import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MessageCircle,
  Package,
  Play,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
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

function normaliseSpecs(specs: ProductDetailData["specifications"]) {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    return specs.map((item) => ({
      label: item.name,
      value: item.unit ? `${item.value} ${item.unit}` : item.value,
    }));
  }
  return Object.entries(specs).map(([label, value]) => ({
    label,
    value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
  }));
}

export default function ProductDetailView({ product }: { product: ProductDetailData }) {
  const images = product.images?.filter(Boolean) || [];
  const hasVariants = Boolean(product.variants?.length);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants?.[0] || null,
  );

  const displayPrice = hasVariants
    ? selectedVariant?.price ?? Math.min(...product.variants!.map((item) => item.price))
    : product.price;

  const isInStock = hasVariants
    ? selectedVariant?.in_stock ?? product.variants!.some((item) => item.in_stock)
    : Boolean(product.in_stock);

  const specs = normaliseSpecs(product.specifications);

  const whatsappUrl = useMemo(() => {
    const variant = selectedVariant ? ` — ${selectedVariant.name}` : "";
    const price = displayPrice ? ` (${formatPrice(displayPrice)})` : "";
    return `https://wa.me/254723407849?text=${encodeURIComponent(
      `Hi DripTech! I'm interested in ${product.name}${variant}${price}. Please confirm stock and delivery to my location.`,
    )}`;
  }, [displayPrice, product.name, selectedVariant]);

  const showImage = (index: number) => {
    if (!images.length) return;
    setActiveImage((index + images.length) % images.length);
  };

  const documents = [
    { label: "Brochure", url: product.brochure_url, icon: FileText },
    { label: "Installation guide", url: product.installation_guide_url, icon: Wrench },
    { label: "Maintenance manual", url: product.maintenance_manual_url, icon: FileText },
  ].filter((item) => item.url);

  return (
    <div className="space-y-10 sm:space-y-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/45 shadow-sm">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ${
                isInStock ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border"
              }`}>
                {isInStock ? "In stock" : "Check availability"}
              </span>
            </div>

            <div className="relative flex aspect-square min-h-[320px] items-center justify-center p-8 sm:p-12">
              {images.length ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-contain transition-all duration-300"
                />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/30" />
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => showImage(activeImage - 1)}
                  aria-label="Previous product image"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-card"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => showImage(activeImage + 1)}
                  aria-label="Next product image"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-card"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {images.slice(0, 6).map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => showImage(index)}
                  aria-label={`View product image ${index + 1}`}
                  className={`overflow-hidden rounded-xl border bg-card p-1 transition-all ${
                    activeImage === index ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={src} alt="" className="aspect-square w-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">DripTech irrigation equipment</p>
            <h1 className="mt-2 font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {product.model_number && (
                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-mono text-muted-foreground">
                  Model {product.model_number}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isInStock ? "Ready to order" : "Availability check"}
              </span>
            </div>

            <div className="mt-6 border-y border-border py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Current price</p>
              <p className="mt-1 font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {formatPrice(displayPrice)}
              </p>
              {hasVariants && <p className="mt-1 text-xs text-muted-foreground">Price changes with the selected option.</p>}
            </div>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {product.description || "Professional irrigation equipment for dependable field use."}
            </p>

            {hasVariants && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">Choose option</h2>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{product.variants!.length} options</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {product.variants!.map((variant) => (
                    <button
                      key={variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-3 text-left transition-all ${
                        selectedVariant?.name === variant.name
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-bold text-foreground">{variant.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{formatPrice(variant.price)}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${
                        variant.in_stock ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {variant.in_stock ? "In stock" : "Check"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-2">
              <Button
                size="lg"
                className="h-12 rounded-xl text-sm font-extrabold shadow-sm"
                onClick={() => openTrackedWhatsApp(whatsappUrl, "product detail page")}
              >
                <MessageCircle className="h-5 w-5" />
                Order on WhatsApp
              </Button>
              <p className="text-center text-[10px] font-semibold text-muted-foreground">
                Confirm stock, delivery location and final quotation with our team.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-muted/30">
              <div className="px-2 py-3 text-center">
                <Truck className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[9px] font-bold text-foreground">Delivery</p>
                <p className="text-[8px] text-muted-foreground">Kenya-wide</p>
              </div>
              <div className="px-2 py-3 text-center">
                <ShieldCheck className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[9px] font-bold text-foreground">Support</p>
                <p className="text-[8px] text-muted-foreground">Expert help</p>
              </div>
              <div className="px-2 py-3 text-center">
                <Package className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[9px] font-bold text-foreground">Payment</p>
                <p className="text-[8px] text-muted-foreground">M-Pesa</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {(product.features?.length || specs.length > 0 || product.applications?.length) ? (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Why choose it</p>
            <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">Product overview</h2>
            {product.features?.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.features.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl bg-muted/35 p-3 text-sm leading-6 text-muted-foreground">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {product.applications?.length ? (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-bold text-foreground">Best suited for</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.applications.map((item) => (
                    <span key={item} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {specs.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Technical data</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">Specifications</h2>
              <dl className="mt-5 overflow-hidden rounded-2xl border border-border">
                {specs.map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-border px-4 py-3.5 text-sm last:border-b-0">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      ) : null}

      {(documents.length > 0 || product.video_url) && (
        <section className="rounded-3xl border border-border bg-muted/25 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Technical resources</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">Downloads & product media</h2>
              <p className="mt-1 text-sm text-muted-foreground">Useful documents for selection, installation and maintenance.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map(({ label, url, icon: Icon }) => (
              <Button key={label} asChild variant="outline" className="h-auto justify-start gap-3 rounded-xl bg-card px-4 py-4 text-left">
                <a href={url!} target="_blank" rel="noreferrer">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold">{label}</span>
                  <Download className="ml-auto h-4 w-4 text-muted-foreground" />
                </a>
              </Button>
            ))}
            {product.video_url && (
              <Button asChild variant="outline" className="h-auto justify-start gap-3 rounded-xl bg-card px-4 py-4 text-left">
                <a href={product.video_url} target="_blank" rel="noreferrer">
                  <Play className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold">Watch product video</span>
                </a>
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
