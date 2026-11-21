import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  ProductCategory,
  ProductSortOption,
  ProductStatusFilter,
  ProductViewMode,
} from "@/types/Product";

interface StatusCounts {
  all: number;
  in_stock: number;
  out_of_stock: number;
  missing_photos: number;
  featured: number;
  with_variants: number;
  unpriced: number;
}

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: ProductCategory[];
  categoryCounts?: Record<string, number>;
  statusFilter: ProductStatusFilter;
  setStatusFilter: (status: ProductStatusFilter) => void;
  statusCounts: StatusCounts;
  sortBy: ProductSortOption;
  setSortBy: (sort: ProductSortOption) => void;
  viewMode: ProductViewMode;
  setViewMode: (mode: ProductViewMode) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  matchingCount: number;
  onResetFilters: () => void;
}

const STATUS_TABS: Array<{ id: ProductStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In Stock" },
  { id: "out_of_stock", label: "Pending / Hidden" },
  { id: "missing_photos", label: "Missing Photos" },
  { id: "featured", label: "Featured" },
  { id: "with_variants", label: "Variants" },
  { id: "unpriced", label: "Unpriced" },
];

const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  categoryCounts = {},
  statusFilter,
  setStatusFilter,
  statusCounts,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  itemsPerPage,
  setItemsPerPage,
  matchingCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "newest";

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm space-y-3.5">
      {/* Row 1: Search, Category, Sort, Page Size, View Switcher */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, model number, subcategory, or keyword…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 h-10 bg-background border-border/80 focus-visible:ring-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10 w-full sm:w-[215px] bg-background border-border/80">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">
                All Categories ({statusCounts.all})
              </SelectItem>
              {categories.map((cat) => {
                const count = categoryCounts[cat.value] || 0;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as ProductSortOption)}
          >
            <SelectTrigger className="h-10 w-full sm:w-[190px] bg-background border-border/80">
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="name_asc">Name (A → Z)</SelectItem>
              <SelectItem value="price_asc">Price (Low → High)</SelectItem>
              <SelectItem value="price_desc">Price (High → Low)</SelectItem>
              <SelectItem value="missing_photos">Missing photos first</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="h-10 w-[108px] bg-background border-border/80 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 / page</SelectItem>
              <SelectItem value="24">24 / page</SelectItem>
              <SelectItem value="48">48 / page</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="inline-flex h-10 items-center rounded-lg border border-border/80 bg-muted/40 p-1 shrink-0"
            role="group"
            aria-label="Catalog view mode"
          >
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-8 px-2.5 text-xs ${
                viewMode === "table"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-none"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Compact table view"
            >
              <List className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 px-2.5 text-xs ${
                viewMode === "grid"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-none"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2: Quick Status Chips & Match Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.id;
            const count = statusCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  active
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <Badge
                  variant="secondary"
                  className={`h-4 px-1.5 text-[10px] font-semibold ${
                    active
                      ? "bg-white/20 text-white hover:bg-white/20"
                      : "bg-background text-foreground"
                  }`}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span>
            <strong className="text-foreground">{matchingCount}</strong>{" "}
            matching
          </span>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
