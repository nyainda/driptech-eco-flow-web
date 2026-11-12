import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Layers,
  Leaf,
  Sprout,
  Sun,
  TreePine,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "@/components/Home/QuoteModal";

const ACREAGE_PACKAGES = [
  {
    badge: "Starter Plot",
    size: "¼ Acre Drip Setup",
    idealFor: "Kitchen gardens, high-value vegetables & starter greenhouses",
    highlights: [
      "1,000m – 1,500m UV-stabilized drip tape",
      "32mm HDPE mainline & sub-main fittings",
      "¾\" or 1\" screen/disc water filter",
      "Works with a 1,000L – 2,500L raised tank",
    ],
    href: "/irrigation-kits",
    cta: "Compare ¼ Acre Kits",
  },
  {
    badge: "Market Grower",
    size: "½ Acre Commercial Setup",
    idealFor: "Commercial tomatoes, onions, capsicum & watermelon plots",
    highlights: [
      "2,500m – 3,000m turbulent dripline",
      "40mm HDPE mainline + zoned control valves",
      "High-capacity disc filtration unit",
      "Optional venturi fertigation injector",
    ],
    href: "/irrigation-kits",
    cta: "Compare ½ Acre Kits",
  },
  {
    badge: "Most Popular",
    size: "1 Acre Full Drip System",
    idealFor: "2-line or 3-line bed layouts with 4 zoned irrigation blocks",
    highlights: [
      "4,000m – 6,000m dripline (15cm/20cm/30cm)",
      "50mm/63mm HDPE mainline & sub-mains",
      "1½\" or 2\" dual disc filter headworks",
      "5,000L – 10,000L tank or booster pump ready",
    ],
    href: "/one-acre-drip-irrigation-system-kenya",
    cta: "1-Acre System Guide",
    featured: true,
  },
  {
    badge: "Commercial Estate",
    size: "5 to 50+ Acres Turnkey",
    idealFor: "Agribusinesses, orchards, NGOs & institutional estates",
    highlights: [
      "Full topographic & hydraulic CAD design",
      "Solar or electric borehole/river pump station",
      "Multi-block manifold & pressure regulation",
      "Certified field trenching & commissioning",
    ],
    href: "/irrigation-design-consultation-kenya",
    cta: "Book Engineering Survey",
  },
];

const CROP_SOLUTIONS = [
  {
    title: "Tomatoes & Capsicum",
    spec: "20cm / 30cm Spacing · 2 Lines/Bed",
    detail:
      "Keeps foliage dry to reduce blight while delivering uniform moisture and soluble fertilizer directly to the root zone.",
    href: "/drip-irrigation-for-tomatoes-kenya",
    icon: Sprout,
  },
  {
    title: "Red Bulb Onions & Garlic",
    spec: "15cm Close Spacing · 3–4 Lines/Bed",
    detail:
      "High-density emitter distribution for shallow-rooted bulb crops to maximize uniform bulb size across every bed.",
    href: "/drip-irrigation-for-onions-kenya",
    icon: Layers,
  },
  {
    title: "Hass Avocado & Orchards",
    spec: "Button Drippers (4–8 L/hr) or PC Line",
    detail:
      "Adjustable or pressure-compensating basin watering tailored for young seedlings through mature fruit-bearing trees.",
    href: "/drip-irrigation-for-avocado-kenya",
    icon: TreePine,
  },
  {
    title: "Greenhouse Irrigation",
    spec: "Drip Laterals + Overhead Misting",
    detail:
      "Precision root-zone drip lines paired with foggers/misters for humidity control and venturi fertigation.",
    href: "/greenhouse-irrigation-systems-kenya",
    icon: Leaf,
  },
  {
    title: "Cabbage, Kales & Melons",
    spec: "20cm / 30cm Dripline or Sprinklers",
    detail:
      "Flexible row-crop layouts engineered for fast turnaround cycles and reliable water conservation.",
    href: "/drip-irrigation-for-cabbage-kenya",
    icon: Droplets,
  },
  {
    title: "Solar & Borehole Pumping",
    spec: "Submersible & Surface Solar Pumps",
    detail:
      "Eliminate daily fuel costs with matched solar arrays, MPPT controllers, and elevated tank feeding.",
    href: "/solar-irrigation-pumps-kenya",
    icon: Sun,
  },
];

export default function HomeCropAcreageGuide() {
  return (
    <section
      className="border-b border-border bg-background py-12 sm:py-16 lg:py-20"
      aria-labelledby="home-crop-acreage-title"
    >
      <div className="dt-container space-y-14">
        {/* Part 1: Shop by Farm Acreage */}
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div className="max-w-2xl">
              <p className="dt-section-label mb-2">Sized for your land</p>
              <h2
                id="home-crop-acreage-title"
                className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl"
              >
                Choose by{" "}
                <span className="text-primary">Farm Acreage & Scale</span>
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground sm:text-base">
                Compare standard equipment configurations from quarter-acre
                starter packages to multi-acre commercial engineering projects.
              </p>
            </div>
            <QuoteModal>
              <button
                type="button"
                className="dt-btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
              >
                Request Custom Acreage BOQ <ArrowRight className="h-4 w-4" />
              </button>
            </QuoteModal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACREAGE_PACKAGES.map((pkg) => (
              <div
                key={pkg.size}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  pkg.featured
                    ? "border-primary bg-primary/[0.04] shadow-md ring-1 ring-primary/25"
                    : "border-border bg-card shadow-sm hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        pkg.featured
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-bold text-foreground">
                    {pkg.size}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {pkg.idealFor}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-border/70 pt-4 text-xs text-foreground/90">
                    {pkg.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={pkg.href}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-colors ${
                    pkg.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {pkg.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Crop-Specific Irrigation Setups */}
        <div className="border-t border-border pt-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="dt-section-label mb-2">Agronomic matching</p>
              <h3 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                Engineered Setups for{" "}
                <span className="text-primary">Major Kenyan Crops</span>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Different crops require specific emitter spacing, lateral counts
                per bed, and filtration ratings. Explore our field-tested crop
                configurations.
              </p>
            </div>
            <Link
              to="/how-to-choose-dripline-spacing-kenya"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
            >
              Dripline Spacing Guide (15cm vs 20cm vs 30cm){" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CROP_SOLUTIONS.map(({ title, spec, detail, href, icon: Icon }) => (
              <Link
                key={title}
                to={href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[10px] font-bold text-foreground">
                      {spec}
                    </span>
                  </div>
                  <h4 className="mt-3.5 font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {detail}
                  </p>
                </div>

                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                  View system specs & pricing{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
