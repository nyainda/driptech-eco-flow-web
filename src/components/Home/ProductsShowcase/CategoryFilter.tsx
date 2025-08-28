
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface CategoryFilterProps {
  categories: Record<string, any[]>;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, onCategorySelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-12">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        onClick={() => onCategorySelect('all')}
        className="relative group"
      >
        <Package className="h-4 w-4 mr-2" />
        All Products
        <Badge variant="secondary" className="ml-2 text-xs">
          {Object.values(categories).reduce((sum, products) => sum + products.length, 0)}
        </Badge>
      </Button>
      
      {Object.entries(categories).map(([category, products]) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          onClick={() => onCategorySelect(category)}
          className="relative group"
        >
          {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
          <Badge variant="secondary" className="ml-2 text-xs">
            {products.length}
          </Badge>
        </Button>
      ))}
    </div>
  );
};
