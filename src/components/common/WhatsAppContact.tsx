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
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Check, Package, Droplets, Filter, Gauge, Settings, X } from 'lucide-react';
import { dataService } from '@/services/dataService';

interface Variant {
  name: string;
  price: number;
  in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  model_number: string | null;
  price: number | null;
  category: string;
  images: string[] | null;
  variants?: Variant[];
  in_stock: boolean | null;
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
  phoneNumber = '+254794494515',
  variant = 'button',
  className = '',
}: WhatsAppContactProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentProduct) {
      fetchProducts();
    }
  }, [filterCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await dataService.getProducts(
        filterCategory && filterCategory !== 'all'
          ? { category: filterCategory }
          : undefined
      );

      // Filter and sort
      const filteredData = data
        .filter((p: any) => p.in_stock)
        .sort((a: any, b: any) => {
          // Sort by featured first, then by name
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });

      setProducts(filteredData as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drip_irrigation':
        return Droplets;
      case 'sprinkler_systems':
        return Gauge;
      case 'filtration_systems':
        return Filter;
      case 'control_systems':
        return Settings;
      default:
        return Package;
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const categories = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const generateWhatsAppMessage = () => {
    if (currentProduct) {
      const modelInfo = currentProduct.model_number
        ? ` (Model: ${currentProduct.model_number})`
        : '';
      return `Hi, I'm interested in the *${currentProduct.name}*${modelInfo}. Could you share more details?`;
    }

    if (selectedProducts.length === 0) {
      return 'Hi, I would like to inquire about your irrigation products. Could you help me?';
    }

    const selectedProductDetails = products.filter((p) =>
      selectedProducts.includes(p.id)
    );

    let message = 'Hi, I would like to inquire about the following products:\n\n';

    selectedProductDetails.forEach((product, index) => {
      const modelInfo = product.model_number ? ` (Model: ${product.model_number})` : '';
      const priceInfo = product.price ? ` - KES ${product.price.toLocaleString()}` : '';
      message += `${index + 1}. *${product.name}*${modelInfo}${priceInfo}\n`;
    });

    message += '\nCould you please provide more details about these products?';

    return message;
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsDialogOpen(false);
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
            onClick={currentProduct ? openWhatsApp : () => setIsDialogOpen(true)}
            className="fixed bottom-8 right-8 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
            aria-label="Contact us on WhatsApp"
          >
            <MessageCircle className="h-8 w-8" />
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{renderButton()}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Select Products to Inquire About</DialogTitle>
          <DialogDescription>
            Choose specific products or send a general inquiry via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              size="sm"
              className="rounded-full"
            >
              <Package className="h-4 w-4 mr-2" />
              All Products
              <Badge variant="secondary" className="ml-2 text-xs">
                {products.length}
              </Badge>
            </Button>

            {Object.entries(categories).map(([category, categoryProducts]) => {
              const IconComponent = getCategoryIcon(category);
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="rounded-full"
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {formatCategoryName(category)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {categoryProducts.length}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Selected Products Summary */}
          {selectedProducts.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Selected Products ({selectedProducts.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {products
                  .filter((p) => selectedProducts.includes(p.id))
                  .map((product) => (
                    <Badge
                      key={product.id}
                      variant="secondary"
                      className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700 px-3 py-1"
                    >
                      {product.name}
                      <button
                        onClick={() => toggleProduct(product.id)}
                        className="ml-2 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No products available in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                const IconComponent = getCategoryIcon(product.category);

                return (
                  <Card
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500'
                      : 'border-border hover:border-green-300'
                      }`}
                  >
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <IconComponent className="h-16 w-16 text-primary opacity-70" />
                          </div>
                        )}

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-green-500 rounded-full p-2 shadow-lg">
                              <Check className="h-5 w-5 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        )}

                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-900/90">
                            {formatCategoryName(product.category)}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold line-clamp-2 text-foreground">
                          {product.name}
                        </h4>

                        {product.model_number && (
                          <p className="text-xs text-muted-foreground">
                            Model: {product.model_number}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          {product.price && (
                            <span className="text-sm font-bold text-primary">
                              KES {product.price.toLocaleString()}
                            </span>
                          )}

                          <div className={`text-xs px-2 py-1 rounded-full ${isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                            }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border bg-background">
          <div className="flex-1 text-sm text-muted-foreground flex items-center">
            {selectedProducts.length > 0 ? (
              <span className="font-medium text-foreground">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>No products selected - Send general inquiry</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={openWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {selectedProducts.length > 0
                ? `Send Inquiry (${selectedProducts.length})`
                : 'Send General Inquiry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppContact;