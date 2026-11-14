import type { createClient } from "npm:@supabase/supabase-js@2";

type AdminClient = ReturnType<typeof createClient>;

export const MARKET_JOB_STALE_MS = 175_000;

export const MARKET_JOB_SELECT_FIELDS =
  "id,function_name,requested_by,status,progress_message,error_message,result_report_id,created_at,started_at,completed_at";

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
  const staleMessage =
    "The background Grok scan did not finish within the worker time limit. Try again or switch Grok Model to grok-4-fast in Admin -> System Settings -> API Keys.";

  for (const row of activeRows) {
    const anchor = String(row.started_at || row.created_at || "");
    const ageMs = now - new Date(anchor).getTime();
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

    await admin
      .from("grok_usage_logs")
      .update({
        status: "timeout",
        request_finished_at: nowIso,
        error_message: staleMessage,
      })
      .eq("job_id", row.id)
      .eq("status", "reserved");
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

export async function recordGrokUsageSuccess(
  admin: AdminClient,
  usageLogId: number,
  startedAtMs: number,
  usage: Record<string, unknown> | null,
  metadata: Record<string, unknown>,
) {
  await admin
    .from("grok_usage_logs")
    .update({
      status: "success",
      request_finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAtMs,
      input_tokens: usage?.input_tokens ?? null,
      output_tokens: usage?.output_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
      metadata,
    })
    .eq("id", usageLogId);
}

export async function recordGrokUsageFailure(
  admin: AdminClient,
  usageLogId: number,
  startedAtMs: number,
  message: string,
) {
  const isRateLimited = /429|rate.?limit/i.test(message);
  const isTimeout = /timeout|timed out|abort|signal timed out/i.test(message);
  await admin
    .from("grok_usage_logs")
    .update({
      status: isRateLimited ? "rate_limited" : isTimeout ? "timeout" : "error",
      request_finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAtMs,
      error_code: isRateLimited ? "429" : null,
      error_message: message.slice(0, 1000),
    })
    .eq("id", usageLogId);
}
