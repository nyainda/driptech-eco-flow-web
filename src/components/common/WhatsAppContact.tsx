
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  model_number: string | null;
  price: number | null;
  category: string;
}

interface WhatsAppContactProps {
  currentProduct?: {
    name: string;
    model_number?: string | null;
  };
  filterCategory?: string;
  phoneNumber?: string;
  variant?: 'button' | 'icon' | 'floating';
  className?: string;
}

const WhatsAppContact = ({
  currentProduct,
  filterCategory,
  phoneNumber = '+254712345678', // Replace with your actual WhatsApp number
  variant = 'button',
  className = '',
}: WhatsAppContactProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProduct) {
      fetchProducts();
    }
  }, [filterCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, model_number, price, category')
        .eq('in_stock', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });

      if (filterCategory && filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const generateWhatsAppMessage = () => {
    if (currentProduct) {
      // Single product inquiry
      const modelInfo = currentProduct.model_number
        ? ` (Model: ${currentProduct.model_number})`
        : '';
      return `Hi, I'm interested in the *${currentProduct.name}*${modelInfo}. Could you share more details?`;
    }

    // Multiple products inquiry
    if (selectedProducts.length === 0) {
      return 'Hi, I would like to inquire about your irrigation products. Could you help me?';
    }

    const selectedProductDetails = products.filter((p) =>
      selectedProducts.includes(p.id)
    );

    let message = 'Hi, I would like to inquire about the following products:\n\n';
    
    // Create a formatted table
    message += '```\n';
    message += '┌─────────────────────────────────────────────┐\n';
    message += '│ Product Inquiry List                        │\n';
    message += '├─────────────────────────────────────────────┤\n';
    
    selectedProductDetails.forEach((product, index) => {
      const num = String(index + 1).padEnd(2);
      const name = product.name.substring(0, 30).padEnd(30);
      const model = (product.model_number || 'N/A').substring(0, 15).padEnd(15);
      const price = product.price
        ? `KES ${product.price.toLocaleString()}`
        : 'POA';
      
      message += `│ ${num}. ${name} │\n`;
      message += `│     Model: ${model}               │\n`;
      message += `│     Price: ${price.padEnd(20)}   │\n`;
      if (index < selectedProductDetails.length - 1) {
        message += '├─────────────────────────────────────────────┤\n';
      }
    });
    
    message += '└─────────────────────────────────────────────┘\n';
    message += '```\n\n';
    message += 'Could you please provide more details about these products?';

    return message;
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const renderButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <Button
            size="icon"
            className={`bg-green-500 hover:bg-green-600 text-white ${className}`}
            onClick={currentProduct ? openWhatsApp : undefined}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        );
      case 'floating':
        return (
          <button
            onClick={currentProduct ? openWhatsApp : undefined}
            className={`fixed bottom-8 right-8 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center ${className}`}
          >
            <span className="text-2xl">💬</span>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              !
            </div>
          </button>
        );
      default:
        return (
          <Button
            className={`bg-green-500 hover:bg-green-600 text-white ${className}`}
            onClick={currentProduct ? openWhatsApp : undefined}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact via WhatsApp
          </Button>
        );
    }
  };

  if (currentProduct) {
    return renderButton();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{renderButton()}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Products to Inquire About</DialogTitle>
          <DialogDescription>
            Choose one or more products you'd like to ask about via WhatsApp. Showing all available products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products available
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-border hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          {isSelected && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        {product.model_number && (
                          <p className="text-sm text-muted-foreground">
                            Model: {product.model_number}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category.replace('_', ' ')}
                          </Badge>
                          {product.price && (
                            <span className="text-sm font-medium text-primary">
                              KES {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={openWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send WhatsApp Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppContact;
