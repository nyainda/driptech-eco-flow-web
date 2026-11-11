import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { useToast } from "@/hooks/use-toast";

export const STAFF_PORTAL_STORAGE_KEY = "dt_staff_portal_unlocked";
const STAFF_CLOAK_EVENT = "dt-staff-cloak-changed";

export const isStaffPortalUnlocked = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STAFF_PORTAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const unlockStaffPortal = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STAFF_PORTAL_STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent(STAFF_CLOAK_EVENT, { detail: true }));
  } catch {
    // ignore storage errors
  }
};

export const cloakStaffPortal = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STAFF_PORTAL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(STAFF_CLOAK_EVENT, { detail: false }));
  } catch {
    // ignore storage errors
  }
};

/**
 * Global keyboard & route listener mounted inside BrowserRouter.
 * Allows company staff to press Ctrl+Shift+L (or Cmd+Shift+L) on any page
 * — including the 404 screen — to unlock and open the Admin Portal.
 */
export const GlobalStaffShortcutListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if visitor arrived via private staff entry route or ?access=driptech
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessKey = params.get("access") || params.get("staff");
    const isPrivateAlias = location.pathname === "/dt-ops-console";

    if (
      isPrivateAlias ||
      (accessKey &&
        ["driptech", "ecoflow", "unlock"].includes(accessKey.toLowerCase()))
    ) {
      unlockStaffPortal();
      if (isPrivateAlias || accessKey) {
        navigate("/admin", { replace: true });
      }
    }
  }, [location.pathname, location.search, navigate]);

  // Listen for Ctrl+Shift+L / Cmd+Shift+L anywhere on the site
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "l"
      ) {
        e.preventDefault();
        unlockStaffPortal();
        toast({
          title: "Staff Portal Unlocked",
          description: "Opening DripTech Operations & Commerce Command Center.",
        });
        if (!location.pathname.startsWith("/admin")) {
          navigate("/admin");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, navigate, toast]);

  return null;
};

/**
 * Wraps the unauthenticated Admin login screen.
 * When stealth cloak is active (not unlocked by staff), renders the standard
 * public 404 NotFound page so external visitors never know /admin exists.
 */
export const StealthAdminGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(() =>
    isStaffPortalUnlocked(),
  );

  useEffect(() => {
    const syncState = () => setUnlocked(isStaffPortalUnlocked());
    window.addEventListener(STAFF_CLOAK_EVENT, syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener(STAFF_CLOAK_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  if (!unlocked) {
    return <NotFound />;
  }

  return <>{children}</>;
};
