# DripTech SEO Intelligence — deployment setup

The Analytics workspace calls Grok from a Supabase Edge Function. The xAI API key stays server-side and is never exposed to the browser.

## 1. Add Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

- **XAI_API_KEY**: create an API key in the xAI API Console.
- **SEO_CRON_SECRET**: generate a long random secret (at least 32 characters). Use the same value in Supabase Vault in step 3.
- **XAI_GROK_MODEL** (optional): defaults to grok-4.7.

The existing Search Console integration also needs its configured GSC_CLIENT_ID, GSC_CLIENT_SECRET and stored OAuth token.

## 2. Apply database migration and deploy functions

Apply supabase/migrations/202611100002_seo_intelligence.sql, then deploy the seo-intelligence Edge Function and updated Analytics frontend.

The function accepts authenticated admin calls from the DripTech admin portal. Scheduled calls must carry the matching x-seo-cron-secret header.

## 3. Enable the weekly public-market scan (optional)

The first release is manual by default so you can review report quality and API spend before scheduling recurring research. When ready, enable pg_cron and pg_net in Supabase Database → Extensions, then run the following SQL in the SQL Editor. Replace the project URL and secret with your actual values. Store the same secret used for SEO_CRON_SECRET in Supabase Vault; do not commit it to Git.

```sql
select vault.create_secret(
  'https://cnvtnxesywbzwsxwpejw.supabase.co',
  'seo_intelligence_project_url'
);

select vault.create_secret(
  'REPLACE_WITH_THE_SAME_SEO_CRON_SECRET',
  'seo_intelligence_cron_secret'
);

select cron.schedule(
  'driptech-weekly-seo-intelligence',
  '0 5 * * 1',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'seo_intelligence_project_url'
      ) || '/functions/v1/seo-intelligence',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-seo-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'seo_intelligence_cron_secret'
        )
      ),
      body := '{"action":"run","days":28}'::jsonb
    );
  $$
);
```

This runs every Monday at 08:00 East Africa Time (05:00 UTC). Monitor execution in Supabase Database → Cron → Jobs. To disable it:

```sql
select cron.unschedule('driptech-weekly-seo-intelligence');
```

## 4. Cost and evidence notes

- Grok text generation and web-search tool invocations are billed by xAI. Check live xAI pricing before enabling automatic scans.
- This implementation uses web search, not X Search. X Search is a separate billable tool and can be considered later if social listening is required.
- Search Console metrics are first-party data. Product interaction counts are interest signals, not sales. Public competitor pages provide visible product/content evidence, not competitor traffic, sales or private analytics.
- Reports retain source links and the metric snapshot used so the team can review the evidence behind each recommendation.
