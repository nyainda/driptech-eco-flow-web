import {
  ArrowRight,
  Calculator,
  Droplets,
  Gauge,
  Leaf,
  MessageCircle,
  Package,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dataService } from "@/services/dataService";

interface HeroProduct {
  id: string;
  name: string;
  category: string;
  images: string[] | null;
}

const heroProductCategories = [
  { category: "drip_irrigation", label: "Drip lines & tape", href: "/products/drip" },
  { category: "sprinkler_systems", label: "Sprinklers", href: "/products/sprinklers" },
  { category: "filtration_systems", label: "Filters & pumps", href: "/products/filtration" },
];

const shopPaths = [
  {
    label: "Drip irrigation",
    detail: "Dripline & tape",
    href: "/products/drip",
    icon: Droplets,
  },
  {
    label: "Sprinklers",
    detail: "Water distribution",
    href: "/products/sprinklers",
    icon: Gauge,
  },
  {
    label: "Pumps & motors",
    detail: "Water supply equipment",
    href: "/products/pumps",
    icon: Wrench,
  },
  {
    label: "Irrigation kits",
    detail: "Explore complete packages",
    href: "/irrigation-kits",
    icon: Package,
  },
];

const planningChecklist = [
  {
    title: "Crop and spacing",
    detail: "What you grow and how it is planted",
    icon: Leaf,
  },
  {
    title: "Water source",
    detail: "Available flow, pressure and power",
    icon: Droplets,
  },
  {
    title: "Project scope",
    detail: "Components, delivery and installation",
    icon: ShieldCheck,
  },
];

export default function HeroSectionVibe() {
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>([]);

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
              Array.isArray(product.images) && product.images.some((image) => typeof image === "string" && image.trim()),
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

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-background"
      aria-labelledby="home-hero-title"
    >
      <div className="dt-container relative py-5 sm:py-7 lg:py-9">
        <div className="relative min-h-[650px] overflow-hidden rounded-[20px] border border-border bg-card shadow-sm sm:min-h-[620px] lg:min-h-[610px] xl:min-h-[640px]">
          <picture>
            <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
            <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
            <img
              src="/hero-bg-new-desktop.webp"
              alt="Irrigated crop rows on a Kenyan farm"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
              width="1920"
              height="1080"
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 via-52% to-background/15 lg:from-background/95 lg:via-background/80 lg:to-background/15" />

          <div className="relative flex min-h-[650px] items-end px-4 py-6 sm:min-h-[620px] sm:px-7 sm:py-8 lg:min-h-[610px] lg:items-center lg:px-10 xl:min-h-[640px] xl:px-12">
            <div className="max-w-2xl">
              <p className="dt-section-label mb-3">
                Irrigation equipment &amp; kits · Kenya
              </p>
              <h1
                id="home-hero-title"
                className="font-heading text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                Find the right
                <br />
                <span className="text-primary">
                  irrigation setup.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/85 sm:text-base sm:leading-7">
                Shop dripline, sprinklers, pumps, filters and irrigation kits.
                Explore your options and get help matching equipment to your
                crop, water source and field layout.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
                <Link
                  to="/products"
                  className="dt-btn-primary inline-flex items-center gap-2 shadow-sm"
                >
                  Shop equipment <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/irrigation-cost-calculator-kenya"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-primary/30 bg-card/90 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card"
                >
                  <Calculator className="h-4 w-4" />
                  Estimate your cost
                </Link>
              </div>

              <a
                href={"https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech Eco-Flow, I would like to speak with your engineers about irrigation system design and consultation.")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-md text-xs font-bold text-foreground underline decoration-[hsl(var(--dt-green-700)/0.35)] underline-offset-4 transition-colors hover:text-primary sm:text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Need a system designed? Talk to our engineers
              </a>

              <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2 border-t border-foreground/15 pt-5 sm:mt-7 sm:grid-cols-4 sm:gap-3">
                {shopPaths.map(({ label, detail, href, icon: Icon }) => (
                  <Link
                    key={label}
                    to={href}
                    className="group flex min-w-0 items-start gap-2 rounded-xl border border-border bg-card/75 p-2.5 backdrop-blur-sm transition-all hover:border-primary/35 hover:bg-card sm:p-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-extrabold leading-4 text-foreground sm:text-[11px]">
                        {label}
                      </span>
                      <span className="mt-0.5 hidden text-[9px] leading-3.5 text-muted-foreground sm:block">
                        {detail}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {heroProducts.length > 0 && (
              <aside
                className="absolute right-5 top-1/2 hidden w-[300px] -translate-y-1/2 overflow-hidden rounded-[24px] border border-white/40 bg-white/90 p-3 shadow-2xl backdrop-blur-md xl:block xl:right-8 xl:w-[340px]"
                aria-label="DripTech products from the live catalogue"
              >
                <div className="flex items-center justify-between px-2 pb-3 pt-1">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[hsl(var(--dt-green-700))]">
                      From our catalogue
                    </p>
                    <h2 className="mt-1 font-heading text-lg font-bold text-[hsl(var(--dt-green-900))]">
                      Irrigation essentials
                    </h2>
                  </div>
                  <span className="rounded-full bg-[hsl(var(--dt-gold-400))] px-2.5 py-1 text-[10px] font-extrabold text-[hsl(var(--dt-green-900))]">
                    DripTech
                  </span>
                </div>

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
                        className={`group relative h-[132px] overflow-hidden rounded-2xl bg-[hsl(var(--dt-green-50))] ${index === 0 ? "col-span-2 h-[150px]" : ""}`}
                        aria-label={`Browse ${product.name}`}
                      >
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 text-xs font-bold text-white">
                          {product.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <Link
                  to="/products"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--dt-green-900))] px-4 py-3 text-xs font-extrabold text-white transition-colors hover:bg-[hsl(var(--dt-green-800))]"
                >
                  Explore all products <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
