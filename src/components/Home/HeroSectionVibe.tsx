import { ArrowRight, CheckCircle2, Droplets, MessageCircle, Sprout, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const solutionLinks = [
  { label: "Drip irrigation", href: "/products/drip", icon: Droplets },
  { label: "Sprinkler systems", href: "/products/sprinklers", icon: Zap },
  { label: "Complete kits", href: "/irrigation-kits", icon: Sprout },
];

export default function HeroSectionVibe() {
  return (
    <section className="overflow-hidden border-b border-border bg-muted/35" aria-labelledby="home-hero-title">
      <div className="dt-container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="dt-section-label mb-4">Irrigation solutions for Kenya</p>
          <h1 id="home-hero-title" className="font-heading text-4xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Build a farm that uses <span className="text-primary">water wisely.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Quality driplines, sprinklers, pumps, filters and complete irrigation kits—chosen to fit your crop, field and budget.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="dt-btn-primary inline-flex min-h-11 items-center justify-center gap-2 shadow-sm">
              Explore products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/254723407849?text=Hello%20DripTech%2C%20I%20need%20help%20choosing%20an%20irrigation%20product."
              target="_blank"
              rel="noreferrer"
              className="dt-btn-whatsapp inline-flex min-h-11 items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
            </a>
          </div>

          <ul className="mt-7 grid gap-2 text-sm text-foreground sm:grid-cols-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Products for small and large farms</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Design and installation support</li>
          </ul>

          <div className="mt-8 grid gap-2 sm:grid-cols-3">
            {solutionLinks.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className="dt-card group flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-foreground hover:bg-card">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/15" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3">
            <picture>
              <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
              <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
              <img
                src="/hero-bg-new-desktop.webp"
                alt="Healthy crops growing with efficient farm irrigation"
                className="h-[300px] w-full rounded-xl object-cover sm:h-[410px] lg:h-[500px]"
                fetchPriority="high"
                decoding="async"
                width="1920"
                height="1080"
              />
            </picture>
          </div>
          <div className="absolute -bottom-4 left-4 max-w-[245px] rounded-xl border border-border bg-card p-4 shadow-md sm:-bottom-6 sm:left-6">
            <p className="dt-section-label">Start with the right system</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-foreground">Tell us what you are growing. We will help you select the equipment.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
