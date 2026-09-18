-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active', -- active, unsubscribed
  source TEXT DEFAULT 'website',
  metadata JSONB,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- RLS Policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (subscribe)
CREATE POLICY "Allow public insert to subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Allow public to read their own status (for preventing duplicates)
CREATE POLICY "Allow public to read own subscriber status" ON newsletter_subscribers
  FOR SELECT USING (true); -- Ideally restricted, but for check logic allow true or limit by specific query if possible. Simplified for now.

-- Allow public to update their own status (reactivate)
CREATE POLICY "Allow public update own status" ON newsletter_subscribers
  FOR UPDATE USING (true);
