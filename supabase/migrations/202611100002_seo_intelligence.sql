-- DripTech SEO intelligence: editable public competitor watchlist and saved Grok reports.
-- API credentials are deliberately stored as Supabase Edge Function secrets, never in these tables.

create table if not exists public.seo_intelligence_settings (
  id integer primary key default 1 check (id = 1),
  competitors jsonb not null default '[
    {"name":"Grekkon Limited","domain":"grekkon.com","focus":"Irrigation systems, greenhouses, pumps"},
    {"name":"Afrodrip Limited","domain":"afrodrip.co.ke","focus":"Dripline, pipes, irrigation manufacturing"},
    {"name":"FineTouch Africa","domain":"finetouch.co.ke","focus":"Irrigation supply, greenhouses, pumps"},
    {"name":"Davis & Shirtliff","domain":"davisandshirtliff.com","focus":"Water pumps, solar pumping, irrigation equipment"},
    {"name":"IrriGuru","domain":"irriguru.co.ke","focus":"Drip and sprinkler irrigation systems"}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.seo_intelligence_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.seo_intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null default 'full_audit'
    check (report_type in ('full_audit', 'competitor_scan', 'product_opportunity')),
  title text not null,
  executive_summary text not null default '',
  report_data jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  model text not null default 'grok-4.7',
  created_at timestamptz not null default now()
);

create index if not exists seo_intelligence_reports_created_at_idx
  on public.seo_intelligence_reports (created_at desc);
create index if not exists seo_intelligence_reports_type_created_idx
  on public.seo_intelligence_reports (report_type, created_at desc);

alter table public.seo_intelligence_settings enable row level security;
alter table public.seo_intelligence_reports enable row level security;

-- All access goes through the admin-checked Edge Function using service_role.
revoke all on public.seo_intelligence_settings from anon, authenticated;
revoke all on public.seo_intelligence_reports from anon, authenticated;
grant all on public.seo_intelligence_settings to service_role;
grant all on public.seo_intelligence_reports to service_role;
