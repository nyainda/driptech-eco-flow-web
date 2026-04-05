import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, Eye, MessageCircle } from "lucide-react";
import ProductTracker from "@/components/Analytics/ProductTracker";

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
  onVideoPlay,
}: ProductCardProps) => {
  const whatsappUrl = `https://wa.me/254794494515?text=${encodeURIComponent(`Hi DripTech! I'm interested in: ${product.name}. Please share more details and pricing.`)}`;

  return (
    <ProductTracker
      productName={product.name}
      productId={product.id}
      category={categoryName}
    >
      <Card className="group hover:shadow-xl transition-all duration-300 hover:border-primary/20 border overflow-hidden flex flex-col h-full">
        <CardHeader className="p-0 relative">
          <div
            className={`h-40 sm:h-48 ${colors.bg} flex items-center justify-center relative overflow-hidden`}
          >
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <IconComponent
                  className={`h-16 w-16 sm:h-20 sm:w-20 ${colors.color} opacity-70 relative z-10`}
                />
              </div>
            )}

            {/* Floating badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md text-[10px] px-2 py-0.5">
                  <Star className="h-2.5 w-2.5 mr-1" fill="currentColor" />
                  Featured
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-md"
              >
                {categoryName}
              </Badge>
            </div>

            {/* Stock status */}
            <div className="absolute top-3 right-3">
              {product.in_stock ? (
                <Badge className="bg-emerald-500/90 text-white border-0 shadow-md text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  <div className="h-1.5 w-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
                  In Stock
                </Badge>
              ) : (
                <Badge className="bg-red-500/90 text-white border-0 shadow-md text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  <div className="h-1.5 w-1.5 bg-white rounded-full mr-1.5" />
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Video play button */}
            {product.video_url && (
              <div className="absolute bottom-3 right-3">
                <div
                  className="bg-black/75 backdrop-blur-sm rounded-full p-2.5 shadow-lg cursor-pointer hover:bg-black/90 transition-colors"
                  onClick={() => onVideoPlay?.(product.video_url)}
                >
                  <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex-1">
          <CardTitle className="text-sm sm:text-base font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {product.name}
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {product.price && (
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-primary">
                KSh {product.price.toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Inquiry
          </a>
          <Button
            onClick={() => onViewDetails(product)}
            className="w-full rounded-xl text-sm py-2.5 h-auto"
            variant="outline"
          >
            <Eye className="h-3.5 w-3.5 mr-2" />
            View Details
          </Button>
        </CardFooter>
      </Card>
    </ProductTracker>
  );
};
