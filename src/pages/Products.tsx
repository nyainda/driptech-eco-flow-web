import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import SEOHead from "@/components/common/SEOHead";
import { buildLocalBusinessSchema, SITE_COMPANY } from "@/config/company";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Star,
  Eye,
  Download,
  Play,
  Package,
  Truck,
  CheckCircle,
  List,
  Heart,
  Share2,
  Wrench,
  FileText,
  Video,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Scale,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import ProductTracker from "@/components/Analytics/ProductTracker";
import AutoRotatingGallery from "@/components/Products/AutoRotatingGallery";
import ProductRecommendations from "@/components/Products/ProductRecommendations";
import OptimizedImage from "@/components/common/OptimizedImage";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { trackSearch } from "@/services/aiProductService";
import { cn } from "@/lib/utils";

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
  category:
  | "accessories"
  | "drip_irrigation"
  | "sprinkler_systems"
  | "filtration_systems"
  | "control_systems"
  | "pumps_motors"
  | "pipes_fittings"
  | "solar_irrigation"
  | "fertigation_systems"
  | "greenhouse_systems"
  | "emitters_drippers"
  | "valves_regulators"
  | "water_storage"
  | "rain_guns"
  | "filters_strainers"
  | "controllers_timers"
  | "mulching_materials"
  | "greenhouse_accessories"
  | "growing_media"
  | "seedling_trays_nursery"
  | "borehole_equipment";
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
  variants?: Variant[] | null;
}

