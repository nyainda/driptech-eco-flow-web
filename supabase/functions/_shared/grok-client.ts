const ALLOWED_ORIGINS = new Set([
  "https://www.dripstech.co.ke",
  "https://dripstech.co.ke",
  "https://driptech-eco-flow-web.vercel.app",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]);

const WEB_SEARCH_COST_PER_CALL_USD = 0.005;
const TICKS_PER_USD = 10_000_000_000;

export interface GrokUsageMetrics {
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cached_tokens: number;
  reasoning_tokens: number;
  web_search_calls: number;
  cost_in_usd_ticks: number | null;
  estimated_cost_usd: number | null;
  cost_source: "xai_ticks" | "estimated";
}

export interface GrokJsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

export interface GrokResponseResult {
  payload: Record<string, unknown>;
  text: string;
  citations: Array<{ title: string; url: string; domain: string }>;
  usage: GrokUsageMetrics;
  latencyMs: number;
}

export class GrokRequestError extends Error {
  httpStatus?: number;
  usage: GrokUsageMetrics | null;
  incomplete: boolean;

  constructor(
    message: string,
    options: { httpStatus?: number; usage?: GrokUsageMetrics | null; incomplete?: boolean } = {},
  ) {
    super(message);
    this.name = "GrokRequestError";
    this.httpStatus = options.httpStatus;
    this.usage = options.usage ?? null;
    this.incomplete = !!options.incomplete;
  }
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname.endsWith(".replit.dev") ||
      hostname.endsWith(".replit.app") ||
      (hostname.startsWith("driptech-eco-flow-web-") && hostname.endsWith(".vercel.app"))
    );
  } catch {
    return false;
  }
}

export function buildCorsHeaders(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-my-custom-header",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Max-Age": "86400",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return (
      error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /timed out|signal timed out|abort/i.test(error.message)
    );
  }
  return /timed out|signal timed out|abort/i.test(String(error));
}

export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function sanitizeAllowedDomains(domains: string[], maxDomains = 5): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of domains) {
    const cleaned = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    if (!cleaned || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned) || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= maxDomains) break;
  }
  return out;
}

export function extractGrokResponseText(response: Record<string, unknown>): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const fragments: string[] = [];
  for (const item of Array.isArray(response.output) ? response.output : []) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) fragments.push(text.trim());
    }
  }
  return fragments.join("\n");
}

export function extractGrokCitations(
  response: Record<string, unknown>,
): Array<{ title: string; url: string; domain: string }> {
  const citations: Array<{ title: string; url: string; domain: string }> = [];
  const seen = new Set<string>();
  const add = (title: unknown, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url) || seen.has(url)) return;
    seen.add(url);
    try {
      const domain = new URL(url).hostname;
      citations.push({
        title: typeof title === "string" && title.trim() ? title.trim().slice(0, 180) : domain,
        url,
        domain,
      });
    } catch {
      // Ignore malformed URLs.
    }
  };

  for (const citation of Array.isArray(response.citations) ? response.citations : []) {
    if (typeof citation === "string") add(undefined, citation);
    else if (citation && typeof citation === "object") {
      const item = citation as Record<string, unknown>;
      add(item.title, item.url);
    }
  }

  for (const item of Array.isArray(response.output) ? response.output : []) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const annotations = (part as Record<string, unknown>).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        if (citation.type === "url_citation") add(citation.title, citation.url);
      }
    }
  }

  return citations;
}

const toNonNegInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

function getModelRatesPerMillion(model: string, inputTokens: number) {
  const normalized = model.toLowerCase();
  const isLongContext = inputTokens >= 200_000;
  // Grok 4.20 / 4.3 (and retired fast aliases that redirect to 4.3)
  if (/grok-4\.2|grok-4\.3|grok-4-fast|grok-4-1-fast|grok-4-3/i.test(normalized)) {
    return {
      input: isLongContext ? 2.5 : 1.25,
      cachedInput: isLongContext ? 0.4 : 0.2,
      output: isLongContext ? 5.0 : 2.5,
    };
  }
  // Flagship Grok 4.6 / 4.7 rates
  return {
    input: isLongContext ? 4.0 : 2.0,
    cachedInput: isLongContext ? 1.0 : 0.5,
    output: isLongContext ? 12.0 : 6.0,
  };
}

