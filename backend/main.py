"""
FastAPI backend for extracting and managing Facebook posts using Apify + Gemini.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from apify_client import ApifyClient
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# LangChain / Gemini
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.documents import Document
from langchain_community.vectorstores import SupabaseVectorStore

# Agents
from agents.course_roadmap_agent import CourseRoadmapAgent

# Supabase
from supabase.client import Client, create_client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="Facebook Post AI Extractor")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
APIFY_API_KEY = os.getenv("APIFY_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY]):
    print("⚠ Warning: Missing critical environment variables (SUPABASE_*, GOOGLE_API_KEY)")

supabase_client: Optional[Client] = None
embeddings: Optional[GoogleGenerativeAIEmbeddings] = None
vector_store: Optional[SupabaseVectorStore] = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Supabase Client initialized")
    except Exception as e:
        print(f"❌ Failed to init Supabase: {e}")

# Initialize embeddings and vector store for advanced search
if SUPABASE_URL and SUPABASE_KEY and GOOGLE_API_KEY:
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY,
            task_type="RETRIEVAL_DOCUMENT"
        )
        vector_store = SupabaseVectorStore(
            embedding=embeddings,
            client=supabase_client,
            table_name="documents",
            query_name="match_documents"
        )
        print("✓ Vector store initialized for advanced search")
    except Exception as e:
        print(f"⚠ Warning: Vector store not initialized: {e}")

# Initialize CourseRoadmapAgent
roadmap_agent: Optional[CourseRoadmapAgent] = None
if GOOGLE_API_KEY and TAVILY_API_KEY:
    try:
        roadmap_agent = CourseRoadmapAgent(
            google_api_key=GOOGLE_API_KEY,
            tavily_api_key=TAVILY_API_KEY,
            supabase_client=supabase_client,
            vector_store=vector_store,
            embeddings=embeddings
        )
        print("✓ CourseRoadmapAgent initialized")
    except Exception as e:
        print(f"⚠ Warning: CourseRoadmapAgent not initialized: {e}")

# --- Pydantic Models for AI Extraction ---

class MediaItem(BaseModel):
    type: str = Field(description="'photo' or 'video'")
    url: str = Field(description="The direct high-res URL of the media")
    thumbnail: Optional[str] = Field(None, description="Thumbnail URL if available")
    ocr_text: Optional[str] = Field(None, description="Any text extracted from the image (OCR)")
    description: Optional[str] = Field(None, description="Brief description of the image content")

class ExternalLink(BaseModel):
    url: str
    title: Optional[str] = None
    domain: Optional[str] = None

class EngagementMetrics(BaseModel):
    likes: int = 0
    comments: int = 0
    shares: int = 0
    reactions: Dict[str, int] = Field(default_factory=dict, description="Map of reaction type to count (like, love, haha, etc.)")

class ProcessedPost(BaseModel):
    """Unified structure for a processed Facebook post."""
    original_post_id: str = Field(description="The unique ID of the post from Facebook")
    platform: str = "facebook"
    url: str = Field(description="The permanent URL to the post")
    published_at: Optional[str] = Field(None, description="ISO formatted timestamp")
    
    # Author
    author_name: str
    author_id: Optional[str] = None
    author_profile_pic: Optional[str] = None
    
    # Content
    raw_text: Optional[str] = Field(None, description="The full original text of the post")
    summary: str = Field(description="A concise 1-2 sentence summary of the post content")
    sentiment: str = Field(description="'Positive', 'Neutral', 'Negative', or 'Mixed'")
    topics: List[str] = Field(description="List of 3-5 key topics or tags")
    category: str = Field(description="One of: 'News', 'Tech', 'Personal', 'Meme', 'Politics', 'Other'")
    
    # Complex Data
    media: List[MediaItem] = Field(default_factory=list)
    external_links: List[ExternalLink] = Field(default_factory=list)
    engagement_metrics: EngagementMetrics = Field(default_factory=EngagementMetrics)

# --- API Models ---

class PostRequest(BaseModel):
    url: str
    apify_key: Optional[str] = None

class PostResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    advanced_mode: bool = False

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []

class RoadmapRequest(BaseModel):
    goal: str = Field(description="User's learning goal in natural language")

# --- Helper Functions ---

def get_gemini_extractor():
    """Initializes the Gemini model with structured output configuration."""
    if not GOOGLE_API_KEY:
        raise HTTPException(500, "Server Error: GOOGLE_API_KEY/GEMINI_API_KEY not set")
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite", # Fast and capable for extraction
        google_api_key=GOOGLE_API_KEY,
        temperature=0.1, # Low temperature for factual extraction
        max_retries=2
    )
    return llm.with_structured_output(ProcessedPost)

async def process_post_with_ai(raw_data: Dict) -> ProcessedPost:
    """Uses Gemini to parse raw Apify JSON into our unified schema."""
    extractor = get_gemini_extractor()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert social media data analyst. Your job is to extract, normalize, and summarize Facebook post data.
        
        Input: Raw JSON from a Facebook scraper (Apify).
        Output: A clean, structured JSON object matching the ProcessedPost schema.
        
        Guidelines:
        1. **Summary**: Create a concise summary of the main point.
        2. **Sentiment**: Analyze the tone of the text.
        3. **Media**: Extract all unique image/video URLs. Prefer 'image.uri' or high-res sources. Ignore low-res thumbnails if high-res exists.
        4. **Metrics**: Consolidate likes, reactions, comments, and shares.
        5. **Date**: Convert timestamps to ISO format.
        6. **Links**: Extract any external links mentioned in the text or attachments.
        
        Handle missing fields gracefully (use null or empty lists)."""),
        ("human", "Raw Data: {raw_data}")
    ])
    
    chain = prompt | extractor
    
    # Convert raw data to string for the prompt, handling large payloads
    data_str = json.dumps(raw_data, default=str)[:30000] # Truncate if absolutely massive to fit context
    
    return await chain.ainvoke({"raw_data": data_str})

