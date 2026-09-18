
-- Create visitor_sessions table
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_duration INTEGER DEFAULT 0,
    page_views_count INTEGER DEFAULT 0,
    browser TEXT,
    device_type TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    session_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    page_title TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referrer TEXT,
    time_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_interactions table
CREATE TABLE IF NOT EXISTS product_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    session_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_id UUID,
    product_category TEXT,
    interaction_type TEXT NOT NULL, -- 'view', 'click', 'hover', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    element_selector TEXT,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_start ON visitor_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_product_interactions_visitor_id ON product_interactions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_session_id ON product_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_timestamp ON product_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_name ON product_interactions(product_name);

-- Create RPC function to increment page views count
CREATE OR REPLACE FUNCTION increment_page_views(visitor_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE visitor_sessions 
    SET page_views_count = page_views_count + 1,
        updated_at = NOW()
    WHERE visitor_id = visitor_id_param
    AND session_end IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to calculate bounce rate
CREATE OR REPLACE FUNCTION calculate_bounce_rate(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '7 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS NUMERIC AS $$
DECLARE
    total_sessions INTEGER;
    bounce_sessions INTEGER;
BEGIN
    -- Count total sessions
    SELECT COUNT(*) INTO total_sessions
    FROM visitor_sessions
    WHERE session_start >= start_date AND session_start <= end_date;
    
    -- Count bounce sessions (sessions with 1 or no page views)
    SELECT COUNT(*) INTO bounce_sessions
    FROM visitor_sessions vs
    WHERE vs.session_start >= start_date 
    AND vs.session_start <= end_date
    AND (
        vs.page_views_count <= 1 
        OR (
            SELECT COUNT(*) 
            FROM page_views pv 
            WHERE pv.session_id = vs.id
        ) <= 1
    );
    
    -- Return bounce rate as percentage
    IF total_sessions > 0 THEN
        RETURN ROUND((bounce_sessions::NUMERIC / total_sessions::NUMERIC) * 100, 2);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to get top pages
CREATE OR REPLACE FUNCTION get_top_pages(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '7 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    page_path TEXT,
    page_title TEXT,
    total_views BIGINT,
    unique_visitors BIGINT,
    avg_time_spent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.page_path,
        COALESCE(pv.page_title, pv.page_path) as page_title,
        COUNT(*) as total_views,
        COUNT(DISTINCT pv.visitor_id) as unique_visitors,
        ROUND(AVG(pv.time_spent), 0) as avg_time_spent
    FROM page_views pv
    WHERE pv.timestamp >= start_date AND pv.timestamp <= end_date
    GROUP BY pv.page_path, pv.page_title
    ORDER BY total_views DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on visitor_sessions" ON visitor_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on page_views" ON page_views FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_interactions" ON product_interactions FOR ALL USING (true);
