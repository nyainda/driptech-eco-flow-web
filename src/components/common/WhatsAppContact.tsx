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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Check, Package, Droplets, Filter, Gauge, Settings, X, ChevronRight, Wrench } from 'lucide-react';
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

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  service_category_id: string;
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
  phoneNumber = '+254723407849',
  variant = 'button',
  className = '',
}: WhatsAppContactProps) => {
  // Product State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');

  // Service State
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  // General State
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (!currentProduct && isDialogOpen) {
      loadData();
    }
  }, [filterCategory, isDialogOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const productsData = await dataService.getProducts(
        filterCategory && filterCategory !== 'all'
          ? { category: filterCategory }
          : undefined
      );

      const filteredProducts = productsData
        .filter((p: any) => p.in_stock)
        .sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });

      setProducts(filteredProducts as Product[]);

      // Fetch Services (only if not already loaded)
      if (serviceCategories.length === 0) {
        const categories = await dataService.getServiceCategories({ active: true });
        setServiceCategories(categories || []);

        // Fetch all packages initially for simplicity
        const packages = await dataService.getServicePackages({ active: true });
        setServicePackages(packages || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drip_irrigation': return Droplets;
      case 'sprinkler_systems': return Gauge;
      case 'filtration_systems': return Filter;
      case 'control_systems': return Settings;
      default: return Package;
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const productCategories = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const filteredProducts = selectedProductCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedProductCategory);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setSelectedPackage(null);
    setSelectedServiceCategory(null);
  };

  const generateWhatsAppMessage = () => {
    if (currentProduct) {
      const modelInfo = currentProduct.model_number
        ? ` (Model: ${currentProduct.model_number})`
        : '';
      return `Hi, I'm interested in the *${currentProduct.name}*${modelInfo}. Could you share more details?`;
    }

    // Service Inquiry
    if (activeTab === "services") {
      if (selectedPackage) {
        const category = serviceCategories.find(c => c.id === selectedPackage.service_category_id)?.name;
        return `Hi, I'm interested in the *${category}* service.\nSpecifically, the *${selectedPackage.name}* package (KES ${selectedPackage.price.toLocaleString()}).\n\nCould you please provide more details?`;
      }
      if (selectedServiceCategory) {
        const category = serviceCategories.find(c => c.id === selectedServiceCategory)?.name;
        return `Hi, I'm interested in your *${category}* services.\n\nCould you please provide more details on available packages?`;
      }
      return 'Hi, I would like to inquire about your professional irrigation services.';
    }

    // Product Inquiry
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
            className={`bg-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.9)] text-white ${className}`}
            onClick={currentProduct ? openWhatsApp : undefined}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        );
      case 'floating':
        return (
          <button
            onClick={currentProduct ? openWhatsApp : () => setIsDialogOpen(true)}
            className="fixed bottom-8 right-8 z-50 bg-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.9)] text-white rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
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
            className={`bg-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.9)] text-white ${className}`}
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

  const filteredPackages = selectedServiceCategory
    ? servicePackages.filter(p => p.service_category_id === selectedServiceCategory)
    : [];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{renderButton()}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-[hsl(var(--dt-whatsapp))]" />
            Start WhatsApp Inquiry
          </DialogTitle>
          <DialogDescription>
            Select products or services to create a personalized inquiry
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
          </div>

          {/* Category filter lives in its own static header, not inside the
              scroll container below — previously it was `sticky top-0` on
              top of the product grid's own scroll area, which meant the
              top row of product cards slid up and got visually sliced by
              this bar's opaque background as you scrolled. */}
          {activeTab === 'products' && (
            <div className="px-6 pb-4 border-b border-border">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={selectedProductCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedProductCategory('all')}
                  size="sm"
                  className="rounded-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  All
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {products.length}
                  </Badge>
                </Button>

                {Object.entries(productCategories).map(([category, categoryProducts]) => {
                  const IconComponent = getCategoryIcon(category);
                  return (
                    <Button
                      key={category}
                      variant={selectedProductCategory === category ? 'default' : 'outline'}
                      onClick={() => setSelectedProductCategory(category)}
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
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <TabsContent value="products" className="space-y-6 mt-0">
              {/* Selected Products Summary */}
              {selectedProducts.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">
                      Selected ({selectedProducts.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-primary hover:text-primary/80"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {products
                      .filter((p) => selectedProducts.includes(p.id))
                      .map((product) => (
                        <Badge
                          key={product.id}
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/30 px-3 py-1"
                        >
                          {product.name}
                          <button
                            onClick={() => toggleProduct(product.id)}
                            className="ml-2 hover:text-primary"
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
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border hover:border-primary/40'
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

                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <div className="bg-[hsl(var(--dt-whatsapp))] rounded-full p-2 shadow-lg">
                                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                                </div>
                              </div>
                            )}

                            <div className="absolute top-3 left-3">
                              <Badge variant="secondary" className="text-xs bg-card">
                                {formatCategoryName(product.category)}
                              </Badge>
                            </div>
                          </div>

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
                                ? 'bg-[hsl(var(--dt-whatsapp))] text-white'
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
            </TabsContent>

            <TabsContent value="services" className="space-y-6 mt-0">
              {!selectedServiceCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {serviceCategories.map((category) => (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                      onClick={async () => {
                        setSelectedServiceCategory(category.id);
                        setLoading(true);
                        try {
                          // Fetch packages specifically for this category to ensure data is loaded
                          const packages = await dataService.getServicePackages({
                            categoryId: category.id,
                            active: true
                          });
                          // Replace packages list, or you could keep a cache map if preferred, but simple replacement is fine for now
                          setServicePackages(packages || []);
                        } catch (e) {
                          console.error("Error fetching packages", e);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Wrench className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description || "Professional installation and maintenance services."}
                          </p>
                        </div>
                        <Button variant="ghost" className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground">
                          View Packages <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedServiceCategory(null);
                      setSelectedPackage(null);
                      setServicePackages([]); // Clear to avoid showing wrong packages next time
                    }}
                    className="pl-0 hover:pl-2 transition-all"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Categories
                  </Button>

                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {serviceCategories.find(c => c.id === selectedServiceCategory)?.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">Select a package to inquire about</p>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">Loading packages...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicePackages.length > 0 ? (
                        servicePackages.map((pkg) => {
                          const isSelected = selectedPackage?.id === pkg.id;
                          return (
                            <Card
                              key={pkg.id}
                              onClick={() => setSelectedPackage(isSelected ? null : pkg)}
                              className={`cursor-pointer transition-all ${isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                                : 'hover:border-primary'
                                }`}
                            >
                              <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold">{pkg.name}</h4>
                                  {isSelected && <Check className="h-5 w-5 text-[hsl(var(--dt-whatsapp))]" />}
                                </div>
                                <p className="text-2xl font-bold text-primary mb-3">
                                  KES {pkg.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  {pkg.description || "Comprehensive service package for your farm."}
                                </p>
                                <div className={`text-center py-2 rounded-md text-sm font-medium ${isSelected
                                  ? 'bg-[hsl(var(--dt-whatsapp))] text-white'
                                  : 'bg-secondary text-secondary-foreground'
                                  }`}>
                                  {isSelected ? 'Selected' : 'Select Package'}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                          <Wrench className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p className="mb-4">No specific packages found for this category.</p>
                          <Button
                            onClick={() => openWhatsApp()}
                            className="bg-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.9)] text-white"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Inquire about {serviceCategories.find(c => c.id === selectedServiceCategory)?.name}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 px-6 pb-6 border-t border-border bg-background">
          <div className="flex-1 text-sm text-muted-foreground flex items-center">
            {activeTab === "products" ? (
              selectedProducts.length > 0 ? (
                <span className="font-medium text-foreground">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span>No products selected</span>
              )
            ) : (
              selectedPackage ? (
                <span className="font-medium text-foreground text-green-600">
                  Package: {selectedPackage.name}
                </span>
              ) : (
                <span>No package selected</span>
              )
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
              className="bg-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.9)] text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {activeTab === "products" && selectedProducts.length > 0
                ? `Inquire Products (${selectedProducts.length})`
                : activeTab === "services" && selectedPackage
                  ? `Inquire Service`
                  : 'General Inquiry'}
            </Button>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  );
};

export default WhatsAppContact;