export function estimateCostUsdFromCounts(params: {
  model: string;
  inputTokens: number;
  cachedTokens?: number;
  outputTokens?: number;
  webSearchCalls?: number;
}): number {
  const inputTokens = Math.max(0, params.inputTokens || 0);
  const cachedTokens = Math.min(inputTokens, Math.max(0, params.cachedTokens || 0));
  const uncachedInput = inputTokens - cachedTokens;
  const outputTokens = Math.max(0, params.outputTokens || 0);
  const webSearchCalls = Math.max(0, params.webSearchCalls || 0);
  const rates = getModelRatesPerMillion(params.model, inputTokens);

  const tokenUsd =
    (uncachedInput * rates.input) / 1_000_000 +
    (cachedTokens * rates.cachedInput) / 1_000_000 +
    (outputTokens * rates.output) / 1_000_000;
  const toolUsd = webSearchCalls * WEB_SEARCH_COST_PER_CALL_USD;
  return Number((tokenUsd + toolUsd).toFixed(6));
}

export function extractGrokUsage(
  payload: Record<string, unknown> | null | undefined,
  model: string,
  fallbackPromptTokens = 0,
): GrokUsageMetrics {
  const rawUsage =
    payload && payload.usage && typeof payload.usage === "object"
      ? (payload.usage as Record<string, unknown>)
      : {};
  const inputDetails =
    rawUsage.input_tokens_details && typeof rawUsage.input_tokens_details === "object"
      ? (rawUsage.input_tokens_details as Record<string, unknown>)
      : {};
  const outputDetails =
    rawUsage.output_tokens_details && typeof rawUsage.output_tokens_details === "object"
      ? (rawUsage.output_tokens_details as Record<string, unknown>)
      : {};
  const toolUsage =
    rawUsage.server_side_tool_usage && typeof rawUsage.server_side_tool_usage === "object"
      ? (rawUsage.server_side_tool_usage as Record<string, unknown>)
      : {};

  const inputTokens =
    toNonNegInt(rawUsage.input_tokens ?? rawUsage.prompt_tokens) ??
    (fallbackPromptTokens > 0 ? fallbackPromptTokens : null);
  const outputTokens = toNonNegInt(rawUsage.output_tokens ?? rawUsage.completion_tokens);
  const cachedTokens = toNonNegInt(inputDetails.cached_tokens ?? rawUsage.cached_tokens) ?? 0;
  const reasoningTokens = toNonNegInt(outputDetails.reasoning_tokens ?? rawUsage.reasoning_tokens) ?? 0;
  const totalTokens =
    toNonNegInt(rawUsage.total_tokens) ??
    (inputTokens !== null || outputTokens !== null ? (inputTokens ?? 0) + (outputTokens ?? 0) : null);

  let webSearchCalls = 0;
  for (const [key, val] of Object.entries(toolUsage)) {
    if (/web_search|search/i.test(key)) {
      webSearchCalls += toNonNegInt(val) ?? 0;
    }
  }
  if (webSearchCalls === 0 && rawUsage.num_sources_used != null) {
    webSearchCalls = toNonNegInt(rawUsage.num_sources_used) ?? 0;
  }
  if (webSearchCalls === 0 && payload && Array.isArray(payload.output)) {
    for (const item of payload.output) {
      if (item && typeof item === "object" && (item as Record<string, unknown>).type === "web_search_call") {
        webSearchCalls += 1;
      }
    }
  }

  const ticks = toNonNegInt(rawUsage.cost_in_usd_ticks);
  if (ticks !== null) {
    return {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cached_tokens: cachedTokens,
      reasoning_tokens: reasoningTokens,
      web_search_calls: webSearchCalls,
      cost_in_usd_ticks: ticks,
      estimated_cost_usd: Number((ticks / TICKS_PER_USD).toFixed(6)),
      cost_source: "xai_ticks",
    };
  }

  const estimatedUsd =
    inputTokens !== null || outputTokens !== null || webSearchCalls > 0
      ? estimateCostUsdFromCounts({
          model,
          inputTokens: inputTokens ?? 0,
          cachedTokens,
          outputTokens: outputTokens ?? 0,
          webSearchCalls,
        })
      : null;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cached_tokens: cachedTokens,
    reasoning_tokens: reasoningTokens,
    web_search_calls: webSearchCalls,
    cost_in_usd_ticks: null,
    estimated_cost_usd: estimatedUsd,
    cost_source: "estimated",
  };
}

export function parseGrokJsonObject(raw: string): Record<string, unknown> {
  const clean = raw.replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, "").trim();
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(clean.slice(start, end + 1));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Handled below.
      }
    }
  }
  throw new Error("Grok returned a response that was not valid JSON.");
}

/**
 * Calls xAI /v1/responses exactly ONCE (no timeout/truncation/retry duplicates).
 * Captures complete usage metrics including reasoning tokens, web_search calls, and xAI USD ticks.
 */
