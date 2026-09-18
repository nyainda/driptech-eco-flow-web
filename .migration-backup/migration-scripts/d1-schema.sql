-- DripTech D1 Migration Schema
-- Phase 1: Read-Heavy Public Content Tables
-- Compatible with Cloudflare D1 (SQLite)

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_number TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  technical_specs TEXT, -- JSON stored as TEXT
  price REAL,
  images TEXT, -- JSON array stored as TEXT
  brochure_url TEXT,
  installation_guide_url TEXT,
  maintenance_manual_url TEXT,
  video_url TEXT,
  in_stock INTEGER DEFAULT 1, -- Boolean as INTEGER (0/1)
  featured INTEGER DEFAULT 0,
  features TEXT, -- JSON array stored as TEXT
  applications TEXT, -- JSON array stored as TEXT
  specifications TEXT, -- JSON stored as TEXT
  variants TEXT, -- JSON array stored as TEXT for product variants
  stock_quantity INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- ============================================
-- BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  featured_image_url TEXT,
  category_id TEXT,
  tags TEXT, -- JSON array stored as TEXT
  published INTEGER DEFAULT 0,
  published_at TEXT,
  seo_title TEXT,
  seo_description TEXT,
  author_id TEXT,
  reading_time INTEGER,
  views INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);

-- ============================================
-- BLOG CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- ============================================
-- VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'irrigation',
  tags TEXT, -- JSON array stored as TEXT
  published INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(featured);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer_id TEXT,
  quote_id TEXT,
  status TEXT DEFAULT 'planning',
  start_date TEXT,
  completion_date TEXT,
  location TEXT,
  project_type TEXT,
  area_covered REAL,
  water_saved REAL,
  yield_improvement REAL,
  before_images TEXT, -- JSON array stored as TEXT
  after_images TEXT, -- JSON array stored as TEXT
  project_images TEXT, -- JSON array stored as TEXT
  testimonial TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- SUCCESS STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS success_stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_company TEXT,
  image_url TEXT,
  before_image TEXT,
  after_image TEXT,
  results TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured);

-- ============================================
-- NEWS ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT,
  tags TEXT, -- JSON array stored as TEXT
  published INTEGER DEFAULT 0,
  published_at TEXT,
  author_id TEXT,
  views INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published);
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);

-- ============================================
-- IRRIGATION KITS TABLE (if exists)
-- ============================================
CREATE TABLE IF NOT EXISTS irrigation_kits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  coverage_area REAL,
  target_crop TEXT,
  components TEXT, -- JSON stored as TEXT
  price REAL,
  in_stock INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  maintenance_level TEXT,
  created_at TEXT,
  updated_at TEXT,
  active INTEGER DEFAULT 1,
  images TEXT, -- JSON array stored as TEXT
  installation_complexity TEXT,
  installation_time_hours REAL,
  kit_type TEXT,
  recommended_crops TEXT, -- JSON array stored as TEXT
  warranty_months INTEGER,
  water_efficiency_percentage REAL
);

CREATE INDEX IF NOT EXISTS idx_irrigation_kits_category ON irrigation_kits(category);
CREATE INDEX IF NOT EXISTS idx_irrigation_kits_featured ON irrigation_kits(featured);
CREATE INDEX IF NOT EXISTS idx_irrigation_kits_active ON irrigation_kits(active);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  tags TEXT, -- JSON array stored as TEXT
  download_count INTEGER DEFAULT 0,
  requires_login INTEGER DEFAULT 0, -- Boolean as INTEGER
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_requires_login ON documents(requires_login);

-- ============================================
-- KIT DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kit_documents (
  id TEXT PRIMARY KEY,
  kit_id TEXT,
  document_type TEXT,
  title TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  version TEXT,
  language TEXT,
  requires_login INTEGER DEFAULT 0, -- Boolean as INTEGER
  download_count INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_kit_documents_kit_id ON kit_documents(kit_id);

-- ============================================
-- TEAM TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_team_featured ON team(featured);
