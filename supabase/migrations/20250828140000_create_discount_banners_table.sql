
-- Create discount_banners table
CREATE TABLE IF NOT EXISTS discount_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discount TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for active banners
CREATE INDEX IF NOT EXISTS idx_discount_banners_active ON discount_banners(is_active);

-- Create index for validity
CREATE INDEX IF NOT EXISTS idx_discount_banners_valid_until ON discount_banners(valid_until);

-- Enable RLS
ALTER TABLE discount_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to active discount banners"
  ON discount_banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to discount banners"
  ON discount_banners FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO discount_banners (discount, title, description, valid_until, is_active) VALUES
  ('20%', 'Winter Special Offer!', 'Save 20% on all drip irrigation systems this winter season', '2024-12-31', true),
  ('Buy 1 Get 1', 'Double Value Deal', 'Buy one irrigation kit and get another one absolutely free', '2024-11-30', true);
