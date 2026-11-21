-- Async job status columns for Grok B2B prospect discovery so long web_search scans
-- run in EdgeRuntime.waitUntil without hitting browser/gateway HTTP timeouts.

alter table public.b2b_outreach_campaigns
  add column if not exists status text not null default 'succeeded'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  add column if not exists progress_message text not null default '',
  add column if not exists error_message text,
  add column if not exists skipped_duplicates integer not null default 0,
  add column if not exists skipped_suppressed integer not null default 0,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists b2b_outreach_campaigns_status_created_idx
  on public.b2b_outreach_campaigns (status, created_at desc);

drop trigger if exists trg_b2b_outreach_campaigns_updated_at on public.b2b_outreach_campaigns;
create trigger trg_b2b_outreach_campaigns_updated_at
  before update on public.b2b_outreach_campaigns
  for each row execute function public.update_b2b_outreach_updated_at();
