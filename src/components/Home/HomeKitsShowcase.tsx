import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MessageCircle, Package, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { dataService } from "@/services/dataService";

interface IrrigationKit {
  id: string;
  name: string;
  description: string | null;
  kit_type: string | null;
  coverage_area: number | null;
  price: number | null;
  components: any;
  images: any;
  featured: boolean | null;
}

const parseImages = (images: any): string[] => {
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(images) ? images : [];
};

const parseComponents = (components: any): { main_components?: string[]; pricing_tiers?: Array<{ price: number }> } => {
  if (typeof components === "string") {
    try {
      return JSON.parse(components);
    } catch {
      return {};
    }
  }
  return components || {};
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "Price on request";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function HomeKitsShowcase() {
  const [kits, setKits] = useState<IrrigationKit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService
      .getIrrigationKits({ sortBy: "featured" })
      .then((data) => setKits((data || []).slice(0, 4) as IrrigationKit[]))
      .catch((error) => console.error("Error fetching homepage irrigation kits:", error))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && kits.length === 0) return null;

  return (
    <section className="overflow-hidden border-y border-[hsl(var(--dt-stone-200))] bg-[hsl(var(--dt-green-50)/0.55)] py-10 sm:py-14 lg:py-16">
      <div className="dt-container">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.8fr] lg:items-center lg:gap-10">
          <div>
            <p className="dt-section-label flex items-center gap-2">
              <Sprout className="h-4 w-4" aria-hidden="true" />
              Irrigation kits
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Complete irrigation kits
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
              Everything you need to get a practical irrigation system running, grouped by plot size so you can buy with less guesswork.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-foreground">
              {["Pre-configured for common farm sizes", "Main components grouped together", "Installation guidance available"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/irrigation-kits" className="dt-btn-primary inline-flex items-center gap-2">
                Explore all kits <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={"https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech! Please help me choose an irrigation kit.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[10px] border border-[hsl(var(--dt-whatsapp)/0.35)] bg-background px-4 py-2.5 text-sm font-bold text-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.06)]"
              >
                <MessageCircle className="h-4 w-4" /> Ask us
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse overflow-hidden rounded-[14px] border border-border bg-card">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="space-y-2 p-3.5">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-5 w-3/4 rounded bg-muted" />
                      <div className="h-8 rounded bg-muted" />
                    </div>
                  </div>
                ))
              : kits.map((kit) => {
                  const images = parseImages(kit.images);
                  const components = parseComponents(kit.components);
                  const tierPrices = components.pricing_tiers?.map((tier) => tier.price).filter((price) => Number.isFinite(price)) || [];
                  const price = tierPrices.length ? Math.min(...tierPrices) : kit.price;
                  const coverage = kit.coverage_area
                    ? `${kit.coverage_area} acre${kit.coverage_area === 1 ? "" : "s"}`
                    : "Custom";

                  return (
                    <article key={kit.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-[hsl(var(--dt-stone-200))] bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))] hover:shadow-md">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--dt-stone-100))]">
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt={kit.name}
                            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-10 w-10 text-primary/50" />
                          </div>
                        )}
                        {kit.featured && (
                          <span className="absolute left-2.5 top-2.5 rounded-full bg-[hsl(var(--dt-gold-500))] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[hsl(var(--dt-green-900))]">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-3.5">
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[hsl(var(--dt-green-600))]">{coverage}</p>
                        <h3 className="mt-1 line-clamp-2 font-heading text-sm font-bold leading-snug text-foreground">{kit.name}</h3>
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-4.5 text-muted-foreground">{kit.description || "A practical irrigation package for your farm."}</p>
                        <div className="mt-auto pt-3">
                          <p className="font-mono text-sm font-black text-[hsl(var(--dt-green-800))]">{formatCurrency(price)}</p>
                          <Link to="/irrigation-kits" className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground hover:bg-primary/90">
                            View kit <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}
