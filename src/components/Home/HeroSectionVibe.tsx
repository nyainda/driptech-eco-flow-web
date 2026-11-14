import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Droplets,
  FileText,
  Gauge,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Sprout,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dataService } from "@/services/dataService";
import QuoteModal from "@/components/Home/QuoteModal";
import { formatPrice, getProductPath } from "@/lib/productUrl";

interface HeroProduct {
  id: string;
  name: string;
  category: string;
  price?: number | null;
  in_stock?: boolean | null;
  images: string[] | null;
}

const heroProductCategories = [
  {
    category: "drip_irrigation",
    label: "Drip lines & tape",
    href: "/products/drip",
  },
  {
    category: "sprinkler_systems",
    label: "Sprinklers",
    href: "/products/sprinklers",
  },
  {
    category: "pumps_motors",
    label: "Pumps & solar",
    href: "/products/pumps",
  },
  {
    category: "filtration_systems",
    label: "Disc & screen filters",
    href: "/products/filtration",
  },
];

const shopPaths = [
  {
    label: "Drip Irrigation",
    detail: "15cm, 20cm & 30cm rolls",
    href: "/products/drip",
    icon: Droplets,
  },
  {
    label: "Complete Kits",
    detail: "⅛, ¼, ½ & 1+ Acre packages",
    href: "/irrigation-kits",
    icon: Package,
  },
  {
    label: "Pumps & Solar",
    detail: "Borehole, surface & solar",
    href: "/products/pumps",
    icon: Wrench,
  },
  {
    label: "Sprinklers",
    detail: "Impact, pop-up & rain guns",
    href: "/products/sprinklers",
    icon: Gauge,
  },
];

const CROP_PRESETS = [
  {
    id: "tomatoes",
    label: "Tomatoes & Capsicum",
    spacing: "20cm or 30cm emitter spacing",
    layout: "2 drip lines per 1m raised bed",
    filtration: "120-mesh disc filter + venturi injector",
    guideHref: "/drip-irrigation-for-tomatoes-kenya",
  },
  {
    id: "onions",
    label: "Onions & Garlic",
    spacing: "15cm close emitter spacing",
    layout: "3 to 4 drip lines per bed (high density)",
    filtration: "High-flow screen/disc headworks",
    guideHref: "/drip-irrigation-for-onions-kenya",
  },
  {
    id: "avocado",
    label: "Avocado & Fruit Orchards",
    spacing: "Button drippers (4–8 L/hr) or PC line",
    layout: "1 to 2 lateral lines per tree row",
    filtration: "Pressure-compensated zoning for slopes",
    guideHref: "/drip-irrigation-for-avocado-kenya",
  },
  {
    id: "greenhouse",
    label: "Greenhouse Production",
    spacing: "15cm / 20cm drip tape + misting",
    layout: "Multi-bed manifold with fertigation kit",
    filtration: "Complete headworks + elevated tank",
    guideHref: "/greenhouse-irrigation-systems-kenya",
  },
  {
    id: "vegetables",
    label: "Cabbage, Kales & Melons",
    spacing: "20cm or 30cm turbulent dripline",
    layout: "2 lines per bed with mainline hydrants",
    filtration: "Standard disc filtration + gate valves",
    guideHref: "/drip-irrigation-for-cabbage-kenya",
  },
] as const;

const ACREAGE_OPTIONS = [
  { id: "0.25", label: "¼ Acre", blocks: "1–2 irrigation blocks" },
  { id: "0.5", label: "½ Acre", blocks: "2–3 irrigation blocks" },
  { id: "1", label: "1 Acre", blocks: "4 zoned blocks + mainline" },
  { id: "5+", label: "5+ Acres Commercial", blocks: "Engineered hydraulic BOQ" },
] as const;

