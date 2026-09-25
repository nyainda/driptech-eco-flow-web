import { ArrowRight, CheckCircle2, Droplets, MessageCircle, Sprout, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const solutionLinks = [
  { label: "Drip irrigation", href: "/products/drip", icon: Droplets },
  { label: "Sprinkler systems", href: "/products/sprinklers", icon: Zap },
  { label: "Complete kits", href: "/irrigation-kits", icon: Sprout },
];

export default function HeroSectionVibe() {
  return (
    <section
      className="overflow-hidden border-b border-border bg-background"
      aria-labelledby="home-hero-title"
    >
      <div className="dt-container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="dt-section-label mb-4">Supplies · Kenya</p>
          <h1
            id="home-hero-title"
            className="storefront-heading text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl"
          >
            Driplines, kits and pumps that fit{" "}
            <span className="text-primary">your farm — not the other way round.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            From a kitchen-garden kit to a full-field system: we stock the parts, help you size
            them, and can install when you need a crew on site.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/products"
              className="dt-btn-primary inline-flex min-h-11 items-center justify-center gap-2 shadow-sm"
            >
              Browse products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/254723407849?text=Hi%20DripTech%20%E2%80%94%20I%20need%20help%20choosing%20irrigation%20equipment."
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[hsl(var(--dt-whatsapp))] px-5 py-2.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--dt-whatsapp)/0.92)] hover:shadow-lg"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span>Talk to our team</span>
                <span className="text-[10px] font-medium text-white/75">WhatsApp · quick sizing help</span>
              </span>
            </a>
          </div>

          <ul className="mt-7 grid gap-2 text-sm text-foreground sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Small plots and larger farms
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Supply, design and install
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Delivery across Kenya
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Honest sizing before you pay
            </li>
          </ul>

          <div className="mt-8 grid gap-2 sm:grid-cols-3">
            {solutionLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="dt-card group flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-foreground hover:bg-card"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{label}</span>
                <ArrowRight
                  className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3">
            <picture>
              <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
              <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
              <img
                src="/hero-bg-new-desktop.webp"
                alt="Irrigated crop rows on a Kenyan farm"
                className="h-[300px] w-full rounded-xl object-cover sm:h-[410px] lg:h-[500px]"
                fetchPriority="high"
                decoding="async"
                width="1920"
                height="1080"
              />
            </picture>
          </div>
          <div className="relative mt-3 max-w-[290px] rounded-xl border border-border bg-card p-4 shadow-md sm:mt-4 sm:max-w-[320px] lg:absolute lg:-bottom-6 lg:left-6 lg:mt-0">
            <p className="dt-section-label">Not sure what you need?</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
              Tell us the crop and acreage. We’ll point you to the right kit or parts list.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
