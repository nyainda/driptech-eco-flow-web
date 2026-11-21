import {
  SESSION_TIMEOUT_MS,
  generateTrackingId,
  getBrowserInfo,
  getDeviceType,
  getLocationFromTimezone,
  sanitizePathForAnalytics,
  shouldSkipClientTracking,
} from "./analyticsHelpers";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isTelemetryConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const VISITOR_ID_KEY = "visitor_id";
const SESSION_ID_KEY = "session_id";
const SESSION_START_KEY = "session_started_at";
const SESSION_LAST_ACTIVE_KEY = "session_last_active_at";

const memoryFallbackStore = new Map<string, string>();
const initializedSessionIds = new Set<string>();
const sessionInitPromises = new Map<string, Promise<void>>();
let engagementRpcSupported = true;

const safeGetStorage = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? memoryFallbackStore.get(key) ?? null;
  } catch {
    return memoryFallbackStore.get(key) ?? null;
  }
};

const safeSetStorage = (storage: Storage | undefined, key: string, value: string): void => {
  memoryFallbackStore.set(key, value);
  try {
    storage?.setItem(key, value);
  } catch {
    // Ignore storage quota or private browsing errors cleanly
  }
};

export interface TrackingIdentity {
  visitorId: string;
  sessionId: string;
  sessionStartedAtMs: number;
}

export const getTrackingIdentity = (): TrackingIdentity => {
  const now = Date.now();
  const ls = typeof window !== "undefined" ? window.localStorage : undefined;
  const ss = typeof window !== "undefined" ? window.sessionStorage : undefined;

  let visitorId = safeGetStorage(ls, VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateTrackingId();
    safeSetStorage(ls, VISITOR_ID_KEY, visitorId);
  }

  let sessionId = safeGetStorage(ss, SESSION_ID_KEY);
  const lastActiveRaw = safeGetStorage(ss, SESSION_LAST_ACTIVE_KEY);
  const lastActiveMs = lastActiveRaw ? Number(lastActiveRaw) : 0;
  let sessionStartRaw = safeGetStorage(ss, SESSION_START_KEY);
  let sessionStartedAtMs = sessionStartRaw ? Number(sessionStartRaw) : 0;

  const sessionExpired =
    !sessionId ||
    !Number.isFinite(lastActiveMs) ||
    lastActiveMs <= 0 ||
    now - lastActiveMs > SESSION_TIMEOUT_MS;

  if (sessionExpired) {
    sessionId = generateTrackingId();
    sessionStartedAtMs = now;
    sessionStartRaw = String(now);
    safeSetStorage(ss, SESSION_ID_KEY, sessionId);
    safeSetStorage(ss, SESSION_START_KEY, sessionStartRaw);
  } else if (!Number.isFinite(sessionStartedAtMs) || sessionStartedAtMs <= 0) {
    sessionStartedAtMs = now;
    safeSetStorage(ss, SESSION_START_KEY, String(now));
  }

  safeSetStorage(ss, SESSION_LAST_ACTIVE_KEY, String(now));

  return {
    visitorId,
    sessionId: sessionId!,
    sessionStartedAtMs,
  };
};

