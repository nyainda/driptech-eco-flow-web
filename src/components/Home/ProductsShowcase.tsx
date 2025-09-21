import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Gauge, 
  Filter, 
  Settings, 
  ArrowRight,
  Zap,
  Leaf,
  Shield,
  Play,
  Download,
  Wrench,
  Eye,
  ShoppingCart,
  Star,
  Package,
  Calendar,
  TrendingUp,
  CheckCircle,
  Users,
  Globe,
  Check,
  Sparkles,
  Target,
  Award,
  Lightbulb,
  Cpu,
  Droplet,
  Thermometer,
  Clock,
  Scissors,
  Home,
  Building,
  TreePine,
  Wheat,
  Factory,
  ChevronDown,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "./QuoteModal";

interface Variant {
  name: string;
  price: number;
  in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string;
  subcategory: string | null;
  model_number: string | null;
  images: string[] | null;
  featured: boolean | null;
  in_stock: boolean | null;
  applications: string[] | null;
  features: string[] | null;
  specifications: any | null;
  brochure_url: string | null;
  installation_guide_url: string | null;
  maintenance_manual_url: string | null;
  video_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  variants?: Variant[];
}

const ProductsShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(6);

        if (error) throw error;
        console.log('Fetched products:', data);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drip_irrigation': return Droplets;
      case 'sprinkler_systems': return Gauge;
      case 'filtration_systems': return Filter;
      case 'control_systems': return Settings;
      default: return Droplets;
    }
  };

  const getCategoryRoute = (category: string) => {
    switch (category) {
      case 'drip_irrigation': return 'drip';
      case 'sprinkler_systems': return 'sprinklers';
      case 'filtration_systems': return 'filtration';
      case 'control_systems': return 'controls';
      case 'accessories': return 'accessories';
      default: return 'all';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('efficient') || featureLower.includes('energy')) return Zap;
    if (featureLower.includes('smart') || featureLower.includes('intelligent')) return Cpu;
    if (featureLower.includes('water') || featureLower.includes('drip')) return Droplet;
    if (featureLower.includes('temperature') || featureLower.includes('weather')) return Thermometer;
    if (featureLower.includes('timer') || featureLower.includes('schedule')) return Clock;
    if (featureLower.includes('durable') || featureLower.includes('quality')) return Award;
    if (featureLower.includes('easy') || featureLower.includes('simple')) return Check;
    if (featureLower.includes('precision') || featureLower.includes('accurate')) return Target;
    if (featureLower.includes('innovative') || featureLower.includes('advanced')) return Lightbulb;
    return Sparkles;
  };

  const getApplicationIcon = (application: string) => {
    const appLower = application.toLowerCase();
    if (appLower.includes('residential') || appLower.includes('home')) return Home;
    if (appLower.includes('commercial') || appLower.includes('office')) return Building;
    if (appLower.includes('agriculture') || appLower.includes('farm') || appLower.includes('crop')) return Wheat;
    if (appLower.includes('greenhouse') || appLower.includes('nursery')) return TreePine;
    if (appLower.includes('industrial') || appLower.includes('factory')) return Factory;
    if (appLower.includes('landscape') || appLower.includes('garden')) return Leaf;
    return Target;
  };

  const benefits = [
    {
      icon: Zap,
      title: "50% Energy Savings",
      description: "Reduce operational costs with our energy-efficient systems",
      stat: "50%",
    },
    {
      icon: Leaf,
      title: "40% Water Conservation",
      description: "Minimize water waste while maximizing crop yields",
      stat: "40%",
    },
    {
      icon: Shield,
      title: "10-Year Warranty",
      description: "Industry-leading warranty on all premium products",
      stat: "10Y",
    },
  ];

  const stats = [
    {
      icon: Users,
      number: "500+",
      label: "Happy Customers",
    },
    {
      icon: Globe,
      number: "50+",
      label: "Projects Completed",
    },
    {
      icon: TrendingUp,
      number: "99%",
      label: "Customer Satisfaction",
    },
    {
      icon: CheckCircle,
      number: "24/7",
      label: "Technical Support",
    }
  ];

  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
      product.variants && product.variants.length > 0 ? product.variants[0] : null
    );
    const [showVariants, setShowVariants] = useState(false);
    
    const IconComponent = getCategoryIcon(product.category);
    const categoryName = formatCategoryName(product.category);
    const categoryRoute = getCategoryRoute(product.category);
    
    // Determine pricing display
    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
    const displayStock = hasVariants && selectedVariant ? selectedVariant.in_stock : product.in_stock;
    
    // Get price range for variants
    const getPriceRange = () => {
      if (!hasVariants || !product.variants) return null;
      const prices = product.variants.map(v => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? null : { min, max };
    };
    
    const priceRange = getPriceRange();
    
    return (
      <Card className="group relative hover:shadow-xl transition-all duration-300 bg-background border-border">
        <CardContent className="p-0 relative">
          {/* Product Image */}
          <div className="relative overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
                <IconComponent className="h-20 w-20 text-primary opacity-70 relative z-10" />
              </div>
            )}
            
            {/* Floating badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.featured && (
                <Badge className="bg-muted text-foreground border-border">
                  <Star className="h-3 w-3 mr-1" fill="currentColor" />
                  Featured
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs bg-muted text-foreground border-border">
                {categoryName}
              </Badge>
              {hasVariants && (
                <Badge className="bg-muted text-foreground border-border">
                  <Layers className="h-3 w-3 mr-1" />
                  {product.variants!.length} Options
                </Badge>
              )}
            </div>

            {/* Stock status */}
            <div className="absolute top-4 right-4">
              {displayStock ? (
                <Badge className="bg-muted text-foreground border-border">
                  <div className="h-2 w-2 bg-primary rounded-full mr-2 animate-pulse" />
                  In Stock
                </Badge>
              ) : (
                <Badge className="bg-muted text-foreground border-border">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Video indicator */}
            {product.video_url && (
              <div className="absolute bottom-4 right-4">
                <div className="bg-muted rounded-full p-3">
                  <Play className="h-4 w-4 text-primary" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="p-3 rounded-xl bg-muted group-hover:scale-105 transition-transform duration-300">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              {product.model_number && (
                <p className="text-sm text-muted-foreground font-medium">
                  Model: <span className="text-foreground">{product.model_number}</span>
                </p>
              )}
              
              {product.subcategory && (
                <Badge variant="outline" className="text-xs font-medium border-border">
                  {product.subcategory}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description || "Advanced irrigation solution designed for modern agriculture and efficient water management."}
            </p>

            {/* Variants Section */}
            {hasVariants && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                      <Layers className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Variants
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVariants(!showVariants)}
                    className="h-6 px-2 text-xs"
                  >
                    <ChevronDown 
                      className={`h-3 w-3 transition-transform ${showVariants ? 'rotate-180' : ''}`} 
                    />
                  </Button>
                </div>
                
                {showVariants ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {product.variants!.map((variant, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedVariant?.name === variant.name
                            ? 'bg-muted/30 border-primary'
                            : 'border-border hover:bg-muted/30 hover:border-primary/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            variant.in_stock ? 'bg-primary' : 'bg-red-500'
                          }`} />
                          <span className={`text-xs font-medium truncate max-w-[80px] ${
                            selectedVariant?.name === variant.name ? 'text-primary' : 'text-foreground'
                          }`}>
                            {variant.name}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${
                          selectedVariant?.name === variant.name ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          KSh {variant.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : selectedVariant && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedVariant.in_stock ? 'bg-primary' : 'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium text-primary truncate max-w-[100px]">
                        {selectedVariant.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      KSh {selectedVariant.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Key Features
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.features.slice(0, 2).map((feature, idx) => {
                    const FeatureIcon = getFeatureIcon(feature);
                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-colors duration-200 group">
                        <FeatureIcon className="h-3 w-3 text-primary group-hover:scale-105 transition-transform duration-200" strokeWidth={2.5} />
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                  {product.features.length > 2 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-colors duration-200">
                      <Sparkles className="h-3 w-3 text-primary" strokeWidth={2.5} />
                      <span className="text-xs font-medium text-muted-foreground">
                        +{product.features.length - 2} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Applications */}
            {product.applications && product.applications.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Target className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Applications
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.applications.slice(0, 2).map((app, idx) => {
                    const AppIcon = getApplicationIcon(app);
                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-all duration-200 group">
                        <AppIcon className="h-3 w-3 text-primary group-hover:scale-105 transition-transform duration-200" strokeWidth={2} />
                        <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                          {app}
                        </span>
                      </div>
                    );
                  })}
                  {product.applications.length > 2 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-colors duration-200">
                      <Globe className="h-3 w-3 text-primary" strokeWidth={2} />
                      <span className="text-xs font-medium text-muted-foreground">
                        +{product.applications.length - 2} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            {displayPrice && (
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    {priceRange && !selectedVariant ? (
                      <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">
                          KSh {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">Price varies by option</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">
                          KSh {displayPrice.toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {hasVariants && selectedVariant ? `${selectedVariant.name} variant` : 'Base price'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* Resource Links */}
            <div className="flex flex-wrap gap-2">
              {product.brochure_url && (
                <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Download className="h-3 w-3 mr-2" />
                  Brochure
                </Button>
              )}
              {product.installation_guide_url && (
                <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Wrench className="h-3 w-3 mr-2" />
                  Install Guide
                </Button>
              )}
              {product.maintenance_manual_url && (
                <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Settings className="h-3 w-3 mr-2" />
                  Manual
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Link to={`/products/${categoryRoute}`} className="flex-1">
                <Button 
                  variant="ghost" 
                  className="w-full hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-xl"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <QuoteModal>
                <Button variant="outline" className="rounded-xl hover:bg-accent hover:text-accent-foreground border-border transition-all duration-300">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Quote
                </Button>
              </QuoteModal>
            </div>

            {/* Creation Date */}
            {product.created_at && (
              <div className="flex items-center justify-center pt-4 border-t border-border">
                <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Added {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="py-24 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-5xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 mb-8">
            <Badge variant="secondary" className="px-5 py-2.5 text-sm font-semibold bg-muted text-foreground border-border rounded-full">
              <Package className="w-4 h-4 mr-2" />
              Product Innovation
            </Badge>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-[0.9] tracking-tight">
            <span className="block mb-2">Complete</span>
            <span className="block text-primary">
              Irrigation Solutions
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            From precision drip systems to intelligent controls, we provide everything you need for efficient, sustainable irrigation that transforms agriculture.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-background border border-border hover:border-primary/20 transition-colors duration-300">
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-border bg-background shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-muted animate-pulse"></div>
                  <div className="p-7 space-y-5">
                    <div className="animate-pulse space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                        <div className="h-12 w-12 bg-muted rounded-xl"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-4/5"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded-full w-20"></div>
                        <div className="h-6 bg-muted rounded-full w-24"></div>
                      </div>
                      <div className="flex gap-3">
                        <div className="h-10 bg-muted rounded-xl flex-1"></div>
                        <div className="h-10 bg-muted rounded-xl w-24"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-24">
              <div className="max-w-md mx-auto">
                <div className="bg-muted rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                  <Package className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  No Featured Products
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  No featured products available at the moment.
                </p>
                <p className="text-sm text-muted-foreground">
                  Products can be marked as featured in the admin dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-muted/30 rounded-3xl p-8 md:p-16 border border-border relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose 
                <span className="text-primary"> DripTech?</span>
              </h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Proven results that make a difference to your bottom line and environmental impact
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center space-y-6 group">
                  <div className="inline-flex p-6 bg-muted rounded-2xl group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <benefit.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {benefit.stat}
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-3">
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <Link to="/products">
                <Button size="lg" className="px-8 py-6 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                  Explore All Products
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(156 163 175) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(156 163 175);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(107 114 128);
        }
      `}</style>
    </section>
  );
};

export default ProductsShowcase;