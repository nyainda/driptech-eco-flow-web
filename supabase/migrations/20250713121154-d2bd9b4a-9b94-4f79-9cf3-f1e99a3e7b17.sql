-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.product_category AS ENUM (
  'drip_irrigation',
  'sprinkler_systems', 
  'filtration_systems',
  'control_systems',
  'accessories'
);

CREATE TYPE public.project_status AS ENUM (
  'planning',
  'in_progress', 
  'completed',
  'on_hold'
);

CREATE TYPE public.quote_status AS ENUM (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'manager',
  'sales',
  'customer'
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_number TEXT,
  category product_category NOT NULL,
  subcategory TEXT,
  description TEXT,
  technical_specs JSONB,
  price DECIMAL(10,2),
  images TEXT[],
  brochure_url TEXT,
  installation_guide_url TEXT,
  maintenance_manual_url TEXT,
  video_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog categories table
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  author_id UUID,
  reading_time INTEGER,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  user_role user_role DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  project_type TEXT,
  area_size DECIMAL(10,2),
  crop_type TEXT,
  water_source TEXT,
  terrain_info TEXT,
  status quote_status DEFAULT 'draft',
  total_amount DECIMAL(12,2),
  valid_until DATE,
  notes TEXT,
  site_plan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quote items table
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  quote_id UUID REFERENCES public.quotes(id),
  status project_status DEFAULT 'planning',
  start_date DATE,
  completion_date DATE,
  location TEXT,
  project_type TEXT,
  area_covered DECIMAL(10,2),
  water_saved DECIMAL(10,2),
  yield_improvement DECIMAL(5,2),
  before_images TEXT[],
  after_images TEXT[],
  testimonial TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  tags TEXT[],
  download_count INTEGER DEFAULT 0,
  requires_login BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public read access for now, admin write access)
CREATE POLICY "Public read access for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full access for products" ON public.products FOR ALL USING (true);

CREATE POLICY "Public read access for blog_categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access for blog_categories" ON public.blog_categories FOR ALL USING (true);

CREATE POLICY "Public read access for published blog_posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Admin full access for blog_posts" ON public.blog_posts FOR ALL USING (true);

CREATE POLICY "Admin full access for customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Admin full access for quotes" ON public.quotes FOR ALL USING (true);
CREATE POLICY "Admin full access for quote_items" ON public.quote_items FOR ALL USING (true);

CREATE POLICY "Public read access for featured projects" ON public.projects FOR SELECT USING (featured = true);
CREATE POLICY "Admin full access for projects" ON public.projects FOR ALL USING (true);

CREATE POLICY "Public read access for public documents" ON public.documents FOR SELECT USING (requires_login = false);
CREATE POLICY "Admin full access for documents" ON public.documents FOR ALL USING (true);

CREATE POLICY "Admin full access for system_settings" ON public.system_settings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_featured ON public.products(featured);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_quotes_customer ON public.quotes(customer_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_projects_featured ON public.projects(featured);
CREATE INDEX idx_projects_customer ON public.projects(customer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
('Technology', 'technology', 'Latest innovations in irrigation technology'),
('Case Studies', 'case-studies', 'Success stories and project showcases'),
('Tips & Guides', 'tips-guides', 'Practical advice and how-to guides'),
('Industry News', 'industry-news', 'Latest news and trends in agriculture'),
('Sustainability', 'sustainability', 'Environmental and water conservation topics');

-- Insert initial system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('company_info', '{"name": "DripTech", "tagline": "Advanced Irrigation Solutions for Modern Agriculture"}', 'Basic company information'),
('contact_info', '{"email": "info@driptech.com", "phone": "+1-555-0123", "address": "123 Innovation Drive, Tech City"}', 'Contact information'),
('social_media', '{"facebook": "", "twitter": "", "linkedin": "", "youtube": ""}', 'Social media links'),
('seo_settings', '{"meta_title": "DripTech - Advanced Irrigation Solutions", "meta_description": "Leading provider of smart irrigation systems"}', 'SEO configuration');