"""
CourseRoadmapAgent — A 6-step pipeline for synthesizing personalized learning roadmaps.

This agent:
1. Understands the user profile
2. Generates search queries
3. Cleans advisement corpus from Tavily search
4. Builds staged roadmap
5. Fills each stage with resources (posts, courses)
6. Outputs UI-ready learning path
"""

import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from tavily import TavilyClient
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from supabase.client import Client
import json


# ============================================================================
# STEP 1 MODELS: Understand the User
# ============================================================================

class LearnerProfile(BaseModel):
    """Structured user profile extracted from natural language goal."""
    background: str = Field(description="User's current background (student, professional, etc.)")
    current_skills: List[str] = Field(default_factory=list, description="Skills they already have")
    time_constraints: str = Field(description="Available time (e.g., '6 months', '2 hours/day')")
    career_goals: List[str] = Field(default_factory=list, description="Career objectives")
    conflicts: List[str] = Field(default_factory=list, description="Decision conflicts or uncertainties")


class Step1Output(BaseModel):
    """Output from Step 1."""
    profile: LearnerProfile


# ============================================================================
# STEP 2 MODELS: Generate Search Subqueries
# ============================================================================

class Step2Output(BaseModel):
    """Output from Step 2."""
    queries: List[str] = Field(description="3-6 search queries for advisement")


# ============================================================================
# STEP 3 MODELS: Clean Advisement Corpus
# ============================================================================

class Step3Output(BaseModel):
    """Output from Step 3."""
    advisement_corpus: List[str] = Field(description="Cleaned advisement units")


# ============================================================================
# STEP 4 MODELS: Build Staged Roadmap
# ============================================================================

class RoadmapStage(BaseModel):
    """A single stage in the learning roadmap."""
    id: str = Field(description="Unique stage ID (e.g., 'stage_1')")
    title: str = Field(description="Stage title")
    focus: List[str] = Field(description="Key focus areas for this stage")
    why: str = Field(description="Rationale for this stage")
    skills: List[str] = Field(description="Skills to develop in this stage")
    projects: List[str] = Field(description="Suggested project ideas")


class Step4Output(BaseModel):
    """Output from Step 4."""
    stages: List[RoadmapStage]


# ============================================================================
# STEP 5 MODELS: Fill Each Stage with Resources
# ============================================================================

class PostReference(BaseModel):
    """Reference to a Facebook post."""
    id: str = Field(description="Post ID from database")
    reason: str = Field(description="Why this post is relevant to the stage")


class CourseReference(BaseModel):
    """Reference to a course."""
    id: str = Field(description="Course ID or URL")
    title: str = Field(description="Course Title")
    url: str = Field(description="Course URL")
    reason: str = Field(description="Why this course is relevant to the stage")


class EnrichedStage(BaseModel):
    """Stage with attached resources."""
    id: str
    posts: List[PostReference] = Field(default_factory=list)
    courses: List[CourseReference] = Field(default_factory=list)


class Step5Output(BaseModel):
    """Output from Step 5."""
    enriched_stages: List[EnrichedStage]


# ============================================================================
# STEP 6 MODELS: UI-Ready Learning Path
# ============================================================================

class UINode(BaseModel):
    """A single node in the UI timeline."""
    id: str
    title: str
    description: str
    skills: List[str]
    projects: List[str]
    posts: List[Dict[str, Any]] = Field(default_factory=list, description="Full post objects")
    courses: List[Dict[str, Any]] = Field(default_factory=list, description="Full course objects")


class Step6Output(BaseModel):
    """Final UI-ready output."""
    goal: str
    timeline_style: str = "horizontal_path"
    nodes: List[UINode]


# ============================================================================
# MAIN AGENT CLASS
# ============================================================================

