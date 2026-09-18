import { useState, useEffect } from "react";
import { dataService } from "@/services/dataService";
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
  Home,
  Building,
  TreePine,
  Wheat,
  Factory,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "./QuoteModal";
import AutoRotatingGallery from "@/components/Products/AutoRotatingGallery";
import { StructuredData } from "@/components/SEO/StructuredData";

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


const CATEGORIES = [
  { key: "all", label: "All Products" },
  { key: "drip_irrigation", label: "Drip Irrigation" },
  { key: "sprinkler_systems", label: "Sprinklers" },
  { key: "pumps_motors", label: "Pumps & Motors" },
  { key: "pipes_fittings", label: "Pipes & Fittings" },
  { key: "filtration_systems", label: "Filtration" },
  { key: "control_systems", label: "Controls" },
  { key: "fertigation_systems", label: "Fertigation" },
  { key: "greenhouse_systems", label: "Greenhouse" },
  { key: "emitters_drippers", label: "Emitters & Drippers" },
  { key: "valves_regulators", label: "Valves & Regulators" },
  { key: "accessories", label: "Accessories" },
];

const INITIAL_SHOW = 8;
const LOAD_MORE_COUNT = 4;

/** Spread products across categories so "All" is not dominated by one type (e.g. accessories). */
function mixProductsByCategory(list: Product[]): Product[] {
  if (!list.length) return list;

  const featured = list.filter((p) => p.featured);
  const rest = list.filter((p) => !p.featured);

  const group = (items: Product[]) => {
    const map = new Map<string, Product[]>();
    for (const p of items) {
      const key = p.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  };

  const interleave = (map: Map<string, Product[]>) => {
    const queues = Array.from(map.values()).map((arr) => [...arr]);
    // Prefer categories with more stock so big ranges still appear
    queues.sort((a, b) => b.length - a.length);
    const out: Product[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const q of queues) {
        if (q.length) {
          out.push(q.shift()!);
          added = true;
        }
      }
    }
    return out;
  };

  // Featured first (also mixed), then the rest mixed
  const featuredMixed = interleave(group(featured));
  const restMixed = interleave(group(rest));
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const p of [...featuredMixed, ...restMixed]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    result.push(p);
  }
  return result;
}

interface ProductsShowcaseProps {
  hideHeader?: boolean;
  hideStats?: boolean;
  hideBenefits?: boolean;
  compact?: boolean;
}

