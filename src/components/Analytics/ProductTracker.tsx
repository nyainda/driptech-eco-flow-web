import React, { useRef, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

interface ProductTrackerProps {
  productName: string;
  productId?: string;
  category?: string;
  children: React.ReactNode;
  className?: string;
}

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
  const interactionCooldown = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            setTimeout(() => {
              trackProductInteraction(productName, "view", {
                productId,
                category,
                elementSelector: `.product-${productId || productName.replace(/\s+/g, "-")}`,
              });
              hasTrackedView.current = true;
            }, 200);
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

  const shouldTrackInteraction = (interactionType: string): boolean => {
    const now = Date.now();
    const lastInteraction = interactionCooldown.current[interactionType] || 0;
    const cooldownPeriod = interactionType === "click" ? 1000 : 5000;

    if (now - lastInteraction > cooldownPeriod) {
      interactionCooldown.current[interactionType] = now;
      return true;
    }
    return false;
  };

  const handleClick = (event: React.MouseEvent) => {
    if (shouldTrackInteraction("click")) {
      trackProductInteraction(productName, "click", {
        productId,
        category,
        elementSelector: `.product-${productId || productName.replace(/\s+/g, "-")}`,
        clickTarget: (event.target as HTMLElement).tagName,
      });
    }
  };

  const handleHover = () => {
    if (shouldTrackInteraction("hover")) {
      trackProductInteraction(productName, "hover", {
        productId,
        category,
        elementSelector: `.product-${productId || productName.replace(/\s+/g, "-")}`,
      });
    }
  };

  return (
    <div
      ref={elementRef}
      className={`product-${productId || productName.replace(/\s+/g, "-")} ${className || ""}`}
      onClick={handleClick}
      onMouseEnter={handleHover}
    >
      {children}
    </div>
  );
};

export default ProductTracker;
