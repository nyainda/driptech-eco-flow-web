import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
    let id = localStorage.getItem('visitor_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('visitor_id', id);
    }
    return id;
  });

  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('session_id');
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem('session_id', id);
    }
    return id;
  });

  const sessionStartTime = useRef<Date>(new Date());
  const currentPageStartTime = useRef<Date>(new Date());
  const currentPagePath = useRef<string>('');

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionData = {
          visitor_id: visitorId,
          session_start: sessionStartTime.current.toISOString(),
          browser: getBrowserInfo(),
          device_type: getDeviceType(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || undefined,
          location: getLocationFromTimezone(),
        };

        // For now, just log the session data since tables are being set up
        console.log('Visitor tracking session:', sessionData);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();

    // Update session on page unload
    const handleBeforeUnload = async () => {
      try {
        const sessionEnd = new Date();
        const totalDuration = Math.floor(
          (sessionEnd.getTime() - sessionStartTime.current.getTime()) / 1000
        );

        await supabase
          .from('visitor_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            total_duration: totalDuration,
          })
          .eq('visitor_id', visitorId);
      } catch (error) {
        console.error('Error updating session end:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [visitorId]);

  const trackPageView = async (path: string, title: string) => {
    try {
      // Track time spent on previous page
      if (currentPagePath.current && currentPagePath.current !== path) {
        const timeSpent = Math.floor(
          (new Date().getTime() - currentPageStartTime.current.getTime()) / 1000
        );

        if (timeSpent > 0) {
          await supabase
            .from('page_views')
            .update({ time_spent: timeSpent })
            .eq('visitor_id', visitorId)
            .eq('page_path', currentPagePath.current)
            .order('timestamp', { ascending: false })
            .limit(1);
        }
      }

      // Track new page view
      const pageViewData = {
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: path,
        page_title: title,
        timestamp: new Date().toISOString(),
        referrer: currentPagePath.current || document.referrer || undefined,
      };

      // For now, just log the page view since tables are being set up
      console.log('Page view tracked:', pageViewData);

      // Update current page tracking
      currentPagePath.current = path;
      currentPageStartTime.current = new Date();

      // Update session page views count
      try {
        await supabase.rpc('increment_page_views', {
          visitor_id_param: visitorId,
        });
      } catch (rpcError) {
        console.log('RPC increment page views not available yet:', rpcError);
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackProductInteraction = async (
    productName: string,
    interactionType: string,
    additionalData?: any
  ) => {
    try {
      const interactionData = {
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: window.location.pathname,
        product_name: productName,
        product_id: additionalData?.productId,
        product_category: additionalData?.category,
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
        element_selector: additionalData?.elementSelector,
        additional_data: additionalData,
      };

      // For now, just log the interaction since tables are being set up
      console.log('Product interaction tracked:', interactionData);
    } catch (error) {
      console.error('Error tracking product interaction:', error);
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
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
};

const getLocationFromTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
};