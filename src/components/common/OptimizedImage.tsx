import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}

const OptimizedImage = ({
  src,
  alt,
  className,
  loading = 'lazy',
  priority = false,
  fill = false,
  sizes = '100vw',
  width,
  height,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const getWebPSource = () => {
    if (src.includes('unsplash.com')) {
      return `${src}&fm=webp&q=80`;
    }
    if (src.endsWith('.webp')) {
      return src;
    }
    return null;
  };

  const getAVIFSource = () => {
    if (src.includes('unsplash.com')) {
      return `${src}&fm=avif&q=80`;
    }
    return null;
  };

  const getSrcSet = () => {
    if (src.includes('unsplash.com')) {
      return `${src}&w=400 400w, ${src}&w=800 800w, ${src}&w=1200 1200w, ${src}&w=1600 1600w`;
    }
    return undefined;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const fallbackSrc = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop&fm=webp&q=80';

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden bg-muted', className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
      )}
      {isInView && (
        <picture>
          {getAVIFSource() && <source type="image/avif" srcSet={getAVIFSource()!} />}
          {getWebPSource() && <source type="image/webp" srcSet={getWebPSource()!} />}
          <img
            src={hasError ? fallbackSrc : src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width={width}
            height={height}
            srcSet={getSrcSet()}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              fill ? 'absolute inset-0 h-full w-full object-cover' : 'h-full w-full object-cover'
            )}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;
