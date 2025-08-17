
-- Create a table to store quote items persistently
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for quote items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to quote items
CREATE POLICY "Admin full access for quote_items" 
  ON public.quote_items 
  FOR ALL 
  USING (true);

-- Create videos table for video content management
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'irrigation',
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policies for videos
CREATE POLICY "Admin full access for videos" 
  ON public.videos 
  FOR ALL 
  USING (true);

CREATE POLICY "Public read access for published videos" 
  ON public.videos 
  FOR SELECT 
  USING (published = true);

-- Create a health check table for the cron job
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial health check record
INSERT INTO public.health_checks (status) VALUES ('healthy')
ON CONFLICT DO NOTHING;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to keep the database active
CREATE OR REPLACE FUNCTION public.keep_database_active()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update health check timestamp
  UPDATE public.health_checks 
  SET last_check = now(), status = 'healthy'
  WHERE id = (SELECT id FROM public.health_checks ORDER BY last_check DESC LIMIT 1);
  
  -- Log the activity
  RAISE NOTICE 'Database keep-alive executed at %', now();
END;
$$;

-- Schedule the cron job to run every 5 minutes to keep database active
SELECT cron.schedule(
  'keep-database-active',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT public.keep_database_active();'
);

-- Add updated_at trigger for quote_items
CREATE OR REPLACE TRIGGER update_quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for videos
CREATE OR REPLACE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