# --- Endpoints ---

@app.get("/")
def root():
    return {"status": "ok", "service": "Facebook AI Extractor"}

@app.post("/get_post_info", response_model=PostResponse)
async def get_post_info(request: PostRequest):
    try:
        # 1. Scrape with Apify
        api_key = request.apify_key or APIFY_API_KEY
        if not api_key:
            raise HTTPException(400, "Apify API Key missing")
            
        client = ApifyClient(api_key)
        print(f"🕷️ Scraper starting for: {request.url}")
        
        run = client.actor("apify/facebook-posts-scraper").call(
            run_input={"startUrls": [{"url": request.url}], "resultsLimit": 1}
        )
        
        dataset_id = run["defaultDatasetId"]
        items = list(client.dataset(dataset_id).iterate_items())
        
        if not items:
            return PostResponse(success=False, error="Apify returned no data.")
            
        raw_post = items[0]
        print("✓ Scrape complete. Processing with AI...")
        
        # 2. Process with Gemini
        processed_post: ProcessedPost = await process_post_with_ai(raw_post)
        print(f"✓ AI Processing complete: {processed_post.summary}")
        
        # 3. Save to Supabase
        if supabase_client:
            # Convert Pydantic model to dict for insertion
            post_dict = processed_post.model_dump()
            
            # Rename fields to match DB columns if necessary (though our schema matches the model)
            # Pydantic 'metrics' -> DB 'engagement_metrics' is already handled by model definition
            
            # Ensure complex types are JSON serializable
            db_record = {
                "original_post_id": post_dict["original_post_id"],
                "platform": post_dict["platform"],
                "url": post_dict["url"],
                "published_at": post_dict["published_at"],
                "author_name": post_dict["author_name"],
                "author_id": post_dict["author_id"],
                "author_profile_pic": post_dict["author_profile_pic"],
                "raw_text": post_dict["raw_text"],
                "summary": post_dict["summary"],
                "sentiment": post_dict["sentiment"],
                "topics": post_dict["topics"],
                "category": post_dict["category"],
                "media": json.loads(json.dumps(post_dict["media"], default=str)), # Ensure valid JSONB
                "external_links": json.loads(json.dumps(post_dict["external_links"], default=str)),
                "engagement_metrics": json.loads(json.dumps(post_dict["engagement_metrics"], default=str))
            }
            
            try:
                # Upsert command
                supabase_client.table("posts").upsert(
                    db_record, on_conflict="original_post_id"
                ).execute()
                print("✓ Saved to Supabase 'posts' table")
                
                # 4. Save to Vector Store for Advanced Search
                if vector_store:
                    print("... Generating embedding and saving to vector store")
                    try:
                        # Combine summary and text for rich search context
                        doc_content = f"Summary: {processed_post.summary}\n\nContent: {processed_post.raw_text}"
                        
                        metadata = {
                            "post_id": processed_post.original_post_id,
                            "author": processed_post.author_name,
                            "published_at": processed_post.published_at,
                            "url": processed_post.url,
                            "topics": processed_post.topics
                        }
                        
                        doc = Document(page_content=doc_content, metadata=metadata)
                        
                        # Use add_documents which handles embedding generation via the initialized 'embeddings' model
                        vector_store.add_documents([doc])
                        print("✓ Saved to vector store (documents table)")
                    except Exception as e:
                        print(f"⚠ Vector Store Error: {e}")
            except Exception as e:
                print(f"❌ Supabase Save Error: {e}")
                
        return PostResponse(success=True, data=processed_post.model_dump())

    except Exception as e:
        print(f"❌ Error: {e}")
        return PostResponse(success=False, error=str(e))

