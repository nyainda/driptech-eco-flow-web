# DripTech SEO and competitor research playbook

Last reviewed: 6 November 2026

## Objective

Win useful search traffic by answering the questions Kenyan farmers ask before buying, installing, maintaining or repairing irrigation systems. Use competitor sites as market research, not as copy sources.

## What established irrigation sites do well

| Site | Patterns worth learning from | DripTech opportunity |
| --- | --- | --- |
| Grekkon | Product categories, visible price ranges, kit variants, crop/row configuration explanations and focused product pages. | Make DripTech product pages clearer about model, spacing, wall thickness, flow, quantity, included fittings and what a kit price excludes. |
| Irri-Hub | Category-led shopping, visible current product prices, countrywide delivery messaging and easy contact paths. | Make product discovery and stock/price status easy to understand, with a fast WhatsApp/quotation path. |
| Davis & Shirtliff | Broad solution categories, company credibility, branch information, featured products, product manuals and service/support positioning. | Strengthen technical documentation, warranty clarity, service expectations and proof of capability without claiming branches that do not exist. |
| Netafim | End-to-end irrigation framing across design, installation, operation and maintenance. | Explain the full customer journey—not just equipment sales—including design inputs, commissioning, operator guidance and ongoing maintenance. |

Competitor pages inspected:

- Grekkon irrigation category: https://grekkon.co.ke/product-category/irrigation-products/
- Grekkon Eldoret drip kits: https://grekkon-eldoret.co.ke/product-category/drip-irrigation-kits/
- Irri-Hub shop: https://shop.irrihub.com/
- Davis & Shirtliff: https://www.davisandshirtliff.com/
- Netafim: https://www.netafim.com/en/

These are observations of public page structure and merchandising. They are not claims that one supplier is better overall.

## Customer friction to address with original DripTech content

The following themes are useful buyer questions to investigate and answer. They are not presented as measured rankings of complaints across the Kenyan market.

1. **Unclear installed cost.** A kit headline may exclude transport, tanks, stands, trenching, extra fittings, electrical work or installation. Publish a clear inclusions/exclusions checklist and itemised quotations.
2. **Wrong system configuration.** Acreage alone does not determine the kit. Crop spacing, lines per bed, emitter spacing, flow rate, wall thickness, lateral length and operating pressure must be matched.
3. **Blocked emitters and poor water quality.** Explain how water source, filtration, flushing access and maintenance affect system reliability. Do not prescribe chemical treatment without manufacturer guidance and qualified assessment.
4. **Low flow or weak sprinkler performance.** Explain the difference between pump power and delivered flow at total dynamic head. Use pump curves and the sprinkler's required operating pressure.
5. **After-sales uncertainty.** State what commissioning includes, which warranty applies, how a customer raises a claim, which parts are consumables and how replacement parts can be obtained.
6. **No practical handover.** Give customers a system layout, valve/zone labels, operation notes, maintenance schedule and a contact route after installation.

The quotation checklist page in this PR is the first response to these concerns. Follow it with product-specific specification tables, documented project case studies and maintenance guides backed by DripTech's own field experience.

## Free and low-cost research stack

| Tool | Best use | Notes |
| --- | --- | --- |
| Google Search Console | Real queries, impressions, clicks, CTR, average position and index coverage for dripstech.co.ke. | Highest priority because it shows how people already find DripTech. |
| Google Trends | Compare topic interest and regional/seasonal patterns. | Use it to generate hypotheses; confirm with Search Console and enquiries. |
| Web Scraper browser extension | Point-and-click extraction of visible tables and product fields from permitted public pages. | Good for small manual research jobs. |
| Octoparse Free | Desktop-based extraction of simple public pages into a spreadsheet. | Free tier limits apply and can change. |
| Scrapy | Repeatable, code-based crawler for sites that permit crawling. | Best when we need a controlled, documented crawl. |
| Apify | Run existing actors or small custom crawlers for permitted public pages. | Free usage credits/limits vary; check the current plan before running. |

Official tool pages:

- Google Search Console: https://search.google.com/search-console/about
- Google Trends: https://trends.google.com/trends/
- Web Scraper: https://www.webscraper.io/
- Octoparse pricing: https://www.octoparse.com/pricing
- Scrapy: https://scrapy.org/
- Apify pricing: https://apify.com/pricing

## Safe research rules

- Check each target site's terms, robots.txt and any published crawling guidance before collecting data.
- Keep request rates low. Do not bypass logins, paywalls, CAPTCHAs, technical restrictions or access controls.
- Do not scrape Google Search result pages or Google Maps reviews. Use Search Console for DripTech's own search data and approved/public sources for market research.
- Collect only what is needed for analysis: product category, product name, model, public price, listed specifications, delivery/warranty wording, page structure, FAQs and visible update date.
- Do not collect customer personal information.
- Do not republish a competitor's copy, images, product photography, reviews, manuals or page layout. Write original explanations, use DripTech's own photography and link to primary references where relevant.
- Treat an individual review as an anecdote, not proof of a widespread service problem. Look for repeated, independently supported themes before writing about market-wide complaints.

Google's policy on doorway abuse, scaled content abuse and scraped content is here:
https://developers.google.com/search/docs/essentials/spam-policies

## Publishing and indexing checklist

1. Publish a page only when it answers a distinct customer need with original, useful information.
2. Ensure the page is linked from a relevant hub, product page or guide; do not orphan it.
3. Give it a unique title, meta description, H1, canonical URL and useful visible content.
4. Include it in the generated sitemap only after the route and static HTML generation work.
5. Test that the URL returns HTTP 200, is not blocked by robots.txt and does not carry a noindex directive.
6. Submit the sitemap in Search Console. Use URL Inspection for a small number of priority pages.
7. Track impressions, queries, clicks, CTR, indexing status and actual enquiries. Improve pages based on real performance.

Submitting a sitemap or requesting a crawl does not guarantee indexing or rankings. Google's documentation says crawl and indexing can take days or weeks:
https://developers.google.com/search/docs/crawling-indexing/ask-google

## Next research cycle

- Export the last 3–6 months of Search Console queries and page performance.
- Tag queries by intent: product, price, location, design, troubleshooting, installation and after-sales.
- Compare those queries with WhatsApp questions and quotation objections received by DripTech.
- Review a small sample of permitted competitor product pages and public reviews; record recurring questions, not copied paragraphs.
- Prioritise pages where DripTech can add a better calculator, specification matrix, worked example, downloadable checklist, original photo or verified case study.
