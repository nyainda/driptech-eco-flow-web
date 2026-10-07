import { useState, useEffect } from "react";
import { dataService } from "@/services/dataService";
import { ProductCard } from "@/components/Products/ProductCard";
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
import { getProductPath } from "@/lib/productUrl";

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

  // Same slug pattern as pages/Products.tsx (getProductSlug/slugify), so
  // Details links here actually resolve to the individual product page
  // instead of only the category page.
  const slugifyName = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const getProductDetailSlug = (product: Product) =>
    `${slugifyName(product.name)}-${product.id.slice(0, 8)}`;

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


  const featuredProduct = allProducts.find((p) => p.featured) || allProducts[0];
  const formatHomepagePrice = (price: number | null | undefined) =>
    price == null
      ? "Price on request"
      : new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          maximumFractionDigits: 0,
        }).format(price);

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
    <section className={`${compact ? "py-10 sm:py-14" : "dt-section border-t"} bg-background border-border relative overflow-hidden`}>
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

        {/* Featured product spotlight */}
        {!loading && featuredProduct && !hideHeader && (
          <section className="mb-10 overflow-hidden rounded-2xl border border-[hsl(var(--dt-stone-200))] bg-card sm:mb-14" aria-labelledby="featured-product-title">
            <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
              <Link
                to={getProductPath(featuredProduct)}
                className="group relative overflow-hidden border-b border-[hsl(var(--dt-stone-200))] bg-[hsl(var(--dt-stone-100)/0.7)] lg:border-b-0 lg:border-r"
                aria-label={`View featured product: ${featuredProduct.name}`}
              >
                {featuredProduct.images?.[0] ? (
                  <img
                    src={featuredProduct.images[0]}
                    alt={featuredProduct.name}
                    className="aspect-[4/3] w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.025] sm:p-8 lg:aspect-auto lg:h-full lg:min-h-[360px]"
                  />
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center">
                    <Package className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-[hsl(var(--dt-gold-500))] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[hsl(var(--dt-green-900))]">
                  Featured equipment
                </span>
              </Link>
              <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Recommended starting point</p>
                <h3 id="featured-product-title" className="mt-2 max-w-xl font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                  {featuredProduct.name}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {featuredProduct.description || "A dependable irrigation component selected from our current catalogue."}
                </p>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Starting price</p>
                    <p className="mt-1 font-mono text-xl font-bold text-foreground">{formatHomepagePrice(featuredProduct.price)}</p>
                  </div>
                  <Link
                    to={getProductPath(featuredProduct)}
                    className="dt-btn-primary inline-flex items-center gap-2"
                  >
                    View product <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                  <span>✓ Product details</span>
                  <span>✓ Stock status</span>
                  <span>✓ WhatsApp support</span>
                </div>
              </div>
            </div>
          </section>
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
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground border-primary"
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
            <p className="mt-3 text-xs text-muted-foreground">
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
                className="px-7 border-border hover:border-primary/40 hover:bg-accent"
              >
                Load {Math.min(LOAD_MORE_COUNT, filteredProducts.length - visibleCount)} more products
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Link to="/products">
              <Button
                size="lg"
                className="px-7 bg-primary text-primary-foreground hover:bg-primary/90"
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
