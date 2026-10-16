import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Droplets,
  Gauge,
  Leaf,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

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
    label: "Pumps & filters",
    detail: "Move and protect water",
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
                className="font-heading text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-[hsl(var(--dt-green-900))] sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                Find the right
                <br />
                <span className="text-[hsl(var(--dt-green-700))]">
                  irrigation setup.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--dt-green-900)/0.82)] sm:text-base sm:leading-7">
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
                href={"https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech! I need help choosing irrigation equipment.")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-md text-xs font-bold text-[hsl(var(--dt-green-900))] underline decoration-[hsl(var(--dt-green-700)/0.35)] underline-offset-4 transition-colors hover:text-primary sm:text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Not sure where to start? Chat with DripTech
              </a>

              <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2 border-t border-[hsl(var(--dt-green-900)/0.15)] pt-5 sm:mt-7 sm:grid-cols-4 sm:gap-3">
                {shopPaths.map(({ label, detail, href, icon: Icon }) => (
                  <Link
                    key={label}
                    to={href}
                    className="group flex min-w-0 items-start gap-2 rounded-xl border border-[hsl(var(--dt-green-900)/0.12)] bg-card/75 p-2.5 backdrop-blur-sm transition-all hover:border-primary/35 hover:bg-card sm:p-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-extrabold leading-4 text-[hsl(var(--dt-green-900))] sm:text-[11px]">
                        {label}
                      </span>
                      <span className="mt-0.5 hidden text-[9px] leading-3.5 text-[hsl(var(--dt-green-900)/0.65)] sm:block">
                        {detail}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="absolute right-5 top-5 hidden w-[235px] rounded-2xl border border-white/30 bg-[hsl(var(--dt-green-900)/0.95)] p-4 text-white shadow-xl backdrop-blur-md lg:block xl:right-8 xl:top-8 xl:w-[255px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[hsl(var(--dt-gold-400))]">
                Before you choose
              </p>
              <h2 className="mt-2 font-heading text-xl font-bold leading-tight">
                Plan around your farm.
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/70">
                A suitable setup starts with the crop, water supply and what
                needs to be included in the quote.
              </p>
              <div className="mt-4 space-y-3 border-t border-white/15 pt-4">
                {planningChecklist.map(({ title, detail, icon: Icon }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--dt-gold-400))]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[11px] font-bold">{title}</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-white/65">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/services"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-bold transition-colors hover:bg-white/10"
              >
                Explore service options <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
