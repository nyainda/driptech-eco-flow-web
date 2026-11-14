import { supabase } from "@/integrations/supabase/client";

export async function extractEdgeFunctionError(invokeError: unknown, data: unknown): Promise<string> {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string" &&
    (data as { error: string }).error.trim()
  ) {
    return (data as { error: string }).error.trim();
  }

  if (invokeError && typeof invokeError === "object") {
    const errObj = invokeError as { message?: string; context?: Response };
    if (errObj.context && typeof errObj.context.clone === "function") {
      try {
        const payload = await errObj.context.clone().json();
        if (payload && typeof payload.error === "string" && payload.error.trim()) {
          return payload.error.trim();
        }
      } catch {
        try {
          const text = await errObj.context.clone().text();
          if (text.trim()) return text.trim().slice(0, 300);
        } catch {
          // Ignore response body fallback errors.
        }
      }
    }
    if (errObj.message) return errObj.message;
  }

  return "Request failed.";
}

export async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    throw new Error(await extractEdgeFunctionError(error, data));
  }
  const payload = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  if (typeof payload.error === "string" && payload.error.trim()) {
    throw new Error(payload.error.trim());
  }
  return payload;
}
