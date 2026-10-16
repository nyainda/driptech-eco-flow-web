# DripTech Eco-Flow SEO Opportunity Audit — 16 October 2026

## Executive summary

DripTech already has a substantial SEO landing-page manifest, including product/category routes, drip irrigation, kit prices, sprinklers, pumps, filters, crop guides for tomatoes/onions/potatoes/capsicum/cabbage/watermelon/avocado/coffee/maize, cost planning, pump sizing, maintenance and troubleshooting. The highest-value next step is not to duplicate those pages. It is to strengthen internal linking and expand into verified gaps where competitors demonstrate topic coverage and where DripTech can add useful, original product and engineering guidance.

This is a qualitative competitor and site-coverage audit, not a claim of measured keyword search volumes. Search-volume and opportunity scoring should be refined with DripTech's Google Search Console query/page export and, if available, keyword-planner data.

## Competitor patterns observed

- **Grekkon** separates a broad online shop and product categories from crop/system guides. Public examples include garlic irrigation, passion-fruit irrigation, button drippers for orchard crops, and cost comparisons by crop and line layout.
- **Aqua Hub** combines a broad products catalogue with crop guides and kit/system pages. Its public content includes garlic irrigation, strawberry and other crop references, installation, drip kits and pipe/fitting pages.
- **Faulu Irrigation** publishes educational guides alongside product and system pages, including drip irrigation system and HDPE pipe price information.

These pages demonstrate topical coverage, not proof that every page ranks well. Their copy, images and distinctive layouts should not be copied. Use them to discover customer questions and then answer those questions in DripTech's own engineering voice.

## Existing DripTech coverage checked

The current `src/data/publicSeoPages.json` includes:
- Product/system pages: drip irrigation, drip kits and prices, driplines, sprinklers, solar pumps, borehole pumps, storage tanks, greenhouse drip, fertigation and filters.
- Crop pages: tomatoes, onions, potatoes, capsicum, cabbage, watermelon, avocado, coffee and maize.
- Decision and cost pages: drip vs sprinkler, system cost, one-acre system, dripline spacing, pump sizing and irrigation cost calculator.
- Support pages: maintenance, troubleshooting, blocked drippers, low sprinkler pressure, leaks/fittings, filter and pump problems, and drip tape vs dripline.

The sitemap is generated during the build from the SEO page definitions and dynamic content. Preserve current canonical URLs; new content should be additive, not a rewrite or renaming of established URLs. Validate the generated sitemap and each page's canonical URL before merging.

## Priority gaps implemented in this PR

1. **High-intent price/product information:** irrigation pipe prices, HDPE by size/PN, rain hose prices, and dripline roll prices.
2. **Crop-specific gaps shown in competitor coverage:** garlic, passion fruit, macadamia, strawberry and French beans.
3. **Cross-linking:** each new guide points to relevant product categories, calculator, related guides and contact/quotation page.
4. **Source transparency:** third-party price references and competitor topic references link to public source pages. Competitor figures are labelled as third-party references, never DripTech prices.

Crop guides deliberately avoid fixed watering schedules, guaranteed yields, fabricated quotations or unsupported claims. Final irrigation choices depend on field layout, crop stage, soil, water quality, flow, pressure and elevation.

## Remaining audit work after deployment

- Export Search Console Performance data for the latest 3 months: queries, landing pages, clicks, impressions, CTR and average position. Compare against the previous period and identify high-impression/low-CTR pages and pages ranking around positions 5–20.
- Check indexed/canonical status and crawl errors for existing high-value URLs before requesting indexing for new URLs.
- Review internal links from the homepage, product categories, relevant blog posts and installation guides; avoid orphan pages.
- Confirm live product prices, stock, image availability and structured data from the real catalogue.
- Measure impressions/clicks by page group after sufficient time; do not promise indexing or rankings from sitemap submission alone.

## Public references reviewed

- Grekkon product categories: https://grekkon.co.ke/product-category/irrigation-products/
- Grekkon garlic irrigation: https://grekkon.com/garlic-irrigation-farming-in-kenya/amp/
- Grekkon passion fruit irrigation: https://grekkon.com/passion-fruit-irrigation-in-kenya/
- Grekkon button drippers: https://grekkon.com/button-drippers-irrigation-in-kenya/
- Grekkon drip irrigation cost by crop: https://grekkon.com/cost-of-drip-irrigation-in-kenya/
- Aqua Hub products: https://www.aquahubkenya.co.ke/products/
- Aqua Hub garlic irrigation: https://www.aquahubkenya.co.ke/garlic-irrigation-farming-in-kenya-guide-for-2026/
- Aqua Hub drip kit and crop layout guide: https://www.aquahubkenya.co.ke/drip-irrigation-kit-price-in-kenya-best-2026/
- Faulu drip irrigation guide: https://fauluirrigation.co.ke/drip-irrigation-system-in-kenya-a-guide-to-efficient-watering/
- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
