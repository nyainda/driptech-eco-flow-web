import { useState, useEffect } from "react";

const DESKTOP_MODE_KEY = "driptech-desktop-mode";
const MOBILE_BREAKPOINT = 1024;

export function useDesktopMode() {
    const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);
    const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

    // Detect if user is on a mobile device
    useEffect(() => {
        const checkIfMobile = () => {
            const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobileDevice(isMobile);
            return isMobile;
        };

        // Initial check
        const mobile = checkIfMobile();

        // Load saved preference only if on mobile
        if (mobile) {
            const savedMode = localStorage.getItem(DESKTOP_MODE_KEY);
            if (savedMode === "true") {
                setIsDesktopMode(true);
                applyDesktopMode(true);
            }
        }

        // Listen for window resize
        const handleResize = () => {
            const mobile = checkIfMobile();
            // If user resizes to desktop, disable desktop mode
            if (!mobile && isDesktopMode) {
                setIsDesktopMode(false);
                applyDesktopMode(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Apply desktop mode by manipulating viewport and body classes
    const applyDesktopMode = (enabled: boolean) => {
        const viewport = document.querySelector('meta[name="viewport"]');

        if (enabled) {
            // Set viewport to desktop width
            if (viewport) {
                viewport.setAttribute(
                    "content",
                    "width=1024, initial-scale=0.5, maximum-scale=2.0, user-scalable=yes"
                );
            }
            document.body.classList.add("force-desktop-mode");
        } else {
            // Reset to mobile-friendly viewport
            if (viewport) {
                viewport.setAttribute(
                    "content",
                    "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
                );
            }
            document.body.classList.remove("force-desktop-mode");
        }
    };

    // Toggle desktop mode
    const toggleDesktopMode = () => {
        const newMode = !isDesktopMode;
        setIsDesktopMode(newMode);
        localStorage.setItem(DESKTOP_MODE_KEY, String(newMode));
        applyDesktopMode(newMode);

        // Reload page to apply changes properly
        setTimeout(() => {
            window.location.reload();
        }, 300);
    };

    // Enable desktop mode
    const enableDesktopMode = () => {
        if (!isDesktopMode) {
            toggleDesktopMode();
        }
    };

    // Disable desktop mode
    const disableDesktopMode = () => {
        if (isDesktopMode) {
            toggleDesktopMode();
        }
    };

    return {
        isDesktopMode,
        isMobileDevice,
        toggleDesktopMode,
        enableDesktopMode,
        disableDesktopMode,
        // Only show toggle on mobile devices
        showToggle: isMobileDevice,
    };
}
