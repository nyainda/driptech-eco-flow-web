import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Gift, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface DiscountBannerData {
  id: string;
  discount: string;
  title: string;
  description: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

const DiscountBanner = () => {
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch active banners using React Query
  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: ['active-discount-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_banners' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired banners
      const activeBanners = data?.filter((banner: DiscountBannerData) => {
        if (!banner.valid_until) return true;
        return new Date(banner.valid_until) >= new Date();
      }) || [];

      return activeBanners as DiscountBannerData[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Load dismissed banners from memory on component mount
  useEffect(() => {
    const dismissed = getDismissedBanners();
    setDismissedBanners(dismissed);
  }, []);

  // Auto-rotate banners every 8 seconds if multiple banners exist
  useEffect(() => {
    const visibleBanners = getVisibleBanners();
    if (visibleBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % visibleBanners.length
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [banners, dismissedBanners]);

  // Reset current index when banners change
  useEffect(() => {
    const visibleBanners = getVisibleBanners();
    if (currentBannerIndex >= visibleBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [banners, dismissedBanners, currentBannerIndex]);

  const getDismissedBanners = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const dismissed = sessionStorage.getItem('dismissedBanners');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  const saveDismissedBanners = (dismissed: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('dismissedBanners', JSON.stringify(dismissed));
    } catch (error) {
      console.warn('Failed to save dismissed banners:', error);
    }
  };

  const getVisibleBanners = () => {
    return banners.filter(banner => !dismissedBanners.includes(banner.id));
  };

  const handleClose = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId];
    setDismissedBanners(newDismissed);
    saveDismissedBanners(newDismissed);

    // If this was the last visible banner, hide the entire component
    const remainingBanners = getVisibleBanners().filter(b => b.id !== bannerId);
    if (remainingBanners.length === 0) {
      setIsVisible(false);
    } else {
      // Adjust current index if needed
      setCurrentBannerIndex(0);
    }
  };

  const handleCloseAll = () => {
    const allBannerIds = banners.map(b => b.id);
    const newDismissed = [...dismissedBanners, ...allBannerIds];
    setDismissedBanners(newDismissed);
    saveDismissedBanners(newDismissed);
    setIsVisible(false);
  };

  const handlePrevious = () => {
    const visibleBanners = getVisibleBanners();
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === 0 ? visibleBanners.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    const visibleBanners = getVisibleBanners();
    setCurrentBannerIndex((prevIndex) => 
      (prevIndex + 1) % visibleBanners.length
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'tomorrow';
    if (diffDays <= 7) return `in ${diffDays} days`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isExpiringSoon = (validUntil?: string) => {
    if (!validUntil) return false;
    const date = new Date(validUntil);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  // Don't render if loading, error, or no visible banners
  if (isLoading || error || !isVisible) return null;

  const visibleBanners = getVisibleBanners();
  if (visibleBanners.length === 0) return null;

  const currentBanner = visibleBanners[currentBannerIndex];
  if (!currentBanner) return null;

  const hasMultipleBanners = visibleBanners.length > 1;
  const isExpiring = isExpiringSoon(currentBanner.valid_until);

  const bannerClasses = `relative overflow-hidden transition-all duration-300 ease-in-out text-primary-foreground ${
    isExpiring 
      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
      : 'bg-gradient-to-r from-primary to-primary/80'
  }`;

  return (
    <div className={bannerClasses}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
      </div>

      <div className="relative py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Gift className="h-5 w-5 animate-bounce" />
              <Badge 
                variant="secondary" 
                className={`font-bold text-xs px-2 py-1 ${
                  isExpiring 
                    ? 'bg-white text-red-600 animate-pulse' 
                    : 'bg-white text-primary'
                }`}
              >
                {currentBanner.discount} OFF
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm sm:text-base block sm:inline">
                {currentBanner.title}
              </span>
              <span className="ml-0 sm:ml-2 opacity-90 text-xs sm:text-sm block sm:inline">
                {currentBanner.description}
              </span>
            </div>
            
            {currentBanner.valid_until && (
              <div className={`flex items-center gap-1 text-xs opacity-90 flex-shrink-0 ${
                isExpiring ? 'animate-pulse font-semibold' : ''
              }`}>
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Valid until </span>
                <span className="font-medium">
                  {formatDate(currentBanner.valid_until)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
            {hasMultipleBanners && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1 px-2">
                  {visibleBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentBannerIndex 
                          ? 'bg-primary-foreground' 
                          : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {hasMultipleBanners && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseAll}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0 ml-1"
                aria-label="Close all banners"
                title="Close all banners"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClose(currentBanner.id)}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
              aria-label="Close banner"
              title={hasMultipleBanners ? "Close this banner" : "Close banner"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountBanner;