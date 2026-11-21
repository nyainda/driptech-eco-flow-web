import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

interface DeferredSectionProps {
  children: ReactNode;
  minHeight?: string;
  rootMargin?: string;
  fallbackDelayMs?: number;
  minMountDelayMs?: number;
}

/**
 * Delays mounting below-the-fold sections and their data fetches until either the
 * user scrolls near them or initial critical LCP/TBT paint settles cleanly.
 */
export default function DeferredSection({
  children,
  minHeight = "280px",
  rootMargin = "350px 0px",
  fallbackDelayMs = 2200,
  minMountDelayMs = 0,
}: DeferredSectionProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = hostRef.current;
    const mountedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    let revealTimer: number | undefined;

    const scheduleReveal = () => {
      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - mountedAt;
      const remaining = Math.max(0, minMountDelayMs - elapsed);
      if (remaining === 0) {
        setVisible(true);
      } else if (revealTimer === undefined) {
        revealTimer = window.setTimeout(() => setVisible(true), remaining);
      }
    };

    let observer: IntersectionObserver | null = null;
    if (node && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            scheduleReveal();
          }
        },
        { rootMargin },
      );
      observer.observe(node);
    }

    const timer = window.setTimeout(() => {
      observer?.disconnect();
      scheduleReveal();
    }, fallbackDelayMs);

    return () => {
      window.clearTimeout(timer);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
      observer?.disconnect();
    };
  }, [visible, rootMargin, fallbackDelayMs, minMountDelayMs]);

  return (
    <div ref={hostRef} style={!visible ? { minHeight } : undefined}>
      {visible ? (
        <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : null}
    </div>
  );
}
