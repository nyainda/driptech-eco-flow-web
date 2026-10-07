import React, { useState } from "react";
import SEOHead from "@/components/common/SEOHead";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Package,
  Star,
  Clock,
  Droplets,
  Leaf,
  MapPin,
  Download,
  FileText,
  CheckCircle,
  ShoppingCart,
  Eye,
  Phone,
  Mail,
  Shield,
  Settings,
  Filter,
  Search,
  AlertCircle,
  Loader2,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  MessageCircle,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { dataService } from "@/services/dataService";
import { SITE_COMPANY } from "@/config/company";

// Interface definitions remain unchanged
interface IrrigationKit {
  id: string;
  name: string;
  description: string | null;
  kit_type: string | null;
  coverage_area: number | null;
  recommended_crops: string[] | null;
  price: number | null;
  components: any;
  installation_complexity: string | null;
  installation_time_hours: number | null;
  water_efficiency_percentage: number | null;
  warranty_months: number | null;
  featured: boolean | null;
  active: boolean | null;
  images: any;
  created_at: string | null;
  updated_at: string | null;
}

interface KitDocument {
  id: string;
  kit_id: string | null;
  document_type: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  version: string | null;
  language: string | null;
  requires_login: boolean | null;
  download_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ComponentsData {
  main_components?: string[];
  pricing_tiers?: Array<{ name: string; price: number; description: string }>;
  included_services?: string[];
}

const IrrigationKits = () => {
  const [selectedKit, setSelectedKit] = useState<IrrigationKit | null>(null);
  const [kitDocuments, setKitDocuments] = useState<KitDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKitType, setSelectedKitType] = useState("all");
  const [selectedComplexity, setSelectedComplexity] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const {
    data: kits = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["irrigation-kits-public"],
    queryFn: async () => {
      const data = await dataService.getIrrigationKits({ sortBy: 'featured' });
      return data as IrrigationKit[];
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const fetchKitDocuments = async (kitId: string) => {
    try {
      const data = await dataService.getKitDocuments(kitId);
      setKitDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setKitDocuments([]);
    }
  };

  const handleKitSelect = (kit: IrrigationKit) => {
    setSelectedKit(kit);
    fetchKitDocuments(kit.id);
  };

  const processedKits = React.useMemo(() => {
    let filtered = kits.filter((kit) => {
      const searchText = searchTerm.toLowerCase();
      const matchesSearch =
        kit.name.toLowerCase().includes(searchText) ||
        (kit.description &&
          kit.description.toLowerCase().includes(searchText)) ||
        (kit.kit_type && kit.kit_type.toLowerCase().includes(searchText)) ||
        (kit.recommended_crops &&
          kit.recommended_crops.some((crop) =>
            crop.toLowerCase().includes(searchText),
          ));

      const matchesKitType =
        selectedKitType === "all" || kit.kit_type === selectedKitType;
      const matchesComplexity =
        selectedComplexity === "all" ||
        kit.installation_complexity === selectedComplexity;

      const price = kit.price || 0;
      const matchesPrice =
        (!priceRange.min || price >= parseFloat(priceRange.min)) &&
        (!priceRange.max || price <= parseFloat(priceRange.max));

      return (
        matchesSearch && matchesKitType && matchesComplexity && matchesPrice
      );
    });

    switch (sortBy) {
      case "price_low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "coverage_area":
        filtered.sort(
          (a, b) => (b.coverage_area || 0) - (a.coverage_area || 0),
        );
        break;
      case "efficiency":
        filtered.sort(
          (a, b) =>
            (b.water_efficiency_percentage || 0) -
            (a.water_efficiency_percentage || 0),
        );
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime(),
        );
        break;
      default:
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
          );
        });
    }

