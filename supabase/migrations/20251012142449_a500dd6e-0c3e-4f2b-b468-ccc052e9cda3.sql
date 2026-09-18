-- Simple cleanup functions with 7-day retention

-- Function to clean old page views (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_page_views()
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM page_views
  WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Function to clean old visitor sessions (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_visitor_sessions()
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM visitor_sessions
  WHERE session_start < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Function to clean old product interactions (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_product_interactions()
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM product_interactions
  WHERE timestamp < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Function to run all cleanup operations at once
CREATE OR REPLACE FUNCTION public.cleanup_all_analytics()
RETURNS TABLE(
  table_name text,
  rows_deleted bigint
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  page_views_deleted bigint;
  sessions_deleted bigint;
  interactions_deleted bigint;
BEGIN
  -- Clean page views
  SELECT cleanup_old_page_views() INTO page_views_deleted;
  
  -- Clean visitor sessions
  SELECT cleanup_old_visitor_sessions() INTO sessions_deleted;
  
  -- Clean product interactions  
  SELECT cleanup_old_product_interactions() INTO interactions_deleted;
  
  -- Return results
  RETURN QUERY 
  SELECT 'page_views'::text, page_views_deleted
  UNION ALL
  SELECT 'visitor_sessions'::text, sessions_deleted
  UNION ALL
  SELECT 'product_interactions'::text, interactions_deleted;
END;
$function$;

-- Run immediate cleanup to free up space NOW
SELECT * FROM cleanup_all_analytics();

-- Add comments
COMMENT ON FUNCTION public.cleanup_old_page_views() IS 'Deletes page views older than 7 days';
COMMENT ON FUNCTION public.cleanup_old_visitor_sessions() IS 'Deletes visitor sessions older than 7 days';
COMMENT ON FUNCTION public.cleanup_old_product_interactions() IS 'Deletes product interactions older than 7 days';
COMMENT ON FUNCTION public.cleanup_all_analytics() IS 'Runs all analytics cleanup functions and returns deleted row counts';