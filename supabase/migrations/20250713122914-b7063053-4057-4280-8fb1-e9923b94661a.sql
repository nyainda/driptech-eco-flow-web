-- Add team table
CREATE TABLE public.team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add success_stories table  
CREATE TABLE public.success_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_company TEXT,
  image_url TEXT,
  before_image TEXT,
  after_image TEXT,
  results TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add image_uploads table for file management
CREATE TABLE public.image_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team
CREATE POLICY "Admin full access for team" 
ON public.team 
FOR ALL 
USING (true);

CREATE POLICY "Public read access for team" 
ON public.team 
FOR SELECT 
USING (true);

-- Create RLS policies for success_stories
CREATE POLICY "Admin full access for success_stories" 
ON public.success_stories 
FOR ALL 
USING (true);

CREATE POLICY "Public read access for success_stories" 
ON public.success_stories 
FOR SELECT 
USING (true);

-- Create RLS policies for image_uploads
CREATE POLICY "Admin full access for image_uploads" 
ON public.image_uploads 
FOR ALL 
USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create storage policies for images
CREATE POLICY "Public access for image viewing" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Admin can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Admin can update images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images');

CREATE POLICY "Admin can delete images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'images');

-- Add updated_at triggers
CREATE TRIGGER update_team_updated_at
BEFORE UPDATE ON public.team
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_success_stories_updated_at
BEFORE UPDATE ON public.success_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin user table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage themselves" 
ON public.admin_users 
FOR ALL 
USING (true);

-- Insert default admin user (password: admin123)
INSERT INTO public.admin_users (email, password_hash, name) 
VALUES ('admin@driptech.com', '$2b$10$rOzJo.5sE5p4YU4OYAzDcuGZf.9gHjO6EwVd1bNyqG1ypxKm9bNmG', 'Admin User');

CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();