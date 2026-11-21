import type { createClient } from "npm:@supabase/supabase-js@2";
import {
  type GrokUsageMetrics,
  estimateCostUsdFromCounts,
} from "./grok-client.ts";

type AdminClient = ReturnType<typeof createClient>;

export const MARKET_JOB_STALE_MS = 160_000;
export const DEFAULT_DAILY_GROK_USD_CAP = 2.0;
export const DEFAULT_DAILY_GROK_TOKEN_CAP = 500_000;

export const MARKET_JOB_SELECT_FIELDS =
  "id,function_name,requested_by,status,progress_message,error_message,result_report_id,created_at,started_at,completed_at";

const MODEL_GUIDANCE =
  "Try again with cached competitor insights or switch Grok Model to grok-4.20-0309-non-reasoning or grok-4.3 in Admin -> System Settings -> API Keys.";

function buildUsageMetadata(
  usage: GrokUsageMetrics | null | undefined,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...extra,
    ...(usage
      ? {
          cached_tokens: usage.cached_tokens,
          reasoning_tokens: usage.reasoning_tokens,
          web_search_calls: usage.web_search_calls,
          cost_in_usd_ticks: usage.cost_in_usd_ticks,
          cost_source: usage.cost_source,
        }
      : {}),
  };
}

export async function expireStaleMarketJobs(admin: AdminClient, jobId?: string): Promise<void> {
  let query = admin
    .from("market_intelligence_jobs")
    .select("id,started_at,created_at,status")
    .in("status", ["queued", "running"])
    .limit(10);
  if (jobId) {
    query = query.eq("id", jobId);
  }
  const { data: activeRows } = await query;
  if (!Array.isArray(activeRows) || activeRows.length === 0) return;

  const now = Date.now();
  const staleMessage = `The background Grok scan did not finish within the worker time limit. ${MODEL_GUIDANCE}`;

  for (const row of activeRows) {
    const anchor = String(row.started_at || row.created_at || "");
    const startMs = new Date(anchor).getTime();
    const ageMs = now - startMs;
    if (!Number.isFinite(ageMs) || ageMs <= MARKET_JOB_STALE_MS) continue;

    const nowIso = new Date().toISOString();
    await admin
      .from("market_intelligence_jobs")
      .update({
        status: "failed",
        progress_message: "Scan timed out",
        error_message: staleMessage,
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", row.id)
      .in("status", ["queued", "running"]);

    const { data: reservedLogs } = await admin
      .from("grok_usage_logs")
      .select("id,model,input_tokens,estimated_cost_usd,metadata,request_started_at")
      .eq("job_id", row.id)
      .eq("status", "reserved");

    for (const log of Array.isArray(reservedLogs) ? reservedLogs : []) {
      const meta = log.metadata && typeof log.metadata === "object"
        ? (log.metadata as Record<string, unknown>)
        : {};
      const estInput = Number(log.input_tokens || meta.estimated_prompt_tokens || 0);
      const estCost = log.estimated_cost_usd != null
        ? Number(log.estimated_cost_usd)
        : estimateCostUsdFromCounts({
            model: String(log.model || "grok-4.7"),
            inputTokens: estInput,
            webSearchCalls: meta.use_web_search ? 1 : 0,
          });
      const started = new Date(String(log.request_started_at || anchor)).getTime();
      await admin
        .from("grok_usage_logs")
        .update({
          status: "timeout",
          request_finished_at: nowIso,
          duration_ms: Number.isFinite(started) ? Math.max(0, now - started) : null,
          input_tokens: estInput > 0 ? estInput : null,
          output_tokens: 0,
          total_tokens: estInput > 0 ? estInput : null,
          estimated_cost_usd: estCost,
          error_message: staleMessage,
          metadata: {
            ...meta,
            abort_still_billed_risk: true,
            cost_source: "estimated",
          },
        })
        .eq("id", log.id);
    }
  }
}

export async function getActiveMarketJobForUser(
  admin: AdminClient,
  userId: string,
  expectedFunctionName?: string,
) {
  await expireStaleMarketJobs(admin);
  const { data: activeJobs, error } = await admin
    .from("market_intelligence_jobs")
    .select(MARKET_JOB_SELECT_FIELDS)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error("Could not load scan status: " + error.message);
  }

  const active = activeJobs?.[0] || null;
  if (!active) return null;

  if (expectedFunctionName && active.function_name !== expectedFunctionName) {
    const otherLabel =
      active.function_name === "seo-intelligence"
        ? "Grok SEO Intelligence"
        : "Irrigation Market Intelligence";
    return {
      id: null,
      function_name: active.function_name,
      status: active.status,
      progress_message: `A ${otherLabel} scan is currently running.`,
      ownedByUser: false,
    };
  }

  return active.requested_by === userId
    ? {
        id: active.id,
        function_name: active.function_name,
        status: active.status,
        progress_message: active.progress_message,
        error_message: active.error_message,
        result_report_id: active.result_report_id,
        created_at: active.created_at,
        started_at: active.started_at,
        ownedByUser: true,
      }
    : {
        id: null,
        function_name: active.function_name,
        status: active.status,
        progress_message: "Another administrator is running an intelligence scan.",
        ownedByUser: false,
      };
}

export async function getMarketJobStatus(admin: AdminClient, jobId: string, userId: string) {
  await expireStaleMarketJobs(admin, jobId);
  const { data: job, error } = await admin
    .from("market_intelligence_jobs")
    .select("id,status,progress_message,error_message,result_report_id,created_at,started_at,completed_at")
    .eq("id", jobId)
    .eq("requested_by", userId)
    .maybeSingle();

  if (error) throw new Error("Could not read scan status: " + error.message);
  return job;
}

export async function cancelMarketJob(admin: AdminClient, jobId: string, userId: string) {
  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from("market_intelligence_jobs")
    .update({
      status: "failed",
      progress_message: "Cancelled",
      error_message: "Scan cancelled by admin.",
      completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", jobId)
    .eq("requested_by", userId)
    .in("status", ["queued", "running"]);

  if (error) throw new Error("Could not cancel scan: " + error.message);

  await admin
    .from("grok_usage_logs")
    .update({
      status: "error",
      request_finished_at: nowIso,
      error_message: "Cancelled by admin.",
    })
    .eq("job_id", jobId)
    .eq("status", "reserved");
}

export async function checkGrokDailyBudget(
  admin: AdminClient,
  dailyUsdCap = DEFAULT_DAILY_GROK_USD_CAP,
  dailyTokenCap = DEFAULT_DAILY_GROK_TOKEN_CAP,
) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { data, error } = await admin
    .from("grok_usage_logs")
    .select("estimated_cost_usd,total_tokens,status")
    .gte("request_started_at", dayStart.toISOString());

  if (error || !Array.isArray(data)) {
    return {
      ok: true,
      dailySpendUsd: 0,
      dailyTokens: 0,
      callsToday: 0,
      budgetUsd: dailyUsdCap,
      tokenCap: dailyTokenCap,
    };
  }

  let dailySpendUsd = 0;
  let dailyTokens = 0;
  for (const row of data) {
    dailySpendUsd += Number(row.estimated_cost_usd || 0);
    dailyTokens += Number(row.total_tokens || 0);
  }
  dailySpendUsd = Number(dailySpendUsd.toFixed(6));

  return {
    ok: dailySpendUsd < dailyUsdCap && dailyTokens < dailyTokenCap,
    dailySpendUsd,
    dailyTokens,
    callsToday: data.length,
    budgetUsd: dailyUsdCap,
    tokenCap: dailyTokenCap,
  };
}

export async function createGrokUsageReservation(
  admin: AdminClient,
  params: {
    jobId?: string | null;
    functionName: string;
    model: string;
    estimatedPromptTokens: number;
    useWebSearch: boolean;
    maxTurns?: number;
    allowedDomains?: string[];
    metadata?: Record<string, unknown>;
  },
): Promise<number> {
  const baselineCost = estimateCostUsdFromCounts({
    model: params.model,
    inputTokens: params.estimatedPromptTokens,
    webSearchCalls: params.useWebSearch ? 1 : 0,
  });

  const { data, error } = await admin
    .from("grok_usage_logs")
    .insert({
      job_id: params.jobId ?? null,
      function_name: params.functionName,
      model: params.model,
      status: "reserved",
      input_tokens: params.estimatedPromptTokens > 0 ? params.estimatedPromptTokens : null,
      total_tokens: params.estimatedPromptTokens > 0 ? params.estimatedPromptTokens : null,
      estimated_cost_usd: baselineCost,
      metadata: {
        ...(params.metadata || {}),
        estimated_prompt_tokens: params.estimatedPromptTokens,
        use_web_search: params.useWebSearch,
        max_turns: params.useWebSearch ? params.maxTurns ?? 2 : 0,
        allowed_domains: params.allowedDomains || [],
        cost_source: "estimated",
      },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Could not reserve Grok usage record: " + error.message);
  }
  return Number(data.id);
}

/**
 * Persists exact xAI usage immediately after the HTTP response arrives so downstream
 * JSON/DB failures can never discard real token & USD consumption.
 */
export async function persistGrokUsageSnapshot(
  admin: AdminClient,
  usageLogId: number,
  startedAtMs: number,
  usage: GrokUsageMetrics,
  extraMetadata: Record<string, unknown> = {},
) {
  await admin
    .from("grok_usage_logs")
    .update({
      duration_ms: Date.now() - startedAtMs,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost_usd: usage.estimated_cost_usd,
      metadata: buildUsageMetadata(usage, extraMetadata),
    })
    .eq("id", usageLogId);
}

export async function recordGrokUsageSuccess(
  admin: AdminClient,
  usageLogId: number,
  startedAtMs: number,
  usage: GrokUsageMetrics | null,
  metadata: Record<string, unknown>,
) {
  await admin
    .from("grok_usage_logs")
    .update({
      status: "success",
      request_finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAtMs,
      ...(usage
        ? {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: usage.estimated_cost_usd,
          }
        : {}),
      metadata: buildUsageMetadata(usage, metadata),
    })
    .eq("id", usageLogId);
}

export async function recordGrokUsageFailure(
  admin: AdminClient,
  usageLogId: number,
  startedAtMs: number,
  message: string,
  options: {
    usage?: GrokUsageMetrics | null;
    model?: string;
    estimatedPromptTokens?: number;
    useWebSearch?: boolean;
    extraMetadata?: Record<string, unknown>;
  } = {},
) {
  const isRateLimited = /429|rate.?limit/i.test(message);
  const isTimeout = /timeout|timed out|abort|signal timed out/i.test(message);
  const isClientRejected = /http 40[013]|api error:.*(invalid|incorrect|key)/i.test(message);

  let usage = options.usage ?? null;
  const metaExtra: Record<string, unknown> = { ...(options.extraMetadata || {}) };

  if (!usage && isTimeout && options.model && options.estimatedPromptTokens) {
    const estCost = estimateCostUsdFromCounts({
      model: options.model,
      inputTokens: options.estimatedPromptTokens,
      webSearchCalls: options.useWebSearch ? 1 : 0,
    });
    usage = {
      input_tokens: options.estimatedPromptTokens,
      output_tokens: 0,
      total_tokens: options.estimatedPromptTokens,
      cached_tokens: 0,
      reasoning_tokens: 0,
      web_search_calls: options.useWebSearch ? 1 : 0,
      cost_in_usd_ticks: null,
      estimated_cost_usd: estCost,
      cost_source: "estimated",
    };
    metaExtra.abort_still_billed_risk = true;
  } else if (!usage && isClientRejected) {
    usage = {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      cached_tokens: 0,
      reasoning_tokens: 0,
      web_search_calls: 0,
      cost_in_usd_ticks: 0,
      estimated_cost_usd: 0,
      cost_source: "estimated",
    };
  }

  await admin
    .from("grok_usage_logs")
    .update({
      status: isRateLimited ? "rate_limited" : isTimeout ? "timeout" : "error",
      request_finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAtMs,
      error_code: isRateLimited ? "429" : null,
      error_message: message.slice(0, 1000),
      ...(usage
        ? {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: usage.estimated_cost_usd,
          }
        : {}),
      metadata: buildUsageMetadata(usage, metaExtra),
    })
    .eq("id", usageLogId);
}

export async function loadGrokUsageTelemetry(admin: AdminClient) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const [todayRes, recentRes] = await Promise.all([
    admin
      .from("grok_usage_logs")
      .select("function_name,status,input_tokens,output_tokens,total_tokens,estimated_cost_usd,metadata")
      .gte("request_started_at", dayStart.toISOString()),
    admin
      .from("grok_usage_logs")
      .select("id,job_id,function_name,model,status,duration_ms,input_tokens,output_tokens,total_tokens,estimated_cost_usd,metadata,request_started_at")
      .order("request_started_at", { ascending: false })
      .limit(8),
  ]);

  const todayRows = Array.isArray(todayRes.data) ? todayRes.data : [];
  let todayTokens = 0;
  let todaySpendUsd = 0;
  let todayWebSearchCalls = 0;
  let todayReasoningTokens = 0;
  for (const row of todayRows) {
    todayTokens += Number(row.total_tokens || 0);
    todaySpendUsd += Number(row.estimated_cost_usd || 0);
    const meta = row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
    todayWebSearchCalls += Number(meta.web_search_calls || 0);
    todayReasoningTokens += Number(meta.reasoning_tokens || 0);
  }

  return {
    todayCalls: todayRows.length,
    todayTokens,
    todayReasoningTokens,
    todayWebSearchCalls,
    todaySpendUsd: Number(todaySpendUsd.toFixed(6)),
    dailyBudgetUsd: DEFAULT_DAILY_GROK_USD_CAP,
    dailyTokenCap: DEFAULT_DAILY_GROK_TOKEN_CAP,
    recentLogs: (Array.isArray(recentRes.data) ? recentRes.data : []).map((row: Record<string, unknown>) => {
      const meta = row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {};
      return {
        id: row.id,
        job_id: row.job_id,
        function_name: row.function_name,
        model: row.model,
        status: row.status,
        duration_ms: row.duration_ms,
        input_tokens: row.input_tokens,
        output_tokens: row.output_tokens,
        total_tokens: row.total_tokens,
        estimated_cost_usd: row.estimated_cost_usd,
        reasoning_tokens: Number(meta.reasoning_tokens || 0),
        cached_tokens: Number(meta.cached_tokens || 0),
        web_search_calls: Number(meta.web_search_calls || 0),
        used_cached_competitors: !!meta.used_cached_competitors,
        request_started_at: row.request_started_at,
      };
    }),
  };
}