class CourseRoadmapAgent:
    """
    A 6-step pipeline agent for generating personalized learning roadmaps.
    """

    def __init__(
        self,
        google_api_key: str,
        tavily_api_key: str,
        supabase_client: Optional[Client] = None,
        vector_store: Optional[SupabaseVectorStore] = None,
        embeddings: Optional[GoogleGenerativeAIEmbeddings] = None
    ):
        self.google_api_key = google_api_key
        self.tavily_api_key = tavily_api_key
        self.supabase_client = supabase_client
        self.vector_store = vector_store
        self.embeddings = embeddings
        
        # Initialize Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=google_api_key,
            temperature=0.3,
            max_retries=6
        )
        
        # Initialize Tavily search client
        self.tavily_client = TavilyClient(api_key=tavily_api_key)

    async def _safe_invoke(self, chain, input_data):
        """
        Helper to invoke chains with robust handling for Gemini's Free Tier rate limits.
        Catches RESOURCE_EXHAUSTED and waits before retrying.
        """
        import asyncio
        import re
        
        max_retries = 10
        
        for attempt in range(max_retries + 1):
            try:
                return await chain.ainvoke(input_data)
            except Exception as e:
                error_str = str(e)
                if "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries:
                        # Extract suggested wait time if available, or default to 20s * attempt
                        wait_match = re.search(r'retry in (\d+\.?\d*)s', error_str)
                        wait_time = float(wait_match.group(1)) if wait_match else 20.0
                        
                        # Add a larger buffer for safety
                        wait_time += 5.0
                        
                        print(f"   ⚠ Rate limit hit. Waiting {wait_time:.1f}s before retry {attempt+1}/{max_retries}...")
                        await asyncio.sleep(wait_time)
                        continue
                
                # If not resource exhausted or out of retries, raise
                raise e

    # ========================================================================
    # STEP 1: Understand the User
    # ========================================================================

    async def step1_understand_user(self, user_text: str) -> Step1Output:
        """
        Extract structured learner profile from natural language goal.
        
        Input: {"user_text": "<raw natural language goal>"}
        Output: {"profile": {...}}
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a senior career mentor and curriculum designer.
            
Your task: Extract a structured learner profile from the user's natural language goal.

Extract:
- background (student, professional, career switcher, etc.)
- current_skills (languages, frameworks they already know)
- time_constraints (e.g., "6 months", "2 hours per day")
- career_goals (e.g., ["backend engineer", "remote job"])
- conflicts (any decision dilemmas or uncertainties they mention)

Be practical and job-market aligned. If information is missing, infer reasonable defaults.
"""),
            ("human", "User Goal: {user_text}")
        ])
        
        chain = prompt | self.llm.with_structured_output(Step1Output)
        result = await self._safe_invoke(chain, {"user_text": user_text})
        return result

    # ========================================================================
    # STEP 2: Generate Search Subqueries
    # ========================================================================

    async def step2_generate_queries(self, profile: LearnerProfile) -> Step2Output:
        """
        Generate 3-6 search queries for advisement corpus.
        
        Input: {"profile": {...}}
        Output: {"queries": [...]}
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a search strategist for learning resources.
            
Your task: Generate 3-6 Google-style search queries that will find the best advisement content.

Each query should:
- Focus on ONE specific aspect (e.g., roadmap, skills, timeline, job market)
- Include user context (time constraints, career goals)
- Be natural language
- Include "LinkedIn" or "Reddit" to find community-sourced advice

Example profile:
- background: "IT student"
- time_constraints: "6 months"
- career_goals: ["backend python junior job"]

Example queries:
- "Backend Python roadmap for IT students aiming for junior jobs (6-8 months)"
- "Essential Python backend skills for junior developers 2025"
- "Backend Python projects for portfolio LinkedIn"
"""),
            ("human", "Profile: {profile}")
        ])
        
        chain = prompt | self.llm.with_structured_output(Step2Output)
        result = await self._safe_invoke(chain, {"profile": profile.model_dump_json()})
        return result

    # ========================================================================
    # STEP 3: Clean Advisement Corpus
    # ========================================================================

    async def step3_clean_advisement(self, queries: List[str]) -> Step3Output:
        """
        Execute Tavily searches and clean the results.
        
        Input: {"queries": [...]}
        Output: {"advisement_corpus": [...]}
        """
        # Execute all queries with Tavily
        all_results = []
        for query in queries:
            try:
                response = self.tavily_client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=5
                )
                # Extract only the content field
                for item in response.get('results', []):
                    if item.get('content'):
                        all_results.append({
                            'url': item.get('url', ''),
                            'title': item.get('title', ''),
                            'content': item.get('content', '')
                        })
            except Exception as e:
                print(f"⚠ Tavily search failed for '{query}': {e}")
        
        # Now use Gemini to clean and normalize
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a curriculum content curator.
            
Your task: Clean and normalize search results into concise advisement units.

