
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

const VisitorTracker = () => {
  const location = useLocation();
  const { trackPageView } = useVisitorTracking();

  useEffect(() => {
    // Track page view when location changes
    const path = location.pathname;
    const title = document.title;
    
    // Small delay to ensure the page title is updated
    setTimeout(() => {
      trackPageView(path, title);
    }, 100);
  }, [location.pathname, trackPageView]);

  return null; // This component doesn't render anything
};

export default VisitorTracker;
