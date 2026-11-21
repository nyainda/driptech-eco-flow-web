-- Upgrade Grok quota & usage accounting controls across all Grok-powered Edge Functions.
-- Enforces both per-function request caps and a shared daily USD / token ceiling.

create index if not exists grok_usage_logs_fn_started_idx
  on public.grok_usage_logs (function_name, request_started_at desc);

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
  v_daily_spend numeric;
  v_daily_tokens bigint;
  v_day_start timestamptz := date_trunc('day', timezone('utc', now()));
  v_daily_budget_usd constant numeric := 2.00;
  v_daily_token_cap constant bigint := 500000;
  v_job_id uuid;
  v_retry integer;
begin
  if p_function_name not in ('irrigation-market-intelligence','seo-intelligence') then
    return jsonb_build_object('ok',false,'reason','unsupported_function');
  end if;

  -- Serialize quota checks across all Grok consumers.
  perform pg_advisory_xact_lock(hashtext('driptech-grok-analysis-quota'));

  select * into v_active from public.market_intelligence_jobs
   where status in ('queued','running')
   order by created_at asc limit 1;
  if found then
    return jsonb_build_object('ok',false,'reason','analysis_already_active','job_id',v_active.id);
  end if;

  select max(request_started_at) into v_last from public.grok_usage_logs
   where function_name in ('irrigation-market-intelligence','seo-intelligence')
     and status in ('reserved','success','error','timeout','rate_limited');
  if v_last is not null and v_last > now() - make_interval(mins => p_cooldown_minutes) then
    v_retry := greatest(1,ceil(extract(epoch from (v_last + make_interval(mins => p_cooldown_minutes) - now())))::integer);
    return jsonb_build_object('ok',false,'reason','cooldown','retry_after_seconds',v_retry);
  end if;

  select count(*) into v_count from public.grok_usage_logs
   where request_started_at >= v_day_start
     and function_name in ('irrigation-market-intelligence','seo-intelligence')
     and status in ('reserved','success','error','timeout','rate_limited');
  if v_count >= greatest(1,p_daily_limit) then
    return jsonb_build_object('ok',false,'reason','daily_limit','daily_limit',p_daily_limit);
  end if;

  select
    coalesce(sum(coalesce(estimated_cost_usd, 0)), 0),
    coalesce(sum(coalesce(total_tokens, 0)), 0)
  into v_daily_spend, v_daily_tokens
  from public.grok_usage_logs
  where request_started_at >= v_day_start;

  if v_daily_spend >= v_daily_budget_usd or v_daily_tokens >= v_daily_token_cap then
    return jsonb_build_object(
      'ok', false,
      'reason', 'daily_budget',
      'daily_spend_usd', v_daily_spend,
      'daily_tokens', v_daily_tokens,
      'budget_usd', v_daily_budget_usd,
      'token_cap', v_daily_token_cap
    );
  end if;

  insert into public.market_intelligence_jobs(function_name,requested_by,request_payload)
  values (p_function_name,p_requested_by,coalesce(p_payload,'{}'::jsonb))
  returning id into v_job_id;
  return jsonb_build_object('ok',true,'job_id',v_job_id,'status','queued');
end;
$$;
revoke all on function public.enqueue_market_intelligence_job(text,uuid,jsonb,integer,integer) from public, anon, authenticated;
grant execute on function public.enqueue_market_intelligence_job(text,uuid,jsonb,integer,integer) to service_role;
