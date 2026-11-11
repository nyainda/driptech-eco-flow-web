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
import {
  Lock,
  User,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  Droplets,
  ShieldCheck,
  BarChart3,
  Package,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
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

  // Check the role table; email domains are not an authorization boundary.
  const checkAdminRole = async (
    supabaseUser: SupabaseUser,
  ): Promise<AdminUser | null> => {
    try {
      const email = supabaseUser.email;
      const { data: isAdmin, error } = await supabase.rpc("is_admin", {
        _user_id: supabaseUser.id,
      });
      if (error) throw error;

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
  <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
    <Card className="w-80 border-destructive/50 bg-card/95 backdrop-blur-md shadow-2xl">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-foreground">Session Expired</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your admin session timed out due to inactivity. Refresh your session or sign in again.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 text-xs">
                Refresh Session
              </Button>
              <Button size="sm" onClick={onLogin} className="h-8 text-xs">
                Sign In
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

  const capabilities = [
    {
      icon: Package,
      title: "Catalog & Kit Engineering",
      detail: "Manage driplines, sprinklers, pumps, filtration specs, and complete acreage kits.",
    },
    {
      icon: BarChart3,
      title: "Quotes, BOQs & M-Pesa Billing",
      detail: "Generate farm bills of quantities, track invoices, and reconcile M-Pesa payments.",
    },
    {
      icon: Sparkles,
      title: "AI Market & SEO Intelligence",
      detail: "Monitor Search Console queries, visitor telemetry, and Cloudflare D1 edge sync.",
    },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background text-foreground">
      {/* Left Brand & Operations Panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border bg-slate-950 p-12 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.25), transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300/90 hover:text-emerald-200 transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to DripTech public storefront
          </Link>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shadow-inner">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                DripTech EcoFlow
              </p>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Operations & Commerce Command Center
              </h1>
            </div>
          </div>

          <div className="mt-12 max-w-lg space-y-4">
            <h2 className="text-3xl font-bold tracking-tight leading-tight text-white">
              Precision management for Kenya's smart irrigation network.
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Control product inventory, farm quotations, technician dispatch, customer relationships, and edge database synchronization from a single unified workspace.
            </p>
          </div>

          <div className="mt-10 space-y-4 max-w-lg">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                >
                  <div className="rounded-lg bg-emerald-500/15 p-2.5 text-emerald-400 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Protected by role-based access control & PKCE auth</span>
          </div>
          <span>30m inactivity lock</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to storefront
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  DripTech EcoFlow
                </p>
                <p className="text-lg font-bold text-foreground">Admin Portal</p>
              </div>
            </div>
          </div>

          <Card className="border-border/80 bg-card/95 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-primary to-teal-500" />
            <CardHeader className="space-y-2 pb-6 pt-7 px-7">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
                <Lock className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Sign in to Admin Workspace
              </CardTitle>
              <CardDescription className="text-sm">
                Enter your administrator credentials to unlock catalog, billing, and analytics tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Administrator Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dripstech.co.ke"
                    required
                    disabled={loading}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="h-11 rounded-xl bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                  className="h-11 w-full rounded-xl font-semibold shadow-md transition-all"
                  disabled={loading || !email || !password}
                >
                  {loading ? "Verifying credentials..." : "Sign In to Workspace"}
                </Button>
              </form>
              <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Authorized personnel only. Role verification is enforced via Supabase <code className="font-mono text-[11px]">is_admin</code> security policies.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, sessionExpired, refreshSession, logout } =
    useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
        <p className="text-xs font-medium text-muted-foreground">Verifying administrator session...</p>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <>
        <AdminLogin />
        <SessionExpiredWarning
          onRefresh={refreshSession}
          onLogin={logout}
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
    <div className="flex items-center gap-2.5">
      <div className="hidden md:flex items-center gap-2.5 rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
          {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
        </div>
        <div className="leading-none">
          <p className="text-xs font-semibold text-foreground">{user?.name || "Admin"}</p>
          <p className="text-[10px] text-muted-foreground">{user?.email || "Administrator"}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={logout}
        className="h-9 rounded-xl border-border/80 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
      >
        <LogOut className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
      </Button>
    </div>
  );
};

export default AdminLogin;