export const telemetryFetch = async (
  pathAndQuery: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    prefer?: string;
    keepalive?: boolean;
  } = {},
): Promise<{ ok: boolean; status: number }> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 0 };
  }

  try {
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
    if (options.prefer) {
      headers.Prefer = options.prefer;
    }

    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`, {
      method: options.method || "POST",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      keepalive: Boolean(options.keepalive),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
};

export const ensureTrackingSession = async (
  identity: TrackingIdentity = getTrackingIdentity(),
): Promise<void> => {
  if (!isTelemetryConfigured || shouldSkipClientTracking()) return;
  if (initializedSessionIds.has(identity.sessionId)) return;

  const inFlight = sessionInitPromises.get(identity.sessionId);
  if (inFlight) {
    await inFlight;
    return;
  }

  const task = (async () => {
    const sessionStartIso = new Date(identity.sessionStartedAtMs).toISOString();
    const { ok } = await telemetryFetch("visitor_sessions?on_conflict=id", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=minimal",
      body: {
        id: identity.sessionId,
        visitor_id: identity.visitorId,
        session_start: sessionStartIso,
        browser: getBrowserInfo(),
        device_type: getDeviceType(),
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent?.slice(0, 500) || null : null,
        referrer:
          typeof document !== "undefined" && document.referrer
            ? document.referrer.slice(0, 500)
            : null,
        location: getLocationFromTimezone(),
        created_at: new Date().toISOString(),
      },
    });
    if (ok) {
      initializedSessionIds.add(identity.sessionId);
    }
  })();

  sessionInitPromises.set(identity.sessionId, task);
  try {
    await task;
  } finally {
    sessionInitPromises.delete(identity.sessionId);
  }
};

export const recordPageViewEvent = async (
  path: string,
  title: string,
  referrerOverride?: string | null,
): Promise<{ pageViewId: string; identity: TrackingIdentity } | null> => {
  if (!isTelemetryConfigured || shouldSkipClientTracking()) return null;

  const identity = getTrackingIdentity();
  await ensureTrackingSession(identity);

  const cleanPath = sanitizePathForAnalytics(path);
  const pageViewId = generateTrackingId();
  const nowIso = new Date().toISOString();
  const rawReferrer =
    referrerOverride ??
    (typeof document !== "undefined" && document.referrer ? document.referrer : null);

  const { ok } = await telemetryFetch("page_views", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      id: pageViewId,
      visitor_id: identity.visitorId,
      session_id: identity.sessionId,
      page_path: cleanPath,
      page_title: (title || cleanPath).slice(0, 200),
      timestamp: nowIso,
      referrer: rawReferrer ? rawReferrer.slice(0, 500) : null,
      created_at: nowIso,
    },
  });

  return ok ? { pageViewId, identity } : null;
};

export const flushEngagementDuration = async (params: {
  visitorId: string;
  sessionId: string;
  pageViewId?: string | null;
  pageDurationSeconds?: number | null;
  sessionDurationSeconds?: number | null;
  markExit?: boolean;
  keepalive?: boolean;
}): Promise<void> => {
  if (!isTelemetryConfigured || !engagementRpcSupported || shouldSkipClientTracking()) return;

  const pageSec =
    typeof params.pageDurationSeconds === "number" && Number.isFinite(params.pageDurationSeconds)
      ? Math.max(0, Math.min(1800, Math.round(params.pageDurationSeconds)))
      : null;
  const sessionSec =
    typeof params.sessionDurationSeconds === "number" &&
    Number.isFinite(params.sessionDurationSeconds)
      ? Math.max(0, Math.min(14400, Math.round(params.sessionDurationSeconds)))
      : null;

  if (!params.pageViewId && (sessionSec === null || sessionSec <= 0)) return;

  const res = await telemetryFetch("rpc/record_visitor_engagement", {
    method: "POST",
    keepalive: params.keepalive,
    body: {
      p_session_id: params.sessionId,
      p_visitor_id: params.visitorId,
      p_page_view_id: params.pageViewId || null,
      p_page_duration: pageSec,
      p_session_duration: sessionSec,
      p_mark_exit: Boolean(params.markExit),
    },
  });

  if (res.status === 404) {
    engagementRpcSupported = false;
  }
};

export const recordWhatsAppOutboundClick = (
  phone: string | null,
  hasPrefilledMessage: boolean,
  source = "website",
): void => {
  if (!isTelemetryConfigured || shouldSkipClientTracking()) return;

  const identity = getTrackingIdentity();
  void ensureTrackingSession(identity).then(() =>
    telemetryFetch("whatsapp_click_events", {
      method: "POST",
      prefer: "return=minimal",
      keepalive: true,
      body: {
        visitor_id: identity.visitorId,
        session_id: identity.sessionId,
        page_path: sanitizePathForAnalytics(
          `${window.location.pathname}${window.location.search}`,
        ),
        source: source.trim().slice(0, 200) || "website",
        target_number: phone,
        has_prefilled_message: hasPrefilledMessage,
        clicked_at: new Date().toISOString(),
      },
    }),
  );
};

/**
 * Lightweight tracker for static pre-rendered SEO HTML pages that skip mounting
 * the React SPA tree in src/main.tsx.
 */
export const initStaticSeoTracking = (): void => {
  if (!isTelemetryConfigured || shouldSkipClientTracking()) return;

  let currentPageViewId: string | null = null;
  let activeIdentity: TrackingIdentity | null = null;
  let accumulatedVisibleMs = 0;
  let visibleSinceMs: number | null =
    document.visibilityState === "visible" ? Date.now() : null;
  let hasFlushedExit = false;

  const getActiveSeconds = (): number => {
    const running = visibleSinceMs !== null ? Date.now() - visibleSinceMs : 0;
    return Math.round((accumulatedVisibleMs + Math.max(0, running)) / 1000);
  };

  const pauseVisibleTimer = () => {
    if (visibleSinceMs !== null) {
      accumulatedVisibleMs += Math.max(0, Date.now() - visibleSinceMs);
      visibleSinceMs = null;
    }
  };

  const resumeVisibleTimer = () => {
    if (document.visibilityState === "visible" && visibleSinceMs === null) {
      visibleSinceMs = Date.now();
    }
  };

  const flush = (markExit: boolean) => {
    if (!activeIdentity) return;
    if (markExit && hasFlushedExit) return;
    if (markExit) hasFlushedExit = true;

    pauseVisibleTimer();
    const activePageSec = getActiveSeconds();
    const sessionSec = Math.round((Date.now() - activeIdentity.sessionStartedAtMs) / 1000);
    void flushEngagementDuration({
      visitorId: activeIdentity.visitorId,
      sessionId: activeIdentity.sessionId,
      pageViewId: currentPageViewId,
      pageDurationSeconds: activePageSec,
      sessionDurationSeconds: sessionSec,
      markExit,
      keepalive: true,
    });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush(false);
    } else {
      resumeVisibleTimer();
    }
  });

  window.addEventListener("pagehide", () => flush(true));

  // Track WhatsApp link clicks on pre-rendered static SEO pages
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href*="wa.me"], a[href*="whatsapp.com"]') as
        | HTMLAnchorElement
        | null;
      if (!link) return;
      try {
        const parsed = new URL(link.href, window.location.origin);
        const phone =
          parsed.hostname === "wa.me"
            ? parsed.pathname.replace(/\D/g, "")
            : (parsed.searchParams.get("phone") || "").replace(/\D/g, "");
        if (phone === "254723407849" || phone === "254141294497") {
          recordWhatsAppOutboundClick(
            phone,
            parsed.searchParams.has("text"),
            link.dataset.whatsappSource || link.getAttribute("aria-label") || link.textContent || "seo page link",
          );
        }
      } catch {
        // Ignore malformed links
      }
    },
    true,
  );

  const boot = () => {
    const path = `${window.location.pathname}${window.location.search}`;
    void recordPageViewEvent(path, document.title || path).then((res) => {
      if (res) {
        currentPageViewId = res.pageViewId;
        activeIdentity = res.identity;
      }
    });
  };

  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof ric === "function") {
    ric(boot, { timeout: 1500 });
  } else {
    window.setTimeout(boot, 1200);
  }
};
