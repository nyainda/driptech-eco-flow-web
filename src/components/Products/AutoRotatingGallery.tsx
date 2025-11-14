import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/common/OptimizedImage';

interface AutoRotatingGalleryProps {
  images: string[];
  interval?: number;
  className?: string;
  autoPlay?: boolean;
}

const AutoRotatingGallery = ({
  images,
  interval = 3000,
  className,
  autoPlay = true,
}: AutoRotatingGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (!autoPlay || isPaused || images.length <= 1) return;

    const timer = setInterval(nextImage, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, nextImage, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className={cn('relative aspect-square bg-gray-100', className)}>
        <div className="flex h-full items-center justify-center text-gray-400">
          No images available
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('group relative', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <OptimizedImage
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          className="h-full w-full"
          fill
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              onClick={prevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              onClick={nextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                currentIndex === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <OptimizedImage
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full"
                fill
              />
            </button>
          ))}
        </div>
      )}

      {/* Autoplay Indicator */}
      {autoPlay && !isPaused && images.length > 1 && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span>Auto</span>
        </div>
      )}
    </div>
  );
};

export default AutoRotatingGallery;
