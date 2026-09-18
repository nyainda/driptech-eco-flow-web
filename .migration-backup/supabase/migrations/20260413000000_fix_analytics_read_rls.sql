-- Fix analytics and business data RLS policies
-- Ensures authenticated admins can read all data needed for the dashboard
-- Run this in Supabase SQL Editor if the dashboard shows zeros for any section

-- Visitor tracking tables: allow authenticated users to read
DROP POLICY IF EXISTS "Authenticated users can read visitor_sessions" ON visitor_sessions;
CREATE POLICY "Authenticated users can read visitor_sessions"
  ON visitor_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read page_views" ON page_views;
CREATE POLICY "Authenticated users can read page_views"
  ON page_views FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read product_interactions" ON product_interactions;
CREATE POLICY "Authenticated users can read product_interactions"
  ON product_interactions FOR SELECT
  TO authenticated
  USING (true);

-- Service tables: allow authenticated users to read counts
DROP POLICY IF EXISTS "Authenticated users can read service_bookings" ON service_bookings;
CREATE POLICY "Authenticated users can read service_bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read service_reviews" ON service_reviews;
CREATE POLICY "Authenticated users can read service_reviews"
  ON service_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read technicians" ON technicians;
CREATE POLICY "Authenticated users can read technicians"
  ON technicians FOR SELECT
  TO authenticated
  USING (true);

-- Newsletter subscribers
DROP POLICY IF EXISTS "Authenticated users can read newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Authenticated users can read newsletter_subscribers"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);

-- News articles
DROP POLICY IF EXISTS "Authenticated users can read news_articles" ON news_articles;
CREATE POLICY "Authenticated users can read news_articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

-- M-Pesa transactions
DROP POLICY IF EXISTS "Authenticated users can read mpesa_transactions" ON mpesa_transactions;
CREATE POLICY "Authenticated users can read mpesa_transactions"
  ON mpesa_transactions FOR SELECT
  TO authenticated
  USING (true);

-- WhatsApp conversations
DROP POLICY IF EXISTS "Authenticated users can read whatsapp_conversations" ON whatsapp_conversations;
CREATE POLICY "Authenticated users can read whatsapp_conversations"
  ON whatsapp_conversations FOR SELECT
  TO authenticated
  USING (true);

-- Email campaigns
DROP POLICY IF EXISTS "Authenticated users can read email_campaigns" ON email_campaigns;
CREATE POLICY "Authenticated users can read email_campaigns"
  ON email_campaigns FOR SELECT
  TO authenticated
  USING (true);

-- Success stories
DROP POLICY IF EXISTS "Authenticated users can read success_stories" ON success_stories;
CREATE POLICY "Authenticated users can read success_stories"
  ON success_stories FOR SELECT
  TO authenticated
  USING (true);

-- Discount banners (used in dashboard)
DROP POLICY IF EXISTS "Authenticated users can read discount_banners" ON discount_banners;
CREATE POLICY "Authenticated users can read discount_banners"
  ON discount_banners FOR SELECT
  TO authenticated
  USING (true);
