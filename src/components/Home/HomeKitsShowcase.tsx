import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
  Package,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dataService } from "@/services/dataService";
import QuoteModal from "@/components/Home/QuoteModal";

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

const parseComponents = (
  components: any,
): {
  main_components?: string[];
  pricing_tiers?: Array<{ price: number }>;
} => {
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
      .catch((error) =>
        console.error("Error fetching homepage irrigation kits:", error),
      )
      .finally(() => setLoading(false));
  }, []);

  if (!loading && kits.length === 0) return null;

  return (
    <section className="overflow-hidden border-y border-border bg-muted/40 py-8 sm:py-16 lg:py-20">
      <div className="dt-container">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[0.82fr_1.78fr] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="dt-section-label flex items-center gap-2">
              <Sprout className="h-4 w-4" aria-hidden="true" />
              Ready-to-Install Packages
            </p>
            <h2 className="mt-1.5 sm:mt-2 font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Complete{" "}
              <span className="text-primary">Acreage Irrigation Kits</span>
            </h2>
            <p className="mt-2 sm:mt-3 max-w-md text-xs leading-5 sm:text-base sm:leading-6 text-muted-foreground">
              Pre-engineered packages with matched driplines, mainline pipes,
              connectors, valves, and filtration—grouped by plot size so you can
              deploy without missing a single fitting.
            </p>

            <ul className="hidden sm:block mt-5 space-y-2.5 text-sm text-foreground">
              {[
                "Sized for ⅛, ¼, ½, and 1+ Acre plots",
                "Includes driplines, filtration, valves & all fittings",
                "Custom BOQ adjustments available for any terrain",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-2.5">
              <Link
                to="/irrigation-kits"
                className="dt-btn-primary inline-flex items-center gap-2"
              >
                Explore All Kits <ArrowRight className="h-4 w-4" />
              </Link>
              <QuoteModal>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-primary/40 bg-card px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <FileText className="h-4 w-4" /> Custom Kit Quote
                </button>
              </QuoteModal>
              <a
                href={
                  "https://wa.me/254723407849?text=" +
                  encodeURIComponent(
                    "Hi DripTech! Please help me choose an irrigation kit for my farm.",
                  )
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[10px] border border-[hsl(var(--dt-whatsapp)/0.35)] bg-background px-4 py-2.5 text-sm font-bold text-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.06)]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="w-[72vw] max-w-[260px] shrink-0 snap-start sm:w-auto sm:max-w-none animate-pulse overflow-hidden rounded-[16px] border border-border bg-card"
                    >
                      <div className="aspect-[4/3] bg-muted" />
                      <div className="space-y-2 p-3.5 sm:p-4">
                        <div className="h-3 w-1/2 rounded bg-muted" />
                        <div className="h-5 w-3/4 rounded bg-muted" />
                        <div className="h-8 rounded bg-muted" />
                      </div>
                    </div>
                  ))
                : kits.map((kit) => {
                    const images = parseImages(kit.images);
                    const components = parseComponents(kit.components);
                    const tierPrices =
                      components.pricing_tiers
                        ?.map((tier) => tier.price)
                        .filter((price) => Number.isFinite(price)) || [];
                    const price = tierPrices.length
                      ? Math.min(...tierPrices)
                      : kit.price;
                    const coverage = kit.coverage_area
                      ? `${kit.coverage_area} Acre${
                          kit.coverage_area === 1 ? "" : "s"
                        } Coverage`
                      : "Custom Coverage";

                    return (
                      <article
                        key={kit.id}
                        className="group flex w-[72vw] max-w-[260px] shrink-0 snap-start sm:w-auto sm:max-w-none min-w-0 flex-col overflow-hidden rounded-[16px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                      >
                        <div className="relative aspect-[4/3] min-h-[145px] overflow-hidden bg-muted sm:min-h-[185px]">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={kit.name}
                              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-10 w-10 text-primary/50" />
                            </div>
                          )}
                          {kit.featured && (
                            <span className="absolute left-2.5 top-2.5 rounded-full bg-[hsl(var(--dt-gold-500))] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[hsl(var(--dt-green-900))] shadow-sm">
                              Best Seller
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">
                            {coverage}
                          </p>
                          <h3 className="mt-1 line-clamp-2 font-heading text-sm font-bold leading-snug text-foreground">
                            {kit.name}
                          </h3>
                          <p className="mt-1.5 hidden text-xs leading-relaxed text-muted-foreground sm:line-clamp-2 sm:block">
                            {kit.description ||
                              "Complete farm-ready irrigation package with mainline, laterals, filtration, and fittings."}
                          </p>
                          <div className="mt-auto border-t border-border/60 pt-3 sm:pt-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Complete Kit Price
                            </p>
                            <p className="mt-0.5 font-mono text-base font-black text-foreground">
                              {formatCurrency(price)}
                            </p>
                            <Link
                              to="/irrigation-kits"
                              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-2.5"
                            >
                              View Kit Specs <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
