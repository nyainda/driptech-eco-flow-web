import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

const VisitorTracker = () => {
  const location = useLocation();
  const { trackPageView } = useVisitorTracking();

  useEffect(() => {
    const trackCurrentPage = () => {
      const path = location.pathname + location.search;
      const title = document.title || path;

      // Small delay to ensure page has loaded
      setTimeout(() => {
        trackPageView(path, title);
      }, 100);
    };

    trackCurrentPage();
  }, [location, trackPageView]);

  return null; // This component doesn't render anything
};

export default VisitorTracker;
