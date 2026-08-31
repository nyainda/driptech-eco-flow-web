import { ArrowRight, Droplets, MessageCircle, Sprout, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const solutionLinks = [
  { label: "Drip irrigation", href: "/products/drip", icon: Droplets },
  { label: "Sprinkler systems", href: "/products/sprinklers", icon: Zap },
  { label: "Irrigation kits", href: "/irrigation-kits", icon: Sprout },
];

/** A product-led hero that uses the shared DripTech design tokens and local media. */
export default function HeroSectionVibe() {
  return (
    <section className="overflow-hidden border-b border-border bg-background" aria-labelledby="home-hero-title">
      <div className="dt-container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="dt-section-label mb-4">Irrigation equipment · Kenya</p>
          <h1 id="home-hero-title" className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Reliable irrigation for farms that want to grow.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Shop driplines, sprinklers, pumps, filters and complete irrigation kits. Get the right equipment, practical advice and installation support from DripTech.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="dt-btn-primary inline-flex min-h-11 items-center justify-center gap-2">
              Browse all products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/254794494515?text=Hello%20DripTech%2C%20I%20need%20help%20choosing%20an%20irrigation%20product."
              target="_blank"
              rel="noreferrer"
              className="dt-btn-whatsapp inline-flex min-h-11 items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask about a product
            </a>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-3">
            {solutionLinks.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className="dt-card group flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
            <picture>
              <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
              <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
              <img
                src="/hero-bg-new-desktop.webp"
                alt="Healthy crops growing with efficient farm irrigation"
                className="h-[300px] w-full object-cover sm:h-[390px] lg:h-[480px]"
                fetchPriority="high"
                decoding="async"
                width="1920"
                height="1080"
              />
            </picture>
          </div>
          <div className="absolute bottom-4 left-4 rounded-xl border border-border bg-card px-4 py-3 shadow-md sm:bottom-6 sm:left-6">
            <p className="dt-micro text-primary">One catalogue. Complete solutions.</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Products for every stage of irrigation.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
