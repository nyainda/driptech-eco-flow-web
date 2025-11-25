import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, Check } from 'lucide-react';
import { useWhatsAppProducts } from '@/hooks/useWhatsAppProducts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { products, loading } = useWhatsAppProducts();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSendWhatsApp = () => {
    const selectedItems = products.filter(p => selectedProducts.includes(p.id));

    let message = "Hi DripTech! 🌿\\n\\n";

    if (selectedItems.length > 0) {
      message += "I'm interested in the following products:\\n\\n";

      const productsByCategory = selectedItems.reduce((acc, product) => {
        const category = product.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as Record<string, typeof products>);

      Object.entries(productsByCategory).forEach(([category, items]) => {
        const categoryName = category.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase());
        message += `*${categoryName}*\\n`;
        items.forEach((product, index) => {
          message += `${index + 1}. ${product.name}`;
          if (product.price) {
            message += ` - KSh ${product.price.toLocaleString()}`;
          }
          message += `\\n`;
        });
        message += `\\n`;
      });
    } else {
      message += "I'm interested in your irrigation systems. ";
    }

    message += "Could you please provide more details on pricing, availability, and installation services?\\n\\n";
    message += "Thank you! 💧";

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setSelectedProducts([]);
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
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
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Products for WhatsApp Inquiry</DialogTitle>
          <DialogDescription>
            Choose the products you're interested in, then we'll create a WhatsApp message for you.
            You can also send a general inquiry without selecting specific products.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(productsByCategory).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products available at the moment.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(productsByCategory).map(([category, items]) => {
                const categoryName = category.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase());
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-lg text-foreground border-b pb-2">
                      {categoryName}
                    </h3>
                    <div className="space-y-2">
                      {items.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => toggleProduct(product.id)}
                        >
                          <Checkbox
                            id={product.id}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={product.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-foreground">{product.name}</div>
                            {product.price && (
                              <div className="text-sm text-muted-foreground">
                                KSh {product.price.toLocaleString()}
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="text-sm text-muted-foreground flex-1">
            {selectedProducts.length > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" />
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedProducts([]);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSendWhatsApp} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Send General Inquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

