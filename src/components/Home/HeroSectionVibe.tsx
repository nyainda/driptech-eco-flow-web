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

interface HeroProduct {
  id: string;
  name: string;
  category: string;
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
    category: "filtration_systems",
    label: "Filters & pumps",
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
  const [panelTab, setPanelTab] = useState<"advisor" | "catalogue">("advisor");

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
      <div className="dt-container relative py-4 sm:py-6 lg:py-8">
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card shadow-lg">
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
              fetchPriority="high"
              decoding="async"
              width="1920"
              height="1080"
            />
          </picture>

          {/* Rich multi-stop gradient overlay for legibility in light & dark mode */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 via-58% to-background/35 dark:from-background/95 dark:via-background/90 dark:to-background/45" />

          <div className="relative grid gap-8 px-4 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:gap-10 lg:px-10 lg:py-12 xl:px-12">
            {/* Left Column: Value Proposition & Direct CTAs */}
            <div className="max-w-2xl">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-extrabold text-primary backdrop-blur-sm mb-4">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Kenya's Premier Irrigation Engineering & Supply Partner</span>
              </div>

              <h1
                id="home-hero-title"
                className="font-heading text-3xl font-bold leading-[1.03] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[54px] xl:text-6xl"
              >
                Precision Irrigation{" "}
                <span className="text-primary block mt-1">
                  Built for Kenyan Farms.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/85 sm:text-base sm:leading-7">
                From single-roll driplines and solar borehole pumps to complete{" "}
                <strong>¼-acre through 50+ acre turnkey installations</strong>.
                We engineer hydraulic layouts, supply genuine UV-stabilized
                equipment, and support farms across all 47 counties.
              </p>

              {/* Key Trust Badges */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-foreground/90">
                {[
                  "15cm, 20cm & 30cm Driplines",
                  "Complete Acreage Kits",
                  "Same-Day Itemized BOQs",
                ].map((point) => (
                  <span key={point} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {point}
                  </span>
                ))}
              </div>

              {/* Primary CTA Row */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  to="/products"
                  className="dt-btn-primary inline-flex items-center gap-2 shadow-md"
                >
                  Shop Equipment <ArrowRight className="h-4 w-4" />
                </Link>

                <QuoteModal>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-[10px] border-2 border-primary bg-primary/10 px-4 py-2.5 text-sm font-extrabold text-primary backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    Request Official BOQ
                  </button>
                </QuoteModal>

                <Link
                  to="/irrigation-cost-calculator-kenya"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card/90 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card"
                >
                  <Calculator className="h-4 w-4 text-primary" />
                  Cost Calculator
                </Link>
              </div>

              {/* Quick Category Navigation Cards */}
              <div className="mt-7 grid grid-cols-2 gap-2.5 border-t border-foreground/15 pt-5 sm:grid-cols-4 sm:gap-3">
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

            {/* Right Column: Interactive Farm System Advisor + Catalogue Switcher */}
            <aside
              className="w-full max-w-md mx-auto lg:max-w-none overflow-hidden rounded-[22px] border border-border/90 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md"
              aria-label="Interactive farm irrigation system advisor and catalogue preview"
            >
              {/* Panel Switcher Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3 mb-4">
                <div className="inline-flex rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setPanelTab("advisor")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      panelTab === "advisor"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    System Finder
                  </button>
                  {heroProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPanelTab("catalogue")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        panelTab === "catalogue"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Package className="h-3.5 w-3.5 text-primary" />
                      Catalogue ({heroProducts.length})
                    </button>
                  )}
                </div>
                <span className="rounded-full bg-[hsl(var(--dt-gold-400))] px-2.5 py-1 text-[10px] font-extrabold text-[hsl(var(--dt-green-900))]">
                  Instant Sizing
                </span>
              </div>

              {panelTab === "advisor" ? (
                <div className="space-y-4">
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
                          className={`rounded-xl border px-2 py-2 text-center text-xs font-bold transition-all ${
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
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs sm:text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                    >
                      {CROP_PRESETS.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recommended Engineering Spec Box */}
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                        <Sprout className="h-4 w-4" />
                        Recommended Engineering Spec
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {activeAcreage.blocks}
                      </span>
                    </div>
                    <div className="grid gap-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Emitter Spacing:</span>
                        <span className="font-bold text-foreground text-right">
                          {activeCrop.spacing}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">Field Layout:</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href={advisorWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--whatsapp))] px-3 py-2.5 text-xs font-extrabold text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Get {activeAcreage.label} Quote
                    </a>
                    <Link
                      to={activeCrop.guideHref}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-extrabold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      Read Crop Guide <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {heroProducts.map((product, index) => {
                      const categoryInfo = heroProductCategories.find(
                        (item) => item.category === product.category,
                      );
                      const image = product.images?.find(
                        (value) => typeof value === "string" && value.trim(),
                      );
                      if (!image || !categoryInfo) return null;

                      return (
                        <Link
                          key={product.id}
                          to={categoryInfo.href}
                          className={`group relative h-[128px] overflow-hidden rounded-2xl bg-muted ${
                            index === 0 ? "col-span-2 h-[145px]" : ""
                          }`}
                          aria-label={`Browse ${product.name}`}
                        >
                          <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8 text-xs font-bold text-white">
                            {product.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <Link
                    to="/products"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Explore Full Product Catalogue{" "}
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
