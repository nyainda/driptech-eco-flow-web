-- Irrigation Market Intelligence stores evidence snapshots and structured Grok interpretation.
-- Credentials are stored only as Supabase Edge Function secrets.

create table if not exists public.irrigation_market_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  executive_summary text not null default '',
  report_data jsonb not null default '{}'::jsonb,
  search_console_snapshot jsonb not null default '{}'::jsonb,
  keyword_estimates jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  model text not null default 'grok-4.7',
  created_at timestamptz not null default now()
);

create index if not exists irrigation_market_reports_created_at_idx
  on public.irrigation_market_reports (created_at desc);

alter table public.irrigation_market_reports enable row level security;

-- Reads and writes are performed only by the admin-authenticated Edge Function via service_role.
revoke all on public.irrigation_market_reports from anon, authenticated;
grant all on public.irrigation_market_reports to service_role;
