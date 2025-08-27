import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductTracker from "@/components/Analytics/ProductTracker";
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
  Factory
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "./QuoteModal";

const ProductsShowcase = () => {
  const [products, setProducts] = useState<any[]>([]);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'drip_irrigation': return { 
        color: "text-blue-600 dark:text-blue-400", 
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20", 
        borderColor: "border-blue-200 dark:border-blue-800",
        gradient: "from-blue-500 to-cyan-500",
        accent: "bg-blue-500/10 dark:bg-blue-400/10"
      };
      case 'sprinkler_systems': return { 
        color: "text-emerald-600 dark:text-emerald-400", 
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20", 
        borderColor: "border-emerald-200 dark:border-emerald-800",
        gradient: "from-emerald-500 to-teal-500",
        accent: "bg-emerald-500/10 dark:bg-emerald-400/10"
      };
      case 'filtration_systems': return { 
        color: "text-violet-600 dark:text-violet-400", 
        bgColor: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20", 
        borderColor: "border-violet-200 dark:border-violet-800",
        gradient: "from-violet-500 to-purple-500",
        accent: "bg-violet-500/10 dark:bg-violet-400/10"
      };
      case 'control_systems': return { 
        color: "text-amber-600 dark:text-amber-400", 
        bgColor: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20", 
        borderColor: "border-amber-200 dark:border-amber-800",
        gradient: "from-amber-500 to-orange-500",
        accent: "bg-amber-500/10 dark:bg-amber-400/10"
      };
      default: return { 
        color: "text-blue-600 dark:text-blue-400", 
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20", 
        borderColor: "border-blue-200 dark:border-blue-800",
        gradient: "from-blue-500 to-cyan-500",
        accent: "bg-blue-500/10 dark:bg-blue-400/10"
      };
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
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Leaf,
      title: "40% Water Conservation",
      description: "Minimize water waste while maximizing crop yields",
      stat: "40%",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "10-Year Warranty",
      description: "Industry-leading warranty on all premium products",
      stat: "10Y",
      gradient: "from-blue-500 to-indigo-500"
    },
  ];

  const stats = [
    {
      icon: Users,
      number: "500+",
      label: "Happy Customers",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Globe,
      number: "50+",
      label: "Projects Completed",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: TrendingUp,
      number: "99%",
      label: "Customer Satisfaction",
      color: "text-violet-600 dark:text-violet-400"
    },
    {
      icon: CheckCircle,
      number: "24/7",
      label: "Technical Support",
      color: "text-amber-600 dark:text-amber-400"
    }
  ];

  const ProductCard = ({ product }: { product: any }) => {
    const IconComponent = getCategoryIcon(product.category);
    const colors = getCategoryColor(product.category);
    const categoryName = formatCategoryName(product.category);
    const categoryRoute = getCategoryRoute(product.category);
    
    return (
      <ProductTracker
        productName={product.name}
        productId={product.id}
        productCategory={product.category}
        productPrice={product.price}
        trackOnView={true}
        trackOnClick={true}
      >
        <Card className="group relative hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-3 border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardContent className="p-0 relative">
            {/* Product Image */}
            <div className="relative overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              ) : (
                <div className={`aspect-[4/3] ${colors.bgColor} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <IconComponent className={`h-20 w-20 ${colors.color} opacity-70 relative z-10`} />
                </div>
              )}
              
              {/* Floating badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg backdrop-blur-sm">
                    <Star className="h-3 w-3 mr-1" fill="currentColor" />
                    Featured
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-lg">
                  {categoryName}
                </Badge>
              </div>

              {/* Stock status with animated dot */}
              <div className="absolute top-4 right-4">
                {product.in_stock ? (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg backdrop-blur-sm">
                    <div className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg backdrop-blur-sm">
                    <div className="h-2 w-2 bg-white rounded-full mr-2" />
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Video indicator with glow effect */}
              {product.video_url && (
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-white/25 transition-shadow duration-300">
                    <Play className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>

            {/* Content with optimized spacing */}
            <div className="p-6 space-y-4">
              {/* Header with improved typography */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <div className={`p-3 rounded-xl ${colors.accent} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-5 w-5 ${colors.color}`} />
                  </div>
                </div>
                
                {product.model_number && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Model: <span className="text-foreground">{product.model_number}</span>
                  </p>
                )}
                
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {product.subcategory}
                  </Badge>
                )}
              </div>

              {/* Enhanced description */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {product.description || "Advanced irrigation solution designed for modern agriculture and efficient water management."}
              </p>

              {/* Compact Features with icons */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Key Features
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.features.slice(0, 2).map((feature, idx) => {
                      const FeatureIcon = getFeatureIcon(feature);
                      return (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-200 group">
                          <FeatureIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.5} />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-[120px]">
                            {feature}
                          </span>
                        </div>
                      );
                    })}
                    {product.features.length > 2 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted">
                        <Sparkles className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
                        <span className="text-xs font-medium text-muted-foreground">
                          +{product.features.length - 2} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compact Applications with smart display */}
              {product.applications && product.applications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                      <Target className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Applications
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.applications.slice(0, 2).map((app, idx) => {
                      const AppIcon = getApplicationIcon(app);
                      return (
                        <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.accent} border ${colors.borderColor} hover:scale-105 transition-all duration-200 group`}>
                          <AppIcon className={`h-3 w-3 ${colors.color}`} strokeWidth={2} />
                          <span className={`text-xs font-medium ${colors.color} truncate max-w-[100px]`}>
                            {app}
                          </span>
                        </div>
                      );
                    })}
                    {product.applications.length > 2 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-muted hover:bg-muted/50 transition-colors duration-200">
                        <Globe className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                        <span className="text-xs font-medium text-muted-foreground">
                          +{product.applications.length - 2} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced price section */}
              {product.price && (
                <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        KSh {product.price.toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">Price may vary</p>
                    </div>
                    <div className={`p-2 rounded-lg ${colors.accent}`}>
                      <ShoppingCart className={`h-4 w-4 ${colors.color}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Resource Links with better icons */}
              <div className="flex flex-wrap gap-2">
                {product.brochure_url && (
                  <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-primary/10 transition-colors">
                    <Download className="h-3 w-3 mr-2" />
                    Brochure
                  </Button>
                )}
                {product.installation_guide_url && (
                  <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-primary/10 transition-colors">
                    <Wrench className="h-3 w-3 mr-2" />
                    Install Guide
                  </Button>
                )}
                {product.maintenance_manual_url && (
                  <Button variant="ghost" size="sm" className="text-xs px-3 py-2 h-auto rounded-full hover:bg-primary/10 transition-colors">
                    <Settings className="h-3 w-3 mr-2" />
                    Manual
                  </Button>
                )}
              </div>

              {/* Enhanced action buttons */}
              <div className="flex gap-3 pt-2">
                <Link to={`/products/${categoryRoute}`} className="flex-1">
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/90 group-hover:text-primary-foreground transition-all duration-300 rounded-xl"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <QuoteModal>
                  <Button variant="outline" className="rounded-xl hover:shadow-lg transition-shadow duration-300">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Quote
                  </Button>
                </QuoteModal>
              </div>

              {/* Creation date with better styling */}
              {product.created_at && (
                <div className="flex items-center justify-center pt-4 border-t border-muted/30">
                  <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Added {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ProductTracker>
    );
  };

  return (
    <section className="py-24 bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/3 to-cyan-500/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
            🚀 Product Innovation
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
            Complete Irrigation
            <span className="bg-gradient-to-r from-primary via-blue-600 to-emerald-600 bg-clip-text text-transparent"> Solutions</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            From precision drip systems to intelligent controls, we provide everything you need for efficient, sustainable irrigation that transforms agriculture.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-muted/20 hover:border-primary/20 transition-colors duration-300">
              <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {loading ? (
            // Enhanced loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card to-card/80">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/60 animate-pulse"></div>
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
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
                  <Package className="h-16 w-16 text-muted-foreground" />
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

        {/* Enhanced Benefits Section */}
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 md:p-16 border border-muted/20 shadow-2xl relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose 
                <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent"> DripTech?</span>
              </h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Proven results that make a difference to your bottom line and environmental impact
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center space-y-6 group">
                  <div className={`inline-flex p-6 bg-gradient-to-r ${benefit.gradient} rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                    <benefit.icon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <div className={`text-4xl font-bold bg-gradient-to-r ${benefit.gradient} bg-clip-text text-transparent mb-2`}>
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

            {/* Enhanced CTA */}
            <div className="text-center mt-16">
              <Link to="/products">
                <Button size="lg" className="px-8 py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 group">
                  Explore All Products
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsShowcase;
