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
      <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))]">
        <Link to={path} aria-label={`View ${product.name}`} className="relative block overflow-hidden border-b border-border bg-muted/60">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={600}
              loading="lazy"
              className="aspect-[4/3] w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.035] sm:p-5"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center">
              <Package className="h-14 w-14 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className="rounded-full bg-[hsl(var(--dt-green-800))] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white">
              {isInStock ? "In stock" : "Check availability"}
            </span>
            {product.featured && (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[hsl(var(--dt-gold-500))] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[hsl(var(--dt-green-900))]">
                <Star className="h-2.5 w-2.5" fill="currentColor" />
                Featured
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">{categoryLabel}</p>
          <h3 className="mt-1.5 font-heading text-[17px] font-bold leading-snug tracking-tight text-foreground sm:text-lg">
            <Link to={path} className="transition-colors hover:text-primary">{product.name}</Link>
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-muted-foreground sm:text-sm">
            {product.description || "Professional irrigation equipment for dependable field use."}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4 mt-5">
            <p className="font-mono text-base font-black tracking-tight text-foreground sm:text-lg">{priceLabel}</p>
            <Link
              to={path}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View product <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => openTrackedWhatsApp(whatsappUrl, "product card inquiry")}
            className="mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-[hsl(var(--dt-whatsapp))] transition-colors hover:text-[hsl(var(--dt-green-800))]"
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
