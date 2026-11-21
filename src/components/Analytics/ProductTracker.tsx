import React, { useRef, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { shouldSkipClientTracking } from "@/lib/analyticsHelpers";

interface ProductTrackerProps {
  productName: string;
  productId?: string;
  category?: string;
  children: React.ReactNode;
  className?: string;
}

const sessionViewedProducts = new Set<string>();

const ProductTracker: React.FC<ProductTrackerProps> = ({
  productName,
  productId,
  category,
  children,
  className,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { trackProductInteraction } = useVisitorTracking();
  const hasTrackedView = useRef(false);
  const lastClickAt = useRef<number>(0);

  useEffect(() => {
    if (shouldSkipClientTracking()) return;
    const element = elementRef.current;
    if (!element) return;

    const dedupeKey = productId || productName;
    if (sessionViewedProducts.has(dedupeKey)) {
      hasTrackedView.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current && !sessionViewedProducts.has(dedupeKey)) {
            hasTrackedView.current = true;
            sessionViewedProducts.add(dedupeKey);
            window.setTimeout(() => {
              trackProductInteraction(productName, "view", {
                productId,
                category,
                elementSelector: `.product-${productId || productName.replace(/\s+/g, "-")}`,
              });
            }, 350);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [productName, productId, category, trackProductInteraction]);

  const handleClick = (event: React.MouseEvent) => {
    if (shouldSkipClientTracking()) return;
    const now = Date.now();
    if (now - lastClickAt.current < 1500) return;
    lastClickAt.current = now;

    trackProductInteraction(productName, "click", {
      productId,
      category,
      elementSelector: `.product-${productId || productName.replace(/\s+/g, "-")}`,
      clickTarget: (event.target as HTMLElement).tagName,
    });
  };

  return (
    <div
      ref={elementRef}
      className={`product-${productId || productName.replace(/\s+/g, "-")} ${className || ""}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default ProductTracker;
