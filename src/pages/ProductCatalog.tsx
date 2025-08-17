import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye,
  Droplets,
  Gauge,
  Settings,
  Wrench,
  ShoppingCart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import QuoteModal from "@/components/Home/QuoteModal";
import { useToast } from "@/hooks/use-toast";

const ProductCatalog = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All Products", icon: Filter },
    { value: "drip_irrigation", label: "Drip Irrigation", icon: Droplets },
    { value: "sprinkler_systems", label: "Sprinkler Systems", icon: Gauge },
    { value: "filtration_systems", label: "Filtration Systems", icon: Filter },
    { value: "control_systems", label: "Control Systems", icon: Settings },
    { value: "accessories", label: "Accessories", icon: Wrench }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      const { data, error } = await query.order(sortBy, { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : Droplets;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'drip_irrigation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sprinkler_systems': return 'bg-green-50 text-green-700 border-green-200';
      case 'filtration_systems': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'control_systems': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'accessories': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              📦 Complete Product Range
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Product <span className="text-primary">Catalog</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore our comprehensive range of irrigation solutions designed for efficiency, sustainability, and superior performance.
            </p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-muted/30 rounded-2xl">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, model, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price">Price Low-High</SelectItem>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="featured">Featured First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && (
                <span> in {categories.find(c => c.value === selectedCategory)?.label}</span>
              )}
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-48 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-6 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const IconComponent = getCategoryIcon(product.category);
                const categoryColor = getCategoryColor(product.category);
                const categoryName = product.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative aspect-video bg-muted/50 overflow-hidden rounded-t-lg">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <IconComponent className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className={`${categoryColor} border`}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {categoryName}
                          </Badge>
                        </div>

                        {/* Featured Badge */}
                        {product.featured && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="default" className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}

                        {/* Stock Status */}
                        <div className="absolute bottom-3 right-3">
                          <Badge variant={product.in_stock ? "secondary" : "destructive"}>
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          {product.model_number && (
                            <p className="text-sm text-muted-foreground">
                              Model: {product.model_number}
                            </p>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description || "Professional irrigation solution for modern agriculture."}
                        </p>

                        {/* Key Features */}
                        {product.features && product.features.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Key Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.features.slice(0, 3).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {product.features.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Applications */}
                        {product.applications && product.applications.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Applications:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.applications.slice(0, 2).map((app, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {app}
                                </Badge>
                              ))}
                              {product.applications.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{product.applications.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Price */}
                        {product.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">
                              KSh {product.price.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <QuoteModal>
                            <Button size="sm" className="flex-1">
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Get Quote
                            </Button>
                          </QuoteModal>
                        </div>

                        {/* Download Resources */}
                        <div className="flex gap-2 text-xs">
                          {product.brochure_url && (
                            <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                              <Download className="h-3 w-3 mr-1" />
                              Brochure
                            </Button>
                          )}
                          {product.installation_guide_url && (
                            <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                              <Download className="h-3 w-3 mr-1" />
                              Install Guide
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4">
                <Search className="h-16 w-16 text-muted-foreground/50 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Need Help Choosing the Right Product?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our irrigation experts are here to help you select the perfect solution for your specific needs and requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <QuoteModal>
                <Button size="lg">
                  Get Custom Quote
                </Button>
              </QuoteModal>
              <Button variant="outline" size="lg">
                Contact Expert
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductCatalog;