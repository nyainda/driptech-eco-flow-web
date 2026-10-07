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
import { ProductCard } from "@/components/Products/ProductCard";
import ProductDetailView from "@/components/Products/ProductDetailView";
import ProductRecommendations from "@/components/Products/ProductRecommendations";
import OptimizedImage from "@/components/common/OptimizedImage";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { trackSearch } from "@/services/aiProductService";
import { cn } from "@/lib/utils";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

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
  | "fertigation_systems"
  | "greenhouse_systems"
  | "emitters_drippers"
  | "valves_regulators"
  | "filters_strainers"
  | "controllers_timers"
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
  greenhouse_systems: "greenhouse",
  filters_strainers: "filters-strainers",
  pipes_fittings: "pipes",
  pumps_motors: "pumps",
  sprinkler_systems: "sprinklers",
  valves_regulators: "valves",
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
          fertigation: "fertigation_systems",
          greenhouse: "greenhouse_systems",
          emitters: "emitters_drippers",
          valves: "valves_regulators",
          "filters-strainers": "filters_strainers",
          controllers: "controllers_timers",
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
  const hasActiveFilters = Boolean(
    searchTerm ||
      subcategoryFilter ||
      showFeaturedOnly ||
      showInStockOnly ||
      category,
  );
  const catalogueStatus = hasActiveFilters
    ? "Matching irrigation solutions"
    : "Explore our irrigation collection";

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
      fertigation: "Fertigation Systems",
      greenhouse: "Greenhouse Systems",
      emitters: "Emitters & Drippers",
      valves: "Valves & Regulators",
      "filters-strainers": "Filters & Strainers",
      controllers: "Controllers & Timers",
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


  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object" && value !== null) {
      return value.value || JSON.stringify(value);
    }
    return String(value);
  };


  const MobilePagination = () => (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-muted-foreground text-center">
        {hasActiveFilters ? "Viewing matching products" : "Browse more products"} · Page {currentPage}
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
        {hasActiveFilters ? "Viewing matching products" : "Explore more irrigation solutions"} · Page {currentPage}
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
        <main className="flex-1" id="main-content" tabIndex={-1}>
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
              <div className="border-b border-border pb-7 sm:pb-9">
                <p className="storefront-eyebrow">{categoryLabel}</p>
                <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <h1 className="storefront-heading max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{detailProduct.name}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{detailDescription}</p>
                  </div>
                  <div className="min-w-[220px] border-l-0 border-border lg:border-l lg:pl-7">
                    <p className="font-mono text-xl font-bold text-foreground sm:text-2xl">{formatPrice(detailPrice)}</p>
                    <p className={`mt-1 text-sm font-medium ${detailProduct.in_stock ? "text-primary" : "text-muted-foreground"}`}>{detailProduct.in_stock ? "In stock — confirm delivery" : "Contact us for availability"}</p>
                    <WhatsAppContact currentProduct={{ name: detailProduct.name, model_number: detailProduct.model_number }} variant="button" className="mt-4 w-full rounded-md shadow-none" />
                  </div>
                </div>
              </div>
              <div className="mt-8 border-y border-border bg-card py-6 sm:mt-10 sm:py-10">
                <ProductDetailView product={detailProduct} />
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
                  {catalogueStatus}
                </Badge>
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
                    ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
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