Rules:
- Remove ads, calls-to-action, fluff
- Extract ONLY useful learning advice
- Each advisement unit should be 1-3 sentences
- Focus on: roadmaps, skills, timelines, projects, job advice
- Discard irrelevant content
"""),
            ("human", "Raw search results:\n{results}")
        ])
        
        chain = prompt | self.llm.with_structured_output(Step3Output)
        result = await self._safe_invoke(chain, {"results": json.dumps(all_results, indent=2)})
        return result

    # ========================================================================
    # STEP 4: Build Staged Roadmap
    # ========================================================================

    async def step4_build_roadmap(
        self, 
        profile: LearnerProfile, 
        advisement_corpus: List[str]
    ) -> Step4Output:
        """
        Build a staged roadmap with 4-7 progressive stages.
        
        Input: {"profile": {...}, "advisement_corpus": [...]}
        Output: {"stages": [...]}
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a senior engineer and curriculum architect.
            
Your task: Build a staged learning roadmap.

Rules:
- Detect recurring skill clusters from advisement
- Divide into 4-7 progressive stages
- Each stage builds on the previous
- Each stage has a clear theme and focus
- Include skills and project ideas per stage
- Be project-first: every stage should have 1-3 concrete project ideas
- Avoid repeating the same skills in multiple stages

Each stage must have:
- id (e.g., "stage_1")
- title (e.g., "Foundations")
- focus (key areas)
- why (rationale)
- skills (list)
- projects (list of project ideas)
"""),
            ("human", """User Profile:
{profile}

Advisement Corpus:
{advisement}

Build the roadmap now.""")
        ])
        
        chain = prompt | self.llm.with_structured_output(Step4Output)
        result = await self._safe_invoke(chain, {
            "profile": profile.model_dump_json(),
            "advisement": json.dumps(advisement_corpus)
        })
        return result

    # ========================================================================
    # STEP 5: Fill Each Stage with Resources
    # ========================================================================

    async def step5_fill_resources(
        self, 
        stages: List[RoadmapStage],
        courses: Optional[List[Dict]] = None
    ) -> Step5Output:
        """
        Match Facebook posts and courses to each stage.
        
        Input: {"stages": [...], "courses": [...]}
        Output: {"enriched_stages": [...]}
        """
        enriched = []
        
        for stage in stages:
            # Search for relevant posts using vector store
            relevant_posts = []
            if self.embeddings and self.supabase_client:
                try:
                    # Create search query from stage focus and skills
                    search_query = f"{stage.title}: {', '.join(stage.focus + stage.skills)}"
                    
                    # Generate embedding
                    query_embedding = self.embeddings.embed_query(search_query)
                    
                    # Search vector store
                    rpc_response = self.supabase_client.rpc(
                        'match_documents',
                        {
                            'query_embedding': query_embedding,
                            'match_count': 5
                        }
                    ).execute()
                    
                    # Get unique posts
                    seen_ids = set()
                    for item in rpc_response.data:
                        post_id = item.get('metadata', {}).get('post_id')
                        if post_id and post_id not in seen_ids:
                            seen_ids.add(post_id)
                            relevant_posts.append({
                                'id': post_id,
                                'content': item.get('content', '')[:200],
                                'url': item.get('metadata', {}).get('url', '')
                            })
                            
                except Exception as e:
                    print(f"⚠ Vector search failed for stage '{stage.id}': {e}")
            
            # Now use Gemini to rank and explain relevance
            post_refs = []
            if relevant_posts:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", """You are a curriculum matcher.
                    
Your task: Match posts to this learning stage and explain why they're relevant.

For each post, provide:
- id (the post ID)
- reason (1 sentence explaining relevance)

Only include posts that are TRULY relevant. Max 3 posts per stage.
"""),
                    ("human", """Stage: {stage}

Posts: {posts}

