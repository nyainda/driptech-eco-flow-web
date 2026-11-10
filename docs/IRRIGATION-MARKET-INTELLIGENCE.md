# Irrigation Market Intelligence — setup and evidence rules

The Analytics workspace includes a dedicated Irrigation Market Intelligence view. It runs on demand and saves each report so the team can review past research.

## Evidence is intentionally separated

1. **Actual measurements — Google Search Console.** Clicks, impressions, CTR and average position for the connected DripTech property and the stated date window. Query and landing-page rows are the top rows returned by the Search Console API, not a promise that every query has been returned. Search Console data is delayed by Google; the report date window ends three days before the scan.
2. **Third-party estimates — DataForSEO.** The optional Google Keyword Ideas API returns keyword suggestions and estimated monthly search volume, CPC and paid-search competition for Kenya/English. These are estimates from a third-party keyword database, not DripTech traffic, not exact counts of individual searches and not Search Console measurements. The UI shows the provider, market, retrieval time and provider-reported request cost when available.
3. **Public competitor evidence.** Grok uses web search to inspect publicly accessible competitor pages, category/product pages, public pricing, FAQs and guides. This does not expose a competitor's private Search Console, visitor analytics, revenue, sales or conversion data.
4. **AI recommendations.** Grok's interpretations, topic ideas and recommended actions are explicitly presented as analysis, not measurements. The model is instructed never to invent keyword search volumes. The numeric estimate table is rendered from the DataForSEO response only.

## 1. Apply the database migration

Apply:

`supabase/migrations/202611100003_irrigation_market_intelligence.sql`

The table has RLS enabled. Browser roles are denied direct table access; the Edge Function uses the service role after verifying the signed-in admin.

## 2. Configure Supabase Edge Function secrets

Required for reports:

- `XAI_API_KEY`: xAI API key used by the server-side Grok request.
- Existing Google Search Console configuration: `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, and the connected OAuth refresh token stored by the current GSC integration.

Optional third-party estimates:

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

Create DataForSEO API credentials in the provider account and add them only under Supabase → Edge Functions → Secrets. Never put credentials in the React app, SQL migration, GitHub, or browser storage.

The keyword research uses the DataForSEO Labs Google Keyword Ideas live endpoint with Kenya and English targeting. The endpoint is metered. One manual scan makes one keyword-ideas request using a compact set of irrigation seed terms. Review DataForSEO's current pricing before enabling the credentials:
- API documentation: https://docs.dataforseo.com/v3/dataforseo_labs-google-keyword_ideas-live/
- Pricing: https://dataforseo.com/pricing

Without DataForSEO credentials the rest of the scan still runs, but third-party search volumes remain unavailable. Grok is instructed not to invent or estimate them.

## 3. Deploy the Edge Function

Deploy `irrigation-market-intelligence` after applying the migration. The function requires a signed-in admin request and checks the user's email using the same admin allowlist convention as the existing SEO intelligence function.

## 4. Usage and cost controls

- Scans are manual; no cron job or recurring keyword lookup is enabled.
- Each scan may incur xAI usage. If DataForSEO credentials are configured, it may also incur one paid keyword-ideas request.
- The report stores the Search Console response, the raw third-party keyword estimates, provider-reported cost when supplied, Grok report JSON and public citation URLs.
- The function requests a bounded set of 12 seed keywords and limits the returned keyword ideas to 80.
- Do not treat third-party volume estimates as guaranteed demand. Compare them with actual Search Console clicks/impressions and commercial context before changing stock, pricing or content priorities.

## 5. Suggested review workflow

1. Run a scan after Search Console is connected.
2. Review actual DripTech query and landing-page measurements first.
3. Review the third-party Kenya keyword-estimate table separately.
4. Open the cited public competitor sources and verify time-sensitive prices or product claims.
5. Treat Grok's prioritized page/content recommendations as hypotheses to validate, then track the changes in Search Console over the following weeks.
