import React, { useState } from "react";
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
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
      const { data, error } = await supabase
        .from("irrigation_kits")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching kits:", error);
        throw error;
      }

      return data as IrrigationKit[];
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const fetchKitDocuments = async (kitId: string) => {
    try {
      const { data, error } = await supabase
        .from("kit_documents")
        .select("*")
        .eq("kit_id", kitId)
        .order("document_type");

      if (error) {
        console.error("Error fetching kit documents:", error);
        setKitDocuments([]);
        return;
      }

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
        return "light:bg-green-100 light:text-green-800 light:border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800";
      case "medium":
        return "light:bg-yellow-100 light:text-yellow-800 light:border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800";
      case "advanced":
        return "light:bg-red-100 light:text-red-800 light:border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800";
      default:
        return "light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border";
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
              className="light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
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
      <Header />

      <main className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 light:bg-gray-100 dark:bg-muted/30 rounded-lg mb-6 border border-border">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-primary font-semibold">
                Professional Irrigation Solutions
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Find Your Perfect
              <span className="block text-primary">Irrigation Kit</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional-grade irrigation systems designed for Kenyan farms.
              Complete kits with installation, training, and ongoing support.
            </p>
          </div>

          {/* Stats Cards */}
          {kits.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <Card className="text-center light:bg-white dark:bg-background border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2 text-primary">
                    {kits.length}
                  </div>
                  <div className="text-muted-foreground">Available Kits</div>
                </CardContent>
              </Card>
              <Card className="text-center light:bg-white dark:bg-background border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2 text-primary">
                    {kits.filter((k) => k.featured).length}
                  </div>
                  <div className="text-muted-foreground">Featured Kits</div>
                </CardContent>
              </Card>
              <Card className="text-center light:bg-white dark:bg-background border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2 text-primary">
                    {Math.round(
                      kits.reduce(
                        (sum, k) => sum + (k.water_efficiency_percentage || 0),
                        0,
                      ) / kits.length,
                    ) || 0}
                    %
                  </div>
                  <div className="text-muted-foreground">Avg Efficiency</div>
                </CardContent>
              </Card>
              <Card className="text-center light:bg-white dark:bg-background border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2 text-primary">
                    {Math.round(
                      kits.reduce((sum, k) => sum + (k.coverage_area || 0), 0),
                    ) || 0}
                  </div>
                  <div className="text-muted-foreground">Total Coverage</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-8 light:bg-white dark:bg-background border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  Find Your Kit
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className={
                      viewMode === "cards"
                        ? "light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        : "border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted"
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
                        ? "light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        : "border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted"
                    }
                  >
                    <List className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted"
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
                    className="pl-10 light:bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
                    placeholder="Search kits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedKitType}
                  onValueChange={setSelectedKitType}
                >
                  <SelectTrigger className="light:bg-white dark:bg-background border-border text-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Kit Type" />
                  </SelectTrigger>
                  <SelectContent className="light:bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="all"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      All Types
                    </SelectItem>
                    {kitTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
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
                  <SelectTrigger className="light:bg-white dark:bg-background border-border text-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Complexity" />
                  </SelectTrigger>
                  <SelectContent className="light:bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="all"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      All Levels
                    </SelectItem>
                    <SelectItem
                      value="easy"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Easy
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="advanced"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Advanced
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="light:bg-white dark:bg-background border-border text-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="light:bg-white dark:bg-background border-border text-foreground">
                    <SelectItem
                      value="featured"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Featured First
                    </SelectItem>
                    <SelectItem
                      value="price_low"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Price: Low to High
                    </SelectItem>
                    <SelectItem
                      value="price_high"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Price: High to Low
                    </SelectItem>
                    <SelectItem
                      value="coverage_area"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Coverage Area
                    </SelectItem>
                    <SelectItem
                      value="efficiency"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
                    >
                      Water Efficiency
                    </SelectItem>
                    <SelectItem
                      value="newest"
                      className="light:hover:bg-gray-100 dark:hover:bg-muted light:focus:bg-gray-100 dark:focus:bg-muted"
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
                  className="light:bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
                />
                <Input
                  type="number"
                  placeholder="Max Price (KES)"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  className="light:bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground light:focus:ring-blue-500 light:focus:border-blue-500 dark:focus:ring-primary dark:focus:border-primary"
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
                className="light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Table View */}
          {!isLoading && processedKits.length > 0 && viewMode === "table" && (
            <Card className="light:bg-white dark:bg-background border-border shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border light:bg-gray-100 dark:bg-muted/30">
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
                            className="border-b border-border light:hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
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
                                    <Badge className="light:bg-yellow-100 light:text-yellow-800 light:border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800 mt-1">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className="capitalize light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border">
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
                                className="light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                    className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer light:bg-white dark:bg-background border-border text-foreground overflow-hidden light:hover:border-blue-500 dark:hover:border-primary/50"
                    onClick={() => handleKitSelect(kit)}
                  >
                    {/* Image Section */}
                    {imageUrl && (
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={kit.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <div className="absolute inset-0 light:bg-gray-700/70 dark:bg-background/70" />
                        {kit.featured && (
                          <div className="absolute top-4 right-4">
                            <Badge className="light:bg-yellow-100 light:text-yellow-800 light:border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-foreground">
                            <h3 className="text-xl font-bold mb-1">
                              {kit.name}
                            </h3>
                            <Badge className="light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border">
                              {kit.kit_type?.replace("_", " ") ||
                                "Standard Kit"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <CardContent className="p-6 space-y-4">
                      {!imageUrl && (
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                              {kit.name}
                            </h3>
                            <Badge className="mt-1 capitalize light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border">
                              {kit.kit_type?.replace("_", " ") || "Standard"}
                            </Badge>
                          </div>
                          {kit.featured && (
                            <Badge className="light:bg-yellow-100 light:text-yellow-800 light:border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      )}

                      {kit.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {kit.description}
                        </p>
                      )}

                      {/* Pricing Section */}
                      <div className="light:bg-gray-100 dark:bg-muted/30 rounded-lg p-4 border border-border">
                        {hasPricingTiers ? (
                          <div>
                            <div className="text-sm text-muted-foreground mb-3 font-medium">
                              Pricing Options:
                            </div>
                            <div className="space-y-2">
                              {components
                                .pricing_tiers!.slice(0, 3)
                                .map((tier, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-2 px-3 light:bg-white dark:bg-background rounded border border-border"
                                  >
                                    <div className="text-sm">
                                      <div className="font-medium text-foreground">
                                        {tier.name}
                                      </div>
                                      {tier.description && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {tier.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-primary font-bold text-lg">
                                      {formatCurrency(tier.price)}
                                    </div>
                                  </div>
                                ))}
                              {components.pricing_tiers!.length > 3 && (
                                <div className="text-center text-sm text-muted-foreground py-2">
                                  +{components.pricing_tiers!.length - 3} more
                                  options
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                              {formatCurrency(kit.price)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Complete kit price
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Specifications */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 light:bg-gray-100 dark:bg-muted/30 rounded-lg border border-border">
                          <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="font-semibold text-foreground">
                            {kit.coverage_area || "TBD"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            acres
                          </div>
                        </div>
                        <div className="text-center p-3 light:bg-gray-100 dark:bg-muted/30 rounded-lg border border-border">
                          <Droplets className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="font-semibold text-foreground">
                            {kit.water_efficiency_percentage || 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            efficient
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {kit.installation_complexity && (
                          <Badge
                            className={getComplexityColor(
                              kit.installation_complexity,
                            )}
                          >
                            {kit.installation_complexity} install
                          </Badge>
                        )}
                        <Badge className="light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border">
                          <Shield className="h-3 w-3 mr-1" />
                          {kit.warranty_months || 12}mo warranty
                        </Badge>
                      </div>

                      {/* Crops */}
                      {kit.recommended_crops &&
                        kit.recommended_crops.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Leaf className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">
                                Best for:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {kit.recommended_crops
                                .slice(0, 3)
                                .map((crop, index) => (
                                  <Badge
                                    key={index}
                                    className="text-xs light:bg-gray-100 light:text-gray-800 light:border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border"
                                  >
                                    {crop}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}

                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1 light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button className="light:bg-gray-100 light:hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/50 text-muted-foreground border-border">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto light:bg-white dark:bg-background border-border text-foreground">
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
                            "Professional irrigation solution"}
                        </DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedKit.featured && (
                          <Badge className="light:bg-yellow-100 light:text-yellow-800 light:border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
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
                        <Card className="p-4 text-center light:bg-gray-100 dark:bg-muted/30 border-border">
                          <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.coverage_area || "TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            acres coverage
                          </div>
                        </Card>
                        <Card className="p-4 text-center light:bg-gray-100 dark:bg-muted/30 border-border">
                          <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.water_efficiency_percentage || 0}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            efficiency
                          </div>
                        </Card>
                        <Card className="p-4 text-center light:bg-gray-100 dark:bg-muted/30 border-border">
                          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                          <div className="text-xl font-bold text-foreground">
                            {selectedKit.installation_time_hours || "TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            install hours
                          </div>
                        </Card>
                        <Card className="p-4 text-center light:bg-gray-100 dark:bg-muted/30 border-border">
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
                                  className="flex items-center gap-3 p-3 light:bg-gray-100 dark:bg-muted/30 rounded-lg border border-border"
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
                                className="p-4 light:bg-gray-100 dark:bg-muted/30 border-border"
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
                                  className="flex items-center gap-3 p-3 light:bg-gray-100 dark:bg-muted/30 rounded-lg border border-border"
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
                                className="hover:shadow-md transition-shadow light:bg-white dark:bg-background border-border"
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
                                        className="w-full border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted light:hover:text-gray-800 dark:hover:text-foreground"
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
                      <Card className="light:bg-gray-100 dark:bg-muted/30 border-border">
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
                                className="w-full light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                                size="lg"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Request Quote
                              </Button>
                            </a>
                            <a href="tel:+254111409454" className="w-full">
                              <Button
                                variant="outline"
                                className="w-full border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted light:hover:text-gray-800 dark:hover:text-foreground"
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
                      <Card className="light:bg-white dark:bg-background border-border">
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
                          <Card className="light:bg-white dark:bg-background border-border">
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
                      <Card className="light:bg-white dark:bg-background border-border">
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
                  <Card className="mt-8 light:bg-gray-100 dark:bg-muted/30 border-border">
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
                          className="light:bg-blue-600 light:hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-0"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          Call +254111409454
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-border text-muted-foreground light:hover:bg-gray-100 dark:hover:bg-muted light:hover:text-gray-800 dark:hover:text-foreground"
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
