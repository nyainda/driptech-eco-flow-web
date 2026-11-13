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
  Leaf,
  CircleCheck,
  ArrowUpRight,
  Minus,
  Plus,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QuoteModal from "@/components/Home/QuoteModal";
import { openInstantProductQuotePdf } from "@/lib/catalogAndQuotePdf";
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
  const [quantity, setQuantity] = useState(1);
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
  const features = product.features?.filter(Boolean) || [];
  const applications = product.applications?.filter(Boolean) || [];

  const whatsappUrl = useMemo(() => {
    const variant = selectedVariant ? " — " + selectedVariant.name : "";
    const price = displayPrice ? " (" + formatPrice(displayPrice) + " each)" : "";
    const message = "Hi DripTech Eco-Flow! I would like to order " + quantity + " × " + product.name + variant + price + ". Please confirm availability, delivery options and total cost.";
    return "https://wa.me/254723407849?text=" + encodeURIComponent(message);
  }, [displayPrice, product.name, quantity, selectedVariant]);

  const quoteUrl = useMemo(() => {
    const variant = selectedVariant ? " — " + selectedVariant.name : "";
    const message = "Hi DripTech Eco-Flow, please prepare a formal quotation for " + quantity + " × " + product.name + variant + ". Please include the current price, delivery cost and availability.";
    return "https://wa.me/254723407849?text=" + encodeURIComponent(message);
  }, [product.name, quantity, selectedVariant]);

  const showImage = (index: number) => {
    if (!images.length) return;
    setActiveImage((index + images.length) % images.length);
  };

  const documents = [
    { label: "Product brochure", url: product.brochure_url, icon: FileText },
    { label: "Installation guide", url: product.installation_guide_url, icon: Wrench },
    { label: "Maintenance manual", url: product.maintenance_manual_url, icon: FileText },
  ].filter((item) => item.url);

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-8">
        <section aria-label="Product images" className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="absolute left-4 top-4 z-10">
              <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold shadow-sm ${
                isInStock
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground ring-1 ring-border"
              }`}>
                <span className={`h-2 w-2 rounded-full ${isInStock ? "bg-white" : "bg-muted-foreground"}`} />
                {isInStock ? "In stock" : "Check availability"}
              </span>
            </div>

            <div className="relative flex aspect-square min-h-[300px] items-center justify-center p-3 sm:min-h-[420px] sm:p-6 lg:min-h-[480px]">
              {images.length ? (
                <img
                  src={images[activeImage] || images[0]}
                  alt={product.name}
                  className="h-full w-full object-contain object-center transition-opacity duration-300"
                  {...({ fetchpriority: "high" } as Record<string, string>)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                  <Package className="h-20 w-20" />
                  <span className="text-sm">Product image unavailable</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => showImage(activeImage - 1)}
                  aria-label="Previous product image"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md transition hover:border-primary hover:text-primary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => showImage(activeImage + 1)}
                  aria-label="Next product image"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md transition hover:border-primary hover:text-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {images.slice(0, 5).map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => showImage(index)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={`overflow-hidden rounded-xl border bg-card p-1.5 transition-all sm:p-2 ${
                    activeImage === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/60"
                  }`}
                >
                  <img src={src} alt="" className="aspect-square w-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-primary/5 px-4 py-3 text-xs font-semibold text-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Product support</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery options across Kenya</span>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-5 sm:p-7">
              <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-primary">
                <Leaf className="h-4 w-4" /> DripTech Eco-Flow · Irrigation equipment
              </p>
              <h1 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl xl:text-[2.1rem]">
                {product.name}
              </h1>

              {product.description && (
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{product.description}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {product.model_number && (
                  <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-mono text-muted-foreground">
                    Model: {product.model_number}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  isInStock ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <CircleCheck className="h-3.5 w-3.5" />
                  {isInStock ? "Available to order" : "Confirm availability"}
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-primary/5 p-4 sm:p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
                  {hasVariants ? "Price for selected option" : "Current listed price"}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-mono text-3xl font-black tracking-tight text-primary sm:text-4xl">
                    {formatPrice(displayPrice)}
                  </p>
                  {hasVariants && <span className="text-xs text-muted-foreground">Varies by option</span>}
                </div>
                {displayPrice == null && (
                  <p className="mt-1 text-xs text-muted-foreground">Contact our team for a quotation.</p>
                )}
              </div>

              {hasVariants && (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-foreground">Choose an option</h2>
                    <span className="text-xs text-muted-foreground">{product.variants!.length} options</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {product.variants!.map((variant) => (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        aria-pressed={selectedVariant?.name === variant.name}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-3 text-left transition-all ${
                          selectedVariant?.name === variant.name
                            ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-bold text-foreground">{variant.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{formatPrice(variant.price)}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          variant.in_stock ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {variant.in_stock ? "In stock" : "Check stock"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label htmlFor="product-quantity" className="text-sm font-bold text-foreground">Quantity</label>
                    {displayPrice != null && quantity > 1 && (
                      <p className="mt-0.5 text-xs font-semibold text-primary">
                        Subtotal ({quantity} units): <span className="font-mono font-extrabold">{formatPrice(displayPrice * quantity)}</span>
                      </p>
                    )}
                  </div>
                  <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-border bg-background">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      className="flex h-full w-10 items-center justify-center text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span id="product-quantity" aria-live="polite" className="flex h-full min-w-12 items-center justify-center border-x border-border px-3 text-sm font-bold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((current) => Math.min(999, current + 1))}
                      disabled={quantity >= 999}
                      className="flex h-full w-10 items-center justify-center text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                  <Button
                    size="lg"
                    className="h-12 min-h-12 w-full rounded-xl bg-[hsl(var(--dt-whatsapp))] text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                    onClick={() =>
                      openInstantProductQuotePdf({
                        product: {
                          ...product,
                          category: "drip_irrigation",
                        },
                        quantity,
                        selectedVariant,
                        autoPrint: true,
                        alsoOpenWhatsApp: true,
                      })
                    }
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp + Auto PDF Quote
                    <ArrowUpRight className="ml-auto h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-h-12 w-full rounded-xl border-2 border-primary text-sm font-extrabold text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() =>
                      openInstantProductQuotePdf({
                        product: {
                          ...product,
                          category: "drip_irrigation",
                        },
                        quantity,
                        selectedVariant,
                        autoPrint: true,
                        alsoOpenWhatsApp: false,
                      })
                    }
                  >
                    <Download className="mr-2 h-4 w-4 shrink-0" />
                    Download Instant PDF Quote
                  </Button>
                </div>

                <div className="mt-2.5">
                  <QuoteModal
                    trigger={
                      <Button
                        size="default"
                        variant="secondary"
                        className="h-10 w-full rounded-xl border border-border bg-muted/60 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        Request Custom Multi-Item Project BOQ
                      </Button>
                    }
                  />
                </div>

                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                  Clicking <strong>WhatsApp + Auto PDF Quote</strong> generates your official A4 PDF quotation and sends the Quote Ref directly to our WhatsApp desk.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/25">
              <div className="px-2 py-4 text-center">
                <Truck className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 text-xs font-bold text-foreground">Delivery</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Kenya-wide</p>
              </div>
              <div className="px-2 py-4 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 text-xs font-bold text-foreground">Support</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Expert guidance</p>
              </div>
              <div className="px-2 py-4 text-center">
                <Package className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 text-xs font-bold text-foreground">Payment</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">M-Pesa accepted</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {(specs.length > 0 || features.length > 0 || applications.length > 0) && (
        <div className="space-y-4">
          <nav aria-label="Product information sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5">
            {[
              ...(specs.length ? [{ label: "Specifications", href: "#product-specifications" }] : []),
              ...(features.length ? [{ label: "Key features", href: "#product-features" }] : []),
              ...(applications.length ? [{ label: "Applications", href: "#product-applications" }] : []),
              ...(documents.length || product.video_url ? [{ label: "Downloads", href: "#product-resources" }] : []),
            ].map((item) => (
              <a key={item.href} href={item.href} className="shrink-0 rounded-lg px-4 py-3 text-xs font-bold text-muted-foreground transition hover:bg-primary/10 hover:text-primary sm:text-sm">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            {specs.length > 0 && (
              <section id="product-specifications" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Technical data</p>
                    <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">Technical specifications</h2>
                  </div>
                </div>
                <dl className="mt-5 overflow-hidden rounded-xl border border-border">
                  {specs.map(({ label, value }, index) => (
                    <div key={label} className={`grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 px-4 py-3.5 text-sm sm:px-5 ${index % 2 === 0 ? "bg-muted/40" : "bg-card"}`}>
                      <dt className="font-medium text-muted-foreground">{label}</dt>
                      <dd className="break-words font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <div className="grid content-start gap-4">
              {features.length > 0 && (
                <section id="product-features" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Check className="h-5 w-5" /></span>
                    <h2 className="font-heading text-lg font-bold text-foreground">Key features</h2>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {features.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {applications.length > 0 && (
                <section id="product-applications" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Leaf className="h-5 w-5" /></span>
                    <h2 className="font-heading text-lg font-bold text-foreground">Applications</h2>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {applications.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {(documents.length > 0 || product.video_url) && (
        <section id="product-resources" className="scroll-mt-28 rounded-2xl border border-border bg-muted/25 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Product resources</p>
            <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">Downloads & product media</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Technical documents available for this product.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {documents.map(({ label, url, icon: Icon }) => (
              <Button key={label} asChild variant="outline" className="h-auto min-h-14 justify-start gap-3 rounded-xl bg-card px-4 py-4 text-left">
                <a href={url!} target="_blank" rel="noreferrer">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-xs font-bold">{label}</span>
                  <Download className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              </Button>
            ))}
            {product.video_url && (
              <Button asChild variant="outline" className="h-auto min-h-14 justify-start gap-3 rounded-xl bg-card px-4 py-4 text-left">
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
