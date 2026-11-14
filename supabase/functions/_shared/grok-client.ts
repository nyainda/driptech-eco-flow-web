const ALLOWED_ORIGINS = new Set([
  "https://www.dripstech.co.ke",
  "https://dripstech.co.ke",
  "https://driptech-eco-flow-web.vercel.app",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]);

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

export async function callXaiResponses(params: {
  apiKey: string;
  model: string;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  useWebSearch?: boolean;
}): Promise<Record<string, unknown>> {
  const { apiKey, model, prompt, maxOutputTokens, timeoutMs, useWebSearch = true } = params;
  const shouldSetLowReasoning = !model.toLowerCase().includes("non-reasoning");

  const runFetch = async (includeReasoning: boolean) => {
    const body: Record<string, unknown> = {
      model,
      input: [{ role: "user", content: prompt }],
      max_output_tokens: maxOutputTokens,
    };
    if (useWebSearch) {
      body.tools = [{ type: "web_search" }];
    }
    if (includeReasoning) {
      // Flagship grok-4.7 defaults to "high" reasoning effort, which pushes web_search calls past worker limits.
      body.reasoning = { effort: "low" };
    }

    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  };

  let { response, payload } = await runFetch(shouldSetLowReasoning);
  if (!response.ok && shouldSetLowReasoning) {
    const errText = String(payload?.error?.message || payload?.message || "");
    if (/reasoning|unsupported|unknown parameter/i.test(errText)) {
      ({ response, payload } = await runFetch(false));
    }
  }

  if (!response.ok) {
    throw new Error(
      "Grok API error: " + String(payload?.error?.message || payload?.message || "Research request failed."),
    );
  }

  return (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
}