const ProductsShowcase = ({
  hideHeader = false,
  hideStats = false,
  hideBenefits = false,
  compact = false,
}: ProductsShowcaseProps = {}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await dataService.getProducts({ limit: 300, inStock: true });
        setAllProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset visible count when switching category
  useEffect(() => {
    setVisibleCount(INITIAL_SHOW);
  }, [activeCategory]);

  const filteredProducts =
    activeCategory === "all"
      ? mixProductsByCategory(allProducts)
      : allProducts.filter((p) => p.category === activeCategory);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const products = visibleProducts;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "drip_irrigation":
        return Droplets;
      case "sprinkler_systems":
        return Gauge;
      case "filtration_systems":
        return Filter;
      case "control_systems":
        return Settings;
      case "pumps_motors":
        return Zap;
      case "pipes_fittings":
        return Wrench;
      case "fertigation_systems":
        return Leaf;
      case "greenhouse_systems":
        return TreePine;
      case "emitters_drippers":
        return Droplet;
      case "valves_regulators":
        return Shield;
      case "accessories":
        return Cpu;
      default:
        return Droplets;
    }
  };

  const getCategoryRoute = (category: string) => {
    switch (category) {
      case "drip_irrigation":
        return "drip";
      case "sprinkler_systems":
        return "sprinklers";
      case "filtration_systems":
        return "filtration";
      case "control_systems":
        return "controls";
      case "pumps_motors":
        return "pumps";
      case "pipes_fittings":
        return "pipes";
      case "fertigation_systems":
        return "fertigation";
      case "greenhouse_systems":
        return "greenhouse";
      case "emitters_drippers":
        return "emitters";
      case "valves_regulators":
        return "valves";
      case "accessories":
        return "accessories";
      default:
        return "all";
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes("efficient") || featureLower.includes("energy"))
      return Zap;
    if (featureLower.includes("smart") || featureLower.includes("intelligent"))
      return Cpu;
    if (featureLower.includes("water") || featureLower.includes("drip"))
      return Droplet;
    if (
      featureLower.includes("temperature") ||
      featureLower.includes("weather")
    )
      return Thermometer;
    if (featureLower.includes("timer") || featureLower.includes("schedule"))
      return Clock;
    if (featureLower.includes("durable") || featureLower.includes("quality"))
      return Award;
    if (featureLower.includes("easy") || featureLower.includes("simple"))
      return Check;
    if (featureLower.includes("precision") || featureLower.includes("accurate"))
      return Target;
    if (
      featureLower.includes("innovative") ||
      featureLower.includes("advanced")
    )
      return Lightbulb;
    return Sparkles;
  };

  const getApplicationIcon = (application: string) => {
    const appLower = application.toLowerCase();
    if (appLower.includes("residential") || appLower.includes("home"))
      return Home;
    if (appLower.includes("commercial") || appLower.includes("office"))
      return Building;
    if (
      appLower.includes("agriculture") ||
      appLower.includes("farm") ||
      appLower.includes("crop")
    )
      return Wheat;
    if (appLower.includes("greenhouse") || appLower.includes("nursery"))
      return TreePine;
    if (appLower.includes("industrial") || appLower.includes("factory"))
      return Factory;
    if (appLower.includes("landscape") || appLower.includes("garden"))
      return Leaf;
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
    },
  ];

  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
      product.variants && product.variants.length > 0
        ? product.variants[0]
        : null,
    );
    const [showVariants, setShowVariants] = useState(false);

    const IconComponent = getCategoryIcon(product.category);
    const categoryName = formatCategoryName(product.category);
    const categoryRoute = getCategoryRoute(product.category);

    // Determine pricing display
    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice =
      hasVariants && selectedVariant ? selectedVariant.price : product.price;
    const displayStock =
      hasVariants && selectedVariant
        ? selectedVariant.in_stock
        : product.in_stock;

    // Get price range for variants
    const getPriceRange = () => {
      if (!hasVariants || !product.variants) return null;
      const prices = product.variants.map((v) => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? null : { min, max };
    };

    const priceRange = getPriceRange();

    return (
      <Card className="dt-card group relative flex h-full flex-col overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardContent className="relative flex flex-1 flex-col p-0">
          {/* Product image — full product visible on small screens */}
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/60 to-card">
            {product.images && product.images.length > 0 ? (
              <div className="relative aspect-[1.12] overflow-hidden sm:aspect-[4/3] lg:aspect-[1.2]">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 sm:p-5 lg:p-6"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                <IconComponent className="h-12 w-12 text-primary/60 sm:h-16 sm:w-16" />
              </div>
            )}

            {/* Compact badges */}
            <div className="absolute left-2 top-2 flex max-w-[65%] flex-col gap-1">
              {product.featured && (
                <Badge className="border-0 bg-primary px-1.5 py-0 text-[9px] font-bold text-primary-foreground sm:text-[10px]">
                  <Star className="mr-0.5 h-2.5 w-2.5" fill="currentColor" />
                  Featured
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="max-w-full truncate border-border bg-background/95 px-1.5 py-0 text-[9px] text-foreground shadow-sm sm:text-[10px]"
              >
                {categoryName}
              </Badge>
            </div>
            <div className="absolute right-2 top-2">
              {displayStock ? (
                <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow ring-2 ring-background sm:hidden" title="In stock" />
              ) : (
                <span className="inline-flex h-2 w-2 rounded-full bg-destructive shadow ring-2 ring-background sm:hidden" title="Out of stock" />
              )}
              {displayStock ? (
                <Badge className="hidden border-border bg-background/95 text-[10px] text-foreground shadow-sm sm:inline-flex">
                  <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  In stock
                </Badge>
              ) : (
                <Badge className="hidden border-border bg-background/95 text-[10px] text-foreground shadow-sm sm:inline-flex">
                  Out of stock
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">
                  {product.name}
                </h3>
                <div className="hidden shrink-0 rounded-lg bg-muted p-2 sm:block">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
              </div>

              {product.model_number && (
                <p className="hidden text-xs font-medium text-muted-foreground sm:block">
                  Model:{" "}
                  <span className="text-foreground">{product.model_number}</span>
                </p>
              )}
            </div>

            {/* Description - truncated to keep card heights consistent */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 hidden md:block min-h-[2.5rem]">
              {(() => {
                const desc = product.description || "Irrigation equipment from DripTech. Ask us for sizing help if you need it.";
                return desc.length > 110 ? desc.slice(0, 107).trimEnd() + "…" : desc;
              })()}
            </p>

            {/* Variants — desktop only (keeps mobile cards short) */}
            {hasVariants && (
              <div className="hidden space-y-3 sm:block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                      <Layers
                        className="h-2.5 w-2.5 text-primary-foreground"
                        strokeWidth={3}
                      />
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
                    aria-label={showVariants ? "Hide variants" : "Show variants"}
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showVariants ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>

                {showVariants ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {product.variants!.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 w-full text-left ${selectedVariant?.name === variant.name
                          ? "bg-muted/30 border-primary"
                          : "border-border hover:bg-muted/30 hover:border-primary/20"
                          }`}
                        aria-label={`Select variant ${variant.name} - KSh ${variant.price.toLocaleString()}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${variant.in_stock ? "bg-primary" : "bg-red-500"
                              }`}
                          />
                          <span
                            className={`text-xs font-medium truncate max-w-[80px] ${selectedVariant?.name === variant.name
                              ? "text-primary"
                              : "text-foreground"
                              }`}
                          >
                            {variant.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold ${selectedVariant?.name === variant.name
                            ? "text-primary"
                            : "text-muted-foreground"
                            }`}
                        >
                          KSh {variant.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  selectedVariant && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${selectedVariant.in_stock
                            ? "bg-primary"
                            : "bg-red-500"
                            }`}
                        />
                        <span className="text-xs font-medium text-primary truncate max-w-[100px]">
                          {selectedVariant.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        KSh {selectedVariant.price.toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Features - Hidden on mobile */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Check
                      className="h-2.5 w-2.5 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Key Features
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.features.slice(0, 2).map((feature, idx) => {
                    const FeatureIcon = getFeatureIcon(feature);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-colors duration-200 group"
                      >
                        <FeatureIcon
                          className="h-3 w-3 text-primary group-hover:scale-105 transition-transform duration-200"
                          strokeWidth={2.5}
                        />
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                  {product.features.length > 2 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-colors duration-200">
                      <Sparkles
                        className="h-3 w-3 text-primary"
                        strokeWidth={2.5}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        +{product.features.length - 2} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Applications - Hidden on mobile */}
            {product.applications && product.applications.length > 0 && (
              <div className="space-y-3 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Target
                      className="h-2.5 w-2.5 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Applications
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.applications.slice(0, 2).map((app, idx) => {
                    const AppIcon = getApplicationIcon(app);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border hover:bg-muted transition-all duration-200 group"
                      >
                        <AppIcon
                          className="h-3 w-3 text-primary group-hover:scale-105 transition-transform duration-200"
                          strokeWidth={2}
                        />
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
                          KSh {priceRange.min.toLocaleString()} -{" "}
                          {priceRange.max.toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Price varies by option
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">
                          KSh {displayPrice.toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {hasVariants && selectedVariant
                            ? `${selectedVariant.name} variant`
                            : "Base price"}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Brochure
                </Button>
              )}
              {product.installation_guide_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Wrench className="h-3 w-3 mr-2" />
                  Install Guide
                </Button>
              )}
              {product.maintenance_manual_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-3 py-2 h-auto rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Settings className="h-3 w-3 mr-2" />
                  Manual
                </Button>
              )}
            </div>

            {/* Action Bar — 3-column icon + label, always pinned at bottom */}
            <div className="mt-auto pt-3 border-t border-border/40">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {/* WhatsApp — primary, green */}
                <a
                  href={`https://wa.me/254723407849?text=${encodeURIComponent(`Hi DripTech — I'm interested in ${product.name}. Please share price and availability.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp inquiry for ${product.name}`}
                  className="col-span-2 flex flex-row items-center justify-center gap-2 rounded-xl bg-[hsl(var(--dt-whatsapp))] py-2.5 transition-all duration-150 hover:bg-[hsl(var(--dt-whatsapp)/0.9)] active:scale-[0.98] sm:col-span-1 sm:flex-col sm:gap-1.5 sm:py-3"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white sm:text-[10px]">WhatsApp</span>
                </a>

                {/* Details + Quote share one cell on mobile */}
                <div className="col-span-1 grid grid-cols-2 gap-1.5 sm:contents">
                  <Link to={`/products/${categoryRoute}`} className="sm:col-span-1">
                    <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background py-2 transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 active:scale-95 sm:gap-1.5 sm:py-3">
                      <Eye className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      <span className="text-[9px] font-bold leading-none tracking-wide text-muted-foreground sm:text-[10px]">Details</span>
                    </div>
                  </Link>
                  <QuoteModal>
                    <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background py-2 transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 active:scale-95 sm:gap-1.5 sm:py-3">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      <span className="text-[9px] font-bold leading-none tracking-wide text-muted-foreground sm:text-[10px]">Quote</span>
                    </div>
                  </QuoteModal>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Schema.org ItemList for products visible on the homepage (helps product SEO)
  const productListSchemaItems = products
    .filter((p) => p.name)
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      category: p.category?.replace(/_/g, " "),
      image: p.images?.[0] || undefined,
      url: `https://www.dripstech.co.ke/products/${p.id}`,
      price: p.price ?? (p.variants?.[0]?.price ?? undefined),
      currency: "KES",
      inStock: p.in_stock ?? true,
    }));

  return (
    <section className={`${compact ? "py-6 sm:py-8" : "dt-section border-t"} bg-background border-border relative overflow-hidden`}>
      {!loading && productListSchemaItems.length > 0 && (
        <StructuredData
          type="itemlist"
          data={{
            name: "DripTech Irrigation Products",
            description:
              "Irrigation products for Kenyan farms — driplines, sprinklers, pumps, filters, fittings and complete kits.",
            items: productListSchemaItems,
          }}
        />
      )}
      <div className="dt-container relative z-10">
        {/* Header — aligned to site design system */}
        {!hideHeader && (
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <p className="dt-section-label mb-3">Products</p>
            <h2 className="dt-section-title">
              Equipment for the field —{" "}
              <span className="text-primary">pick what fits</span>
            </h2>
            <p className="dt-section-subtitle mx-auto mt-3">
              Driplines (15cm, 20cm, 30cm), sprinklers, pumps, filters, pipes and full kits. Filter by type, check the price, or message us if you are unsure.

            </p>
          </div>
        )}

        {/* Stats Bar */}
        {!hideStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-background border border-border hover:border-primary/20 transition-colors duration-300"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 sm:gap-2 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const count = cat.key === "all"
                ? allProducts.length
                : allProducts.filter(p => p.category === cat.key).length;
              if (count === 0 && cat.key !== "all") return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeCategory === cat.key
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Count line */}
          {!loading && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing <span className="font-semibold text-foreground">{visibleProducts.length}</span> of{" "}
              <span className="font-semibold text-foreground">{filteredProducts.length}</span>{" "}
              {activeCategory === "all" ? "products" : CATEGORIES.find(c => c.key === activeCategory)?.label.toLowerCase() + " products"}
              {allProducts.length > 0 && activeCategory !== "all" && (
                <> &nbsp;·&nbsp; <span className="text-primary font-medium">{allProducts.length} total in catalog</span></>
              )}
            </p>
          )}
        </div>

        {/* Products grid — one card on narrow phones, then two columns when there is room */}
        <div className="mb-8 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="dt-card overflow-hidden flex flex-col">
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-9 bg-muted rounded-lg w-full animate-pulse mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="bg-muted rounded-full p-8 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-14 w-14 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">No products in this category</h3>
                <p className="text-muted-foreground mb-5">
                  Try a different category or browse the full catalog.
                </p>
                <button
                  onClick={() => setActiveCategory("all")}
                  className="text-primary font-semibold hover:underline text-sm"
                >
                  View all products →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Load more + View all CTA */}
        {!loading && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 md:mb-24">
            {hasMore && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
                className="rounded-full px-8 border-border hover:border-primary/40 hover:bg-accent"
              >
                Load {Math.min(LOAD_MORE_COUNT, filteredProducts.length - visibleCount)} more products
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Link to="/products">
              <Button
                size="lg"
                className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                Browse all products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Benefits Section */}
        {!hideBenefits && (
          <div className="bg-muted/30 rounded-3xl p-8 md:p-16 border border-border relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-center mb-16">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Why Choose
                  <span className="text-primary"> DripTech?</span>
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Proven results that make a difference to your bottom line and
                  environmental impact
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
                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  >
                    Browse all products
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}


        {/* Compact CTA */}
        {compact && (
          <div className="text-center mt-12">
            <Link to="/products">
              <Button
                variant="outline"
                className="px-8 py-6 text-lg rounded-full border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                Browse all products
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
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
