-- Group quotation BOQ lines into named sections and retain optional product links.
-- quote_items remains the historical line-item snapshot used by existing quotation/PDF flows.

CREATE TABLE IF NOT EXISTS public.quote_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS section_id UUID
  REFERENCES public.quote_sections(id) ON DELETE SET NULL;

ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS product_id UUID
  REFERENCES public.products(id) ON DELETE SET NULL;

-- BOQs can contain fractional measured quantities (for example, 1.5 m).
ALTER TABLE public.quote_items
  ALTER COLUMN quantity TYPE NUMERIC USING quantity::numeric;

ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_order
  ON public.quote_sections(quote_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_quote_items_section
  ON public.quote_items(section_id);

ALTER TABLE public.quote_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access for quote_sections"
  ON public.quote_sections;

CREATE POLICY "Admin full access for quote_sections"
  ON public.quote_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_quote_sections_updated_at
  ON public.quote_sections;

CREATE TRIGGER update_quote_sections_updated_at
  BEFORE UPDATE ON public.quote_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
