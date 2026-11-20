import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

interface DeferredSectionProps {
  children: ReactNode;
  minHeight?: string;
  rootMargin?: string;
  fallbackDelayMs?: number;
}

/**
 * Delays mounting below-the-fold sections and their data fetches until either the
 * user scrolls near them or initial critical LCP paint settles cleanly.
 */
export default function DeferredSection({
  children,
  minHeight = "280px",
  rootMargin = "350px 0px",
  fallbackDelayMs = 2200,
}: DeferredSectionProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = hostRef.current;

    let observer: IntersectionObserver | null = null;
    if (node && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            observer?.disconnect();
          }
        },
        { rootMargin },
      );
      observer.observe(node);
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
      observer?.disconnect();
    }, fallbackDelayMs);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [visible, rootMargin, fallbackDelayMs]);

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
