import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

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

export const useVisitorTracking = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const [visitorId] = useState(() => {
    let id = localStorage.getItem("visitor_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("visitor_id", id);
    }
    return id;
  });

  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem("session_id");
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem("session_id", id);
    }
    return id;
  });

  const sessionStartTime = useRef<Date>(new Date());
  const currentPageStartTime = useRef<Date>(new Date());
  const currentPagePath = useRef<string>("");
  const currentPageViewId = useRef<string | null>(null);
  const isSessionInitialized = useRef<boolean>(false);
  const sessionInitPromise = useRef<Promise<void> | null>(null);
  const hasTrackedExit = useRef<boolean>(false); // Added for session end tracking

  // Helper function to end the session
  const endSession = async () => {
    const sessionEnd = new Date();
    const totalDuration = Math.floor(
      (sessionEnd.getTime() - sessionStartTime.current.getTime()) / 1000,
    );

    const currentPageDuration = Math.floor(
      (sessionEnd.getTime() - currentPageStartTime.current.getTime()) / 1000,
    );

    if (currentPageViewId.current && currentPageDuration >= 0 && currentPageDuration < 3600) {
      try {
        const { error } = await supabase
          .from("page_views")
          .update({ time_spent: currentPageDuration, exit_page: true })
          .eq("id", currentPageViewId.current);
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
        const { error } = await supabase
          .from("visitor_sessions")
          .update({
            session_end: sessionEnd.toISOString(),
            total_duration: totalDuration,
          })
          .eq("id", sessionId);

        if (error) {
          console.error("Error updating session end:", error);
        }
      } catch (updateError) {
        console.error("Error during session update:", updateError);
      }
    }
  };

  // Initialize session with better error handling
  useEffect(() => {
    const initSession = async () => {
      if (!enabled || isSessionInitialized.current || sessionInitPromise.current) return;

      // Create a promise that resolves when session is ready
      sessionInitPromise.current = (async () => {
        try {
          const sessionData = {
            id: sessionId,
            visitor_id: visitorId,
            session_start: sessionStartTime.current.toISOString(),
            browser: getBrowserInfo(),
            device_type: getDeviceType(), // This now returns lowercase
            user_agent: navigator.userAgent?.substring(0, 500) || null,
            referrer: document.referrer?.substring(0, 500) || null,
            location: getLocationFromTimezone(),
            created_at: new Date().toISOString(),
          };

          // Direct insert with conflict handling using upsert
          const { error } = await supabase
            .from("visitor_sessions")
            .upsert(sessionData, { onConflict: "id", ignoreDuplicates: true });

          if (error) {
            throw error;
          }

          isSessionInitialized.current = true;
        } catch (error) {
          console.error("Unable to start visitor session:", error);
          isSessionInitialized.current = true;
        }
      })();

      await sessionInitPromise.current;
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initSession, 100);
    return () => clearTimeout(timer);
  }, [enabled, visitorId, sessionId]);

  // Clean session end handling
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionId && !hasTrackedExit.current) {
        hasTrackedExit.current = true;
        await endSession();
      }
    };

    // Only add beforeunload in production
    if (import.meta.env.PROD) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      if (import.meta.env.PROD) {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, [sessionId]);

  const trackPageView = async (path: string, title: string) => {
    if (!enabled) return;

    try {
      // Wait for session to be initialized
      if (sessionInitPromise.current) {
        await sessionInitPromise.current;
      }

      // Update time spent on previous page
      if (currentPagePath.current && currentPagePath.current !== path) {
        const timeSpent = Math.floor(
          (new Date().getTime() - currentPageStartTime.current.getTime()) /
          1000,
        );

        if (timeSpent > 0 && timeSpent < 3600) {
          try {
            const { error } = await supabase
              .from("page_views")
              .update({ time_spent: timeSpent })
              .eq("id", currentPageViewId.current);
            if (error) {
              console.error("Unable to update page duration:", error);
            }
          } catch (updateError) {
            console.error("Unexpected error updating page duration:", updateError);
          }
        }
      }

      // Create new page view record
      const pageViewId = uuidv4();
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

      const { error } = await supabase.from("page_views").insert(pageViewData);

      if (error) {
        console.error("Unable to record page view:", error);
        return;
      }

      // Update current page tracking
      currentPagePath.current = path;
      currentPageViewId.current = pageViewId;
      currentPageStartTime.current = new Date();

    } catch (error) {
      console.error("Unexpected error while recording page view:", error);
    }
  };

  const trackProductInteraction = async (
    productName: string,
    interactionType: string,
    additionalData?: any,
  ) => {
    if (!enabled) return;

    try {
      // Wait for session to be initialized
      if (sessionInitPromise.current) {
        await sessionInitPromise.current;
      }

      const interactionData = {
        id: uuidv4(),
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

      const { error } = await supabase
        .from("product_interactions")
        .insert(interactionData);

      if (error) {
        console.error("Unable to record product interaction:", error);
      }
    } catch (error) {
      console.error("Unexpected error while recording product interaction:", error);
    }
  };

  return {
    visitorId,
    sessionId,
    trackPageView,
    trackProductInteraction,
  };
};

// Helper functions
const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  return "Other";
};

// FIXED: Now returns lowercase values to match database constraint
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet"; // lowercase
  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
      userAgent,
    )
  )
    return "mobile"; // lowercase
  return "desktop"; // lowercase
};

const getLocationFromTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || "Unknown";
  } catch (error) {
    return "Unknown";
  }
};
