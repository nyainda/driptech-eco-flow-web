import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSupabaseRest, isSupabaseConfigured } from "@/integrations/supabase/config";

const generateTrackingId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

interface VisitorSession {
  id: string;
  visitor_id: string;
  session_start: string;
  browser?: string;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  location?: string;
}

interface PageView {
  visitor_id: string;
  session_id: string;
  page_path: string;
  page_title: string;
  timestamp: string;
  referrer?: string;
  time_spent?: number;
}

interface ProductInteraction {
  visitor_id: string;
  session_id: string;
  page_path: string;
  product_name: string;
  product_id?: string;
  product_category?: string;
  interaction_type: string;
  timestamp: string;
  element_selector?: string;
  additional_data?: any;
}

const initializedSessionIds = new Set<string>();
const sessionInitPromises = new Map<string, Promise<void>>();

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
  const trackingEnabled = enabled && isSupabaseConfigured;
  const [visitorId] = useState(() => {
    let id = localStorage.getItem("visitor_id");
    if (!id) {
      id = generateTrackingId();
      localStorage.setItem("visitor_id", id);
    }
    return id;
  });

  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem("session_id");
    if (!id) {
      id = generateTrackingId();
      sessionStorage.setItem("session_id", id);
    }
    return id;
  });

  const currentPagePath = useRef<string>("");
  const currentPageViewId = useRef<string | null>(null);
  const isSessionInitialized = useRef<boolean>(false);
  const sessionInitPromise = useRef<Promise<void> | null>(null);
  const hasTrackedExit = useRef<boolean>(false); // Added for session end tracking

  // Helper function to end the session
  const endSession = async () => {
    if (!trackingEnabled) return;
    const sessionEnd = new Date();
    const totalDuration = Math.floor(
      (sessionEnd.getTime() - sessionStartTime.current.getTime()) / 1000,
    );

    const currentPageDuration = Math.floor(
      (sessionEnd.getTime() - currentPageStartTime.current.getTime()) / 1000,
    );

    if (currentPageViewId.current && currentPageDuration >= 0 && currentPageDuration < 3600) {
      try {
        const { error } = await fetchSupabaseRest(
          `page_views?id=eq.${encodeURIComponent(currentPageViewId.current)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ time_spent: currentPageDuration, exit_page: true }),
          },
        );
        if (error) {
          console.error("Error updating final page view:", error);
        }
      } catch (updateError) {
        console.error("Error updating final page view:", updateError);
      }
    }

    if (totalDuration > 0) {
      try {
        // Update the session in the database with end time and duration
        const { error } = await fetchSupabaseRest(
          `visitor_sessions?id=eq.${encodeURIComponent(sessionId)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
              session_end: sessionEnd.toISOString(),
              total_duration: totalDuration,
            }),
          },
        );

        if (error) {
          console.error("Error updating session end:", error);
        }
      } catch (updateError) {
        console.error("Error during session update:", updateError);
      }
    }
  };

  // Initialize session once per browser session (module-level deduplication)
  const ensureSessionInitialized = useCallback(async () => {
    if (!trackingEnabled || initializedSessionIds.has(sessionId)) return;

    const existingPromise = sessionInitPromises.get(sessionId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const promise = (async () => {
      try {
        const sessionData = {
          id: sessionId,
          visitor_id: visitorId,
          session_start: sessionStartTime.current.toISOString(),
          browser: getBrowserInfo(),
          device_type: getDeviceType(),
          user_agent: navigator.userAgent?.substring(0, 500) || null,
          referrer: document.referrer?.substring(0, 500) || null,
          location: getLocationFromTimezone(),
          created_at: new Date().toISOString(),
        };

        const { error } = await fetchSupabaseRest("visitor_sessions?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify(sessionData),
        });

        if (error) {
          throw error;
        }
        initializedSessionIds.add(sessionId);
        isSessionInitialized.current = true;
      } catch (error) {
        console.error("Unable to start visitor session:", error);
        initializedSessionIds.add(sessionId);
        isSessionInitialized.current = true;
      } finally {
        sessionInitPromises.delete(sessionId);
      }
    })();

    sessionInitPromises.set(sessionId, promise);
    sessionInitPromise.current = promise;
    await promise;
  }, [trackingEnabled, visitorId, sessionId]);

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

        if (timeSpent > 0 && timeSpent < 3600) {
          try {
            const { error } = await fetchSupabaseRest(
              `page_views?id=eq.${encodeURIComponent(currentPageViewId.current || "")}`,
              {
                method: "PATCH",
                headers: { Prefer: "return=minimal" },
                body: JSON.stringify({ time_spent: timeSpent }),
              },
            );
            if (error) {
              console.error("Unable to update page duration:", error);
            }
          } catch (updateError) {
            console.error("Unexpected error updating page duration:", updateError);
          }
        }
      }

      // Create new page view record
      const pageViewId = generateTrackingId();
      const pageViewData = {
        id: pageViewId,
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: path,
        page_title: title?.substring(0, 200) || path,
        timestamp: new Date().toISOString(),
        referrer:
          (currentPagePath.current || document.referrer)?.substring(0, 500) ||
          null,
        created_at: new Date().toISOString(),
      };

      const { error } = await fetchSupabaseRest("page_views", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(pageViewData),
      });

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

      const interactionData = {
        id: generateTrackingId(),
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: window.location.pathname,
        product_name: productName?.substring(0, 100) || "Unknown",
        product_id: additionalData?.productId?.substring(0, 50) || null,
        product_category: additionalData?.category?.substring(0, 50) || null,
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
        element_selector:
          additionalData?.elementSelector?.substring(0, 200) || null,
        additional_data: additionalData || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await fetchSupabaseRest("product_interactions", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(interactionData),
      });

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
