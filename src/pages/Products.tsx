import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Grid3x3
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import ProductTracker from "@/components/Analytics/ProductTracker";

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
  category: "accessories" | "drip_irrigation" | "sprinkler_systems" | "filtration_systems" | "control_systems";
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

const Products = () => {
  const { category } = useParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

useEffect(() => {
  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*');
      
      if (category) {
        const categoryMap: Record<string, Product['category']> = {
          'drip': 'drip_irrigation',
          'sprinklers': 'sprinkler_systems',
          'filtration': 'filtration_systems',
          'controls': 'control_systems',
          'accessories': 'accessories'
        };
        
        const dbCategory = categoryMap[category];
        if (dbCategory) {
          query = query.eq('category', dbCategory);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      
      const transformedData = (data || []).map((item: any) => {
       
        const variants = item.variants
          ? Array.isArray(item.variants)
            ? item.variants.filter((v: any) => 
                typeof v === 'object' &&
                v !== null &&
                typeof v.name === 'string' &&
                typeof v.price === 'number' &&
                typeof v.in_stock === 'boolean'
              ).map((v: any) => ({
                name: v.name,
                price: v.price,
                in_stock: v.in_stock
              } as Variant))
            : null
          : null;

        return {
          ...item,
          variants
        } as Product;
      });

      setProducts(transformedData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [category]);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.applications?.some(app => app.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.features?.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter(product => product.featured);
    }

    if (showInStockOnly) {
      filtered = filtered.filter(product => product.in_stock);
    }

    if (subcategoryFilter) {
      filtered = filtered.filter(product => product.subcategory === subcategoryFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

      if (sortBy === 'price') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, sortOrder, showFeaturedOnly, showInStockOnly, subcategoryFilter]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCategoryTitle = (cat: string) => {
    const titles: { [key: string]: string } = {
      'drip': 'Drip Irrigation Systems',
      'sprinklers': 'Sprinkler Systems',
      'filtration': 'Filtration Systems',
      'controls': 'Control Systems',
      'accessories': 'Accessories'
    };
    return titles[cat] || 'All Products';
  };

  const getUniqueSubcategories = () => {
    const subcategories = products
      .map(p => p.subcategory)
      .filter((sub, index, arr) => sub && arr.indexOf(sub) === index);
    return subcategories;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
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
    setFavorites(prev => {
      if (prev.includes(productId)) {
        toast({
          title: "Removed from Favorites",
          description: "Product has been removed from your favorites.",
        });
        return prev.filter(id => id !== productId);
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
      text: product.description || `Check out this ${product.name} from our catalog!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast({
          title: "Link Copied",
          description: "Product link has been copied to clipboard.",
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast({
        title: "Error",
        description: "Failed to share product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestQuote = (product: Product, selectedVariant: Variant | null) => {
    console.log(`Requesting quote for product: ${product.id}, variant: ${selectedVariant ? selectedVariant.name : 'None'}`);
    toast({
      title: "Quote Requested",
      description: `Quote request sent for ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}.`,
    });
  };

  const getVariantPriceRange = (variants: Variant[] | null) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  };

  const hasInStockVariant = (variants: Variant[] | null) => {
    return variants && variants.some(v => v.in_stock);
  };

  const VariantSelector = ({ variants, selectedVariant, onVariantChange }: {
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
            className={`p-3 rounded-xl border border-border cursor-pointer transition-all duration-200 ${
              selectedVariant === variant
                ? 'bg-primary/10 border-primary shadow-sm'
                : 'bg-background hover:bg-muted/30'
            }`}
            onClick={() => onVariantChange(variant)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{variant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(variant.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-xs ${variant.in_stock ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-orange-500/20 border-orange-500/50 text-orange-700'}`}
                >
                  {variant.in_stock ? 'In Stock' : 'Out of Stock'}
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
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [showVariants, setShowVariants] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;
  const variantPriceRange = hasVariants ? getVariantPriceRange(product.variants) : null;
  const displayPrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
  const isInStock = hasVariants 
    ? (selectedVariant ? selectedVariant.in_stock : hasInStockVariant(product.variants))
    : product.in_stock;

  return (
    <ProductTracker
      productName={product.name}
      productId={product.id}
      category={product.category}
    >
      <Card className="group bg-background border-border shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300">
        <CardHeader className="p-0">
          <div className="relative aspect-video bg-muted rounded-t-xl overflow-hidden">
            {product.images && product.images[0] ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge className="bg-muted/30 border-border text-foreground text-xs">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {isInStock && (
              <Badge className="bg-green-500/20 border-green-500/50 text-green-700 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                In Stock
              </Badge>
            )}
            {hasVariants && (
              <Badge className="bg-muted/30 border-border text-foreground text-xs">
                <Layers className="h-3 w-3 mr-1" />
                {product.variants!.length} Variants
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="icon" 
              className="w-8 h-8 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart 
                className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-current text-red-500' : ''}`} 
              />
            </Button>
            <Button 
              size="icon" 
              className="w-8 h-8 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
              onClick={() => shareProduct(product)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  className="w-8 h-8 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-background border-border shadow-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-2xl pr-8 text-foreground">{product.name}</DialogTitle>
                </DialogHeader>
                <ProductDetailModal product={product} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className="capitalize text-xs bg-muted/30 border-border text-foreground">
                {product.category.replace('_', ' ')}
              </Badge>
              {product.subcategory && (
                <Badge className="text-xs capitalize bg-muted/30 border-border text-foreground">
                  {product.subcategory.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {product.model_number && (
              <span className="text-xs sm:text-sm text-muted-foreground font-mono">
                {product.model_number}
              </span>
            )}
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
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
                  {selectedVariant ? selectedVariant.name : `${product.variants!.length} Variants Available`}
                </span>
                {showVariants ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              
              {showVariants && (
                <div className="space-y-1">
                  {product.variants!.map((variant, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                        selectedVariant === variant
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">{variant.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{formatPrice(variant.price)}</span>
                          <Badge 
                            className={`text-xs ${variant.in_stock ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-orange-500/20 border-orange-500/50 text-orange-700'}`}
                          >
                            {variant.in_stock ? '✓' : '✗'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground leading-relaxed">
            {product.description ? (
              <div className="space-y-2">
                <p className="line-clamp-2 sm:line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                  {product.description}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:text-primary/80">
                      Read more...
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border shadow-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="pr-8 text-foreground">{product.name} - Description</DialogTitle>
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
                                <CheckCircle className="h-4 w-4 text-green-500" />
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
              </div>
            ) : (
              <p className="text-muted-foreground/60 italic">No description available.</p>
            )}
          </div>

          {product.applications && product.applications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Applications:</h4>
              <ul className="list-none space-y-1 text-sm text-muted-foreground">
                {product.applications.slice(0, 2).map((app, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {app}
                  </li>
                ))}
                {product.applications.length > 2 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    +{product.applications.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Key Features:</h4>
              <ul className="list-none space-y-1 text-sm text-muted-foreground">
                {product.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
                {product.features.length > 3 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    +{product.features.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div className="text-lg sm:text-xl font-bold text-primary">
              {hasVariants && variantPriceRange && variantPriceRange.min !== variantPriceRange.max ? 
                `${formatPrice(variantPriceRange.min)} - ${formatPrice(variantPriceRange.max)}` : 
                formatPrice(displayPrice)
              }
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

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md text-sm">
                  View Details
                  <Eye className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-background border-border shadow-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-2xl pr-8 text-foreground">{product.name}</DialogTitle>
                </DialogHeader>
                <ProductDetailModal product={product} />
              </DialogContent>
            </Dialog>
            <div className="flex gap-1 justify-center sm:justify-start">
              {product.brochure_url && (
                <Button 
                  className="p-2 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md" 
                  title="Download Brochure"
                  asChild
                >
                  <a href={product.brochure_url} target="_blank" rel="noopener noreferrer">
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
                  <a href={product.video_url} target="_blank" rel="noopener noreferrer">
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
                  <a href={product.installation_guide_url} target="_blank" rel="noopener noreferrer">
                    <Wrench className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </ProductTracker>
  );
};

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object' && value !== null) {
      return value.value || JSON.stringify(value);
    }
    return String(value);
  };

  const ProductDetailModal = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
      product.variants && product.variants.length > 0 ? product.variants[0] : null
    );

    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
    const isInStock = hasVariants 
      ? (selectedVariant ? selectedVariant.in_stock : hasInStockVariant(product.variants))
      : product.in_stock;

    return (
      <div className="space-y-6 sm:space-y-8">
        {product.images && product.images.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-foreground">Product Images</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {product.images.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-32 sm:h-48 object-cover rounded-xl border border-border hover:shadow-lg transition-shadow cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Product Description</h4>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {product.description ? (
                  <p className="leading-relaxed text-sm sm:text-base">{product.description}</p>
                ) : (
                  <p className="italic text-muted-foreground/60">No description available.</p>
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
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Applications</h4>
                <ul className="list-none space-y-2">
                  {product.applications.map((app, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Key Features</h4>
                <ul className="list-none space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 bg-primary/10 rounded-xl">
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
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Product Details</h4>
              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Model Number:</span>
                  <span className="font-mono text-xs sm:text-sm text-foreground">{product.model_number || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Category:</span>
                  <span className="capitalize text-xs sm:text-sm text-foreground">{product.category.replace('_', ' ')}</span>
                </div>
                {product.subcategory && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                    <span className="font-medium text-foreground">Subcategory:</span>
                    <span className="capitalize text-xs sm:text-sm text-foreground">{product.subcategory.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Price:</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-sm sm:text-base">{formatPrice(displayPrice)}</span>
                    {hasVariants && selectedVariant && (
                      <div className="text-xs text-muted-foreground">
                        {selectedVariant.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                  <span className="font-medium text-foreground">Availability:</span>
                  <span className={`flex items-center gap-1 text-xs sm:text-sm ${isInStock ? 'text-green-600' : 'text-orange-600'}`}>
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
                    <span className="font-medium text-foreground">Variants Available:</span>
                    <span className="text-xs sm:text-sm font-medium text-foreground">{product.variants!.length}</span>
                  </div>
                )}
                {product.created_at && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                    <span className="font-medium text-foreground">Added:</span>
                    <span className="text-xs sm:text-sm text-foreground">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {product.specifications && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Specifications</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-muted/30 rounded-xl gap-1">
                      <span className="font-medium text-foreground capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-xs sm:text-sm text-foreground">{formatSpecValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasVariants && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">All Variants</h4>
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
                      <div key={index} className={`p-3 hover:bg-muted/50 transition-colors ${selectedVariant === variant ? 'bg-primary/10' : ''}`}>
                        <div className="grid grid-cols-3 gap-4 items-center text-sm">
                          <span className="font-medium text-foreground">{variant.name}</span>
                          <span className="text-primary font-semibold">{formatPrice(variant.price)}</span>
                          <Badge 
                            className={`w-fit text-xs ${variant.in_stock ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-orange-500/20 border-orange-500/50 text-orange-700'}`}
                          >
                            {variant.in_stock ? 'In Stock' : 'Out of Stock'}
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
          <h4 className="text-base sm:text-lg font-semibold text-foreground mb-4">Resources & Downloads</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {product.brochure_url && (
              <Button className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md" asChild>
                <a href={product.brochure_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Product Brochure</span>
                </a>
              </Button>
            )}
            {product.installation_guide_url && (
              <Button className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md" asChild>
                <a href={product.installation_guide_url} target="_blank" rel="noopener noreferrer">
                  <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Installation Guide</span>
                </a>
              </Button>
            )}
            {product.maintenance_manual_url && (
              <Button className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md" asChild>
                <a href={product.maintenance_manual_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Maintenance Manual</span>
                </a>
              </Button>
            )}
            {product.video_url && (
              <Button className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md" asChild>
                <a href={product.video_url} target="_blank" rel="noopener noreferrer">
                  <Video className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Product Video</span>
                </a>
              </Button>
            )}
            {!product.brochure_url && !product.installation_guide_url && !product.maintenance_manual_url && !product.video_url && (
              <p className="text-sm text-muted-foreground col-span-2 sm:col-span-4">No resources available.</p>
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
              <span className="ml-2 text-xs opacity-75">({selectedVariant.name})</span>
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            className={`flex-1 text-sm ${favorites.includes(product.id) ? 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground' : 'bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground'} rounded-xl shadow-md`}
            onClick={() => toggleFavorite(product.id)}
          >
            {favorites.includes(product.id) ? 'Remove from Favorites' : 'Add to Favorites'}
            <Heart className={`h-4 w-4 ml-2 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
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
      Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
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
            className={`${currentPage === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground'} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
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
          .filter(page => {
            if (totalPages <= 5) return page > 1 && page < totalPages;
            return page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1;
          })
          .map(page => (
            <Button
              key={page}
              className={`${currentPage === page ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground'} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
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
            className={`${currentPage === totalPages ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground'} rounded-xl shadow-md w-8 h-8 flex-shrink-0`}
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
      Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
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
              className={`${currentPage === pageNumber ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground text-foreground'} rounded-xl shadow-md w-10 h-10`}
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
                    <Card key={index} className="animate-pulse bg-background border-border shadow-md">
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
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Error Loading Products</h3>
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main>
        <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
              <Badge className="mb-4 bg-muted text-foreground border-border">
                <Package className="w-4 h-4 mr-2" />
                Product Catalog
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                {category ? getCategoryTitle(category) : <><span className="text-primary">All</span> Products</>}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>

            <div className={`mb-8 sm:mb-12 bg-background shadow-md rounded-xl border border-border p-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border hover:bg-muted/30 rounded-xl text-sm sm:text-base transition-colors"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-background border-border hover:bg-muted/30 rounded-xl text-sm sm:text-base transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="created_at">Date Added</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="px-3 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex border border-border rounded-xl bg-muted/30 overflow-hidden">
                  <Button
                    className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-accent hover:text-accent-foreground'} rounded-l-full`}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-accent hover:text-accent-foreground'} rounded-r-full`}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="sm:hidden bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  className={`${showFeaturedOnly ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border'} hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md text-xs sm:text-sm`}
                  size="sm"
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                >
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Featured
                </Button>

                <Button
                  className={`${showInStockOnly ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border-border'} hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md text-xs sm:text-sm`}
                  size="sm"
                  onClick={() => setShowInStockOnly(!showInStockOnly)}
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  In Stock
                </Button>

                {(searchTerm || showFeaturedOnly || showInStockOnly || subcategoryFilter) && (
                  <Button
                    className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md text-xs sm:text-sm"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {currentProducts.length > 0 ? (
              <div>
                <div className={`grid gap-6 mb-12 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
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
              <div className="text-center py-12 bg-background shadow-md rounded-xl p-6">
                <Package className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Products Found</h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-6">
                  Try adjusting your filters or search terms.
                </p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;