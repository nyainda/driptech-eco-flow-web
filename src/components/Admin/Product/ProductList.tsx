import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Copy,
  Edit,
  ExternalLink,
  ImageOff,
  ImagePlus,
  Layers,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import ImagePickerDialog from "./ImagePickerDialog";
import {
  Product,
  ProductCategory,
  ProductViewMode,
  getProductCategoryLabel,
} from "@/types/Product";
import { getProductPath } from "@/lib/productUrl";

interface ProductListProps {
  products: Product[];
  categories: ProductCategory[];
  viewMode: ProductViewMode;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAllPage: (pageIds: string[]) => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onToggleStock: (product: Product) => void;
  onToggleFeatured: (product: Product) => void;
  onImagesUpdated?: () => void;
  togglingIds?: Set<string>;
  currentPage: number;
  productsPerPage: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddProduct: () => void;
}

function getPriceSummary(product: Product): {
  label: string;
  hasPrice: boolean;
} {
  if (product.variants && product.variants.length > 0) {
    const validPrices = product.variants
      .map((v) => Number(v.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (validPrices.length > 0) {
      const min = Math.min(...validPrices);
      const max = Math.max(...validPrices);
      return {
        label:
          min === max
            ? `KSh ${min.toLocaleString()}`
            : `KSh ${min.toLocaleString()} – ${max.toLocaleString()}`,
        hasPrice: true,
      };
    }
  }
  if (product.price !== null && product.price !== undefined && Number(product.price) > 0) {
    return {
      label: `KSh ${Number(product.price).toLocaleString()}`,
      hasPrice: true,
    };
  }
  return { label: "Price unset", hasPrice: false };
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  viewMode,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllPage,
  onEdit,
  onDuplicate,
  onDelete,
  onApprove,
  onReject,
  onToggleStock,
  onToggleFeatured,
  onImagesUpdated,
  togglingIds,
  currentPage,
  productsPerPage,
  hasActiveFilters,
  onClearFilters,
  onAddProduct,
}) => {
  const [imagePickerFor, setImagePickerFor] = useState<Product | null>(null);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const currentPageIds = currentProducts.map((p) => p.id);
  const allPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  if (products.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {hasActiveFilters ? "No matching products" : "No products in your catalog yet"}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {hasActiveFilters
              ? "No products match your current search, category, or status filter."
              : "Add your first irrigation product manually, import a JSON catalog, or run the catalog seeder."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={onClearFilters}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset filters
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onAddProduct}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add First Product
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={() => onToggleSelectAllPage(currentPageIds)}
                      aria-label="Select all products on this page"
                    />
                  </TableHead>
                  <TableHead className="min-w-[260px]">Product</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[155px]">Category</TableHead>
                  <TableHead className="min-w-[140px]">Price & Variants</TableHead>
                  <TableHead className="hidden lg:table-cell w-[110px]">Media</TableHead>
                  <TableHead className="w-[130px]">Visibility</TableHead>
                  <TableHead className="hidden sm:table-cell w-[80px] text-center">Featured</TableHead>
                  <TableHead className="text-right min-w-[190px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => {
                  const selected = selectedIds.includes(product.id);
                  const isBusy = togglingIds?.has(product.id) ?? false;
                  const imageCount = product.images?.length || 0;
                  const primaryImage = imageCount > 0 ? product.images![0] : "";
                  const categoryLabel = getProductCategoryLabel(product.category);
                  const priceInfo = getPriceSummary(product);
                  const liveUrl = getProductPath(product);

                  return (
                    <TableRow
                      key={product.id}
                      className={selected ? "bg-emerald-500/[0.04]" : undefined}
                    >
                      <TableCell className="px-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => onToggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <button
                              type="button"
                              onClick={() => setImagePickerFor(product)}
                              title="Manage or find photos"
                              className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              <img
                                src={primaryImage}
                                alt={product.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setImagePickerFor(product)}
                              title="Find real product photo"
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 transition-colors"
                            >
                              <ImagePlus className="h-4 w-4" />
                            </button>
                          )}

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              className="text-left font-medium text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                            >
                              {product.name}
                            </button>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              {product.model_number && (
                                <span className="font-mono text-[11px] text-foreground/80">
                                  {product.model_number}
                                </span>
                              )}
                              {product.subcategory && (
                                <span className="truncate max-w-[180px]">
                                  {product.subcategory}
                                </span>
                              )}
                              <span className="md:hidden text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                {categoryLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal text-xs">
                          {categoryLabel}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p
                            className={`text-sm font-semibold ${
                              priceInfo.hasPrice
                                ? "text-foreground"
                                : "text-muted-foreground font-normal text-xs"
                            }`}
                          >
                            {priceInfo.label}
                          </p>
                          {product.variants && product.variants.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                              <Layers className="h-3 w-3" />
                              {product.variants.length} variant
                              {product.variants.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {imageCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setImagePickerFor(product)}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-foreground hover:bg-muted transition-colors"
                          >
                            {imageCount} photo{imageCount === 1 ? "" : "s"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setImagePickerFor(product)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                          >
                            <ImagePlus className="h-3 w-3" />
                            Add photo
                          </button>
                        )}
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggleStock(product)}
                          title="Click to toggle live stock status"
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                            product.in_stock
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : product.in_stock ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {product.in_stock ? "In Stock" : "Hidden"}
                        </button>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-center">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggleFeatured(product)}
                          title={
                            product.featured
                              ? "Remove from featured"
                              : "Mark as featured"
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              product.featured
                                ? "fill-amber-400 text-amber-500"
                                : "text-muted-foreground/50 hover:text-amber-500"
                            }`}
                          />
                        </button>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!product.in_stock && onApprove && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => onApprove(product.id)}
                              className="h-8 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                              title="Approve and publish to website"
                            >
                              Approve
                            </Button>
                          )}
                          {!product.in_stock && onReject && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => onReject(product.id)}
                              className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                              title="Reject and remove pending product"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setImagePickerFor(product)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Find real photo"
                          >
                            <ImagePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View public product page"
                          >
                            <a href={liveUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => onDuplicate(product)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Duplicate product"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => onEdit(product)}
                            className="h-8 w-8 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => onDelete(product.id)}
                            className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={allPageSelected}
                onCheckedChange={() => onToggleSelectAllPage(currentPageIds)}
              />
              Select all {currentPageIds.length} products on this page
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {currentProducts.map((product) => {
              const selected = selectedIds.includes(product.id);
              const isBusy = togglingIds?.has(product.id) ?? false;
              const imageCount = product.images?.length || 0;
              const primaryImage = imageCount > 0 ? product.images![0] : "";
              const categoryLabel = getProductCategoryLabel(product.category);
              const priceInfo = getPriceSummary(product);
              const liveUrl = getProductPath(product);

              return (
                <Card
                  key={product.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md ${
                    selected
                      ? "border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-border/80 hover:border-emerald-500/40"
                  }`}
                >
                  {/* Uniform 16:10 Media Header */}
                  <div className="relative aspect-[16/10] bg-muted/60 overflow-hidden border-b border-border/60">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
                        <ImageOff className="h-7 w-7 text-muted-foreground/50" />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setImagePickerFor(product)}
                          className="h-7 rounded-full border-amber-500/40 bg-amber-500/10 px-3 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                        >
                          <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                          Find real photo
                        </Button>
                      </div>
                    )}

                    {/* Top-left Select & Category */}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 backdrop-blur-sm shadow-sm">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => onToggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </div>
                      <Badge className="bg-background/90 text-foreground hover:bg-background/90 backdrop-blur-sm border border-border/60 text-[11px] font-medium shadow-sm">
                        {categoryLabel}
                      </Badge>
                    </div>

                    {/* Top-right Photo Count & Featured */}
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {imageCount > 0 && (
                        <span className="rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          {imageCount} photo{imageCount === 1 ? "" : "s"}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleFeatured(product)}
                        title={
                          product.featured
                            ? "Remove featured badge"
                            : "Feature this product"
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border/60 shadow-sm hover:bg-background transition-colors"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            product.featured
                              ? "fill-amber-400 text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 line-clamp-2 transition-colors"
                        >
                          {product.name}
                        </button>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {product.model_number ? `SKU: ${product.model_number}` : "No SKU"}
                          {product.subcategory ? ` • ${product.subcategory}` : ""}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {product.description?.trim() || "No product description added yet."}
                    </p>

                    {/* Price & Status Row */}
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div>
                        <p
                          className={`text-base font-bold ${
                            priceInfo.hasPrice
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground text-xs font-medium"
                          }`}
                        >
                          {priceInfo.label}
                        </p>
                        {product.variants && product.variants.length > 0 && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            {product.variants.length} variant
                            {product.variants.length === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleStock(product)}
                        title="Toggle stock visibility"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                          product.in_stock
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : product.in_stock ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {product.in_stock ? "In Stock" : "Hidden"}
                      </button>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        {!product.in_stock && onApprove && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onApprove(product.id)}
                            className="h-7 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                          >
                            Approve
                          </Button>
                        )}
                        {!product.in_stock && onReject && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(product.id)}
                            className="h-7 px-2 text-xs"
                          >
                            Reject
                          </Button>
                        )}
                        {product.in_stock && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <a href={liveUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setImagePickerFor(product)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Find real photo"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onDuplicate(product)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Duplicate product"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(product)}
                          className="h-7 w-7 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                          title="Edit product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(product.id)}
                          className="h-7 w-7 text-rose-600 hover:bg-rose-500/10"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {imagePickerFor && (
        <ImagePickerDialog
          open={!!imagePickerFor}
          onOpenChange={(open) => !open && setImagePickerFor(null)}
          productId={imagePickerFor.id}
          productName={imagePickerFor.name}
          existingImages={imagePickerFor.images}
          onSaved={onImagesUpdated}
        />
      )}
    </>
  );
};

export default ProductList;
