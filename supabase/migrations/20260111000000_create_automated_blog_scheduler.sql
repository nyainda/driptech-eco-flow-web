-- Automated Blog Scheduler Migration
-- Creates tables for automated blog post generation and scheduling

-- ============================================
-- AUTOMATED BLOG SCHEDULE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automated_blog_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_category TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed')),
  generated_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automated_blog_schedule_status 
  ON automated_blog_schedule(status);
CREATE INDEX IF NOT EXISTS idx_automated_blog_schedule_scheduled_for 
  ON automated_blog_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_automated_blog_schedule_generated_post_id 
  ON automated_blog_schedule(generated_post_id);

-- RLS Policies
ALTER TABLE automated_blog_schedule ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view schedules (admin check done in app)
CREATE POLICY "Authenticated users can view automated_blog_schedule"
  ON automated_blog_schedule
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert schedules
CREATE POLICY "Authenticated users can insert automated_blog_schedule"
  ON automated_blog_schedule
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update schedules
CREATE POLICY "Authenticated users can update automated_blog_schedule"
  ON automated_blog_schedule
  FOR UPDATE
  TO authenticated
  USING (true);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage automated_blog_schedule"
  ON automated_blog_schedule
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- BLOG GENERATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_generation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posts_per_week INTEGER DEFAULT 4 CHECK (posts_per_week >= 1 AND posts_per_week <= 7),
  auto_generate_enabled BOOLEAN DEFAULT true,
  notification_email TEXT,
  last_topic_index INTEGER DEFAULT 0 CHECK (last_topic_index >= 0 AND last_topic_index < 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE blog_generation_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view settings
CREATE POLICY "Authenticated users can view blog_generation_settings"
  ON blog_generation_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to update settings
CREATE POLICY "Authenticated users can update blog_generation_settings"
  ON blog_generation_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage blog_generation_settings"
  ON blog_generation_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default settings (only if table is empty)
INSERT INTO blog_generation_settings (posts_per_week, auto_generate_enabled, last_topic_index)
SELECT 4, true, 0
WHERE NOT EXISTS (SELECT 1 FROM blog_generation_settings);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_automated_blog_schedule_updated_at ON automated_blog_schedule;
CREATE TRIGGER update_automated_blog_schedule_updated_at
  BEFORE UPDATE ON automated_blog_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_generation_settings_updated_at ON blog_generation_settings;
CREATE TRIGGER update_blog_generation_settings_updated_at
  BEFORE UPDATE ON blog_generation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Schedule Next Blog Posts
-- ============================================
CREATE OR REPLACE FUNCTION schedule_next_blog_posts()
RETURNS void AS $$
DECLARE
  settings RECORD;
  topic_categories TEXT[] := ARRAY[
    'drip_irrigation_systems',
    'solar_irrigation',
    'irrigation_costs',
    'greenhouse_irrigation',
    'smart_irrigation',
    'irrigation_maintenance',
    'water_management'
  ];
  next_monday TIMESTAMP WITH TIME ZONE;
  next_thursday TIMESTAMP WITH TIME ZONE;
  current_topic_index INTEGER;
  i INTEGER;
BEGIN
  -- Get current settings
  SELECT * INTO settings FROM blog_generation_settings LIMIT 1;
  
  IF NOT settings.auto_generate_enabled THEN
    RETURN;
  END IF;
  
  -- Calculate next Monday and Thursday at 9 AM EAT (6 AM UTC)
  next_monday := date_trunc('week', NOW() + INTERVAL '1 week') + INTERVAL '6 hours';
  next_thursday := next_monday + INTERVAL '3 days';
  
  current_topic_index := settings.last_topic_index;
  
  -- Schedule posts for next Monday (2 posts)
  FOR i IN 1..2 LOOP
    current_topic_index := (current_topic_index + 1) % 7;
    
    INSERT INTO automated_blog_schedule (topic_category, scheduled_for, status)
    VALUES (
      topic_categories[current_topic_index + 1],
      next_monday + (i - 1) * INTERVAL '5 minutes',
      'pending'
    );
  END LOOP;
  
  -- Schedule posts for next Thursday (2 posts)
  FOR i IN 1..2 LOOP
    current_topic_index := (current_topic_index + 1) % 7;
    
    INSERT INTO automated_blog_schedule (topic_category, scheduled_for, status)
    VALUES (
      topic_categories[current_topic_index + 1],
      next_thursday + (i - 1) * INTERVAL '5 minutes',
      'pending'
    );
  END LOOP;
  
  -- Update last topic index
  UPDATE blog_generation_settings
  SET last_topic_index = current_topic_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION schedule_next_blog_posts() TO service_role;

-- ============================================
-- INITIAL SCHEDULE CREATION
-- ============================================
-- Create initial schedule for next week
SELECT schedule_next_blog_posts();
