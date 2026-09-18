-- Records the website action that opens a DripTech WhatsApp conversation.
-- This is intentionally an outbound-click metric: WhatsApp does not tell the
-- website whether a visitor later sends a message in the external application.
CREATE TABLE IF NOT EXISTS public.whatsapp_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id UUID,
  page_path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  target_number TEXT,
  has_prefilled_message BOOLEAN NOT NULL DEFAULT false,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_click_events_clicked_at
  ON public.whatsapp_click_events (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_click_events_visitor_id
  ON public.whatsapp_click_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_click_events_source
  ON public.whatsapp_click_events (source);

ALTER TABLE public.whatsapp_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record WhatsApp click events"
  ON public.whatsapp_click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_id) BETWEEN 1 AND 100
    AND char_length(page_path) BETWEEN 1 AND 500
    AND char_length(source) BETWEEN 1 AND 200
  );

CREATE POLICY "Authenticated users can read WhatsApp click events"
  ON public.whatsapp_click_events
  FOR SELECT
  TO authenticated
  USING (true);
