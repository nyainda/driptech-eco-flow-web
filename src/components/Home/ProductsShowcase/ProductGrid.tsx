import { ProductCard } from "./ProductCard";
import { getApplicationIcon } from "../../../utils/iconUtils";
import { getCategoryColors } from "../../../utils/categoryUtils";

interface ProductGridProps {
  products: any[];
  filteredProducts: any[];
  onViewDetails: (product: any) => void;
  onVideoPlay?: (videoUrl: string) => void;
}

export const ProductGrid = ({
  products,
  filteredProducts,
  onViewDetails,
  onVideoPlay,
}: ProductGridProps) => {
  const categories = products.reduce(
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {filteredProducts.map((product) => {
        const categoryName =
          product.category?.charAt(0).toUpperCase() +
            product.category?.slice(1).replace("_", " ") || "Uncategorized";
        const colors = getCategoryColors(product.category);
        const IconComponent = getApplicationIcon(
          product.applications?.join(", ") || "",
        );

        return (
          <ProductCard
            key={product.id}
            product={product}
            categoryName={categoryName}
            colors={colors}
            IconComponent={IconComponent}
            onViewDetails={onViewDetails}
            onVideoPlay={onVideoPlay}
          />
        );
      })}
    </div>
  );
};
