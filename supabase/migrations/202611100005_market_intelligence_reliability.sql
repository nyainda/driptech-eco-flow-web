-- Scan settings and recommendation progress are part of a report's identity and review workflow.
alter table public.irrigation_market_reports
  add column if not exists cache_key text,
  add column if not exists scan_parameters jsonb not null default '{}'::jsonb;

create index if not exists irrigation_market_reports_cache_idx
  on public.irrigation_market_reports (cache_key, created_at desc)
  where cache_key is not null;

alter table public.market_intelligence_jobs
  add column if not exists progress_message text not null default 'Waiting for a worker';

create table if not exists public.market_intelligence_recommendation_status (
  report_id uuid not null references public.irrigation_market_reports(id) on delete cascade,
  recommendation_index integer not null check (recommendation_index >= 0),
  title text not null,
  category text not null default '',
  priority text not null default '',
  status text not null default 'open' check (status in ('open', 'done')),
  updated_by uuid,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (report_id, recommendation_index)
);

create index if not exists market_intelligence_recommendation_status_report_idx
  on public.market_intelligence_recommendation_status (report_id, status);

alter table public.market_intelligence_recommendation_status enable row level security;
revoke all on public.market_intelligence_recommendation_status from anon, authenticated;
grant all on public.market_intelligence_recommendation_status to service_role;
