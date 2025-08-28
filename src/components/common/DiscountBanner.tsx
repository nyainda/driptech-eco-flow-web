
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Gift, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiscountBannerData {
  id: string;
  discount: string;
  title: string;
  description: string;
  valid_until?: string;
  is_active: boolean;
}

const DiscountBanner = () => {
  const [banners, setBanners] = useState<DiscountBannerData[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  useEffect(() => {
    fetchActiveBanners();
    
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem('dismissedBanners');
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed));
    }
  }, []);

  const fetchActiveBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired banners
      const activeBanners = data?.filter(banner => {
        if (!banner.valid_until) return true;
        return new Date(banner.valid_until) >= new Date();
      }) || [];

      setBanners(activeBanners);
    } catch (error) {
      console.error('Error fetching discount banners:', error);
    }
  };

  const handleClose = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId];
    setDismissedBanners(newDismissed);
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
  };

  // Filter out dismissed banners
  const visibleBanners = banners.filter(banner => !dismissedBanners.includes(banner.id));

  if (visibleBanners.length === 0) return null;

  // Show only the first active banner
  const banner = visibleBanners[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <Badge variant="secondary" className="bg-white text-primary font-bold">
              {banner.discount} OFF
            </Badge>
          </div>
          
          <div className="flex-1">
            <span className="font-semibold">{banner.title}</span>
            <span className="ml-2 opacity-90">{banner.description}</span>
          </div>
          
          {banner.valid_until && (
            <div className="flex items-center gap-1 text-sm opacity-90">
              <Clock className="h-4 w-4" />
              <span>Valid until {formatDate(banner.valid_until)}</span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleClose(banner.id)}
          className="text-primary-foreground hover:bg-primary-foreground/20 ml-4"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DiscountBanner;
