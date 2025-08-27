
-- Create visitor sessions table to track unique visitors
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  page_views INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in seconds
  browser TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page views table to track individual page visits
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id UUID REFERENCES visitor_sessions(id),
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent INTEGER DEFAULT 0, -- in seconds
  scroll_depth INTEGER DEFAULT 0, -- percentage
  referrer TEXT,
  query_params JSONB,
  exit_page BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product interactions table to track product views/clicks
CREATE TABLE IF NOT EXISTS public.product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id UUID REFERENCES visitor_sessions(id),
  product_name TEXT NOT NULL,
  product_id TEXT,
  product_category TEXT,
  product_price DECIMAL,
  interaction_type TEXT NOT NULL, -- 'view', 'click', 'add_to_cart', etc.
  page_path TEXT NOT NULL,
  element_selector TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics summary table for pre-computed metrics
CREATE TABLE IF NOT EXISTS public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_range TEXT NOT NULL,
  summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_visitors INTEGER DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL DEFAULT 0,
  top_pages JSONB DEFAULT '[]'::jsonb,
  top_products JSONB DEFAULT '[]'::jsonb,
  device_breakdown JSONB DEFAULT '{}'::jsonb,
  hourly_activity JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for visitor sessions
CREATE POLICY "Visitors can insert their sessions" 
  ON public.visitor_sessions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Visitors can read their sessions" 
  ON public.visitor_sessions FOR SELECT 
  USING (true);

CREATE POLICY "Visitors can update their sessions" 
  ON public.visitor_sessions FOR UPDATE 
  USING (true);

CREATE POLICY "Admins can do everything on visitor_sessions" 
  ON public.visitor_sessions FOR ALL 
  USING (is_admin());

-- Create policies for page views
CREATE POLICY "Visitors can insert page views" 
  ON public.page_views FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Visitors can update page views" 
  ON public.page_views FOR UPDATE 
  USING (true);

CREATE POLICY "Admins can do everything on page_views" 
  ON public.page_views FOR ALL 
  USING (is_admin());

-- Create policies for product interactions
CREATE POLICY "Visitors can insert product interactions" 
  ON public.product_interactions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can do everything on product_interactions" 
  ON public.product_interactions FOR ALL 
  USING (is_admin());

-- Create policies for analytics summary
CREATE POLICY "Public read access to analytics_summary" 
  ON public.analytics_summary FOR SELECT 
  USING (true);

CREATE POLICY "Admins can do everything on analytics_summary" 
  ON public.analytics_summary FOR ALL 
  USING (is_admin());

-- Create helper functions for analytics
CREATE OR REPLACE FUNCTION calculate_bounce_rate(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - INTERVAL '7 days'),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day')
) RETURNS DECIMAL AS $$
DECLARE
  bounce_rate DECIMAL;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN page_views <= 1 THEN 1 END) * 100.0 / COUNT(*))::DECIMAL, 
        2
      )
    END
  INTO bounce_rate
  FROM public.visitor_sessions
  WHERE session_start BETWEEN start_date AND end_date;
  
  RETURN bounce_rate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_pages(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - INTERVAL '7 days'),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
  page_path TEXT,
  page_title TEXT,
  total_views BIGINT,
  unique_visitors BIGINT,
  avg_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_path,
    pv.page_title,
    COUNT(*)::BIGINT as total_views,
    COUNT(DISTINCT pv.visitor_id)::BIGINT as unique_visitors,
    ROUND(AVG(pv.time_spent))::INTEGER as avg_time_spent
  FROM public.page_views pv
  WHERE pv.timestamp BETWEEN start_date AND end_date
  GROUP BY pv.page_path, pv.page_title
  ORDER BY total_views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON public.visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_start ON public.visitor_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON public.page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_product_interactions_visitor_id ON public.product_interactions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_name ON public.product_interactions(product_name);
CREATE INDEX IF NOT EXISTS idx_product_interactions_timestamp ON public.product_interactions(timestamp);
