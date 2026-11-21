import { useCallback, useEffect, useRef } from "react";
import {
  generateTrackingId,
  sanitizePathForAnalytics,
  shouldSkipClientTracking,
} from "@/lib/analyticsHelpers";
import {
  ensureTrackingSession,
  flushEngagementDuration,
  getTrackingIdentity,
  isTelemetryConfigured,
  recordPageViewEvent,
  telemetryFetch,
} from "@/lib/analyticsTelemetry";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const runAfterIdle = (cb: () => void, timeoutMs = 1600): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const ric = (window as unknown as {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  }).requestIdleCallback;
  const cic = (window as unknown as {
    cancelIdleCallback?: (id: number) => void;
  }).cancelIdleCallback;

  if (typeof ric === "function") {
    const id = ric(cb, { timeout: timeoutMs });
    return () => cic?.(id);
  }
  const timer = window.setTimeout(cb, timeoutMs);
  return () => window.clearTimeout(timer);
};

export const useVisitorTracking = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const identityRef = useRef(getTrackingIdentity());
  const trackingEnabled = enabled && isTelemetryConfigured && !shouldSkipClientTracking();

  const currentPagePath = useRef<string>("");
  const currentPageViewId = useRef<string | null>(null);
  const accumulatedVisibleMs = useRef<number>(0);
  const visibleSinceMs = useRef<number | null>(
    typeof document !== "undefined" && document.visibilityState === "visible" ? Date.now() : null,
  );
  const hasTrackedExit = useRef<boolean>(false);

  const pauseVisibleTimer = useCallback(() => {
    if (visibleSinceMs.current !== null) {
      accumulatedVisibleMs.current += Math.max(0, Date.now() - visibleSinceMs.current);
      visibleSinceMs.current = null;
    }
  }, []);

  const resumeVisibleTimer = useCallback(() => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      visibleSinceMs.current === null
    ) {
      visibleSinceMs.current = Date.now();
    }
  }, []);

  const getActivePageSeconds = useCallback((): number => {
    const activeSlice =
      visibleSinceMs.current !== null ? Math.max(0, Date.now() - visibleSinceMs.current) : 0;
    return Math.round((accumulatedVisibleMs.current + activeSlice) / 1000);
  }, []);

  const flushSession = useCallback(
    (markExit: boolean) => {
      if (!trackingEnabled) return;
      if (markExit && hasTrackedExit.current) return;
      if (markExit) hasTrackedExit.current = true;

      pauseVisibleTimer();
      const identity = identityRef.current;
      const pageSec = getActivePageSeconds();
      const sessionSec = Math.round((Date.now() - identity.sessionStartedAtMs) / 1000);

      void flushEngagementDuration({
        visitorId: identity.visitorId,
        sessionId: identity.sessionId,
        pageViewId: currentPageViewId.current,
        pageDurationSeconds: pageSec,
        sessionDurationSeconds: sessionSec,
        markExit,
        keepalive: true,
      });
    },
    [trackingEnabled, pauseVisibleTimer, getActivePageSeconds],
  );

  // Initialize visitor session lazily after paint
  useEffect(() => {
    if (!trackingEnabled) return;
    return runAfterIdle(() => {
      void ensureTrackingSession(identityRef.current);
    }, 1600);
  }, [trackingEnabled]);

  // Reliable visibility & pagehide engagement persistence (replaces cancelled beforeunload PATCH)
  useEffect(() => {
    if (!trackingEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSession(false);
      } else {
        resumeVisibleTimer();
      }
    };

    const handlePageHide = () => {
      flushSession(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [trackingEnabled, flushSession, resumeVisibleTimer]);

  const trackPageView = useCallback(
    async (path: string, title: string) => {
      if (!trackingEnabled || shouldSkipClientTracking()) return;

      const cleanPath = sanitizePathForAnalytics(path);
      if (currentPagePath.current === cleanPath && currentPageViewId.current) {
        return;
      }

      // Refresh sliding 30-min session window
      identityRef.current = getTrackingIdentity();
      hasTrackedExit.current = false;

      // Flush engagement duration for the previous SPA route before recording next view
      if (currentPagePath.current && currentPageViewId.current) {
        pauseVisibleTimer();
        const prevDurationSec = getActivePageSeconds();
        const prevViewId = currentPageViewId.current;
        const identity = identityRef.current;
        if (prevDurationSec > 0) {
          void flushEngagementDuration({
            visitorId: identity.visitorId,
            sessionId: identity.sessionId,
            pageViewId: prevViewId,
            pageDurationSeconds: prevDurationSec,
            sessionDurationSeconds: Math.round((Date.now() - identity.sessionStartedAtMs) / 1000),
            markExit: false,
            keepalive: true,
          });
        }
      }

      const recorded = await recordPageViewEvent(
        cleanPath,
        title || cleanPath,
        currentPagePath.current || undefined,
      );

      if (recorded) {
        identityRef.current = recorded.identity;
        currentPagePath.current = cleanPath;
        currentPageViewId.current = recorded.pageViewId;
        accumulatedVisibleMs.current = 0;
        visibleSinceMs.current =
          typeof document !== "undefined" && document.visibilityState === "visible"
            ? Date.now()
            : null;
      }
    },
    [trackingEnabled, pauseVisibleTimer, getActivePageSeconds],
  );

  const trackProductInteraction = useCallback(
    async (productName: string, interactionType: string, additionalData?: Record<string, any>) => {
      if (!trackingEnabled || shouldSkipClientTracking()) return;

      try {
        const identity = getTrackingIdentity();
        identityRef.current = identity;
        await ensureTrackingSession(identity);

        const rawProductId =
          typeof additionalData?.productId === "string" ? additionalData.productId.trim() : "";
        const validProductId = UUID_REGEX.test(rawProductId) ? rawProductId : null;

        await telemetryFetch("product_interactions", {
          method: "POST",
          prefer: "return=minimal",
          body: {
            id: generateTrackingId(),
            visitor_id: identity.visitorId,
            session_id: identity.sessionId,
            page_path: sanitizePathForAnalytics(
              `${window.location.pathname}${window.location.search}`,
            ),
            product_name: (productName || "Unknown").slice(0, 100),
            product_id: validProductId,
            product_category:
              typeof additionalData?.category === "string"
                ? additionalData.category.slice(0, 50)
                : null,
            interaction_type: interactionType,
            timestamp: new Date().toISOString(),
            element_selector:
              typeof additionalData?.elementSelector === "string"
                ? additionalData.elementSelector.slice(0, 200)
                : null,
            additional_data: additionalData || null,
            created_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Unexpected error while recording product interaction:", error);
      }
    },
    [trackingEnabled],
  );

  return {
    visitorId: identityRef.current.visitorId,
    sessionId: identityRef.current.sessionId,
    trackPageView,
    trackProductInteraction,
  };
};
