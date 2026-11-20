import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

const VisitorTracker = () => {
  const location = useLocation();
  // Administration traffic is operational activity, not customer behaviour.
  // Excluding it prevents dashboard refreshes from inflating public metrics.
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { trackPageView } = useVisitorTracking({ enabled: !isAdminRoute });

  useEffect(() => {
    const trackCurrentPage = () => {
      if (isAdminRoute) return;

      const path = location.pathname + location.search;
      const title = document.title || path;

      // Defer analytics tracking until after critical initial paint / LCP
      const ric = (window as unknown as {
        requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }).requestIdleCallback;
      const cic = (window as unknown as {
        cancelIdleCallback?: (id: number) => void;
      }).cancelIdleCallback;

      if (typeof ric === "function") {
        const id = ric(() => trackPageView(path, title), { timeout: 1800 });
        return () => cic?.(id);
      }

      const timer = window.setTimeout(() => {
        trackPageView(path, title);
      }, 1500);

      return () => window.clearTimeout(timer);
    };

    return trackCurrentPage();
  }, [isAdminRoute, location.pathname, location.search, trackPageView]);

  return null; // This component doesn't render anything
};

export default VisitorTracker;
