-- ============================================
-- WHATSAPP MESSAGES TABLE
-- Store WhatsApp conversations and messages
-- ============================================

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact')),
  message_content TEXT,
  media_url TEXT,
  media_type TEXT,
  caption TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  customer_name TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  replied_to_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_conversations table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  tags TEXT[],
  assigned_to TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_config table
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_phone_number TEXT NOT NULL,
  business_name TEXT,
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  webhook_verify_token TEXT,
  provider TEXT DEFAULT 'twilio' CHECK (provider IN ('twilio', 'whatsapp_business', 'messagebird', 'vonage')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number 
ON public.whatsapp_messages(from_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number 
ON public.whatsapp_messages(to_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp 
ON public.whatsapp_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status 
ON public.whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction 
ON public.whatsapp_messages(direction);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_is_read 
ON public.whatsapp_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_number 
ON public.whatsapp_conversations(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message_at 
ON public.whatsapp_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status 
ON public.whatsapp_conversations(status);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_messages
CREATE POLICY "Admins can view all whatsapp messages" 
  ON public.whatsapp_messages 
  FOR SELECT 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert whatsapp messages" 
  ON public.whatsapp_messages 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update whatsapp messages" 
  ON public.whatsapp_messages 
  FOR UPDATE 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete whatsapp messages" 
  ON public.whatsapp_messages 
  FOR DELETE 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- RLS Policies for whatsapp_conversations
CREATE POLICY "Admins can view all conversations" 
  ON public.whatsapp_conversations 
  FOR SELECT 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert conversations" 
  ON public.whatsapp_conversations 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update conversations" 
  ON public.whatsapp_conversations 
  FOR UPDATE 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete conversations" 
  ON public.whatsapp_conversations 
  FOR DELETE 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- RLS Policies for whatsapp_config
CREATE POLICY "Admins can view whatsapp config" 
  ON public.whatsapp_config 
  FOR SELECT 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert whatsapp config" 
  ON public.whatsapp_config 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update whatsapp config" 
  ON public.whatsapp_config 
  FOR UPDATE 
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at ON public.whatsapp_messages;
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON public.whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON public.whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- Add comments
COMMENT ON TABLE public.whatsapp_messages IS 
'WhatsApp messages sent and received';

COMMENT ON TABLE public.whatsapp_conversations IS 
'WhatsApp conversation threads with customers';

COMMENT ON TABLE public.whatsapp_config IS 
'WhatsApp Business API configuration';

COMMENT ON COLUMN public.whatsapp_messages.direction IS 
'Message direction: inbound (from customer) or outbound (to customer)';

COMMENT ON COLUMN public.whatsapp_messages.status IS 
'Message delivery status: received, sent, delivered, read, failed';

COMMENT ON COLUMN public.whatsapp_conversations.unread_count IS 
'Number of unread messages in this conversation';
