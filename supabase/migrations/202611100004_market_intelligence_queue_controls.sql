-- Durable, quota-controlled Grok queue for Market Intelligence.
-- Apply in Supabase SQL Editor. Edge Functions process queued jobs separately from the browser request.

create table if not exists public.market_intelligence_jobs (
  id uuid primary key default gen_random_uuid(),
  function_name text not null check (function_name in ('irrigation-market-intelligence','seo-intelligence')),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  requested_by uuid,
  request_payload jsonb not null default '{}'::jsonb,
  result_report_id uuid,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists market_intelligence_jobs_queue_idx
  on public.market_intelligence_jobs(status, created_at) where status = 'queued';
create index if not exists market_intelligence_jobs_owner_idx
  on public.market_intelligence_jobs(requested_by, created_at desc);

create table if not exists public.grok_usage_logs (
  id bigint generated always as identity primary key,
  job_id uuid references public.market_intelligence_jobs(id) on delete set null,
  function_name text not null,
  model text not null,
  status text not null check (status in ('reserved','success','error','timeout','rate_limited')),
  request_started_at timestamptz not null default now(),
  request_finished_at timestamptz,
  duration_ms integer,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(12,6),
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists grok_usage_logs_started_idx on public.grok_usage_logs(request_started_at desc);
create index if not exists grok_usage_logs_job_idx on public.grok_usage_logs(job_id);

alter table public.market_intelligence_jobs enable row level security;
alter table public.grok_usage_logs enable row level security;
revoke all on public.market_intelligence_jobs from anon, authenticated;
revoke all on public.grok_usage_logs from anon, authenticated;
grant all on public.market_intelligence_jobs to service_role;
grant all on public.grok_usage_logs to service_role;

-- Atomically enforce one active job, a 30-minute cooldown and a configurable daily Grok cap.
-- Returns {ok:true, job_id} or {ok:false, reason, retry_after_seconds}.
create or replace function public.enqueue_market_intelligence_job(
  p_function_name text,
  p_requested_by uuid,
  p_payload jsonb default '{}'::jsonb,
  p_daily_limit integer default 4,
  p_cooldown_minutes integer default 30
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active public.market_intelligence_jobs;
  v_last timestamptz;
  v_count integer;
  v_job_id uuid;
  v_retry integer;
begin
  if p_function_name not in ('irrigation-market-intelligence','seo-intelligence') then
    return jsonb_build_object('ok',false,'reason','unsupported_function');
  end if;

  -- Serialize quota checks across both analysis functions to prevent concurrent bypasses.
  perform pg_advisory_xact_lock(hashtext('driptech-grok-analysis-quota'));

  select * into v_active from public.market_intelligence_jobs
   where status in ('queued','running')
   order by created_at asc limit 1;
  if found then
    return jsonb_build_object('ok',false,'reason','analysis_already_active','job_id',v_active.id);
  end if;

  select max(request_started_at) into v_last from public.grok_usage_logs
   where status in ('reserved','success','error','timeout','rate_limited');
  if v_last is not null and v_last > now() - make_interval(mins => p_cooldown_minutes) then
    v_retry := greatest(1,ceil(extract(epoch from (v_last + make_interval(mins => p_cooldown_minutes) - now())))::integer);
    return jsonb_build_object('ok',false,'reason','cooldown','retry_after_seconds',v_retry);
  end if;

  select count(*) into v_count from public.grok_usage_logs
   where request_started_at >= date_trunc('day', now())
     and status in ('reserved','success','error','timeout','rate_limited');
  if v_count >= greatest(1,p_daily_limit) then
    return jsonb_build_object('ok',false,'reason','daily_limit','daily_limit',p_daily_limit);
  end if;

  insert into public.market_intelligence_jobs(function_name,requested_by,request_payload)
  values (p_function_name,p_requested_by,coalesce(p_payload,'{}'::jsonb))
  returning id into v_job_id;
  return jsonb_build_object('ok',true,'job_id',v_job_id,'status','queued');
end;
$$;
revoke all on function public.enqueue_market_intelligence_job(text,uuid,jsonb,integer,integer) from public, anon, authenticated;
grant execute on function public.enqueue_market_intelligence_job(text,uuid,jsonb,integer,integer) to service_role;

-- Claim exactly one queued job safely; concurrent workers use SKIP LOCKED.
create or replace function public.claim_market_intelligence_job()
returns setof public.market_intelligence_jobs
language sql
security definer
set search_path = public
as $$
  update public.market_intelligence_jobs j
     set status='running', started_at=now(), updated_at=now(), attempts=attempts+1
   where j.id = (
     select id from public.market_intelligence_jobs
      where status='queued' order by created_at asc
      for update skip locked limit 1
   )
  returning j.*;
$$;
revoke all on function public.claim_market_intelligence_job() from public, anon, authenticated;
grant execute on function public.claim_market_intelligence_job() to service_role;

-- Usage reservation is written before the outbound API call; failed calls count toward the cap.
