
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, Eye, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: any;
  categoryName: string;
  colors: { bg: string; color: string };
  IconComponent: any;
  onViewDetails: (product: any) => void;
  onVideoPlay?: (videoUrl: string) => void;
}

export const ProductCard = ({ 
  product, 
  categoryName, 
  colors, 
  IconComponent, 
  onViewDetails,
  onVideoPlay 
}: ProductCardProps) => {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-2 hover:border-primary/20 overflow-hidden">
      <CardHeader className="p-0 relative">
        <div className={`h-48 ${colors.bg} flex items-center justify-center relative overflow-hidden`}>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <IconComponent className={`h-20 w-20 ${colors.color} opacity-70 relative z-10`} />
            </div>
          )}
          
          {/* Floating badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.featured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1" fill="currentColor" />
                Featured
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-lg">
              {categoryName}
            </Badge>
          </div>

          {/* Stock status with animated dot */}
          <div className="absolute top-4 right-4">
            {product.in_stock ? (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg backdrop-blur-sm">
                <div className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse" />
                In Stock
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg backdrop-blur-sm">
                <div className="h-2 w-2 bg-white rounded-full mr-2" />
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Video indicator with glow effect */}
          {product.video_url && (
            <div className="absolute bottom-4 right-4">
              <div 
                className="bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-white/25 transition-shadow duration-300 cursor-pointer"
                onClick={() => onVideoPlay?.(product.video_url)}
              >
                <Play className="h-4 w-4 text-white" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <CardTitle className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </CardTitle>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {product.description}
        </p>
        
        {product.price && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-primary">
              KES {product.price.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button 
          onClick={() => onViewDetails(product)} 
          className="flex-1"
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button 
          className="flex-1"
          disabled={!product.in_stock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.in_stock ? 'Add to Quote' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
};
