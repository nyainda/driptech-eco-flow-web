-- Add image upload fields to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Add image upload fields to projects  
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_images text[];

-- Add enhanced product specifications to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS applications text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb;

-- Create contact submissions table for notifications
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  message text NOT NULL,
  project_type text,
  area_size text,
  budget_range text,
  status text DEFAULT 'new',
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to contact submissions
CREATE POLICY "Admin full access for contact_submissions" 
ON public.contact_submissions 
FOR ALL 
USING (true);

-- Create trigger for updating timestamps on contact_submissions
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();