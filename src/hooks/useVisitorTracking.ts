
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisitorSession {
  visitor_id: string;
  session_id: string;
  session_start: string;
}

export const useVisitorTracking = () => {
  const sessionRef = useRef<VisitorSession | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pageStartTimeRef = useRef<number>(Date.now());

  // Generate or get visitor ID
  const getVisitorId = (): string => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  };

  // Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let deviceType = 'desktop';
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Other';

    return { deviceType, browser };
  };

  // Initialize session
  const initializeSession = async () => {
    try {
      const visitorId = getVisitorId();
      const { deviceType, browser } = getDeviceInfo();
      
      const { data, error } = await supabase
        .from('visitor_sessions')
        .insert({
          visitor_id: visitorId,
          session_start: new Date().toISOString(),
          browser,
          device_type: deviceType,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      sessionRef.current = {
        visitor_id: visitorId,
        session_id: data.id,
        session_start: data.session_start
      };

      console.log('Session initialized:', sessionRef.current);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  // Track page view
  const trackPageView = async (path: string, title: string) => {
    if (!sessionRef.current) return;

    try {
      const { error } = await supabase
        .from('page_views')
        .insert({
          visitor_id: sessionRef.current.visitor_id,
          session_id: sessionRef.current.session_id,
          page_path: path,
          page_title: title,
          referrer: document.referrer || null,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking page view:', error);
      } else {
        console.log('Page view tracked:', path);
        pageStartTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  // Track product interaction
  const trackProductInteraction = async (
    productName: string,
    interactionType: string,
    productData?: {
      product_id?: string;
      product_category?: string;
      product_price?: number;
    }
  ) => {
    if (!sessionRef.current) return;

    try {
      const { error } = await supabase
        .from('product_interactions')
        .insert({
          visitor_id: sessionRef.current.visitor_id,
          session_id: sessionRef.current.session_id,
          product_name: productName,
          product_id: productData?.product_id,
          product_category: productData?.product_category,
          product_price: productData?.product_price,
          interaction_type: interactionType,
          page_path: window.location.pathname,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking product interaction:', error);
      } else {
        console.log('Product interaction tracked:', productName, interactionType);
      }
    } catch (error) {
      console.error('Error tracking product interaction:', error);
    }
  };

  // Update session on page unload
  const updateSession = async () => {
    if (!sessionRef.current) return;

    try {
      const sessionDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      await supabase
        .from('visitor_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_duration: sessionDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionRef.current.session_id);

      console.log('Session updated with duration:', sessionDuration);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Update page time spent
  const updatePageTimeSpent = async (path: string) => {
    if (!sessionRef.current) return;

    try {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      
      if (timeSpent > 0) {
        await supabase
          .from('page_views')
          .update({ time_spent: timeSpent })
          .eq('visitor_id', sessionRef.current.visitor_id)
          .eq('page_path', path)
          .order('timestamp', { ascending: false })
          .limit(1);
      }
    } catch (error) {
      console.error('Error updating page time spent:', error);
    }
  };

  useEffect(() => {
    initializeSession();

    // Track initial page view
    const currentPath = window.location.pathname;
    const currentTitle = document.title;
    setTimeout(() => trackPageView(currentPath, currentTitle), 1000);

    // Update session duration periodically
    const sessionInterval = setInterval(updateSession, 30000); // every 30 seconds

    // Handle page unload
    const handleBeforeUnload = () => {
      updateSession();
      updatePageTimeSpent(window.location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(sessionInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateSession();
      updatePageTimeSpent(window.location.pathname);
    };
  }, []);

  return {
    trackPageView,
    trackProductInteraction,
    session: sessionRef.current
  };
};
