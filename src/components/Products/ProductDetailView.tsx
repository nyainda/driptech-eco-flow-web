import { useState } from "react";
import { Check, Download, MessageCircle, Package, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { formatPrice } from "@/lib/productUrl";

interface Variant {
  name: string;
  price: number;
  in_stock: boolean;
}

interface Specification {
  name: string;
  value: string;
  unit?: string;
}

export interface ProductDetailData {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  model_number?: string | null;
  images?: string[] | null;
  in_stock?: boolean | null;
  variants?: Variant[] | null;
  features?: string[] | null;
  applications?: string[] | null;
  specifications?: Specification[] | Record<string, unknown> | null;
  brochure_url?: string | null;
  installation_guide_url?: string | null;
  maintenance_manual_url?: string | null;
  video_url?: string | null;
}

/** Normalises specifications, which are stored either as an array of
 * {name, value, unit} objects or (on some older rows) a plain key/value map. */
function normaliseSpecs(specs: ProductDetailData["specifications"]): { label: string; value: string }[] {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    return specs.map((s) => ({ label: s.name, value: s.unit ? `${s.value} ${s.unit}` : s.value }));
  }
  return Object.entries(specs).map(([label, value]) => ({ label, value: String(value) }));
}

/**
 * Simplified product detail layout: image gallery with thumbnails on the
 * left, name/price/stock/variants/CTA on the right, features/specs/
 * applications/resources below. Replaces the previous ProductDetailModal,
 * which packed all of this plus favourites/share/compare controls into one
 * dense block.
 */
export default function ProductDetailView({ product }: { product: ProductDetailData }) {
  const [activeImage, setActiveImage] = useState(0);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    hasVariants ? product.variants![0] : null,
  );

  const displayPrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
  const isInStock = hasVariants
    ? selectedVariant
      ? selectedVariant.in_stock
      : product.variants!.some((v) => v.in_stock)
    : Boolean(product.in_stock);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const specs = normaliseSpecs(product.specifications);

  const documents = [
    ["Brochure", product.brochure_url],
    ["Installation guide", product.installation_guide_url],
    ["Maintenance manual", product.maintenance_manual_url],
  ] as const;
  const hasDocuments = documents.some(([, url]) => url);

  const whatsappMessage = encodeURIComponent(
    `Hi DripTech! I want to order ${product.name}${
      displayPrice ? ` listed at ${formatPrice(displayPrice)}` : ""
    }${selectedVariant ? ` (${selectedVariant.name})` : ""}. Please confirm stock and delivery to my location.`,
  );
  const whatsappUrl = `https://wa.me/254723407849?text=${whatsappMessage}`;

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden border border-border bg-muted/20 p-5 sm:p-8">
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={`${product.name}${activeImage > 0 ? ` — image ${activeImage + 1}` : ""}`}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`overflow-hidden border p-1 transition-colors ${
                    activeImage === index ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={src} alt="" className="aspect-square w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.model_number && (
            <p className="text-sm text-muted-foreground">Model {product.model_number}</p>
          )}
          <p className="mt-4 text-3xl font-bold text-foreground">{formatPrice(displayPrice)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Check className="h-4 w-4" />
            {isInStock ? "Available to order" : "Confirm availability"}
          </p>

          <p className="mt-6 leading-7 text-muted-foreground">
            {product.description || "Professional irrigation equipment for dependable field use."}
          </p>

          {hasVariants && (
            <section className="mt-7">
              <h2 className="font-heading text-lg font-bold text-foreground">Available variants</h2>
              <div className="mt-3 divide-y divide-border border border-border">
                {product.variants!.map((variant) => (
                  <button
                    key={variant.name}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition-colors ${
                      selectedVariant?.name === variant.name ? "bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-foreground">{variant.name}</span>
                    <span className="flex items-center gap-2">
                      <strong className="text-foreground">{formatPrice(variant.price)}</strong>
                      {!variant.in_stock && (
                        <span className="text-xs text-muted-foreground">(check availability)</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <Button
            size="lg"
            className="mt-7 h-12 w-full rounded-none"
            onClick={() => openTrackedWhatsApp(whatsappUrl, "product detail page")}
          >
            <MessageCircle className="h-5 w-5" />
            Order via WhatsApp
          </Button>
        </div>
      </div>

      {/* Features & specifications */}
      {(product.features?.length || specs.length > 0) && (
        <div className="grid gap-8 lg:grid-cols-2">
          {product.features && product.features.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Features</h2>
              <ul className="mt-4 space-y-3">
                {product.features.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {specs.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Specifications</h2>
              <dl className="mt-4 divide-y divide-border border-y border-border">
                {specs.map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}

      {/* Applications & resources */}
      {(product.applications?.length || hasDocuments || product.video_url) && (
        <div className="grid gap-8 lg:grid-cols-2">
          {product.applications && product.applications.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Applications</h2>
              <ul className="mt-4 space-y-3">
                {product.applications.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(hasDocuments || product.video_url) && (
            <section>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Product resources</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {documents.map(([label, url]) =>
                  url ? (
                    <Button key={label} asChild variant="outline">
                      <a href={url} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" />
                        {label}
                      </a>
                    </Button>
                  ) : null,
                )}
                {product.video_url && (
                  <Button asChild variant="outline">
                    <a href={product.video_url} target="_blank" rel="noreferrer">
                      <Play className="h-4 w-4" />
                      Watch video
                    </a>
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
