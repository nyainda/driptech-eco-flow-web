import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Sparkles, Package, Zap, Eye, CheckCircle, Download, Play, Wrench, FileText, Video, Truck } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import AutoRotatingGallery from '@/components/Products/AutoRotatingGallery';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string;
  subcategory: string | null;
  images: string[] | null;
  featured: boolean | null;
  in_stock: boolean | null;
}

interface ScoredProduct extends Product {
  score: number;
}

interface ProductRecommendationsProps {
  currentProductId?: string;
  currentCategory?: string;
  currentSubcategory?: string;
  currentPrice?: number;
  limit?: number;
  showComplementary?: boolean;
}

const ProductRecommendations = ({
  currentProductId,
  currentCategory,
  currentSubcategory,
  currentPrice,
  limit = 4,
  showComplementary = true,
}: ProductRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('in_stock', true);

        if (currentProductId) {
          query = query.neq('id', currentProductId);
        }

        const { data: allProducts, error } = await query;
        
        if (error) throw error;
        if (!allProducts || allProducts.length === 0) {
          setRecommendations([]);
          setComplementaryProducts([]);
          setLoading(false);
          return;
        }

        // Smart scoring algorithm for recommendations
        const scoredProducts: ScoredProduct[] = allProducts.map(product => {
          let score = 0;

          // 1. Same subcategory gets highest priority (40 points)
          if (currentSubcategory && product.subcategory === currentSubcategory) {
            score += 40;
          }
          
          // 2. Same category (20 points)
          if (currentCategory && product.category === currentCategory) {
            score += 20;
          }

          // 3. Similar price range (20 points)
          if (currentPrice && product.price) {
            const priceDiff = Math.abs(product.price - currentPrice);
            const priceRange = currentPrice * 0.3; // 30% range
            if (priceDiff <= priceRange) {
              const similarity = 1 - (priceDiff / priceRange);
              score += similarity * 20;
            }
          }

          // 4. Featured products (15 points)
          if (product.featured) {
            score += 15;
          }

          // 5. Small boost for recent products (5 points)
          score += 5;

          return { ...product, score };
        });

        // Sort by score and get top recommendations
        const topRecommendations = scoredProducts
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        setRecommendations(topRecommendations);

        // Get complementary products (accessories)
        if (showComplementary && currentCategory !== 'accessories') {
          const accessories = allProducts.filter(
            product => 
              product.category === 'accessories' &&
              product.id !== currentProductId
          ).slice(0, 3);
          
          setComplementaryProducts(accessories);
        }

      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, currentCategory, currentSubcategory, currentPrice, limit, showComplementary]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square animate-pulse bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0 && complementaryProducts.length === 0) {
    return null;
  }

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object" && value !== null) {
      return value.value || JSON.stringify(value);
    }
    return String(value);
  };

  const ProductDetailModal = ({ product }: { product: Product }) => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {product.images && product.images.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-semibold text-foreground">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                Product Description
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>

            {product.applications && product.applications.length > 0 && (
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  Applications
                </h4>
                <ul className="list-none space-y-1">
                  {product.applications.map((app, index) => (
                    <li key={index} className="flex items-center gap-2 p-1.5 sm:p-2 bg-muted/30 rounded-lg text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  Key Features
                </h4>
                <ul className="list-none space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 p-1.5 sm:p-2 bg-primary/10 rounded-lg text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                Product Details
              </h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                  <span className="font-medium text-foreground">Model Number:</span>
                  <span className="font-mono text-foreground">{product.model_number || "N/A"}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                  <span className="font-medium text-foreground">Category:</span>
                  <span className="capitalize text-foreground">{product.category.replace("_", " ")}</span>
                </div>
                {product.subcategory && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                    <span className="font-medium text-foreground">Subcategory:</span>
                    <span className="capitalize text-foreground">{product.subcategory.replace("_", " ")}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                  <span className="font-medium text-foreground">Price:</span>
                  <span className="font-bold text-primary text-sm sm:text-base">
                    {product.price ? `KES ${product.price.toLocaleString()}` : "Price on request"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                  <span className="font-medium text-foreground">Availability:</span>
                  <span className={`flex items-center gap-1 text-xs sm:text-sm ${product.in_stock ? "text-green-600" : "text-orange-600"}`}>
                    {product.in_stock ? (
                      <>
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        In Stock
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                        Contact for availability
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {product.specifications && (
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  Specifications
                </h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1.5 sm:p-2 bg-muted/30 rounded-lg gap-1">
                      <span className="font-medium text-foreground capitalize">{key.replace("_", " ")}:</span>
                      <span className="text-foreground">{formatSpecValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(product.brochure_url || product.installation_guide_url || product.maintenance_manual_url || product.video_url) && (
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-foreground mb-3">
              Resources & Downloads
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {product.brochure_url && (
                <Button className="h-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-lg" asChild>
                  <a href={product.brochure_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Brochure</span>
                  </a>
                </Button>
              )}
              {product.installation_guide_url && (
                <Button className="h-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-lg" asChild>
                  <a href={product.installation_guide_url} target="_blank" rel="noopener noreferrer">
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Install Guide</span>
                  </a>
                </Button>
              )}
              {product.maintenance_manual_url && (
                <Button className="h-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-lg" asChild>
                  <a href={product.maintenance_manual_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Maintenance</span>
                  </a>
                </Button>
              )}
              {product.video_url && (
                <Button className="h-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 text-xs bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-lg" asChild>
                  <a href={product.video_url} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Video</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border">
          <Link to={`/products/${product.category.replace('_', '-')}`} className="flex-1">
            <Button className="w-full text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">
              View Full Details
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group overflow-hidden hover:shadow-xl border transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.featured && (
          <Badge className="absolute left-1 sm:left-2 top-1 sm:top-2 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs shadow-lg">
            <Star className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
            <span className="hidden sm:inline">Featured</span>
          </Badge>
        )}
        <OptimizedImage
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449'}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
          fill
        />
      </div>

      <CardContent className="p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 sm:mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        {product.price && (
          <p className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-primary">
            KES {product.price.toLocaleString()}
          </p>
        )}
        <div className="flex gap-2 mt-3 sm:mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-10" variant="outline">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-xl pr-8 text-foreground">
                  {product.name}
                </DialogTitle>
              </DialogHeader>
              <ProductDetailModal product={product} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 sm:space-y-12">
      {recommendations.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">You May Also Like</h2>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {complementaryProducts.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-bold">Complete Your Setup</h2>
            <Badge variant="secondary" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              Accessories
            </Badge>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
            {complementaryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;
