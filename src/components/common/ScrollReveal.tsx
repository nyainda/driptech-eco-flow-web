import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: "fade-in" | "slide-up" | "scale-in";
  delay?: number;
  className?: string;
}

const ScrollReveal = ({
  children,
  animation = "slide-up",
  delay = 0,
  className = "",
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    return typeof IntersectionObserver === "undefined";
  });
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;
    const node = domRef.current;
    if (!node) return;

    const checkInViewport = () => {
      const rect = node.getBoundingClientRect();
      // Reveal if any part has entered or is within 120px of entering the viewport
      if (rect.top <= window.innerHeight + 120) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    if (checkInViewport()) return;

    // threshold: 0 ensures tall mobile sections (> 10x viewport height) still trigger immediately
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: "120px 0px 120px 0px",
      },
    );

    observer.observe(node);

    const onScroll = () => {
      if (checkInViewport()) {
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Safety net so content is never stranded invisible if an observer callback is skipped
    const fallbackTimer = window.setTimeout(() => setIsVisible(true), 1200);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(fallbackTimer);
    };
  }, [isVisible]);

  const animationClass = `animate-${animation}`;

  return (
    <div
      ref={domRef}
      className={`${className} ${isVisible ? animationClass : "opacity-0"}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
