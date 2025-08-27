
import React, { useEffect, useRef } from 'react';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

interface ProductTrackerProps {
  productName: string;
  productId?: string;
  productCategory?: string;
  productPrice?: number;
  children: React.ReactNode;
  trackOnView?: boolean;
  trackOnClick?: boolean;
}

const ProductTracker: React.FC<ProductTrackerProps> = ({
  productName,
  productId,
  productCategory,
  productPrice,
  children,
  trackOnView = true,
  trackOnClick = true
}) => {
  const { trackProductInteraction } = useVisitorTracking();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!trackOnView || hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            trackProductInteraction(productName, 'view', {
              product_id: productId,
              product_category: productCategory,
              product_price: productPrice
            });
            hasTrackedView.current = true;
          }
        });
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [productName, productId, productCategory, productPrice, trackOnView, trackProductInteraction]);

  const handleClick = () => {
    if (trackOnClick) {
      trackProductInteraction(productName, 'click', {
        product_id: productId,
        product_category: productCategory,
        product_price: productPrice
      });
    }
  };

  return (
    <div ref={elementRef} onClick={handleClick}>
      {children}
    </div>
  );
};

export default ProductTracker;
