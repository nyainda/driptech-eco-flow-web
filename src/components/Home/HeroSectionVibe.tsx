import { ArrowRight, CheckCircle2, Droplets, MessageCircle, Sprout, Timer, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const solutionLinks = [
  { label: "Drip irrigation", href: "/products/drip", icon: Droplets },
  { label: "Sprinkler systems", href: "/products/sprinklers", icon: Zap },
  { label: "Complete irrigation kits", href: "/irrigation-kits", icon: Sprout },
];

/**
 * The homepage's LCP surface deliberately uses a local, responsive image instead
 * of waiting for product data or a third-party image host. This keeps the primary
 * sales message and the two most important conversion paths available immediately.
 */
export default function HeroSectionVibe() {
  return (
    <section
      className="relative isolate overflow-hidden bg-slate-950 text-white"
      aria-labelledby="home-hero-title"
    >
      <picture className="absolute inset-0 -z-20 block">
        <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
        <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
        <img
          src="/hero-bg-new-desktop.webp"
          alt="Healthy crops growing with efficient farm irrigation"
          className="h-full w-full object-cover object-[63%_center]"
          fetchPriority="high"
          decoding="async"
          width="1920"
          height="1080"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />

      <div className="container mx-auto flex min-h-[650px] items-center px-4 py-20 sm:px-6 lg:min-h-[680px] lg:py-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            Irrigation solutions for Kenyan farms
          </div>

          <h1 id="home-hero-title" className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Grow more with every <span className="text-emerald-300">drop of water.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Shop dependable drip irrigation, sprinkler systems, pumps and complete irrigation kits—then get expert design and installation for your farm anywhere in Kenya.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Shop irrigation products <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/254794494515?text=Hello%20DripTech%2C%20I%20would%20like%20help%20choosing%20an%20irrigation%20system."
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Get a free quote
            </a>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-slate-100 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Timer className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /> Fast, practical advice</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /> Design & installation</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /> Nationwide support</li>
          </ul>
        </div>
      </div>

      <nav aria-label="Shop irrigation solutions" className="border-t border-white/15 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto grid grid-cols-1 px-4 sm:grid-cols-3 sm:px-6">
          {solutionLinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} className="group flex items-center gap-3 border-b border-white/10 py-4 text-sm font-semibold text-slate-100 transition hover:text-emerald-300 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
              <span className="rounded-lg bg-emerald-400/10 p-2 text-emerald-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              {label}
              <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
