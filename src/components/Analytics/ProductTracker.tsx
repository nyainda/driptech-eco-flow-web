import React, { useRef, useEffect } from 'react';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

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

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Track product view when element comes into viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            trackProductInteraction(productName, 'view', {
              productId,
              category,
              elementSelector: `.product-${productId || productName.replace(/\s+/g, '-')}`,
            });
            hasTrackedView.current = true;
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% of the element is visible
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [productName, productId, category, trackProductInteraction]);

  const handleClick = (event: React.MouseEvent) => {
    trackProductInteraction(productName, 'click', {
      productId,
      category,
      elementSelector: `.product-${productId || productName.replace(/\s+/g, '-')}`,
      clickTarget: (event.target as HTMLElement).tagName,
    });
  };

  const handleHover = () => {
    trackProductInteraction(productName, 'hover', {
      productId,
      category,
      elementSelector: `.product-${productId || productName.replace(/\s+/g, '-')}`,
    });
  };

  return (
    <div
      ref={elementRef}
      className={`product-${productId || productName.replace(/\s+/g, '-')} ${className || ''}`}
      onClick={handleClick}
      onMouseEnter={handleHover}
    >
      {children}
    </div>
  );
};

export default ProductTracker;