@app.post("/search_posts_v2")
async def search_posts_v2(request: SearchRequest):
    """Search endpoint supporting both keyword and semantic search."""
    if not supabase_client:
        raise HTTPException(503, "Database not connected")
        
    try:
        if request.advanced_mode:
            # ADVANCED MODE: Semantic search using embeddings
            if not embeddings or not supabase_client:
                return {"success": False, "error": "Advanced search not available"}
            
            print(f"🔍 Advanced search (semantic) for: {request.query}")
            
            # Generate embedding for the query
            query_embedding = embeddings.embed_query(request.query)
            
            # Call Supabase match_documents RPC
            rpc_response = supabase_client.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_count': request.limit * 3
                }
            ).execute()
            
            # Deduplicate by post_id and get full posts
            seen_post_ids = set()
            results = []
            
            for item in rpc_response.data:
                post_id = item.get('metadata', {}).get('post_id')
                if post_id and post_id not in seen_post_ids:
                    seen_post_ids.add(post_id)
                    
                    # Get full post from posts table
                    try:
                        full_post = supabase_client.table("posts").select("*").eq("original_post_id", post_id).limit(1).execute()
                        if full_post.data and len(full_post.data) > 0:
                            results.append(full_post.data[0])
                    except Exception as e:
                        print(f"Warning: Could not fetch full post for {post_id}: {e}")
                    
                    if len(results) >= request.limit:
                        break
            
            return {"success": True, "data": results}
        else:
            # NORMAL MODE: Keyword search
            print(f"🔍 Keyword search for: {request.query}")
            response = supabase_client.table("posts").select("*").or_(
                f"raw_text.ilike.%{request.query}%,summary.ilike.%{request.query}%"
            ).limit(request.limit).execute()
            
            return {"success": True, "data": response.data}
    except Exception as e:
        print(f"❌ Search error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint with RAG using the vector store."""
    try:
        if not GOOGLE_API_KEY:
            raise HTTPException(500, "Gemini API key not configured")

        # 1. Search for relevant context if available
        context_docs = []
        if embeddings and supabase_client:
            try:
                # Perform manual semantic search to avoid library compatibility issues
                query_embedding = embeddings.embed_query(request.message)
                rpc_response = supabase_client.rpc(
                    'match_documents',
                    {
                        'query_embedding': query_embedding,
                        'match_count': 3
                    }
                ).execute()
                
                for item in rpc_response.data:
                    context_docs.append(Document(
                        page_content=item.get('content', ''),
                        metadata=item.get('metadata', {})
                    ))
            except Exception as e:
                print(f"⚠ Search for context failed: {e}")

        # 2. Build the prompt
        context_text = "\n\n".join([f"Source {i+1}:\n{doc.page_content}" for i, doc in enumerate(context_docs)])
        
        system_prompt = """You are a helpful AI assistant for a social media dashboard. 
        Your goal is to help users understand and analyze their saved Facebook posts.
        
        When answering, use the provided context from the user's saved posts if relevant.
        If the information isn't in the context, use your general knowledge but mention you're doing so.
        Be concise, professional, and friendly.
        """
        
        if context_text:
            system_prompt += f"\n\nContext from saved posts:\n{context_text}"

        # 3. Initialize LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7
        )

        # 4. Prepare messages (including history)
        messages = [("system", system_prompt)]
        
        # Add history (truncate to last 5 turns to save tokens/context)
        for msg in request.conversation_history[-10:]:
            role = "human" if msg.role == "user" else "ai"
            messages.append((role, msg.text))
            
        messages.append(("human", request.message))

        # 5. Get response
        response = await llm.ainvoke(messages)
        print(response)
        
        # 6. Format sources for the frontend
        sources = []
        for doc in context_docs:
            sources.append({
                "content": doc.page_content[:200] + "...",
                "metadata": doc.metadata,
                "similarity_score": 0.9 # placeholder for simplified similarity
            })

        return {
            "success": True, 
            "response": response.content,
            "sources": sources
        }

    except Exception as e:
        print(f"❌ Chat error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/roadmap")
async def generate_roadmap(request: RoadmapRequest):
    """
    Generate a personalized learning roadmap using the CourseRoadmapAgent.
    
    This endpoint executes the 6-step pipeline:
    1. Understand user profile
    2. Generate search queries
    3. Clean advisement corpus (via Tavily)
    4. Build staged roadmap
    5. Fill each stage with resources (posts from vector store)
    6. Output UI-ready learning path
    """
    try:
        if not roadmap_agent:
            raise HTTPException(503, "CourseRoadmapAgent not available (check API keys)")
        
        print(f"🧠 Generating roadmap for goal: {request.goal}")
        
        # Execute the full 6-step pipeline
        roadmap = await roadmap_agent.create_roadmap(request.goal)
        
        return {
            "success": True,
            "data": roadmap
        }
    
    except Exception as e:
        print(f"❌ Roadmap generation error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
