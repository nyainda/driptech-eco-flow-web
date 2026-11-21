const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let clientPromise: Promise<typeof import("./client").supabase> | null = null;

/**
 * Lazily loads the Supabase SDK only when fallback queries, auth, or tracking run.
 */
export const getSupabase = (): Promise<typeof import("./client").supabase> => {
  if (!clientPromise) {
    clientPromise = import("./client").then((mod) => mod.supabase);
  }
  return clientPromise;
};

/**
 * Lightweight PostgREST helper for public read/telemetry requests without pulling
 * the full @supabase/supabase-js SDK into public storefront bundles.
 */
export const fetchSupabaseRest = async <T = unknown>(
  pathAndQuery: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: Error | null }> => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return { data: null, error: new Error("Supabase not configured") };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`,
      {
        ...options,
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
    );

    if (!response.ok) {
      return { data: null, error: new Error(`HTTP ${response.status}`) };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const text = await response.text();
    return {
      data: text ? (JSON.parse(text) as T) : null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
};