    return filtered;
  }, [
    kits,
    searchTerm,
    selectedKitType,
    selectedComplexity,
    priceRange,
    sortBy,
  ]);

  // Market-informed fallback prices (KES), used only until real kits load from
  // the database or if a kit has no price set yet. Based on July 2026 competitor
  // benchmarking (Grekkon, Hortitechno, Aqua Hub) for equivalent kit sizes.
  const MARKET_FALLBACK_PRICES: Record<string, { min: number; max: number }> = {
    "1/8": { min: 16000, max: 24000 },
    "1/4": { min: 38000, max: 50000 },
    "1/2": { min: 55000, max: 69000 },
    "1": { min: 100000, max: 169000 },
  };

  const kitsSchema = React.useMemo(() => {
    const sourceKits = kits.length > 0 ? kits : [];
    if (sourceKits.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Drip Irrigation Kits Kenya",
      itemListElement: sourceKits.slice(0, 20).map((kit, index) => {
        const acreLabel = kit.coverage_area
          ? String(kit.coverage_area)
          : null;
        const fallback = acreLabel
          ? MARKET_FALLBACK_PRICES[acreLabel]
          : undefined;
        const price = kit.price || fallback?.min || undefined;

        return {
          "@type": "Product",
          position: index + 1,
          name: kit.name,
          description:
            kit.description ||
            `Drip irrigation kit covering ${acreLabel || "custom"} acre(s), suited for Kenyan farms.`,
          brand: { "@type": "Brand", name: SITE_COMPANY.name },
          ...(price
            ? {
                offers: {
                  "@type": "Offer",
                  price: String(price),
                  priceCurrency: "KES",
                  availability: "https://schema.org/InStock",
                  url: "https://www.dripstech.co.ke/irrigation-kits",
                },
              }
            : {}),
        };
      }),
    };
  }, [kits]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Contact for Price";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getComplexityColor = (complexity: string | null) => {
    switch (complexity) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border";
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedKitType("all");
    setSelectedComplexity("all");
    setPriceRange({ min: "", max: "" });
    setSortBy("featured");
  };

  const parseComponents = (components: any): ComponentsData => {
    if (typeof components === "string") {
      try {
        return JSON.parse(components);
      } catch {
        return {};
      }
    }
    return components || {};
  };

  const parseImages = (images: any): string[] => {
    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }
    return Array.isArray(images) ? images : [];
  };

  const kitTypes = React.useMemo(() => {
    const types = new Set(kits.map((kit) => kit.kit_type).filter(Boolean));
    return Array.from(types);
  }, [kits]);

  if (error) {
    return (
      <div className="min-h-screen bg-background border-t border-border">
        <Header />
        <main className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Unable to Load Kits
            </h2>
            <p className="text-muted-foreground mb-6">
              We're having trouble loading the irrigation kits. Please try
              again.
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
            >
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Drip Irrigation Kit Prices Kenya (1/8, 1/4, 1/2, 1 Acre) | DripTech Eco Flow"
        description="Buy drip irrigation kits in Kenya for 1/8 acre, 1/4 acre, 1/2 acre and 1 acre farms. Complete kits with driplines, filters, fittings and installation support. Call 0723 407 849 / 0757 716 018. Transparent pricing, nationwide delivery."
        keywords="drip irrigation kit price kenya, 1 acre drip irrigation kit, 1/4 acre drip kit, 1/2 acre drip kit, buy drip irrigation kit online kenya, irrigation kits for sale kenya, drip kit for tomatoes kenya, drip kit for onions kenya, 0723407849, 0757716018, drip irrigation contact Kenya"
        url="https://www.dripstech.co.ke/irrigation-kits"
        image="https://www.dripstech.co.ke/seed-products/drip3.jpg"
        type="product"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.dripstech.co.ke/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Irrigation Kits",
                item: "https://www.dripstech.co.ke/irrigation-kits",
              },
            ],
          },
          ...(kitsSchema ? [kitsSchema] : []),
        ]}
      />
      <Header />

      <main className="dt-section">
        <div className="dt-container">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <p className="dt-section-label mb-3">Kits</p>
            <h1 className="dt-section-title text-3xl sm:text-4xl">
              Find the right irrigation kit for{" "}
              <span className="text-primary">your plot</span>
            </h1>
            <p className="dt-section-subtitle mx-auto mt-3">
              Compare ready-to-use packages by plot size, price and crop. Every kit brings the core lines, filter and fittings together, with support if you want help installing it.
            </p>
          </div>

          {kits.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground sm:mb-10">
              <span>
                <strong className="text-foreground">{kits.length}</strong> kits
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
              <span>
                <strong className="text-foreground">
                  {kits.filter((k) => k.featured).length}
                </strong>{" "}
                featured
              </span>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-8 border border-border bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  Narrow it down
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className={
                      viewMode === "cards"
                        ? "bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        : "border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                    }
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={
                      viewMode === "table"
                        ? "bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        : "border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                    }
                  >
                    <List className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
                    placeholder="Search kits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedKitType}
                  onValueChange={setSelectedKitType}
                >
                  <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Kit Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      All Types
                    </SelectItem>
                    {kitTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                      >
                        {type
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedComplexity}
                  onValueChange={setSelectedComplexity}
                >
                  <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Complexity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      All Levels
                    </SelectItem>
                    <SelectItem
                      value="easy"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Easy
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="advanced"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Advanced
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="featured"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Featured First
                    </SelectItem>
                    <SelectItem
                      value="price_low"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Price: Low to High
                    </SelectItem>
                    <SelectItem
                      value="price_high"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Price: High to Low
                    </SelectItem>
                    <SelectItem
                      value="coverage_area"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Coverage Area
                    </SelectItem>
                    <SelectItem
                      value="efficiency"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Water Efficiency
                    </SelectItem>
                    <SelectItem
                      value="newest"
                      className="hover:bg-gray-100 dark:hover:bg-muted focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Newest First
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Min Price (KES)"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  className="bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
                />
                <Input
                  type="number"
                  placeholder="Max Price (KES)"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  className="bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-foreground">
                Loading irrigation kits...
              </h3>
            </div>
          )}

          {/* No Results */}
          {!isLoading && processedKits.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No kits found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria
              </p>
              <Button
                onClick={resetFilters}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Table View */}
          {!isLoading && processedKits.length > 0 && viewMode === "table" && (
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-gray-100 dark:bg-muted/30">
                        <th className="text-left p-4 font-semibold text-foreground">
                          Kit Name
                        </th>
                        <th className="text-left p-4 font-semibold text-foreground">
                          Type
                        </th>
                        <th className="text-right p-4 font-semibold text-foreground">
                          Price
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground">
                          Coverage
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground">
                          Efficiency
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedKits.map((kit) => {
                        const components = parseComponents(kit.components);
                        const hasPricingTiers =
                          components.pricing_tiers &&
                          components.pricing_tiers.length > 0;

                        return (
                          <tr
                            key={kit.id}
                            className="border-b border-border hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-semibold text-foreground">
                                    {kit.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {kit.kit_type?.replace("_", " ")}
                                  </div>
                                  {kit.featured && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800 mt-1">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className="capitalize bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border">
                                {kit.kit_type?.replace("_", " ") || "Standard"}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              {hasPricingTiers ? (
                                <div className="text-right">
                                  <div className="font-bold text-lg text-primary">
                                    Multiple Options
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatCurrency(
                                      Math.min(
                                        ...components.pricing_tiers!.map(
                                          (t) => t.price,
                                        ),
                                      ),
                                    )}{" "}
                                    -{" "}
                                    {formatCurrency(
                                      Math.max(
                                        ...components.pricing_tiers!.map(
                                          (t) => t.price,
                                        ),
                                      ),
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="font-bold text-lg text-primary">
                                  {formatCurrency(kit.price)}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-semibold text-foreground">
                                {kit.coverage_area || "TBD"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                acres
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-semibold text-foreground">
                                {kit.water_efficiency_percentage || 0}%
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                onClick={() => handleKitSelect(kit)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Grid View */}
          {!isLoading && processedKits.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {processedKits.map((kit) => {
                const components = parseComponents(kit.components);
                const images = parseImages(kit.images);
                const imageUrl = images[0];
                const hasPricingTiers =
                  components.pricing_tiers &&
                  components.pricing_tiers.length > 0;

                return (
                  <Card
                    key={kit.id}
                    className="dt-card group relative flex h-full cursor-pointer flex-col overflow-hidden transition-colors duration-200 hover:border-primary/50"
                    onClick={() => handleKitSelect(kit)}
                  >
                    <CardContent className="relative flex flex-1 flex-col p-0">
                      <div className="relative overflow-hidden border-b border-border bg-muted">
                        <div className="relative aspect-[1.12] overflow-hidden sm:aspect-[4/3] lg:aspect-[1.2]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={kit.name}
                              className="h-full w-full object-contain p-4 sm:p-5 lg:p-6"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Package className="h-12 w-12 text-primary/50" />
                              <span className="text-xs font-medium">Kit photo</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute left-2 top-2 flex max-w-[70%] flex-col gap-1">
                          {kit.featured && (
                            <Badge className="border-0 bg-primary px-1.5 py-0 text-[9px] font-bold text-primary-foreground sm:text-[10px]">
                              <Star className="mr-0.5 h-2.5 w-2.5" fill="currentColor" />
                              Featured
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="max-w-full truncate border-border bg-background/95 px-1.5 py-0 text-[9px] capitalize text-foreground shadow-sm sm:text-[10px]"
                          >
                            {(kit.kit_type || "standard kit").replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">
                          {kit.name}
                        </h3>

                        {kit.description && (
                          <p className="hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 md:block">
                            {kit.description}
                          </p>
                        )}

                        <div className="mt-auto space-y-3 pt-1">
                          <div className="flex items-baseline justify-between gap-2">
                            {hasPricingTiers ? (
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  From
                                </p>
                                <p className="dt-price-sm text-primary">
                                  {formatCurrency(
                                    Math.min(
                                      ...components.pricing_tiers!.map((tier) => tier.price),
                                    ),
                                  )}
                                </p>
                              </div>
                            ) : (
                              <p className="dt-price-sm text-primary">
                                {formatCurrency(kit.price)}
                              </p>
                            )}
                            {kit.coverage_area ? (
                              <span className="text-xs text-muted-foreground">
                                {kit.coverage_area} acres
                              </span>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            <a
                              href={`https://wa.me/254723407849?text=${encodeURIComponent(
                                `Hi DripTech — I'm interested in the ${kit.name} kit. Please share price and availability.`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="col-span-2 flex flex-row items-center justify-center gap-2 rounded-none bg-[hsl(var(--dt-whatsapp))] py-2.5 transition-all hover:bg-[hsl(var(--dt-whatsapp)/0.9)] active:scale-[0.98] sm:col-span-1 sm:flex-col sm:gap-1.5 sm:py-3"
                            >
                              <MessageCircle className="h-4 w-4 text-white" aria-hidden="true" />
                              <span className="text-[11px] font-bold text-white sm:text-[10px]">Ask on WhatsApp</span>
                            </a>
                            <button
                              type="button"
                              className="flex flex-col items-center justify-center gap-1 rounded-none border border-border bg-background py-2 text-[9px] font-bold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 sm:gap-1.5 sm:py-3 sm:text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKitSelect(kit);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                              Details
                            </button>
                            <button
                              type="button"
                              className="flex flex-col items-center justify-center gap-1 rounded-none border border-border bg-background py-2 text-[9px] font-bold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 sm:gap-1.5 sm:py-3 sm:text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKitSelect(kit);
                              }}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                              Quote
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Kit Details Modal */}
          <Dialog
            open={!!selectedKit}
            onOpenChange={() => setSelectedKit(null)}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-background border-border text-foreground">
              {selectedKit && (
                <>
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-3xl font-bold text-foreground">
                          {selectedKit.name}
                        </DialogTitle>
                        <DialogDescription className="text-lg mt-2 text-muted-foreground">
                          {selectedKit.description ||
                            "A closer look at what is included in this kit."}
                        </DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedKit.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
                            <Star className="h-4 w-4 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="capitalize border-border text-muted-foreground"
                        >
                          {selectedKit.kit_type?.replace("_", " ") ||
                            "Standard Kit"}
                        </Badge>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Specifications */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center bg-gray-100 dark:bg-muted/30 border-border">
                          <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.coverage_area || "TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            acres coverage
                          </div>
                        </Card>
                        <Card className="p-4 text-center bg-gray-100 dark:bg-muted/30 border-border">
                          <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.water_efficiency_percentage || 0}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            efficiency
                          </div>
                        </Card>
                        <Card className="p-4 text-center bg-gray-100 dark:bg-muted/30 border-border">
                          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.installation_time_hours || "TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            install hours
                          </div>
                        </Card>
                        <Card className="p-4 text-center bg-gray-100 dark:bg-muted/30 border-border">
                          <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.warranty_months || 12}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            months warranty
                          </div>
                        </Card>
                      </div>

                      {/* Components */}
                      {parseComponents(selectedKit.components)
                        ?.main_components && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                              <Package className="h-5 w-5 text-primary" />
                              Included Components
                            </h3>
                            <div className="grid gap-3">
                              {parseComponents(
                                selectedKit.components,
                              ).main_components?.map(
                                (component: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-muted/30 border border-border"
                                  >
                                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-foreground">
                                      {component}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Pricing Tiers */}
                      {parseComponents(selectedKit.components)
                        ?.pricing_tiers && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                              <TrendingUp className="h-5 w-5 text-primary" />
                              Pricing Options
                            </h3>
                            <div className="grid gap-4">
                              {parseComponents(
                                selectedKit.components,
                              ).pricing_tiers?.map((tier: any, index: number) => (
                                <Card
                                  key={index}
                                  className="p-4 bg-gray-100 dark:bg-muted/30 border-border"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        {tier.name}
                                      </div>
                                      {tier.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {tier.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                      {formatCurrency(tier.price)}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Services */}
                      {parseComponents(selectedKit.components)
                        ?.included_services && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                              <Settings className="h-5 w-5 text-primary" />
                              Included Services
                            </h3>
                            <div className="grid gap-3">
                              {parseComponents(
                                selectedKit.components,
                              ).included_services?.map(
                                (service: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-muted/30 border border-border"
                                  >
                                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-foreground">
                                      {service}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Documents */}
                      {kitDocuments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                            <FileText className="h-5 w-5 text-primary" />
                            Documentation & Resources
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {kitDocuments.map((doc) => (
                              <Card
                                key={doc.id}
                                className="hover:shadow-md transition-shadow bg-white dark:bg-background border-border"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <h4 className="font-medium text-foreground">
                                        {doc.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {doc.description}
                                      </p>
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-border text-muted-foreground"
                                        >
                                          {doc.file_type || "PDF"}
                                        </Badge>
                                        {doc.version && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs border-border text-muted-foreground"
                                          >
                                            v{doc.version}
                                          </Badge>
                                        )}
                                        {doc.download_count &&
                                          doc.download_count > 0 && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs border-border text-muted-foreground"
                                            >
                                              {doc.download_count} downloads
                                            </Badge>
                                          )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted hover:text-gray-800 dark:hover:text-foreground"
                                        onClick={() =>
                                          window.open(doc.file_url, "_blank")
                                        }
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Price Card */}
                      <Card className="bg-gray-100 dark:bg-muted/30 border-border">
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl font-bold text-primary mb-2">
                            {formatCurrency(selectedKit.price)}
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Complete kit with installation
                          </p>
                          <div className="space-y-3">
                            <a
                              href="mailto:driptech2025@gmail.com?subject=Quote Request for Irrigation Kit"
                              className="w-full"
                            >
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                                size="lg"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Request Quote
                              </Button>
                            </a>
                            <a href="tel:0723407849" className="w-full">
                              <Button
                                variant="outline"
                                className="w-full border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted hover:text-gray-800 dark:hover:text-foreground"
                                size="lg"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call Expert
                              </Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Kit Details */}
                      <Card className="bg-white dark:bg-background border-border">
                        <CardHeader>
                          <CardTitle className="text-lg text-foreground">
                            Kit Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Installation Time:
                            </span>
                            <span className="text-foreground">
                              {selectedKit.installation_time_hours
                                ? `${selectedKit.installation_time_hours}h`
                                : "Contact us"}
                            </span>
                          </div>
                          {selectedKit.installation_complexity && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Complexity:
                              </span>
                              <Badge
                                className={getComplexityColor(
                                  selectedKit.installation_complexity,
                                )}
                              >
                                {selectedKit.installation_complexity}
                              </Badge>
                            </div>
                          )}
                          {selectedKit.kit_type && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Type:
                              </span>
                              <span className="text-foreground capitalize">
                                {selectedKit.kit_type.replace("_", " ")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Warranty:
                            </span>
                            <span className="text-foreground">
                              {selectedKit.warranty_months || 12} months
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Crops */}
                      {selectedKit.recommended_crops &&
                        selectedKit.recommended_crops.length > 0 && (
                          <Card className="bg-white dark:bg-background border-border">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <Leaf className="h-5 w-5 text-primary" />
                                Recommended Crops
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {selectedKit.recommended_crops.map(
                                  (crop, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-muted-foreground border-border"
                                    >
                                      {crop}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                      {/* Benefits */}
                      <Card className="bg-white dark:bg-background border-border">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                            <Award className="h-5 w-5 text-primary" />
                            Key Benefits
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">
                              Water efficient irrigation
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">
                              Professional installation
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">
                              Training & support included
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">
                              {selectedKit.warranty_months || 12} months
                              warranty
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <Card className="mt-8 bg-gray-100 dark:bg-muted/30 border-border">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        Ready to Get Started?
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Our irrigation specialists will help you choose the
                        right system and provide professional installation.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          Call 0723407849
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-border text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted hover:text-gray-800 dark:hover:text-foreground"
                        >
                          <Mail className="h-5 w-5 mr-2" />
                          Email Us
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IrrigationKits;
