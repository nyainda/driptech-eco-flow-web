import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ProductCardProps {
  product: ProductCardData;
}

/**
 * Single shared product card used on the homepage, the products listing page,
 * and related-product recommendations. Deliberately simple: one image, one
 * badge, one price, one call to action -- the card links to the product's own
 * page for everything else (variants, specs, features, applications).
 */
export const ProductCard = ({ product }: ProductCardProps) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const lowestVariantPrice = hasVariants
    ? Math.min(...product.variants!.map((v) => v.price))
    : null;
  const displayPrice = hasVariants ? lowestVariantPrice : product.price;
  const priceLabel = hasVariants && displayPrice !== null
    ? `From ${formatPrice(displayPrice)}`
    : formatPrice(displayPrice);

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
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
        <Link to={path} aria-label={`View ${product.name}`} className="relative block overflow-hidden bg-muted/30">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={600}
              loading="lazy"
              className="aspect-square w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-background shadow-sm backdrop-blur-sm">
            {isInStock ? "In stock" : "Check availability"}
          </span>

          {product.featured && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow-sm">
              <Star className="h-2.5 w-2.5" fill="currentColor" />
              Featured
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-accent-hover">{categoryLabel}</p>
          <h3 className="mt-1 font-heading text-base font-bold leading-snug text-foreground sm:text-lg">
            <Link to={path} className="hover:text-primary transition-colors">
              {product.name}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
            {product.description || "Professional irrigation equipment for dependable field use."}
          </p>

          <div className="mt-auto pt-4">
            <p className="mb-3 text-lg font-bold text-foreground">{priceLabel}</p>
            <div className="grid gap-2">
              <Button asChild variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted">
                <Link to={path}>
                  View product details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                onClick={() => openTrackedWhatsApp(whatsappUrl, "product card inquiry")}
                className="w-full bg-[hsl(var(--dt-whatsapp))] text-white hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </article>
    </ProductTracker>
  );
};

export default ProductCard;
