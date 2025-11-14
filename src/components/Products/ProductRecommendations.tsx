import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Sparkles, Package, Zap } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';

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

  const ProductCard = ({ product }: { product: Product }) => (
    <Card
      className="group overflow-hidden hover:shadow-xl border"
    >
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
          className="h-full w-full object-cover group-hover:scale-110"
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
        <Link to={`/products/${product.category.replace('_', '-')}`}>
          <Button className="mt-3 sm:mt-4 w-full text-xs sm:text-sm h-8 sm:h-10" variant="outline">
            View Details
          </Button>
        </Link>
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

          <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