Match them now.""")
                ])
                
                class PostMatches(BaseModel):
                    matches: List[PostReference]
                
                chain = prompt | self.llm.with_structured_output(PostMatches)
                try:
                    matches = await self._safe_invoke(chain, {
                        "stage": stage.model_dump_json(),
                        "posts": json.dumps(relevant_posts)
                    })
                    post_refs = matches.matches
                except Exception as e:
                    print(f"⚠ Post matching failed: {e}")
            
            # Course matching using Tavily search
            course_refs = []
            try:
                # Generate a specific query for courses
                course_query = f"best online course for {stage.title} {stage.skills[0] if stage.skills else ''}"
                
                print(f"   🔍 Searching courses for: {stage.title}...")
                search_result = self.tavily_client.search(
                    query=course_query, 
                    topic="general", 
                    max_results=2,
                    include_domains=["udemy.com", "coursera.org", "edx.org", "pluralsight.com", "udacity.com", "freecodecamp.org"]
                )
                
                for result in search_result.get("results", []):
                    course_refs.append(CourseReference(
                        id=result.get("url"),
                        title=result.get("title"),
                        url=result.get("url"),
                        reason=f"Recommended resource for {stage.title}"
                    ))
            except Exception as e:
                print(f"⚠ Course search failed for stage '{stage.id}': {e}")
            
            enriched.append(EnrichedStage(
                id=stage.id,
                posts=post_refs,
                courses=course_refs
            ))
        
        return Step5Output(enriched_stages=enriched)

    # ========================================================================
    # STEP 6: UI-Ready Learning Path
    # ========================================================================

    async def step6_ui_ready(
        self,
        goal: str,
        stages: List[RoadmapStage],
        enriched_stages: List[EnrichedStage]
    ) -> Step6Output:
        """
        Produce final UI-ready learning path.
        
        Input: {"goal": "...", "enriched_stages": [...]}
        Output: {"goal": "...", "timeline_style": "...", "nodes": [...]}
        """
        nodes = []
        
        # Fetch full post data from DB
        post_data_map = {}
        if self.supabase_client:
            all_post_ids = []
            for enriched in enriched_stages:
                all_post_ids.extend([p.id for p in enriched.posts])
            
            if all_post_ids:
                try:
                    response = self.supabase_client.table("posts").select("*").in_(
                        "original_post_id", all_post_ids
                    ).execute()
                    
                    for post in response.data:
                        post_data_map[post['original_post_id']] = post
                except Exception as e:
                    print(f"⚠ Failed to fetch full posts: {e}")
        
        # Build UI nodes
        for stage, enriched in zip(stages, enriched_stages):
            # Get full post objects
            full_posts = []
            for post_ref in enriched.posts:
                if post_ref.id in post_data_map:
                    post_data = post_data_map[post_ref.id]
                    full_posts.append({
                        "id": post_data.get("original_post_id"),
                        "url": post_data.get("url"),
                        "author": post_data.get("author_name"),
                        "summary": post_data.get("summary"),
                        "topics": post_data.get("topics", []),
                        "reason": post_ref.reason
                    })
            
            nodes.append(UINode(
                id=stage.id,
                title=stage.title,
                description=stage.why,
                skills=stage.skills,
                projects=stage.projects,
                posts=full_posts,
                courses=[
                    {
                        "id": c.id,
                        "title": c.title,
                        "url": c.url,
                        "reason": c.reason
                    } for c in enriched.courses
                ]
            ))
        
        return Step6Output(
            goal=goal,
            timeline_style="horizontal_path",
            nodes=nodes
        )

    # ========================================================================
    # MAIN PIPELINE
    # ========================================================================

    async def create_roadmap(self, user_goal: str) -> Dict[str, Any]:
        """
        Execute the full 6-step pipeline.
        
        Returns the final UI-ready roadmap.
        """
        print("🧠 CourseRoadmapAgent: Starting pipeline...")
        
        # Step 1: Understand User
        print("📋 Step 1: Understanding user profile...")
        step1 = await self.step1_understand_user(user_goal)
        print("Profile ", "-" * 30, "\n")
        print(step1.profile)

        # print(f"   Profile: {step1.profile.background}, {step1.profile.time_constraints}")
        
        # Step 2: Generate Queries
        print("🔍 Step 2: Generating search queries...")
        step2 = await self.step2_generate_queries(step1.profile)
        # print(f"   Generated {len(step2.queries)} queries")
        print("Queries ", "-" * 30, "\n")
        print(step2.queries)
        
        # Step 3: Clean Advisement
        print("📚 Step 3: Fetching and cleaning advisement corpus...")
        step3 = await self.step3_clean_advisement(step2.queries)
        print("Advisement Units ", "-" * 30, "\n")
        print(step3.advisement_corpus)
        # print(f"   Cleaned {len(step3.advisement_corpus)} advisement units")
        
        # Step 4: Build Roadmap
        print("🗺️  Step 4: Building staged roadmap...")
        step4 = await self.step4_build_roadmap(step1.profile, step3.advisement_corpus)
        print("Stages ", "-" * 30, "\n")
        print(step4.stages)
        
        # Step 5: Fill Resources
        print("📦 Step 5: Matching resources to stages...")
        step5 = await self.step5_fill_resources(step4.stages)
        print(f"   Matched resources to {len(step5.enriched_stages)} stages")
        
        # Step 6: UI-Ready Output
        print("🎨 Step 6: Formatting UI-ready output...")
        step6 = await self.step6_ui_ready(user_goal, step4.stages, step5.enriched_stages)
        print(f"   ✓ Roadmap complete with {len(step6.nodes)} nodes")
        
        return step6.model_dump()
