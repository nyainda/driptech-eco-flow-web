import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, LogOut, Eye, EyeOff, AlertCircle, Clock } from "lucide-react";
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
  idleWarning: boolean;
  timeUntilExpiry: number;
  refreshSession: () => Promise<boolean>;
  resetIdleTimer: () => void;
  extendSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Configuration constants
const IDLE_TIMEOUT = 30 * 60 * 1000; 
const WARNING_TIME = 5 * 60 * 1000; 
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
  
  const { toast } = useToast();
  
  // Refs for timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Check if user is admin using server-side role validation
  const checkAdminRole = async (supabaseUser: SupabaseUser): Promise<AdminUser | null> => {
    try {
      // Query user_roles table to check if user has admin role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .in('role', ['admin', 'super_admin', 'editor']);

      if (error) {
        console.error('Error checking user roles:', error);
        return null;
      }

      // User must have at least one admin role
      if (!userRoles || userRoles.length === 0) {
        return null;
      }

      // Get the highest priority role
      const role = userRoles.find(r => r.role === 'super_admin')?.role || 
                   userRoles.find(r => r.role === 'admin')?.role ||
                   userRoles.find(r => r.role === 'editor')?.role ||
                   'admin';

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || 'Admin User',
        role
      };
    } catch (error) {
      console.error('Error checking admin role:', error);
      return null;
    }
  };

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Handle idle timeout
  const handleIdleTimeout = useCallback(async () => {
    console.log('Session expired due to inactivity');
    clearAllTimers();
    setIdleWarning(false);
    setSessionExpired(true);
    setIsAuthenticated(false);
    setUser(null);
    
    try {
      await supabase.auth.signOut();
      toast({
        title: "Session Expired",
        description: "You've been logged out due to inactivity",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [toast, clearAllTimers]);

  // Show warning before timeout
  const showIdleWarning = useCallback(() => {
    setIdleWarning(true);
    setTimeUntilExpiry(WARNING_TIME / 1000); 
    
    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setTimeUntilExpiry((prev) => {
        if (prev <= 1) {
          handleIdleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set timer for actual timeout
    idleTimerRef.current = setTimeout(handleIdleTimeout, WARNING_TIME);
  }, [handleIdleTimeout]);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    
    lastActivityRef.current = Date.now();
    clearAllTimers();
    setIdleWarning(false);
    setTimeUntilExpiry(0);
    
    // Set warning timer (show warning 5 minutes before timeout)
    warningTimerRef.current = setTimeout(showIdleWarning, IDLE_TIMEOUT - WARNING_TIME);
  }, [isAuthenticated, showIdleWarning, clearAllTimers]);

  // Extend session (called from warning dialog)
  const extendSession = useCallback(() => {
    setIdleWarning(false);
    clearAllTimers();
    resetIdleTimer();
    toast({
      title: "Session Extended",
      description: "Your session has been extended",
    });
  }, [resetIdleTimer, clearAllTimers, toast]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset timer if significant time has passed (throttle)
    // Increased to 60 seconds to avoid triggering on page load
    if (timeSinceLastActivity > 60000) { 
      resetIdleTimer();
    }
  }, [resetIdleTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      return;
    }

    // Delay idle timer initialization by 5 seconds to allow page to fully load
    const initTimer = setTimeout(() => {
      // Add activity event listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      // Start idle timer
      resetIdleTimer();
    }, 5000);

    return () => {
      clearTimeout(initTimer);
      // Clean up event listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }, [isAuthenticated, handleActivity, resetIdleTimer, clearAllTimers]);

  // Function to refresh session manually
  const refreshSession = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Failed to refresh session:', error);
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
        resetIdleTimer(); 
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
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
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          console.log('Token expired, attempting refresh...');
          return await refreshSession();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        // First try to get session from storage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session, validating...', session.user.email);
          const isValid = await validateSession(session);
          
          if (!mounted) return;
          
          if (isValid) {
            const adminUser = await checkAdminRole(session.user);
            
            if (!mounted) return;
            
            if (adminUser) {
              setUser(adminUser);
              setIsAuthenticated(true);
              setSessionExpired(false);
              console.log('Admin session restored successfully');
            } else {
              // User is not admin, clear session
              console.log('User is not admin, clearing session');
              await supabase.auth.signOut();
            }
          } else {
            // Session invalid, try to refresh
            console.log('Session invalid, attempting refresh...');
            const refreshed = await refreshSession();
            if (!refreshed && mounted) {
              setSessionExpired(true);
            }
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        switch (event) {
          case 'INITIAL_SESSION':
            // Skip - handled by initializeAuth
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              const adminUser = await checkAdminRole(session.user);
              if (adminUser && mounted) {
                setUser(adminUser);
                setIsAuthenticated(true);
                setSessionExpired(false);
              } else if (mounted) {
                // User is not admin, sign them out
                await supabase.auth.signOut();
                toast({
                  title: "Access Denied",
                  description: "You don't have admin privileges",
                  variant: "destructive"
                });
              }
            }
            break;
            
          case 'SIGNED_OUT':
            if (mounted) {
              setUser(null);
              setIsAuthenticated(false);
              setSessionExpired(false);
              setIdleWarning(false);
              clearAllTimers();
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            if (session?.user) {
              const adminUser = await checkAdminRole(session.user);
              if (adminUser && mounted) {
                setUser(adminUser);
                setIsAuthenticated(true);
                setSessionExpired(false);
                // Don't reset idle timer on token refresh
              }
            }
            break;
            
          case 'USER_UPDATED':
            if (session?.user) {
              const adminUser = await checkAdminRole(session.user);
              if (adminUser && mounted) {
                setUser(adminUser);
              }
            }
            break;
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
          variant: "destructive"
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
            description: "Logged in successfully"
          });
          return true;
        } else {
          // User is not admin, sign them out
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          return false;
        }
      }

      return false;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during login",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      clearAllTimers();
      setIdleWarning(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setSessionExpired(false);
        toast({
          title: "Success",
          description: "Logged out successfully"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during logout",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      loading, 
      sessionExpired,
      idleWarning,
      timeUntilExpiry,
      refreshSession,
      resetIdleTimer,
      extendSession
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Format time in MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Idle Warning Dialog Component
const IdleWarningDialog = () => {
  const { idleWarning, timeUntilExpiry, extendSession, logout } = useAdminAuth();

  if (!idleWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md border-warning">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <CardTitle className="text-xl">Session Expiring Soon</CardTitle>
          <CardDescription>
            Your session will expire in {formatTime(timeUntilExpiry)} due to inactivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={logout}
            >
              Logout Now
            </Button>
            <Button 
              className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground" 
              onClick={extendSession}
            >
              Stay Logged In
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Click "Stay Logged In" to extend your session for another 30 minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Session Expired Warning Component
const SessionExpiredWarning = ({ onRefresh, onLogin }: { 
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          <CardDescription>
            Access the DripTech admin dashboard
          </CardDescription>
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
              {loading ? 'Signing in...' : 'Sign In'}
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
  const { isAuthenticated, loading, sessionExpired, refreshSession, logout } = useAdminAuth();
  
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
          onLogin={logout} 
        />
      </>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <>
        <AdminLogin />
        <IdleWarningDialog />
      </>
    );
  }
  
  return (
    <>
      {children}
      <IdleWarningDialog />
    </>
  );
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