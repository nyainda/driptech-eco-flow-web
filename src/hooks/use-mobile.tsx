import * as React from "react";

const MOBILE_BREAKPOINT = 1024; // Align with use-desktop-mode and common desktop width
const DESKTOP_MODE_KEY = "driptech-desktop-mode";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const checkIfMobile = () => {
      // Check if desktop mode is forced
      const isForcedDesktop = localStorage.getItem(DESKTOP_MODE_KEY) === "true";
      if (isForcedDesktop) return false;

      return window.innerWidth < MOBILE_BREAKPOINT;
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(checkIfMobile());
    };

    mql.addEventListener("change", onChange);
    setIsMobile(checkIfMobile());

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
