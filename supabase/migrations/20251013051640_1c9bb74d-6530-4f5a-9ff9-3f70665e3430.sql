-- Security Fix: Add SET search_path = public to all SECURITY DEFINER functions
-- This prevents search path manipulation attacks

-- Fix increment_page_views (text version)
CREATE OR REPLACE FUNCTION public.increment_page_views(visitor_id_param text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE visitor_sessions 
  SET page_views = COALESCE(page_views, 0) + 1,
      updated_at = now()
  WHERE visitor_id = visitor_id_param;
END;
$function$;

-- Fix increment_page_views (uuid version)
CREATE OR REPLACE FUNCTION public.increment_page_views(visitor_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE visitor_sessions 
  SET 
    page_views = COALESCE(page_views, 0) + 1,
    updated_at = NOW()
  WHERE visitor_id = visitor_id_param 
    AND session_end IS NULL;
  
  IF NOT FOUND THEN
    RAISE LOG 'No active session found for visitor_id: %', visitor_id_param;
  END IF;
END;
$function$;

-- Fix keep_database_active
CREATE OR REPLACE FUNCTION public.keep_database_active()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.health_checks 
  SET last_check = now(), status = 'healthy'
  WHERE id = (SELECT id FROM public.health_checks ORDER BY last_check DESC LIMIT 1);
  
  RAISE NOTICE 'Database keep-alive executed at %', now();
END;
$function$;

-- Fix generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_number;
END;
$function$;

-- Fix set_invoice_number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_notifications_updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix clean_old_notifications
CREATE OR REPLACE FUNCTION public.clean_old_notifications()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$function$;

-- Fix calculate_bounce_rate
CREATE OR REPLACE FUNCTION public.calculate_bounce_rate(
  start_date timestamp with time zone DEFAULT (CURRENT_DATE - '7 days'::interval),
  end_date timestamp with time zone DEFAULT (CURRENT_DATE + '1 day'::interval)
)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  bounce_rate decimal;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN page_views <= 1 THEN 1 END) * 100.0 / COUNT(*))::numeric, 
        2
      )
    END
  INTO bounce_rate
  FROM public.visitor_sessions
  WHERE session_start BETWEEN start_date AND end_date;
  
  RETURN bounce_rate;
END;
$function$;

-- Fix get_top_pages
CREATE OR REPLACE FUNCTION public.get_top_pages(
  start_date timestamp with time zone DEFAULT (CURRENT_DATE - '7 days'::interval),
  end_date timestamp with time zone DEFAULT (CURRENT_DATE + '1 day'::interval),
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  page_path text,
  page_title text,
  total_views bigint,
  unique_visitors bigint,
  avg_time_spent integer
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_path,
    pv.page_title,
    COUNT(*)::bigint as total_views,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors,
    ROUND(AVG(pv.time_spent))::integer as avg_time_spent
  FROM public.page_views pv
  WHERE pv.timestamp BETWEEN start_date AND end_date
  GROUP BY pv.page_path, pv.page_title
  ORDER BY total_views DESC
  LIMIT limit_count;
END;
$function$;

-- Fix update_user_roles_updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$function$;