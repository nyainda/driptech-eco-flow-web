import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Sparkles } from 'lucide-react';
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

interface ProductRecommendationsProps {
  currentProductId?: string;
  currentCategory?: string;
  limit?: number;
}

const ProductRecommendations = ({
  currentProductId,
  currentCategory,
  limit = 4,
}: ProductRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*');

        if (currentProductId) {
          query = query.neq('id', currentProductId);
        }

        if (currentCategory) {
          query = query.eq('category', currentCategory);
        }

        // First try to get featured products
        const { data: featuredData, error: featuredError } = await query
          .eq('featured', true)
          .eq('in_stock', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (featuredError) throw featuredError;

        // If we don't have enough featured products, get more products
        if (!featuredData || featuredData.length < limit) {
          const { data: moreData, error: moreError } = await query
            .eq('in_stock', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

          if (moreError) throw moreError;
          setRecommendations(moreData || []);
        } else {
          setRecommendations(featuredData);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, currentCategory, limit]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square animate-pulse bg-gray-200" />
            <CardContent className="p-4">
              <div className="h-4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold">Recommended for You</h2>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendations.map((product) => (
          <Card
            key={product.id}
            className="group overflow-hidden transition-all hover:shadow-lg"
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.featured && (
                <Badge className="absolute left-1 sm:left-2 top-1 sm:top-2 z-10 bg-yellow-500 text-xs">
                  <Star className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Featured</span>
                </Badge>
              )}
              <OptimizedImage
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449'}
                alt={product.name}
                className="h-full w-full transition-transform group-hover:scale-110"
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
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;
