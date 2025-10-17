import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: Array<{ value: string; label: string }>;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 sm:h-11 text-sm sm:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-slate-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 shadow-sm"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full sm:w-[200px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-slate-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 shadow-sm">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductSearch;
