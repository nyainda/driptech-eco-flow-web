
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star, Tag, Layers, CheckCircle2, XCircle, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  model_number?: string;
  category: string;
  subcategory?: string;
  description?: string;
  technical_specs?: any;
  price?: number;
  images?: string[];
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  variants?: Array<{
    name: string;
    price: number;
    in_stock: boolean;
  }>;
}

interface ProductListProps {
  products: Product[];
  categories: Array<{ value: string; label: string }>;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  productsPerPage: number;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  categories,
  onEdit,
  onDelete,
  currentPage,
  productsPerPage
}) => {
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  if (products.length === 0) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-200 dark:to-gray-400">
            No products found
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
            Try adjusting your search or filter criteria
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {currentProducts.map((product, index) => {
        let displayPrice = '';
        if (product.variants?.length > 0) {
          const prices = product.variants.map(v => v.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          displayPrice = min === max ? `KSH ${min.toLocaleString()}` : `KSH ${min.toLocaleString()} - ${max.toLocaleString()}`;
        } else if (product.price) {
          displayPrice = `KSH ${product.price.toLocaleString()}`;
        }

        return (
          <Card 
            key={product.id} 
            className="hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg group transform hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg lg:text-xl line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-200 dark:to-gray-400">
                    {product.name}
                  </CardTitle>
                  {product.model_number && (
                    <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                      Model: {product.model_number}
                    </CardDescription>
                  )}
                </div>
                {product.featured && (
                  <div className="relative">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400 fill-current animate-pulse" />
                    <div className="absolute -inset-1 bg-yellow-400 dark:bg-yellow-800 rounded-full opacity-20 animate-ping"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-xs sm:text-sm bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors">
                  {categories.find(c => c.value === product.category)?.label}
                </Badge>
                <Badge 
                  variant={product.in_stock ? "default" : "destructive"}
                  className={`text-xs sm:text-sm ${
                    product.in_stock 
                      ? 'bg-green-100 dark:bg-gray-700 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-gray-600' 
                      : 'bg-red-100 dark:bg-gray-700 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-gray-600'
                  } transition-colors`}
                >
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {product.images && product.images.length > 0 && (
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden mb-3 sm:mb-4 shadow-inner">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-3">
                {product.description || "No description available"}
              </p>
              
              {displayPrice && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                    {displayPrice}
                  </p>
                </div>
              )}

              {/* Enhanced Variants Display */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-3 w-3 text-slate-500 dark:text-gray-400" />
                    <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                      {product.variants.length} Variant{product.variants.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.variants.slice(0, 3).map((variant, vIndex) => (
                      <div 
                        key={vIndex}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          variant.in_stock 
                            ? 'bg-emerald-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-gray-600' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <Tag className="h-2 w-2" />
                        <span>{variant.name}</span>
                        <span className="text-xs opacity-75">
                          KSH {variant.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.variants.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-1 sm:gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-blue-300 dark:border-gray-600 text-blue-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-500 dark:hover:border-gray-500 transition-colors"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-red-300 dark:border-gray-600 text-red-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-500 dark:hover:border-gray-500 transition-colors"
                  onClick={() => onDelete(product.id)}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductList;
