-- Add public read policies for remaining analytics tables
-- page_views and product_interactions only have authenticated read access

CREATE POLICY "Public read access to page_views"
ON page_views
FOR SELECT
USING (true);

CREATE POLICY "Public read access to product_interactions"
ON product_interactions
FOR SELECT
USING (true);