import { Link } from "react-router-dom";
import { ArrowRight, Check, FileText, Layers, MessageCircle, Package, Scale, Star, Truck } from "lucide-react";
import ProductTracker from "@/components/Analytics/ProductTracker";
import {
  formatPrice,
  getCategoryTitleFromCategory,
  getProductPath,
} from "@/lib/productUrl";
import { openInstantProductQuotePdf } from "@/lib/catalogAndQuotePdf";

export interface ProductCardData {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  model_number?: string | null;
  images?: string[] | null;
  featured?: boolean | null;
  in_stock?: boolean | null;
  features?: string[] | null;
  applications?: string[] | null;
  variants?: { name: string; price: number; in_stock: boolean }[] | null;
}

interface ProductCardProps {
  product: ProductCardData;
  viewMode?: "grid" | "list";
  isCompared?: boolean;
  onToggleCompare?: (product: any) => void;
}

export const ProductCard = ({
  product,
  viewMode = "grid",
  isCompared = false,
  onToggleCompare,
}: ProductCardProps) => {
  const hasVariants = Boolean(product.variants?.length);
  const displayPrice = hasVariants
    ? Math.min(...product.variants!.map((v) => v.price))
    : product.price;
  const priceLabel =
    hasVariants && displayPrice !== null
      ? `From ${formatPrice(displayPrice)}`
      : formatPrice(displayPrice);
  const isInStock = hasVariants
    ? product.variants!.some((v) => v.in_stock)
    : Boolean(product.in_stock);
  const path = getProductPath(product);
  const categoryLabel = getCategoryTitleFromCategory(product.category);
  const highlightTags = (
    product.features?.filter(Boolean).slice(0, 2) ||
    product.applications?.filter(Boolean).slice(0, 2) ||
    []
  );
  const cleanDescription = (
    product.description ||
    "Professional irrigation equipment for dependable field use."
  )
    .replace(/\s+/g, " ")
    .trim();

  const whatsappMessage = encodeURIComponent(
    `Hi DripTech! I'm interested in ${product.name}${
      displayPrice ? ` listed at ${formatPrice(displayPrice)}` : ""
    }. Please confirm stock and delivery to my location.`,
  );
  const whatsappUrl = `https://wa.me/254723407849?text=${whatsappMessage}`;

  const isList = viewMode === "list";

  return (
    <ProductTracker
      productName={product.name}
      productId={product.id}
      category={product.category}
      className="h-full"
    >
      <article
        className={`group flex h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 ${
          isCompared ? "border-primary ring-2 ring-primary/20" : "border-border"
        } ${isList ? "flex-col sm:flex-row" : "flex-col"}`}
      >
        <div
          className={`relative overflow-hidden border-border bg-white dark:bg-muted/30 ${
            isList
              ? "border-b sm:w-64 sm:shrink-0 sm:border-b-0 sm:border-r"
              : "border-b"
          }`}
        >
          <Link to={path} aria-label={`View ${product.name}`} className="block h-full w-full">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                width={600}
                height={600}
                loading="lazy"
                className={`w-full object-cover p-0 transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
                  isList ? "aspect-[4/3] sm:h-full sm:aspect-auto" : "aspect-[4/3]"
                }`}
              />
            ) : (
              <div
                className={`flex w-full items-center justify-center bg-muted/30 ${
                  isList ? "aspect-[4/3] sm:h-full" : "aspect-[4/3]"
                }`}
              >
                <Package className="h-14 w-14 text-muted-foreground/30" />
              </div>
            )}
          </Link>

          <div className="pointer-events-none absolute left-2 top-2 right-2 sm:left-3 sm:top-3 sm:right-3 flex items-start justify-between gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.12em] shadow-sm ${
                isInStock
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/95 text-foreground ring-1 ring-border"
              }`}
            >
              {isInStock ? "In stock" : "On request"}
            </span>
            <div className="flex flex-col items-end gap-1">
              {product.featured && (
                <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.08em] text-accent-foreground shadow-sm">
                  <Star className="h-2.5 w-2.5" fill="currentColor" />
                  <span className="hidden sm:inline">Featured</span>
                </span>
              )}
              {hasVariants && (
                <span className="hidden sm:flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-0.5 text-[9px] font-bold text-foreground shadow-sm ring-1 ring-border">
                  <Layers className="h-2.5 w-2.5 text-primary" />
                  {product.variants!.length} options
                </span>
              )}
            </div>
          </div>

          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare(product);
              }}
              aria-pressed={isCompared}
              title={isCompared ? "Remove from comparison" : "Compare specifications"}
              className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-10 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] sm:text-[10px] font-bold shadow-sm transition-all ${
                isCompared
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/95 text-foreground ring-1 ring-border hover:border-primary hover:text-primary"
              }`}
            >
              {isCompared ? <Check className="h-3 w-3" /> : <Scale className="h-3 w-3" />}
              <span className="hidden sm:inline">{isCompared ? "Comparing" : "Compare"}</span>
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-primary">
                {categoryLabel}
              </p>
              {product.model_number && (
                <span className="hidden sm:inline-block shrink-0 max-w-[96px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground">
                  {product.model_number}
                </span>
              )}
            </div>
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-muted-foreground">
              <Truck className="h-3 w-3 shrink-0 text-primary" />
              <span>Kenya delivery</span>
            </span>
          </div>

          <h3 className="mt-1 sm:mt-1.5 line-clamp-2 min-h-[2rem] sm:min-h-[3.1rem] font-heading text-xs font-bold leading-snug tracking-tight text-foreground sm:text-lg">
            <Link to={path} className="transition-colors hover:text-primary">
              {product.name}
            </Link>
          </h3>

          <div className="hidden sm:block mt-2">
            <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-muted-foreground">
              {cleanDescription}
            </p>
          </div>

          <div className="hidden sm:flex mt-2.5 min-h-[24px] items-center gap-1.5 overflow-hidden">
            {highlightTags.map((tag) => (
              <span
                key={tag}
                className="inline-block max-w-[48%] truncate rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-2.5 sm:pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {hasVariants ? "Starting price" : "Unit price"}
              </p>
              <p className="font-mono text-sm font-black tracking-tight text-foreground sm:text-lg truncate">
                {priceLabel}
              </p>
            </div>
            <Link
              to={path}
              className="inline-flex min-h-8 sm:min-h-9 w-full sm:w-auto shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>View</span>
              <span className="hidden sm:inline">specs</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </div>

          <div className="mt-1.5 sm:mt-2.5 grid grid-cols-2 gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() =>
                openInstantProductQuotePdf({
                  product,
                  quantity: 1,
                  autoPrint: true,
                  alsoOpenWhatsApp: true,
                })
              }
              className="inline-flex min-h-8 sm:min-h-10 items-center justify-center gap-1 rounded-lg border border-[hsl(var(--dt-whatsapp)/0.3)] bg-[hsl(var(--dt-whatsapp)/0.08)] px-1 sm:px-2 py-1 text-[9px] sm:text-[10px] font-extrabold text-[hsl(var(--dt-whatsapp))] transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.16)]"
              title="Generates an automatic PDF quote and opens WhatsApp with the quote reference"
            >
              <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">WhatsApp</span>
              <span className="hidden sm:inline">WhatsApp + PDF Quote</span>
            </button>
            <button
              type="button"
              onClick={() =>
                openInstantProductQuotePdf({
                  product,
                  quantity: 1,
                  autoPrint: true,
                  alsoOpenWhatsApp: false,
                })
              }
              className="inline-flex min-h-8 sm:min-h-10 items-center justify-center gap-1 rounded-lg border border-primary/25 bg-primary/5 px-1 sm:px-2 py-1 text-[9px] sm:text-[10px] font-extrabold text-primary transition-colors hover:bg-primary/15"
              title="Download an instant official PDF quotation for this product"
            >
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">PDF</span>
              <span className="hidden sm:inline">Instant PDF Quote</span>
            </button>
          </div>
        </div>
      </article>
    </ProductTracker>
  );
};

export default ProductCard;
