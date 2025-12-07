-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  email_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email 
ON public.newsletter_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status 
ON public.newsletter_subscribers(status);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at 
ON public.newsletter_subscribers(subscribed_at DESC);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (anyone can subscribe)
CREATE POLICY "Anyone can subscribe to newsletter" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for admin access
CREATE POLICY "Admin full access for newsletter_subscribers" 
  ON public.newsletter_subscribers 
  FOR ALL 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

-- Add comments
COMMENT ON TABLE public.newsletter_subscribers IS 
'Newsletter email subscribers for marketing and updates';

COMMENT ON COLUMN public.newsletter_subscribers.email IS 
'Subscriber email address (unique)';

COMMENT ON COLUMN public.newsletter_subscribers.status IS 
'Subscription status: active, unsubscribed, or bounced';

COMMENT ON COLUMN public.newsletter_subscribers.source IS 
'Where the subscriber signed up from (website, landing page, etc)';

COMMENT ON COLUMN public.newsletter_subscribers.metadata IS 
'Additional subscriber information (preferences, tags, etc)';
