import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, LogOut, Eye, EyeOff, AlertCircle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  sessionExpired: boolean;
  refreshSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

// Inactivity timeout in milliseconds (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const AdminAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const { toast } = useToast();
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Check if user is admin by checking their email domain or specific emails
  const checkAdminRole = async (
    supabaseUser: SupabaseUser,
  ): Promise<AdminUser | null> => {
    try {
      const email = supabaseUser.email;

      // Define admin emails or email patterns
      const adminEmails = [
        "admin@driptech.com",
        "support@driptech.com",
        // Add more admin emails as needed
      ];

      // Check if user email is in admin list or has admin domain
      const isAdmin =
        adminEmails.includes(email || "") || email?.endsWith("@driptech.com");

      if (!isAdmin) {
        return null;
      }

      return {
        id: supabaseUser.id,
        email: email || "",
        name: supabaseUser.user_metadata?.name || "Admin User",
        role: "admin",
      };
    } catch (error) {
      console.error("Error checking admin role:", error);
      return null;
    }
  };

  // Function to handle auto logout due to inactivity
  const handleInactivityLogout = useCallback(async () => {
    console.log("Auto logout due to inactivity");
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setSessionExpired(true);
    toast({
      title: "Session Expired",
      description: "You were logged out due to inactivity",
      variant: "destructive",
    });
  }, [toast]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timer only if user is authenticated
    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        handleInactivityLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleInactivityLogout]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timer when not authenticated
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Events to track user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle function to avoid too many timer resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledResetTimer = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetInactivityTimer();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, throttledResetTimer);
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledResetTimer);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Function to refresh session manually
  const refreshSession = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !session) {
        console.error("Failed to refresh session:", error);
        setSessionExpired(true);
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const adminUser = await checkAdminRole(session.user);
      if (adminUser) {
        setUser(adminUser);
        setIsAuthenticated(true);
        setSessionExpired(false);
        resetInactivityTimer();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error refreshing session:", error);
      setSessionExpired(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced session validation
  const validateSession = async (session: any): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      // Check if token is expired (this is additional validation)
      const token = session.access_token;
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
          console.log("Token expired, attempting refresh...");
          return await refreshSession();
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating session:", error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const isValid = await validateSession(session);
          if (isValid) {
            const adminUser = await checkAdminRole(session.user);
            if (adminUser) {
              setUser(adminUser);
              setIsAuthenticated(true);
              setSessionExpired(false);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with enhanced error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            const adminUser = await checkAdminRole(session.user);
            if (adminUser) {
              setUser(adminUser);
              setIsAuthenticated(true);
              setSessionExpired(false);
            } else {
              // User is not admin, sign them out
              await supabase.auth.signOut();
              toast({
                title: "Access Denied",
                description: "You don't have admin privileges",
                variant: "destructive",
              });
            }
          }
          break;

        case "SIGNED_OUT":
          setUser(null);
          setIsAuthenticated(false);
          setSessionExpired(false);
          break;

        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          if (session?.user) {
            const adminUser = await checkAdminRole(session.user);
            if (adminUser) {
              setUser(adminUser);
              setIsAuthenticated(true);
              setSessionExpired(false);
            }
          }
          break;

        case "USER_UPDATED":
          if (session?.user) {
            const adminUser = await checkAdminRole(session.user);
            if (adminUser) {
              setUser(adminUser);
            }
          }
          break;
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        const adminUser = await checkAdminRole(data.user);
        if (adminUser) {
          setUser(adminUser);
          setIsAuthenticated(true);
          setSessionExpired(false);
          toast({
            title: "Success",
            description: "Logged in successfully",
          });
          return true;
        } else {
          // User is not admin, sign them out
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          return false;
        }
      }

      return false;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setSessionExpired(false);
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        sessionExpired,
        refreshSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// Session Expired Warning Component
const SessionExpiredWarning = ({
  onRefresh,
  onLogin,
}: {
  onRefresh: () => void;
  onLogin: () => void;
}) => (
  <div className="fixed top-4 right-4 z-50">
    <Card className="w-80 border-destructive">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Session Expired</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Your session has expired. Please refresh or login again.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={onRefresh}>
                Refresh
              </Button>
              <Button size="sm" onClick={onLogin}>
                Login
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Access the DripTech admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80"
              disabled={loading || !email || !password}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Use your admin credentials to access the dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, sessionExpired, refreshSession, logout } =
    useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <>
        <AdminLogin />
        <SessionExpiredWarning
          onRefresh={refreshSession}
          onLogin={logout} // This will trigger logout and show login
        />
      </>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <>{children}</>;
};

export const AdminHeader = () => {
  const { user, logout } = useAdminAuth();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{user?.name}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={logout}
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
};

export default AdminLogin;