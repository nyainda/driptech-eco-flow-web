import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Package, Star } from "lucide-react";
import ProductTracker from "@/components/Analytics/ProductTracker";
import {
  formatPrice,
  getCategoryTitleFromCategory,
  getProductPath,
} from "@/lib/productUrl";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

export interface ProductCardData {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  category: string;
  images?: string[] | null;
  featured?: boolean | null;
  in_stock?: boolean | null;
  variants?: { name: string; price: number; in_stock: boolean }[] | null;
}

interface ProductCardProps { product: ProductCardData; }

export const ProductCard = ({ product }: ProductCardProps) => {
  const hasVariants = Boolean(product.variants?.length);
  const displayPrice = hasVariants
    ? Math.min(...product.variants!.map((v) => v.price))
    : product.price;
  const priceLabel =
    hasVariants && displayPrice !== null ? `From ${formatPrice(displayPrice)}` : formatPrice(displayPrice);
  const isInStock = hasVariants
    ? product.variants!.some((v) => v.in_stock)
    : Boolean(product.in_stock);
  const path = getProductPath(product);
  const categoryLabel = getCategoryTitleFromCategory(product.category);

  const whatsappMessage = encodeURIComponent(
    `Hi DripTech! I'm interested in ${product.name}${
      displayPrice ? ` listed at ${formatPrice(displayPrice)}` : ""
    }. Please confirm stock and delivery to my location.`,
  );
  const whatsappUrl = `https://wa.me/254723407849?text=${whatsappMessage}`;

  return (
    <ProductTracker productName={product.name} productId={product.id} category={product.category} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden border border-border bg-card transition-colors duration-300 hover:border-primary/50">
        <Link to={path} aria-label={`View ${product.name}`} className="relative block overflow-hidden border-b border-border bg-muted/20">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={600}
              loading="lazy"
              className="aspect-[4/3] w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.035] sm:p-7"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center">
              <Package className="h-14 w-14 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <span className="border border-border bg-card/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground">
              {isInStock ? "In stock" : "Check availability"}
            </span>
            {product.featured && (
              <span className="flex items-center gap-1 border border-accent/30 bg-accent px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-accent-foreground">
                <Star className="h-2.5 w-2.5" fill="currentColor" />
                Featured
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground/80">{categoryLabel}</p>
          <h3 className="mt-1.5 font-heading text-base font-bold leading-snug text-foreground sm:text-lg">
            <Link to={path} className="transition-colors hover:text-primary">{product.name}</Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
            {product.description || "Professional irrigation equipment for dependable field use."}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4 mt-5">
            <p className="font-mono text-base font-bold tracking-tight text-foreground sm:text-lg">{priceLabel}</p>
            <Link
              to={path}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/75"
            >
              View product <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => openTrackedWhatsApp(whatsappUrl, "product card inquiry")}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[hsl(var(--dt-whatsapp)/0.35)] px-3 py-2 text-xs font-bold text-[hsl(var(--dt-whatsapp))] transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.07)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ask about this product
          </button>
        </div>
      </article>
    </ProductTracker>
  );
};

export default ProductCard;