export default function HeroSectionVibe() {
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>([]);
  const [selectedAcreage, setSelectedAcreage] = useState<string>("1");
  const [selectedCropId, setSelectedCropId] = useState<string>("tomatoes");
  const [panelTab, setPanelTab] = useState<"advisor" | "catalogue">("catalogue");

  useEffect(() => {
    let cancelled = false;

    const loadHeroProducts = async () => {
      try {
        const results = await Promise.all(
          heroProductCategories.map(({ category }) =>
            dataService.getProducts({ category, inStock: true, limit: 6 }),
          ),
        );

        const products = results.flatMap((result, index) => {
          const category = heroProductCategories[index].category;
          const rows = Array.isArray(result) ? result : [];
          const withImages = rows.filter(
            (product: HeroProduct) =>
              Array.isArray(product.images) &&
              product.images.some(
                (image) => typeof image === "string" && image.trim(),
              ),
          );
          const featured = withImages.find((product: any) => product.featured);
          const selected = featured || withImages[0];
          return selected ? [{ ...selected, category }] : [];
        });

        if (!cancelled) setHeroProducts(products);
      } catch (error) {
        console.error("Failed to load homepage hero products:", error);
      }
    };

    loadHeroProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCrop =
    CROP_PRESETS.find((c) => c.id === selectedCropId) || CROP_PRESETS[0];
  const activeAcreage =
    ACREAGE_OPTIONS.find((a) => a.id === selectedAcreage) || ACREAGE_OPTIONS[2];

  const advisorWhatsAppUrl =
    "https://wa.me/254723407849?text=" +
    encodeURIComponent(
      `Hi DripTech EcoFlow, I would like an irrigation quote/BOQ for a ${activeAcreage.label} farm growing ${activeCrop.label} (recommended: ${activeCrop.spacing}). Please advise on pricing and requirements.`,
    );

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-background"
      aria-labelledby="home-hero-title"
    >
      <div className="dt-container relative py-3 sm:py-6 lg:py-8">
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-border bg-card shadow-lg">
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="/hero-bg-new-mobile.webp"
            />
            <source
              media="(max-width: 1024px)"
              srcSet="/hero-bg-new-tablet.webp"
            />
            <img
              src="/hero-bg-new-desktop.webp"
              alt="Precision drip-irrigated crop rows on a Kenyan commercial farm"
              className="absolute inset-0 h-full w-full object-cover"
              {...({ fetchpriority: "high" } as Record<string, string>)}
              decoding="async"
              width="1920"
              height="1080"
            />
          </picture>

          {/* Rich multi-stop gradient overlay for legibility in light & dark mode */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/92 to-background/80 lg:bg-gradient-to-r lg:from-background/95 lg:via-background/90 lg:via-58% lg:to-background/35 dark:from-background/95 dark:via-background/90 dark:to-background/45" />

          <div className="relative grid gap-5 px-3.5 py-4 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:gap-10 lg:px-10 lg:py-12 xl:px-12">
            {/* Left Column: Value Proposition & Direct CTAs */}
            <div className="min-w-0 max-w-2xl">
              <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] sm:px-3.5 sm:py-1.5 sm:text-xs font-extrabold text-primary backdrop-blur-sm mb-2.5 sm:mb-4">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Kenya's Factory-Direct Irrigation Store • 47 Counties</span>
              </div>

              <h1
                id="home-hero-title"
                className="font-heading text-[26px] font-bold leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[54px] xl:text-6xl"
              >
                Precision Irrigation{" "}
                <span className="text-primary block mt-0.5 sm:mt-1">
                  Built for Kenyan Farms.
                </span>
              </h1>

              <p className="mt-2.5 sm:mt-4 max-w-xl text-xs leading-5 text-foreground/85 sm:text-base sm:leading-7">
                Factory-direct UV driplines, <strong>complete acreage kits</strong>, <strong>HDPE dam liners</strong>, and solar pumps—priced transparently with same-day BOQs across all 47 counties.
              </p>

              {/* Key Trust Badges (compact single line on mobile) */}
              <div className="mt-3 hidden sm:flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-foreground/90">
                {[
                  "15cm, 20cm & 30cm Driplines",
                  "HDPE Dam Liners & Welding",
                  "Full Field Installation & BOQs",
                ].map((point) => (
                  <span key={point} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {point}
                  </span>
                ))}
              </div>

              {/* Primary CTA Row */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <Link
                  to="/products"
                  className="dt-btn-primary inline-flex min-h-11 items-center justify-center gap-1.5 px-3 text-xs sm:px-6 sm:text-sm shadow-md"
                >
                  <span>Shop Catalogue</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>

                <QuoteModal>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border-2 border-primary bg-primary/10 px-3 py-2 text-xs sm:px-4 sm:text-sm font-extrabold text-primary backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>Official BOQ</span>
                  </button>
                </QuoteModal>

                <Link
                  to="/irrigation-cost-calculator-kenya"
                  className="hidden sm:inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-card/90 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card"
                >
                  <Calculator className="h-4 w-4 shrink-0 text-primary" />
                  <span>Cost Calculator</span>
                </Link>
              </div>

              {/* Mobile Quick-Shop Category Chips (keeps Hero compact); Desktop shows full 4-card grid */}
              <div className="-mx-1 mt-3.5 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide sm:hidden">
                {shopPaths.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    to={href}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Desktop Quick Category Navigation Cards */}
              <div className="mt-7 hidden border-t border-foreground/15 pt-5 sm:grid sm:grid-cols-4 sm:gap-3">
                {shopPaths.map(({ label, detail, href, icon: Icon }) => (
                  <Link
                    key={label}
                    to={href}
                    className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-border/90 bg-card/85 p-3 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold leading-4 text-foreground group-hover:text-primary transition-colors">
                        {label}
                      </span>
                      <span className="mt-1 block text-[10px] leading-3.5 text-muted-foreground">
                        {detail}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Live Featured Equipment + Farm System Advisor Switcher */}
            <aside
              className="w-full min-w-0 max-w-md mx-auto lg:max-w-none overflow-hidden rounded-[18px] sm:rounded-[22px] border border-border/90 bg-card/95 p-3.5 sm:p-5 shadow-2xl backdrop-blur-md"
              aria-label="Live top equipment and farm irrigation system advisor"
            >
              {/* Panel Switcher Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5 mb-3 sm:pb-3 sm:mb-4">
                <div className="inline-flex rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setPanelTab("catalogue")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                      panelTab === "catalogue"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Package className="h-3.5 w-3.5 text-primary" />
                    Top Equipment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelTab("advisor")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                      panelTab === "advisor"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Size My Farm
                  </button>
                </div>
                <span className="hidden sm:inline-block rounded-full bg-[hsl(var(--dt-gold-400))] px-2.5 py-1 text-[10px] font-extrabold text-[hsl(var(--dt-green-900))]">
                  {panelTab === "catalogue" ? "In Stock Now" : "Instant Sizing"}
                </span>
              </div>

              {panelTab === "advisor" ? (
                <div className="space-y-3.5 sm:space-y-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                      1. Select Farm / Plot Size
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ACREAGE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedAcreage(option.id)}
                          className={`rounded-xl border px-1.5 py-2 text-center text-[11px] sm:text-xs font-bold transition-all ${
                            selectedAcreage === option.id
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="hero-crop-select"
                      className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      2. Choose Primary Crop or Setup
                    </label>
                    <select
                      id="hero-crop-select"
                      value={selectedCropId}
                      onChange={(e) => setSelectedCropId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                    >
                      {CROP_PRESETS.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recommended Engineering Spec Box */}
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                        <Sprout className="h-4 w-4" />
                        Recommended Spec
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {activeAcreage.blocks}
                      </span>
                    </div>
                    <div className="grid gap-1 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Spacing:</span>
                        <span className="font-bold text-foreground text-right">
                          {activeCrop.spacing}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Layout:</span>
                        <span className="font-bold text-foreground text-right">
                          {activeCrop.layout}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Headworks:</span>
                        <span className="font-bold text-foreground text-right">
                          {activeCrop.filtration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <a
                      href={advisorWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--whatsapp))] px-2.5 py-2.5 text-[11px] sm:text-xs font-extrabold text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>Quote {activeAcreage.label}</span>
                    </a>
                    <Link
                      to={activeCrop.guideHref}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-2.5 py-2.5 text-[11px] sm:text-xs font-extrabold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <span>Crop Guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  {heroProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {heroProducts.slice(0, 4).map((product) => {
                        const categoryInfo = heroProductCategories.find(
                          (item) => item.category === product.category,
                        );
                        const image = product.images?.find(
                          (value) => typeof value === "string" && value.trim(),
                        );
                        const productUrl = getProductPath(product) || categoryInfo?.href || "/products";
                        const hasPrice = Number(product.price) > 0;

                        return (
                          <Link
                            key={product.id}
                            to={productUrl}
                            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-primary/50 hover:shadow-sm"
                            aria-label={`View ${product.name}`}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  loading="eager"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                              )}
                              {categoryInfo && (
                                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-bold text-foreground shadow-sm">
                                  {categoryInfo.label}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-2 sm:p-2.5">
                              <p className="line-clamp-2 text-[11px] sm:text-xs font-bold leading-snug text-foreground group-hover:text-primary">
                                {product.name}
                              </p>
                              <p className="mt-1 font-mono text-[11px] sm:text-xs font-black text-primary">
                                {hasPrice ? formatPrice(product.price) : "View Price →"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="overflow-hidden rounded-xl border border-border bg-muted/30 animate-pulse">
                          <div className="aspect-[4/3] bg-muted" />
                          <div className="p-2 space-y-1.5">
                            <div className="h-3 w-4/5 rounded bg-muted" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    to="/products"
                    className="mt-2.5 sm:mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Browse All Products &amp; Prices
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
