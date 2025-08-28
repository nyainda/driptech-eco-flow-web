
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Gift, Clock } from 'lucide-react';

interface DiscountBannerProps {
  discount: string;
  title: string;
  description: string;
  validUntil?: string;
  onClose?: () => void;
}

const DiscountBanner = ({ 
  discount, 
  title, 
  description, 
  validUntil,
  onClose 
}: DiscountBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <Badge variant="secondary" className="bg-white text-primary font-bold">
              {discount} OFF
            </Badge>
          </div>
          
          <div className="flex-1">
            <span className="font-semibold">{title}</span>
            <span className="ml-2 opacity-90">{description}</span>
          </div>
          
          {validUntil && (
            <div className="flex items-center gap-1 text-sm opacity-90">
              <Clock className="h-4 w-4" />
              <span>Valid until {validUntil}</span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-primary-foreground hover:bg-primary-foreground/20 ml-4"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DiscountBanner;
