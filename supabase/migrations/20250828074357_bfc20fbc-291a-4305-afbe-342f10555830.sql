-- Create function to increment page views for a visitor session
CREATE OR REPLACE FUNCTION increment_page_views(visitor_id_param text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE visitor_sessions 
  SET page_views = COALESCE(page_views, 0) + 1,
      updated_at = now()
  WHERE visitor_id = visitor_id_param;
END;
$$;