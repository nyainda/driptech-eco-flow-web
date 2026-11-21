import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

/**
 * Defers toast notification portals until after initial LCP/TBT settlement so
 * sonner and radix-toast do not bloat the initial main-thread bundle.
 */
export default function AppFeedback() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const cic = (window as unknown as {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;

    const delayTimer = window.setTimeout(() => {
      if (typeof ric === "function") {
        const id = ric(enable, { timeout: 1200 });
        cleanupIdle = () => cic?.(id);
        return;
      }
      enable();
    }, 2000);

    let cleanupIdle: (() => void) | undefined;
    return () => {
      cancelled = true;
      window.clearTimeout(delayTimer);
      cleanupIdle?.();
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
}
