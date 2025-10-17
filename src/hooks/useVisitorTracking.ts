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

export const useVisitorTracking = () => {
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
  const isSessionInitialized = useRef<boolean>(false);
  const sessionInitPromise = useRef<Promise<void> | null>(null);

  // Initialize session with better error handling
  useEffect(() => {
    const initSession = async () => {
      if (isSessionInitialized.current || sessionInitPromise.current) return;

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

          // Direct insert with conflict handling
          const { error } = await supabase
            .from("visitor_sessions")
            .insert(sessionData);

          if (error) {
            // If duplicate key error, session already exists - that's fine
            if (
              error.code === "23505" ||
              error.message?.includes("duplicate key")
            ) {
              console.log("Session already exists, continuing...");
            } else {
              throw error;
            }
          }

          isSessionInitialized.current = true;
        } catch (error) {
          console.log("Session initialization error:", error);
          // Mark as initialized anyway to prevent infinite retries
          isSessionInitialized.current = true;
        }
      })();

      await sessionInitPromise.current;
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initSession, 100);
    return () => clearTimeout(timer);
  }, [visitorId, sessionId]);

  // Clean session end handling
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionEnd = new Date();
      const totalDuration = Math.floor(
        (sessionEnd.getTime() - sessionStartTime.current.getTime()) / 1000,
      );

      // Use sendBeacon for better reliability
      if (navigator.sendBeacon && totalDuration > 0) {
        const data = JSON.stringify({
          session_end: sessionEnd.toISOString(),
          total_duration: totalDuration,
        });

        const supabaseRestUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        navigator.sendBeacon(
          `${supabaseRestUrl}/rest/v1/visitor_sessions?id=eq.${sessionId}`,
          data,
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId]);

  const trackPageView = async (path: string, title: string) => {
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
            await supabase
              .from("page_views")
              .update({ time_spent: timeSpent })
              .eq("visitor_id", visitorId)
              .eq("session_id", sessionId)
              .eq("page_path", currentPagePath.current)
              .order("timestamp", { ascending: false })
              .limit(1);
          } catch (updateError) {
            // Ignore time spent update errors
          }
        }
      }

      // Create new page view record
      const pageViewData = {
        id: uuidv4(),
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
        console.log("Page view tracking error:", error);
      }

      // Update current page tracking
      currentPagePath.current = path;
      currentPageStartTime.current = new Date();

      // Try to increment page views count (ignore if RPC doesn't exist)
      try {
        await supabase.rpc("increment_page_views", {
          visitor_id_param: visitorId,
        });
      } catch (rpcError) {
        // Ignore RPC errors
      }
    } catch (error) {
      console.log("Page view tracking failed:", error);
    }
  };

  const trackProductInteraction = async (
    productName: string,
    interactionType: string,
    additionalData?: any,
  ) => {
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
        console.log("Product interaction tracking error:", error);
      }
    } catch (error) {
      console.log("Product interaction tracking failed:", error);
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