const CATEGORY_PATHS: Record<string, string> = {
  accessories: "accessories",
  borehole_equipment: "borehole",
  control_systems: "controls",
  drip_irrigation: "drip",
  emitters_drippers: "emitters",
  fertigation_systems: "fertigation",
  filtration_systems: "filtration",
  greenhouse_accessories: "greenhouse-accessories",
  greenhouse_systems: "greenhouse",
  growing_media: "growing-media",
  filters_strainers: "filters-strainers",
  mulching_materials: "mulching",
  pipes_fittings: "pipes",
  pumps_motors: "pumps",
  rain_guns: "rain-guns",
  seedling_trays_nursery: "seedlings",
  solar_irrigation: "solar",
  sprinkler_systems: "sprinklers",
  valves_regulators: "valves",
  water_storage: "storage",
  controllers_timers: "controllers",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getProductSlug = (product: Product) =>
  `${slugify(product.name)}-${product.id.slice(0, 8)}`;

const getProductPath = (product: Product) =>
  `/products/${CATEGORY_PATHS[product.category] || "all"}/${getProductSlug(product)}`;

const Products = () => {
  const { category, product: productSlug } = useParams<{
    category?: string;
    product?: string;
  }>();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      // Map URL category to database category format
      let dbCategory = category;
      if (category) {
        const categoryMap: Record<string, string> = {
          drip: "drip_irrigation",
          sprinklers: "sprinkler_systems",
          filtration: "filtration_systems",
          controls: "control_systems",
          accessories: "accessories",
          pumps: "pumps_motors",
          pipes: "pipes_fittings",
          solar: "solar_irrigation",
          fertigation: "fertigation_systems",
          greenhouse: "greenhouse_systems",
          emitters: "emitters_drippers",
          valves: "valves_regulators",
          storage: "water_storage",
          "rain-guns": "rain_guns",
          "filters-strainers": "filters_strainers",
          controllers: "controllers_timers",
          mulching: "mulching_materials",
          "greenhouse-accessories": "greenhouse_accessories",
          "growing-media": "growing_media",
          seedlings: "seedling_trays_nursery",
          borehole: "borehole_equipment",
        };
        dbCategory = categoryMap[category] || category;
      }

      // Use dataService to fetch products
      const data = await dataService.getProducts({ category: dbCategory, inStock: true });

      return (data || []).map((item: any) => {
        const variants = item.variants
          ? Array.isArray(item.variants)
            ? item.variants
              .filter(
                (v: any) =>
                  typeof v === "object" &&
                  v !== null &&
                  typeof v.name === "string" &&
                  typeof v.price === "number" &&
                  typeof v.in_stock === "boolean",
              )
              .map(
                (v: any) =>
                  ({
                    name: v.name,
                    price: v.price,
                    in_stock: v.in_stock,
                  }) as Variant,
              )
            : null
          : null;

        return {
          ...item,
          variants,
        } as Product;
      });
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (queryError) {
      console.error("Error fetching products:", queryError);
      setError(queryError instanceof Error ? queryError.message : "Failed to load products");
    }
  }, [queryError]);

  // Track search queries for AI analysis
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 3) {
      // Debounce tracking - only track after user stops typing
      const timer = setTimeout(() => {
        trackSearch(searchTerm, category, filteredProducts.length);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, category, filteredProducts.length]);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.model_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.subcategory
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.applications?.some((app) =>
            app.toLowerCase().includes(searchTerm.toLowerCase()),
          ) ||
          product.features?.some((feature) =>
            feature.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter((product) => product.featured);
    }

    if (showInStockOnly) {
      filtered = filtered.filter((product) => product.in_stock);
    }

    if (subcategoryFilter) {
      filtered = filtered.filter(
        (product) => product.subcategory === subcategoryFilter,
      );
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

      if (sortBy === "price") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [
    products,
    searchTerm,
    sortBy,
    sortOrder,
    showFeaturedOnly,
    showInStockOnly,
    subcategoryFilter,
  ]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getCategoryTitle = (cat: string) => {
    const titles: { [key: string]: string } = {
      drip: "Drip Irrigation Systems",
      sprinklers: "Sprinkler Systems",
      filtration: "Filtration Systems",
      controls: "Control Systems",
      accessories: "Accessories",
      pumps: "Pumps & Motors",
      pipes: "Pipes & Fittings",
      solar: "Solar Irrigation",
      fertigation: "Fertigation Systems",
      greenhouse: "Greenhouse Systems",
      emitters: "Emitters & Drippers",
      valves: "Valves & Regulators",
      storage: "Water Storage",
      "rain-guns": "Rain Guns",
      "filters-strainers": "Filters & Strainers",
      controllers: "Controllers & Timers",
      mulching: "Mulching Materials",
      "greenhouse-accessories": "Greenhouse Accessories",
      "growing-media": "Growing Media",
      seedlings: "Seedling Trays & Nursery",
      borehole: "Borehole Equipment",
    };
    return titles[cat] || "All Products";
  };

  const getUniqueSubcategories = () => {
    const subcategories = products
      .map((p) => p.subcategory)
      .filter((sub, index, arr) => sub && arr.indexOf(sub) === index);
    return subcategories;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(price);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setShowFeaturedOnly(false);
    setShowInStockOnly(false);
    setSubcategoryFilter("");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        toast({
          title: "Removed from Favorites",
          description: "Product has been removed from your favorites.",
        });
        return prev.filter((id) => id !== productId);
      } else {
        toast({
          title: "Added to Favorites",
          description: "Product has been added to your favorites.",
        });
        return [...prev, productId];
      }
    });
  };

  const shareProduct = async (product: Product) => {
    const shareData = {
      title: product.name,
      text:
        product.description ||
        `Check out this ${product.name} from our catalog!`,
      url: `${window.location.origin}${getProductPath(product)}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`,
        );
        toast({
          title: "Link Copied",
          description: "Product link has been copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast({
        title: "Error",
        description: "Failed to share product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestQuote = (product: Product, selectedVariant: Variant | null) => {
    console.log(
      `Requesting quote for product: ${product.id}, variant: ${selectedVariant ? selectedVariant.name : "None"}`,
    );
    toast({
      title: "Quote Requested",
      description: `Quote request sent for ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ""}.`,
    });
  };

  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        toast({
          title: "Comparison limit reached",
          description: "You can compare up to 4 products at a time.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, product];
    });
  };

  const getVariantPriceRange = (variants: Variant[] | null) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  };

  const hasInStockVariant = (variants: Variant[] | null) => {
    return variants && variants.some((v) => v.in_stock);
  };

  const VariantSelector = ({
    variants,
    selectedVariant,
    onVariantChange,
  }: {
    variants: Variant[];
    selectedVariant: Variant | null;
    onVariantChange: (variant: Variant) => void;
  }) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <Layers className="h-4 w-4 text-primary" />
        Available Variants
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {variants.map((variant, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl border border-border cursor-pointer transition-all duration-200 ${selectedVariant === variant
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-background hover:bg-muted/30"
              }`}
            onClick={() => onVariantChange(variant)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  {variant.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(variant.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs ${variant.in_stock ? "bg-green-500/20 border-green-500/50 text-green-700" : "bg-orange-500/20 border-orange-500/50 text-orange-700"}`}
                >
                  {variant.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
      product.variants && product.variants.length > 0
        ? product.variants[0]
        : null,
    );
    const [showVariants, setShowVariants] = useState(false);

    const hasVariants = product.variants && product.variants.length > 0;
    const variantPriceRange = hasVariants
      ? getVariantPriceRange(product.variants)
      : null;
    const displayPrice =
      hasVariants && selectedVariant ? selectedVariant.price : product.price;
    const isInStock = hasVariants
      ? selectedVariant
        ? selectedVariant.in_stock
        : hasInStockVariant(product.variants)
      : product.in_stock;

    return (
      <ProductTracker
        productName={product.name}
        productId={product.id}
        category={product.category}
        className="h-full"
      >
        <Card className="group h-full flex flex-col bg-background border-border hover:border-primary/50 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <CardHeader className="p-0 relative">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              {product.images && product.images[0] ? (
                <OptimizedImage
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Badges with better positioning */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.featured && (
                  <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-0 shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
                {isInStock && (
                  <Badge className="bg-green-600/90 backdrop-blur-sm text-white border-0 shadow-lg">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    In Stock
                  </Badge>
                )}
                {hasVariants && (
                  <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0 shadow-lg">
                    <Layers className="h-3 w-3 mr-1" />
                    {product.variants!.length} Variants
                  </Badge>
                )}
              </div>

              {/* Quick action buttons - show on hover with slide animation */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <Button
                  size="icon"
                  className="w-9 h-9 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground rounded-full shadow-lg transition-all"
                  onClick={() => toggleFavorite(product.id)}
                  title={favorites.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-current text-red-500" : ""}`}
                  />
                </Button>
                <Button
                  size="icon"
                  className="w-9 h-9 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground rounded-full shadow-lg transition-all"
                  onClick={() => shareProduct(product)}
                  title="Share product"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      className="w-9 h-9 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground rounded-full shadow-lg transition-all"
                      title="Quick view"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-background border-border shadow-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-2xl pr-8 text-foreground">
                        {product.name}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Detailed information about {product.name}
                      </DialogDescription>
                    </DialogHeader>
                    <ProductDetailModal product={product} />
                  </DialogContent>
                </Dialog>
                <Button
                  size="icon"
                  className={cn(
                    "w-9 h-9 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground rounded-full shadow-lg transition-all",
                    compareList.some(p => p.id === product.id) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => toggleCompare(product)}
                  title="Compare product"
                >
                  <Scale className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col gap-3">
              {/* Category badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize text-xs">
                  {product.category.replace("_", " ")}
                </Badge>
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {product.subcategory.replace("_", " ")}
                  </Badge>
                )}
                {product.model_number && (
                  <span className="text-xs text-muted-foreground font-mono ml-auto">
                    {product.model_number}
                  </span>
                )}
              </div>

              {/* Product name - fixed 2-line height for uniform cards */}
              <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.75rem] sm:min-h-[3.25rem] leading-snug">
                {product.name}
              </h3>

              {hasVariants && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVariants(!showVariants)}
                    className="w-full justify-between text-xs h-auto p-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="h-3 w-3 text-primary" />
                      {selectedVariant
                        ? selectedVariant.name
                        : `${product.variants!.length} Variants Available`}
                    </span>
                    {showVariants ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>

                  {showVariants && (
                    <div className="space-y-1">
                      {product.variants!.map((variant, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-xl cursor-pointer text-xs transition-colors ${selectedVariant === variant
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50"
                            }`}
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-foreground">
                              {variant.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-foreground">
                                {formatPrice(variant.price)}
                              </span>
                              <Badge
                                className={`text-xs ${variant.in_stock ? "bg-green-500/20 border-green-500/50 text-green-700" : "bg-orange-500/20 border-orange-500/50 text-orange-700"}`}
                              >
                                {variant.in_stock ? "✓" : "✗"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description - fixed 2-line block for uniform card heights */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem]">
                {product.description
                  ? product.description.length > 110
                    ? product.description.slice(0, 107).trimEnd() + "…"
                    : product.description
                  : "Premium irrigation solution for efficient water management."}
              </p>

              {/* Compact highlights row — top feature OR top application (always 1 line for uniformity) */}
              <div className="min-h-[1.5rem] flex items-center gap-2 text-xs text-muted-foreground">
                {product.features && product.features.length > 0 ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{product.features[0]}</span>
                    {product.features.length > 1 && (
                      <span className="text-[10px] font-bold text-primary flex-shrink-0">+{product.features.length - 1}</span>
                    )}
                  </>
                ) : product.applications && product.applications.length > 0 ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                    <span className="truncate">{product.applications[0]}</span>
                    {product.applications.length > 1 && (
                      <span className="text-[10px] font-bold text-accent flex-shrink-0">+{product.applications.length - 1}</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground/60 italic">View details for full specs</span>
                )}
              </div>

              {/* Read more dialog — accessible via Quick View eye icon, but kept here for description detail */}
              {product.description && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-[11px] font-semibold text-primary hover:text-primary/80 self-start"
                    >
                      Read more →
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border shadow-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="pr-8 text-foreground">
                        {product.name}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Full description of {product.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {product.description}
                      </p>
                      {product.applications && product.applications.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm text-foreground">Applications</h4>
                          <ul className="list-none space-y-1 text-sm text-muted-foreground">
                            {product.applications.map((app, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-accent" />
                                {app}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.features && product.features.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm text-foreground">Key Features</h4>
                          <ul className="list-none space-y-1 text-sm text-muted-foreground">
                            {product.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <div className="mt-auto flex flex-row items-center justify-between gap-2 pt-3 border-t border-border/40">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {hasVariants &&
                    variantPriceRange &&
                    variantPriceRange.min !== variantPriceRange.max
                    ? `${formatPrice(variantPriceRange.min)} - ${formatPrice(variantPriceRange.max)}`
                    : formatPrice(displayPrice)}
                  {hasVariants && selectedVariant && (
                    <div className="text-xs text-muted-foreground font-normal">
                      {selectedVariant.name}
                    </div>
                  )}
                </div>
                {isInStock ? (
                  <div className="flex items-center text-green-600 text-xs sm:text-sm">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Ready to ship
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-xs sm:text-sm">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Contact for availability
                  </div>
                )}
              </div>

            </div>



            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border mt-3">
                  <Button
                    asChild
                    className="flex-1 bg-muted/30 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md text-sm"
                  >
                    <Link to={getProductPath(product)}>
                    View Details
                    <Eye className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>

              <Button
                onClick={() => {
                  const message = encodeURIComponent(
                    `Hi DripTech! I'm interested in: ${product.name}${hasVariants && selectedVariant ? ` (${selectedVariant.name})` : ''}. Could you provide more information?`
                  );
                  window.open(`https://wa.me/254114575401?text=${message}`, "_blank");
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md text-sm"
              >
                <span className="mr-2">💬</span>
                WhatsApp Inquiry
              </Button>

              <div className="flex gap-1 justify-center sm:justify-start">
                {product.brochure_url && (
                  <Button
                    className="p-2 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    title="Download Brochure"
                    asChild
                  >
                    <a
                      href={product.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {product.video_url && (
                  <Button
                    className="p-2 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    title="Watch Video"
                    asChild
                  >
                    <a
                      href={product.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {product.installation_guide_url && (
                  <Button
                    className="p-2 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    title="Installation Guide"
                    asChild
                  >
                    <a
                      href={product.installation_guide_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Wrench className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </ProductTracker>
    );
  };

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object" && value !== null) {
      return value.value || JSON.stringify(value);
    }
    return String(value);
  };

  const ProductDetailModal = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
      product.variants && product.variants.length > 0
        ? product.variants[0]
        : null,
    );

    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice =
      hasVariants && selectedVariant ? selectedVariant.price : product.price;
    const isInStock = hasVariants
      ? selectedVariant
        ? selectedVariant.in_stock
        : hasInStockVariant(product.variants)
      : product.in_stock;

    return (
      <div className="space-y-6 sm:space-y-8">
        {product.images && product.images.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-foreground">
              Product Gallery
            </h4>
            <AutoRotatingGallery
              images={product.images}
              interval={3000}
              autoPlay={true}
              className="mx-auto max-w-2xl"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                Product Description
              </h4>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {product.description ? (
                  <p className="leading-relaxed text-sm sm:text-base">
                    {product.description}
                  </p>
                ) : (
                  <p className="italic text-muted-foreground/60">
                    No description available.
                  </p>
                )}
              </div>
            </div>

            {hasVariants && (
              <div>
                <VariantSelector
                  variants={product.variants!}
                  selectedVariant={selectedVariant}
                  onVariantChange={setSelectedVariant}
                />
              </div>
            )}

            {product.applications && product.applications.length > 0 && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                  Applications
                </h4>
                <ul className="list-none space-y-2">
                  {product.applications.map((app, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                  Key Features
                </h4>
                <ul className="list-none space-y-2">
                  {product.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 p-2 bg-primary/10 rounded-xl"
                    >
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                Product Details
              </h4>
              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">
                    Model Number:
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-foreground">
                    {product.model_number || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Category:</span>
                  <span className="capitalize text-xs sm:text-sm text-foreground">
                    {product.category.replace("_", " ")}
                  </span>
                </div>
                {product.subcategory && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                    <span className="font-medium text-foreground">
                      Subcategory:
                    </span>
                    <span className="capitalize text-xs sm:text-sm text-foreground">
                      {product.subcategory.replace("_", " ")}
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Price:</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-sm sm:text-base">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasVariants && selectedVariant && (
                      <div className="text-xs text-muted-foreground">
                        {selectedVariant.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">
                    Availability:
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs sm:text-sm ${isInStock ? "text-green-600" : "text-orange-600"}`}
                  >
                    {isInStock ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        In Stock
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Contact for availability
                      </>
                    )}
                  </span>
                </div>
                {hasVariants && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                    <span className="font-medium text-foreground">
                      Variants Available:
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {product.variants!.length}
                    </span>
                  </div>
                )}
                {product.created_at && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                    <span className="font-medium text-foreground">Added:</span>
                    <span className="text-xs sm:text-sm text-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.specifications && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                  Specifications
                </h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1"
                      >
                        <span className="font-medium text-foreground capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span className="text-xs sm:text-sm text-foreground">
                          {formatSpecValue(value)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {hasVariants && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                  All Variants
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b border-border">
                    <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-foreground">
                      <span>Variant Name</span>
                      <span>Price</span>
                      <span>Stock Status</span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {product.variants!.map((variant, index) => (
                      <div
                        key={index}
                        className={`p-3 hover:bg-muted/50 transition-colors ${selectedVariant === variant ? "bg-primary/10" : ""}`}
                      >
                        <div className="grid grid-cols-3 gap-4 items-center text-sm">
                          <span className="font-medium text-foreground">
                            {variant.name}
                          </span>
                          <span className="text-primary font-semibold">
                            {formatPrice(variant.price)}
                          </span>
                          <Badge
                            className={`w-fit text-xs ${variant.in_stock ? "bg-green-500/20 border-green-500/50 text-green-700" : "bg-orange-500/20 border-orange-500/50 text-orange-700"}`}
                          >
                            {variant.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Resources & Downloads
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {product.brochure_url && (
              <Button
                className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                asChild
              >
                <a
                  href={product.brochure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Product Brochure</span>
                </a>
              </Button>
            )}
            {product.installation_guide_url && (
              <Button
                className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                asChild
              >
                <a
                  href={product.installation_guide_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Installation Guide</span>
                </a>
              </Button>
            )}
            {product.maintenance_manual_url && (
              <Button
                className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                asChild
              >
                <a
                  href={product.maintenance_manual_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Maintenance Manual</span>
                </a>
              </Button>
            )}
            {product.video_url && (
              <Button
                className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                asChild
              >
                <a
                  href={product.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Product Video</span>
                </a>
              </Button>
            )}
            {!product.brochure_url &&
              !product.installation_guide_url &&
              !product.maintenance_manual_url &&
              !product.video_url && (
                <p className="text-sm text-muted-foreground col-span-2 sm:col-span-4">
                  No resources available.
                </p>
              )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-border">
          <Button
            className="flex-1 text-sm bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
            onClick={() => requestQuote(product, selectedVariant)}
          >
            Request Quote
            {hasVariants && selectedVariant && (
              <span className="ml-2 text-xs opacity-75">
                ({selectedVariant.name})
              </span>
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <WhatsAppContact
            currentProduct={{
              name: product.name,
              model_number: product.model_number,
            }}
            variant="button"
            className="flex-1 text-sm rounded-xl shadow-md"
          />
          <Button
            className={`flex-1 text-sm ${favorites.includes(product.id) ? "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground" : "bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground"} rounded-xl shadow-md`}
            onClick={() => toggleFavorite(product.id)}
          >
            {favorites.includes(product.id)
              ? "Remove from Favorites"
              : "Add to Favorites"}
            <Heart
              className={`h-4 w-4 ml-2 ${favorites.includes(product.id) ? "fill-current" : ""}`}
            />
          </Button>
          <Button
            className="text-sm bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
            onClick={() => shareProduct(product)}
          >
            Share
            <Share2 className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const MobilePagination = () => (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-muted-foreground text-center">
        Showing {indexOfFirstProduct + 1} to{" "}
        {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
        {filteredProducts.length} products
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground rounded-xl shadow-md"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1 max-w-xs overflow-x-auto">
          {totalPages > 1 && (
            <Button
              className={`${currentPage === 1 ? "bg-primary text-primary-foreground" : "bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground"} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
              size="sm"
              onClick={() => paginate(1)}
            >
              1
            </Button>
          )}

          {currentPage > 3 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 5) return page > 1 && page < totalPages;
              return (
                page > 1 &&
                page < totalPages &&
                Math.abs(page - currentPage) <= 1
              );
            })
            .map((page) => (
              <Button
                key={page}
                className={`${currentPage === page ? "bg-primary text-primary-foreground" : "bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground"} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
                size="sm"
                onClick={() => paginate(page)}
              >
                {page}
              </Button>
            ))}

          {currentPage < totalPages - 2 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}

          {totalPages > 1 && (
            <Button
              className={`${currentPage === totalPages ? "bg-primary text-primary-foreground" : "bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground"} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
              size="sm"
              onClick={() => paginate(totalPages)}
            >
              {totalPages}
            </Button>
          )}
        </div>

        <Button
          className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground rounded-xl shadow-md"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  const DesktopPagination = () => (
    <div className="flex items-center justify-between mt-8">
      <div className="text-sm text-muted-foreground">
        Showing {indexOfFirstProduct + 1} to{" "}
        {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
        {filteredProducts.length} products
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground rounded-xl shadow-md"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 7) {
              pageNumber = i + 1;
            } else if (currentPage <= 4) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNumber = totalPages - 6 + i;
            } else {
              pageNumber = currentPage - 3 + i;
            }

            return (
              <Button
                key={pageNumber}
                className={`${currentPage === pageNumber ? "bg-primary text-primary-foreground" : "bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground"} rounded-xl shadow-md w-10 h-10`}
                size="sm"
                onClick={() => paginate(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        <Button
          className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground rounded-xl shadow-md"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main>
          <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-background shadow-md rounded-xl p-6">
                <div className="text-center mb-8 sm:mb-12">
                  <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                  <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
                </div>
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-10 bg-muted rounded flex-1"></div>
                    <div className="h-10 bg-muted rounded w-48"></div>
                    <div className="h-10 bg-muted rounded w-40"></div>
                    <div className="h-10 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: productsPerPage }).map((_, index) => (
                    <Card
                      key={index}
                      className="animate-pulse bg-background border-border shadow-md"
                    >
                      <div className="aspect-video bg-muted rounded-t-xl"></div>
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-6 bg-muted rounded"></div>
                          <div className="h-10 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main>
          <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center bg-background shadow-md rounded-xl p-6">
                <Package className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Error Loading Products
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-6">
                  {error}
                </p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // The catalogue is the page that visibly lists these products. Marking each
  // listed item up here gives search engines product names, categories, images
  // and live prices without inventing reviews or ratings that cannot be verified.
  const categoryLabel = category ? getCategoryTitle(category) : "Irrigation Products";
  const productPageTitle = category
    ? `${categoryLabel} for Sale Kenya | Call ${SITE_COMPANY.phonePrimaryDisplay} | ${SITE_COMPANY.name}`
    : `Drip Irrigation Products & Kits for Sale Kenya | Call ${SITE_COMPANY.phonePrimaryDisplay}`;
  const productPageDescription = category
    ? `Buy ${categoryLabel.toLowerCase()} in Kenya from ${SITE_COMPANY.name}. Prices in KES, stock in Nairobi, delivery nationwide. Call or WhatsApp ${SITE_COMPANY.phonePrimaryDisplay} / ${SITE_COMPANY.phoneSecondaryDisplay}.`
    : `Buy drip lines, sprinklers, pumps, filters and irrigation kits in Kenya. Clear pricing, WhatsApp support. Call ${SITE_COMPANY.phonePrimaryDisplay} or ${SITE_COMPANY.phoneSecondaryDisplay}.`;
  const productPageKeywords = [
    categoryLabel.toLowerCase() + " Kenya",
    categoryLabel.toLowerCase() + " for sale",
    "drip irrigation Kenya",
    "irrigation products Kenya",
    "buy irrigation equipment Nairobi",
    SITE_COMPANY.phonePrimary.replace("+", ""),
    SITE_COMPANY.phoneSecondary.replace("+", ""),
  ].join(", ");

  const detailProduct = productSlug
    ? products.find((candidate) => getProductSlug(candidate) === productSlug)
    : undefined;

  const productCatalogSchema =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: category
            ? `${categoryLabel} — ${SITE_COMPANY.name}`
            : `Irrigation products — ${SITE_COMPANY.name}`,
          description: productPageDescription,
          numberOfItems: Math.min(products.length, 50),
          itemListElement: products.slice(0, 50).map((product, index) => {
            const item: Record<string, unknown> = {
              "@type": "Product",
              name: product.name,
              sku: product.id,
              description:
                product.description ||
                `${product.name} — irrigation equipment for Kenyan farms from ${SITE_COMPANY.name}.`,
              category: (product.category || "").replaceAll("_", " "),
              brand: { "@type": "Brand", name: SITE_COMPANY.name },
              url: `https://www.dripstech.co.ke${getProductPath(product)}`,
            };

            if (product.images?.[0]) item.image = product.images[0];
            if (typeof product.price === "number" && product.price > 0) {
              item.offers = {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "KES",
                availability: product.in_stock
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                 url: `https://www.dripstech.co.ke${getProductPath(product)}`,
                seller: {
                  "@type": "Organization",
                  name: SITE_COMPANY.name,
                  telephone: SITE_COMPANY.phonePrimary,
                },
              };
            }
            if (product.video_url) {
              item.subjectOf = {
                "@type": "VideoObject",
                name: product.name,
                contentUrl: product.video_url,
                thumbnailUrl: product.images?.[0],
              };
            }

            return {
              "@type": "ListItem",
              position: index + 1,
              item,
            };
          }),
        }
      : undefined;

  const productsSchema = [
    buildLocalBusinessSchema(),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: productPageTitle,
      description: productPageDescription,
      url: category
        ? `https://www.dripstech.co.ke/products/${category}`
        : "https://www.dripstech.co.ke/products",
      isPartOf: { "@id": "https://www.dripstech.co.ke/#website" },
      about: {
        "@type": "Thing",
        name: categoryLabel,
      },
    },
    ...(productCatalogSchema ? [productCatalogSchema] : []),
  ];

  if (productSlug && detailProduct) {
    const detailUrl = `https://www.dripstech.co.ke${getProductPath(detailProduct)}`;
    const detailTitle = `${detailProduct.name} Kenya | Price & Specifications | ${SITE_COMPANY.name}`;
    const detailDescription =
      detailProduct.description ||
      `${detailProduct.name} for irrigation projects in Kenya. Check current availability, specifications and delivery support from ${SITE_COMPANY.name}.`;
    const detailPrice =
      detailProduct.variants && detailProduct.variants.length > 0
        ? Math.min(...detailProduct.variants.map((variant) => variant.price))
        : detailProduct.price;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead
          title={detailTitle}
          description={detailDescription}
          url={detailUrl}
          type="product"
          image={detailProduct.images?.[0] || `${SITE_COMPANY.url}/driptech-logo.png`}
          schema={[
            buildLocalBusinessSchema(),
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_COMPANY.url },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: categoryLabel,
                  item: `${SITE_COMPANY.url}/products/${category || "all"}`,
                },
                { "@type": "ListItem", position: 3, name: detailProduct.name, item: detailUrl },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: detailProduct.name,
              description: detailDescription,
              image: detailProduct.images || undefined,
              sku: detailProduct.model_number || detailProduct.id,
              brand: { "@type": "Brand", name: SITE_COMPANY.name },
              category: categoryLabel,
              url: detailUrl,
              ...(detailPrice && detailPrice > 0
                ? {
                    offers: {
                      "@type": "Offer",
                      price: detailPrice,
                      priceCurrency: "KES",
                      availability: detailProduct.in_stock
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                      seller: { "@type": "Organization", name: SITE_COMPANY.name },
                    },
                  }
                : {}),
            },
          ]}
        />
        <Header />
        <main className="flex-1">
          <div className="dt-container py-6">
            <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-primary hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/products/${category || "all"}`} className="hover:text-primary hover:underline">
                {categoryLabel}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{detailProduct.name}</span>
            </nav>
          </div>
          <section className="dt-section pt-0">
            <div className="dt-container">
              <h1 className="dt-section-title max-w-4xl">{detailProduct.name}</h1>
              <p className="dt-section-subtitle mt-3 max-w-3xl">
                {detailDescription}
              </p>
              <div className="mt-8 dt-card p-4 sm:p-8">
                <ProductDetailModal product={detailProduct} />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (productSlug) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead
          title={`Product not found | ${SITE_COMPANY.name}`}
          description={`The requested irrigation product is not available. Browse the current ${SITE_COMPANY.name} catalogue.`}
          url={`https://www.dripstech.co.ke/products/${category || "all"}/${productSlug}`}
        />
        <Header />
        <main className="flex-1">
          <section className="dt-section">
            <div className="dt-container text-center">
              <h1 className="dt-section-title">Product not found</h1>
              <p className="dt-section-subtitle mx-auto mt-3">
                This product may be out of stock or its catalogue link may have changed.
              </p>
              <Link to={`/products/${category || ""}`} className="dt-btn-primary mt-6 inline-flex">
                Browse the catalogue
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={productPageTitle}
        description={productPageDescription}
        keywords={productPageKeywords}
        url={
          category
            ? `https://www.dripstech.co.ke/products/${category}`
            : "https://www.dripstech.co.ke/products"
        }
        type="product"
        schema={productsSchema}
      />
      <Header />
      <WhatsAppContact
        filterCategory={category}
        variant="floating"
        className="shadow-2xl hover:shadow-3xl"
      />

      {/* Floating Comparison Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-background/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-2xl p-4 flex items-center gap-6 min-w-[320px] max-w-[95vw]">
            <div className="flex -space-x-3 overflow-hidden">
              {compareList.map((p) => (
                <div key={p.id} className="w-12 h-12 rounded-xl border-2 border-background bg-muted flex-shrink-0 relative group">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-6 h-6 m-3 opacity-20" />
                  )}
                  <button
                    onClick={() => toggleCompare(p)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {compareList.length < 4 && (
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50">
                  <span className="text-xl">+</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-bold">{compareList.length} Selected</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Comparison Mode</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>
                Clear
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={compareList.length < 2}
                onClick={() => setShowComparison(true)}
              >
                Compare Now
                <Scale className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Scale className="h-6 w-6 text-primary" />
              Product Comparison
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {compareList.map((p) => (
              <div key={p.id} className="space-y-6">
                <div className="aspect-square rounded-2xl bg-muted overflow-hidden">
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg line-clamp-2 min-h-[3.5rem]">{p.name}</h4>
                  <p className="text-primary font-black text-xl">
                    {p.price ? `KSh ${p.price.toLocaleString()}` : "Price on Request"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Specifications</p>
                    <div className="space-y-2">
                      {p.specifications ? (
                        Object.entries(p.specifications).slice(0, 5).map(([key, val]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-medium ml-1">{formatSpecValue(val)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No detailed specs available</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {p.features?.slice(0, 5).map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="sm">Get Quote</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <main>
        {/* Enhanced Hero Section with Gradient and Breadcrumbs */}
        <section className="relative bg-gradient-to-br from-background via-background to-primary/5 border-b border-border py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero-like Breadcrumb and Title Section */}
            <Breadcrumbs className="mb-8" />

            {/* Title Section */}
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Package className="w-4 h-4 mr-2" />
                Product Catalog
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
                {category ? (
                  getCategoryTitle(category)
                ) : (
                  <>
                    <span className="text-accent">All</span> Products
                  </>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-2">
                Discover our range of professional irrigation solutions
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="font-normal">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </Badge>
                {products.length > filteredProducts.length && (
                  <span>• {products.length} total</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="py-8 sm:py-12 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">

            {/* Enhanced Sticky Filter Bar */}
            <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm mb-8">
              <div className={`py-4 ${showFilters ? "block" : "hidden sm:block"}`}>
                {/* Search and Controls Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Enhanced Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="Search by name, model, or features..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base transition-all"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  {/* Sort and View Controls */}
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-[160px] h-12 bg-background border-border hover:border-primary/50 rounded-xl text-base transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Sort: Name</SelectItem>
                        <SelectItem value="price">Sort: Price</SelectItem>
                        <SelectItem value="created_at">Sort: Newest</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      className="px-4 h-12 bg-background border border-border hover:border-primary/50 hover:bg-muted rounded-xl transition-all"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>

                    <div className="hidden sm:flex border border-border rounded-xl bg-background overflow-hidden">
                      <Button
                        className={`h-12 w-12 p-0 rounded-none ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"} transition-all`}
                        onClick={() => setViewMode("grid")}
                        title="Grid View"
                      >
                        <Grid3x3 className="h-5 w-5" />
                      </Button>
                      <Button
                        className={`h-12 w-12 p-0 rounded-none ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"} transition-all`}
                        onClick={() => setViewMode("list")}
                        title="List View"
                      >
                        <List className="h-5 w-5" />
                      </Button>
                    </div>

                    <Button
                      className="sm:hidden h-12 px-4 bg-background border border-border hover:border-primary/50 hover:bg-muted rounded-xl transition-all"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Filters
                    </Button>
                  </div>
                </div>

                {/* Filter Chips Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Filters:</span>

                  <Button
                    variant="outline"
                    className={`h-9 ${showFeaturedOnly ? "bg-primary text-primary-foreground border-primary" : ""} hover:bg-primary/10 rounded-full transition-all`}
                    size="sm"
                    onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  >
                    <Star className={`h-4 w-4 mr-2 ${showFeaturedOnly ? "fill-current" : ""}`} />
                    Featured
                  </Button>

                  <Button
                    variant="outline"
                    className={`h-9 ${showInStockOnly ? "bg-primary text-primary-foreground border-primary" : ""} hover:bg-primary/10 rounded-full transition-all`}
                    size="sm"
                    onClick={() => setShowInStockOnly(!showInStockOnly)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    In Stock
                  </Button>

                  {(searchTerm || showFeaturedOnly || showInStockOnly || subcategoryFilter) && (
                    <Button
                      variant="outline"
                      className="h-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive rounded-full transition-all"
                      size="sm"
                      onClick={clearAllFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {currentProducts.length > 0 ? (
              <div>
                <div
                  className={`grid gap-6 mb-12 ${viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                    }`}
                >
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="block sm:hidden">
                  <MobilePagination />
                </div>
                <div className="hidden sm:block">
                  <DesktopPagination />
                </div>
                <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-background to-muted/20 rounded-2xl border-2 border-dashed border-border">
                <div className="max-w-md mx-auto px-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    No Products Found
                  </h3>
                  <p className="text-muted-foreground text-base mb-8">
                    We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md"
                      onClick={clearAllFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => window.location.href = '/products'}
                    >
                      View All Products
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <FAQSection faqs={COMMON_FAQS.products} />

        <section className="bg-background py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ProductRecommendations
              currentCategory={category}
              limit={4}
            />
          </div>
        </section>
      </main>
      <IrrigationKeywords />
      <Footer />
    </div>
  );
};

export default Products;
