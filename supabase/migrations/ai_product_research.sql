-- AI Product Research Tables
-- Run this in Supabase SQL Editor

-- 1. Search Queries Tracking
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    category TEXT,
    results_count INTEGER DEFAULT 0,
    user_session_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);

-- 2. AI Product Suggestions
CREATE TABLE IF NOT EXISTS ai_product_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    price_range TEXT,
    estimated_price DECIMAL(10,2),
    target_crops TEXT[],
    technical_specs JSONB,
    features TEXT[],
    applications TEXT[],
    search_volume INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, created
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT DEFAULT 'ai',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_product_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_category ON ai_product_suggestions(category);

-- 3. Enable RLS
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_product_suggestions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for search_queries (anyone can insert, admins can read)
CREATE POLICY "Anyone can insert search queries"
    ON search_queries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view search queries"
    ON search_queries FOR SELECT
    USING (auth.jwt() ->> 'role' = 'authenticated');

-- 5. RLS Policies for ai_product_suggestions (admins only)
CREATE POLICY "Admins can view AI suggestions"
    ON ai_product_suggestions FOR SELECT
    USING (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "Admins can update AI suggestions"
    ON ai_product_suggestions FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "Admins can delete AI suggestions"
    ON ai_product_suggestions FOR DELETE
    USING (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "System can insert AI suggestions"
    ON ai_product_suggestions FOR INSERT
    WITH CHECK (true);
