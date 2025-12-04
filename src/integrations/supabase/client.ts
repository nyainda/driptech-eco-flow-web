import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const USE_D1 = import.meta.env.VITE_USE_D1 === 'true';

// Only require Supabase credentials if D1 is not enabled
if (!USE_D1 && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
  );
}

// Create a mock client if using D1 and Supabase is not configured
const createMockSupabaseClient = () => {
  // Create a chainable mock query builder
  const createMockQueryBuilder = () => {
    const mockQuery: any = {
      select: () => mockQuery,
      eq: () => mockQuery,
      neq: () => mockQuery,
      gt: () => mockQuery,
      gte: () => mockQuery,
      lt: () => mockQuery,
      lte: () => mockQuery,
      like: () => mockQuery,
      ilike: () => mockQuery,
      is: () => mockQuery,
      in: () => mockQuery,
      contains: () => mockQuery,
      containedBy: () => mockQuery,
      rangeGt: () => mockQuery,
      rangeGte: () => mockQuery,
      rangeLt: () => mockQuery,
      rangeLte: () => mockQuery,
      rangeAdjacent: () => mockQuery,
      overlaps: () => mockQuery,
      textSearch: () => mockQuery,
      match: () => mockQuery,
      not: () => mockQuery,
      or: () => mockQuery,
      filter: () => mockQuery,
      order: () => mockQuery,
      limit: () => mockQuery,
      range: () => mockQuery,
      insert: () => mockQuery,
      update: () => mockQuery,
      delete: () => mockQuery,
      upsert: () => mockQuery,
      single: async () => ({ data: null, error: new Error('Supabase not configured - using D1') }),
      maybeSingle: async () => ({ data: null, error: new Error('Supabase not configured - using D1') }),
      then: async (resolve: any) => resolve({ data: [], error: new Error('Supabase not configured - using D1') }),
    };
    return mockQuery;
  };

  const mockClient: any = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
    },
    from: () => createMockQueryBuilder(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
        download: async () => ({ data: null, error: new Error('Supabase not configured') }),
        list: async () => ({ data: [], error: new Error('Supabase not configured') }),
        remove: async () => ({ data: null, error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
  return mockClient;
};

export const supabase = (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
  ? createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // For OAuth flows
        flowType: "pkce", // More secure auth flow
      },
      // Optional: Add global settings
      global: {
        headers: {
          "x-my-custom-header": "my-app-name",
        },
      },
    },
  )
  : createMockSupabaseClient();

// Global auth state listener for handling token events (only if real Supabase client)
if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event, session?.user?.email);

    switch (event) {
      case "SIGNED_IN":
        console.log("User signed in successfully");
        break;
      case "SIGNED_OUT":
        console.log("User signed out");
        // Clear any app-specific cached data here if needed
        break;
      case "TOKEN_REFRESHED":
        console.log("Token refreshed successfully");
        break;
      case "USER_UPDATED":
        console.log("User updated");
        break;
      case "PASSWORD_RECOVERY":
        console.log("Password recovery initiated");
        break;
    }
  });
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return !error && !!session;
  } catch {
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return error ? null : user;
  } catch {
    return null;
  }
};

// Helper function for handling API calls with automatic retry on token refresh
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 1,
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // If JWT expired and we haven't exhausted retries
    if (error?.code === "PGRST301" && maxRetries > 0) {
      console.log("JWT expired, attempting to refresh session...");

      // Force a session refresh
      const {
        data: { session },
        error: refreshError,
      } = await supabase.auth.getSession();

      if (refreshError || !session) {
        throw new Error("Unable to refresh session");
      }

      // Retry the API call
      return withRetry(apiCall, maxRetries - 1);
    }

    throw error;
  }
};