export async function callXaiResponses(params: {
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxOutputTokens: number;
  timeoutMs: number;
  useWebSearch?: boolean;
  allowedDomains?: string[];
  maxTurns?: number;
  reasoningEffort?: "low" | "medium" | "high";
  jsonSchema?: GrokJsonSchemaSpec;
}): Promise<GrokResponseResult> {
  const {
    apiKey,
    model,
    prompt,
    systemPrompt,
    maxOutputTokens,
    timeoutMs,
    useWebSearch = false,
    allowedDomains = [],
    maxTurns = 2,
    reasoningEffort = "low",
    jsonSchema,
  } = params;

  const estimatedPromptTokens = estimateTokensFromText((systemPrompt || "") + prompt);
  const isNonReasoningModel = model.toLowerCase().includes("non-reasoning");
  const normalizedDomains = sanitizeAllowedDomains(allowedDomains, 5);
  const clampedMaxTurns = Math.min(Math.max(Math.floor(maxTurns), 1), 3);

  const buildRequestBody = (opts: {
    includeReasoning: boolean;
    includeMaxTurns: boolean;
    includeSchema: boolean;
    includeFilters: boolean;
  }) => {
    const input: Array<{ role: string; content: string }> = [];
    if (systemPrompt && systemPrompt.trim()) {
      input.push({ role: "system", content: systemPrompt.trim() });
    }
    input.push({ role: "user", content: prompt });

    const body: Record<string, unknown> = {
      model,
      input,
      max_output_tokens: maxOutputTokens,
    };
    if (useWebSearch) {
      const tool: Record<string, unknown> = { type: "web_search" };
      if (opts.includeFilters && normalizedDomains.length > 0) {
        tool.filters = { allowed_domains: normalizedDomains };
      }
      body.tools = [tool];
      if (opts.includeMaxTurns) {
        body.max_turns = clampedMaxTurns;
      }
    }
    if (opts.includeReasoning && !isNonReasoningModel) {
      body.reasoning = { effort: reasoningEffort };
    }
    if (opts.includeSchema && jsonSchema) {
      body.text = {
        format: {
          type: "json_schema",
          name: jsonSchema.name,
          strict: jsonSchema.strict ?? true,
          schema: jsonSchema.schema,
        },
      };
    }
    return body;
  };

  const startedAt = Date.now();
  let opts = {
    includeReasoning: !isNonReasoningModel,
    includeMaxTurns: useWebSearch,
    includeSchema: !!jsonSchema,
    includeFilters: useWebSearch && normalizedDomains.length > 0,
  };

  const execute = async () => {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(buildRequestBody(opts)),
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { response, payload };
  };

  let { response, payload } = await execute();

  // Only recover once on a synchronous HTTP 400 validation error BEFORE inference ran (0 billed tokens).
  if (response.status === 400) {
    const errText = String(
      (payload?.error as Record<string, unknown> | undefined)?.message || payload?.message || "",
    );
    if (/reasoning|max_turns|text\.format|json_schema|filters|unknown parameter|unsupported/i.test(errText)) {
      const nextOpts = { ...opts };
      if (/reasoning/i.test(errText)) nextOpts.includeReasoning = false;
      if (/max_turns/i.test(errText)) nextOpts.includeMaxTurns = false;
      if (/text|format|json_schema|schema/i.test(errText)) nextOpts.includeSchema = false;
      if (/filters|allowed_domains/i.test(errText)) nextOpts.includeFilters = false;
      if (JSON.stringify(nextOpts) !== JSON.stringify(opts)) {
        opts = nextOpts;
        ({ response, payload } = await execute());
      }
    }
  }

  const latencyMs = Date.now() - startedAt;
  const usage = extractGrokUsage(payload, model, estimatedPromptTokens);

  if (!response.ok) {
    const errMessage = String(
      (payload?.error as Record<string, unknown> | undefined)?.message ||
        payload?.message ||
        `HTTP ${response.status} from xAI Responses API.`,
    );
    throw new GrokRequestError("Grok API error: " + errMessage, {
      httpStatus: response.status,
      usage: response.status === 400 || response.status === 401 ? null : usage,
    });
  }

  const incomplete =
    payload.status === "incomplete" ||
    (payload.incomplete_details as Record<string, unknown> | undefined)?.reason === "max_output_tokens";
  const text = extractGrokResponseText(payload);

  if (incomplete || !text) {
    throw new GrokRequestError(
      incomplete
        ? "Grok output hit max_output_tokens before finishing the JSON report."
        : "Grok returned an empty response.",
      { usage, incomplete: true },
    );
  }

  return {
    payload,
    text,
    citations: extractGrokCitations(payload),
    usage,
    latencyMs,
  };
}
