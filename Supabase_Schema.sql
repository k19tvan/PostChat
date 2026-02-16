-- Enable the vector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables to ensure a clean slate (Use with caution if data exists!)
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- 1. Create the 'posts' table (Main storage for structured data)
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_post_id TEXT NOT NULL UNIQUE, -- The Facebook Post ID
    platform TEXT DEFAULT 'facebook',
    url TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Author Information
    author_name TEXT,
    author_id TEXT,
    author_profile_pic TEXT,
    
    -- Content & Analysis
    raw_text TEXT,
    summary TEXT, -- AI Generated summary of the post
    sentiment TEXT, -- AI Generated (Positive, Neutral, Negative, etc.)
    topics TEXT[], -- AI Generated array of topics/tags
    category TEXT, -- AI Generated (News, Personal, Tech, Meme, etc.)
    
    -- Complex Data (Stored as JSONB for query flexibility)
    media JSONB, -- Array of objects: {type: 'photo'|'video', url: string, thumbnail: string, ocr_text: string}
    external_links JSONB, -- Array of objects: {url: string, title: string, domain: string}
    
    -- Engagement Metrics
    engagement_metrics JSONB, -- {likes: int, comments: int, shares: int, reactions: {like: int, love: int, ...}}
    
    -- System Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts (Adjust strictly for production)
CREATE POLICY "Public read access posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public insert access posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Public delete access posts" ON public.posts FOR DELETE USING (true);

-- Create indexes for posts
CREATE INDEX idx_posts_original_id ON public.posts(original_post_id);
CREATE INDEX idx_posts_author_name ON public.posts(author_name);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_topics ON public.posts USING GIN (topics); -- GIN index for fast array searching
CREATE INDEX idx_posts_sentiment ON public.posts(sentiment);

-- 2. Create the 'documents' table (For LangChain Vector Store)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT, -- The text chunk
    metadata JSONB, -- Metadata including post_id to link back to 'posts'
    embedding VECTOR(3072) -- Support for Gemini embeddings (Updated to 3072 dimensions)
);

-- Enable Row Level Security (RLS) for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Public read access documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public insert access documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Public delete access documents" ON public.documents FOR DELETE USING (true);

-- 3. Create the vector search function (RPC)
CREATE OR REPLACE FUNCTION match_documents (
    query_embedding VECTOR(3072),
    match_count INT DEFAULT 10,
    filter JSONB DEFAULT '{}'
) RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) AS similarity
    FROM documents
    WHERE documents.metadata @> filter
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
