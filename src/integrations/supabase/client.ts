import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cnvtnxesywbzwsxwpejw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudnRueGVzeXdiendzeHdwZWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDc5MTQsImV4cCI6MjA2Nzk4MzkxNH0.2N0Ou0PypE0U773zX0864G4Z27-lpmyZQJ6G31F1_Es";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // For OAuth flows
    flowType: 'pkce', // More secure auth flow
  },
  // Optional: Add global settings
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
});

// Global auth state listener for handling token events
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session?.user?.email);
  
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in successfully');
      break;
    case 'SIGNED_OUT':
      console.log('User signed out');
      // Clear any app-specific cached data here if needed
      break;
    case 'TOKEN_REFRESHED':
      console.log('Token refreshed successfully');
      break;
    case 'USER_UPDATED':
      console.log('User updated');
      break;
    case 'PASSWORD_RECOVERY':
      console.log('Password recovery initiated');
      break;
  }
});

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return !error && !!session;
  } catch {
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return error ? null : user;
  } catch {
    return null;
  }
};

// Helper function for handling API calls with automatic retry on token refresh
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // If JWT expired and we haven't exhausted retries
    if (error?.code === 'PGRST301' && maxRetries > 0) {
      console.log('JWT expired, attempting to refresh session...');
      
      // Force a session refresh
      const { data: { session }, error: refreshError } = await supabase.auth.getSession();
      
      if (refreshError || !session) {
        throw new Error('Unable to refresh session');
      }
      
      // Retry the API call
      return withRetry(apiCall, maxRetries - 1);
    }
    
    throw error;
  }
};