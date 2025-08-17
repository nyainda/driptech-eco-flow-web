import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
//import Footer from "@components/Layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Heart,
  Share2,
  Wrench,
  FileText,
  Video,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

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
}

const Products = () => {
  const { category } = useParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase.from('products').select('*');
        
        if (category) {
          const categoryMap: { [key: string]: string } = {
            'drip': 'drip_irrigation',
            'sprinklers': 'sprinkler_systems',
            'filtration': 'filtration_systems',
            'controls': 'control_systems',
            'accessories': 'accessories'
          };
          
          const dbCategory = categoryMap[category];
          if (dbCategory) {
            query = query.eq('category', dbCategory as 'drip_irrigation' | 'sprinkler_systems' | 'filtration_systems' | 'control_systems' | 'accessories');
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

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

    if (priceRange) {
      filtered = filtered.filter(product => 
        product.price && product.price >= priceRange[0] && product.price <= priceRange[1]
      );
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
  }, [products, searchTerm, sortBy, sortOrder, showFeaturedOnly, showInStockOnly, subcategoryFilter, priceRange]);

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
    setPriceRange(null);
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

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:shadow-primary/20 dark:bg-gray-800/50 dark:border-gray-700 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg overflow-hidden">
          {product.images && product.images[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
            {product.featured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg text-xs">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.in_stock && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg text-xs">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                In Stock
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-full shadow-lg"
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart 
                className={`h-3 w-3 sm:h-4 sm:w-4 ${favorites.includes(product.id) ? 'fill-current text-red-500' : ''}`} 
              />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-full shadow-lg"
              onClick={() => shareProduct(product)}
            >
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-full shadow-lg">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-2xl pr-8">{product.name}</DialogTitle>
                </DialogHeader>
                <ProductDetailModal product={product} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize text-xs">
                {product.category.replace('_', ' ')}
              </Badge>
              {product.subcategory && (
                <Badge variant="secondary" className="text-xs capitalize">
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
          
          <h3 className="text-lg sm:text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
          
          <div className="text-muted-foreground text-sm leading-relaxed">
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
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="pr-8">{product.name} - Description</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {product.description}
                      </p>
                      
                      {product.applications && product.applications.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Applications</h4>
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
                          <h4 className="font-semibold mb-2 text-sm">Key Features</h4>
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
              {formatPrice(product.price)}
            </div>
            {product.in_stock ? (
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
                <Button className="flex-1 group text-sm">
                  View Details
                  <Eye className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-2xl pr-8">{product.name}</DialogTitle>
                </DialogHeader>
                <ProductDetailModal product={product} />
              </DialogContent>
            </Dialog>
            <div className="flex gap-1 justify-center sm:justify-start">
              {product.brochure_url && (
                <Button variant="outline" size="sm" className="p-2" title="Download Brochure">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {product.video_url && (
                <Button variant="outline" size="sm" className="p-2" title="Watch Video">
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {product.installation_guide_url && (
                <Button variant="outline" size="sm" className="p-2" title="Installation Guide">
                  <Wrench className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects (e.g., { value: "100 M" })
      return value.value || JSON.stringify(value);
    }
    return String(value);
  };

  const ProductDetailModal = ({ product }: { product: Product }) => (
    <div className="space-y-6 sm:space-y-8">
      {product.images && product.images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base sm:text-lg font-semibold">Product Images</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {product.images.map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt={`${product.name} - ${index + 1}`}
                className="w-full h-32 sm:h-48 object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3">Product Description</h4>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {product.description ? (
                <p className="leading-relaxed text-sm sm:text-base">{product.description}</p>
              ) : (
                <p className="italic text-muted-foreground/60">No description available.</p>
              )}
            </div>
          </div>

          {product.applications && product.applications.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3">Applications</h4>
              <ul className="list-none space-y-2">
                {product.applications.map((app, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-secondary/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{app}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3">Key Features</h4>
              <ul className="list-none space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3">Product Details</h4>
            <div className="space-y-2 sm:space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                <span className="font-medium">Model Number:</span>
                <span className="font-mono text-xs sm:text-sm">{product.model_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                <span className="font-medium">Category:</span>
                <span className="capitalize text-xs sm:text-sm">{product.category.replace('_', ' ')}</span>
              </div>
              {product.subcategory && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                  <span className="font-medium">Subcategory:</span>
                  <span className="capitalize text-xs sm:text-sm">{product.subcategory.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                <span className="font-medium">Price:</span>
                <span className="font-bold text-primary text-sm sm:text-base">{formatPrice(product.price)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                <span className="font-medium">Availability:</span>
                <span className={`flex items-center gap-1 text-xs sm:text-sm ${product.in_stock ? 'text-green-600' : 'text-orange-600'}`}>
                  {product.in_stock ? (
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
              {product.created_at && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                  <span className="font-medium">Added:</span>
                  <span className="text-xs sm:text-sm">{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {product.specifications && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3">Specifications</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-secondary/10 rounded-lg gap-1">
                    <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-xs sm:text-sm">{formatSpecValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-base sm:text-lg font-semibold mb-4">Resources & Downloads</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {product.brochure_url && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs" asChild>
              <a href={product.brochure_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Product Brochure</span>
              </a>
            </Button>
          )}
          {product.installation_guide_url && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs" asChild>
              <a href={product.installation_guide_url} target="_blank" rel="noopener noreferrer">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Installation Guide</span>
              </a>
            </Button>
          )}
          {product.maintenance_manual_url && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs" asChild>
              <a href={product.maintenance_manual_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Maintenance Manual</span>
              </a>
            </Button>
          )}
          {product.video_url && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col gap-2 text-xs" asChild>
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

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t">
        <Button className="flex-1 text-sm">
          Request Quote
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button 
          variant={favorites.includes(product.id) ? 'default' : 'outline'} 
          className="flex-1 text-sm"
          onClick={() => toggleFavorite(product.id)}
        >
          {favorites.includes(product.id) ? 'Remove from Favorites' : 'Add to Favorites'}
          <Heart className={`h-4 w-4 ml-2 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
        </Button>
        <Button 
          variant="outline" 
          className="text-sm"
          onClick={() => shareProduct(product)}
        >
          Share
          <Share2 className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const MobilePagination = () => (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-muted-foreground text-center">
        Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1 max-w-xs overflow-x-auto">
          {totalPages > 1 && (
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(1)}
              className="w-8 h-8 flex-shrink-0"
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
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(page)}
                className="w-8 h-8 flex-shrink-0"
              >
                {page}
              </Button>
            ))}
          
          {currentPage < totalPages - 2 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {totalPages > 1 && (
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(totalPages)}
              className="w-8 h-8 flex-shrink-0"
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50"
        >
          <span className="hidden xs:inline">Next</span>
          <ArrowRight className="h-4 w-4 ml-1" />
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
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
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
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(pageNumber)}
                className="w-10 h-10"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20">
          <div className="container mx-auto px-4 py-6 sm:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="h-32 sm:h-48 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-6 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 sm:pt-20">
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="w-fit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Back to Home</span>
                  <span className="xs:hidden">Back</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {category ? getCategoryTitle(category) : 'All Products'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {filteredProducts.length} of {products.length} products
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="hidden sm:flex"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="hidden sm:flex"
              >
                <List className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          <div className={`space-y-4 mb-6 sm:mb-8 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={showFeaturedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className="text-xs sm:text-sm"
              >
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Featured
              </Button>

              <Button
                variant={showInStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowInStockOnly(!showInStockOnly)}
                className="text-xs sm:text-sm"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                In Stock
              </Button>

              {(searchTerm || showFeaturedOnly || showInStockOnly || subcategoryFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {currentProducts.length > 0 ? (
            <div>
              <div className={`grid gap-4 sm:gap-6 ${
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
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg sm:text-xl mb-2">
                No products found matching your criteria.
              </p>
              <p className="text-muted-foreground text-sm mb-4 px-4">
                Try adjusting your filters or search terms.
              </p>
              <Button onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
export default Products;