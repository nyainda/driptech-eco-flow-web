import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
//import { useWhatsAppProducts } from '@/hooks/useWhatsAppProducts';
import { useWhatsAppProducts } from '@/hooks/useWhatsAppProducts';


interface WhatsAppProductButtonProps {
  whatsappNumber?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export const WhatsAppProductButton = ({
  whatsappNumber = '254114575401',
  variant = 'default',
  size = 'default',
  className = '',
  children,
}: WhatsAppProductButtonProps) => {
  const { loading, generateWhatsAppMessage } = useWhatsAppProducts();

  const handleClick = () => {
    const whatsappUrl = generateWhatsAppMessage(whatsappNumber);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Products...
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          {children || 'Chat on WhatsApp'}
        </>
      )}
    </Button>
  );
};
