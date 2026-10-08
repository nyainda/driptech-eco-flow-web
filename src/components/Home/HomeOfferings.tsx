import { ArrowRight, Droplets, Filter, Gauge, Settings, Sprout, Wrench, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import ProductsShowcase from "@/components/Home/ProductsShowcase";

const categories = [
  { label: "Drip Irrigation", description: "Precision watering", href: "/products/drip", icon: Droplets },
  { label: "Sprinkler Systems", description: "Wide crop coverage", href: "/products/sprinklers", icon: Gauge },
  { label: "Controller Systems", description: "Automate & save water", href: "/products/controls", icon: Settings },
  { label: "Accessories", description: "Fittings, valves & more", href: "/products/accessories", icon: Wrench },
  { label: "Filtration Systems", description: "Cleaner, longer-running systems", href: "/products/filtration", icon: Filter },
  { label: "Pumps & Motors", description: "Reliable water delivery", href: "/products/pumps", icon: Zap },
];

const HomeOfferings = () => (
  <>
    <section className="border-b border-[hsl(var(--dt-stone-200))] bg-background py-10 sm:py-12" aria-labelledby="homepage-categories-title">
      <div className="dt-container">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.7fr] lg:items-center">
          <div>
            <p className="dt-section-label">Our products</p>
            <h2 id="homepage-categories-title" className="mt-2 font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Irrigation solutions for <span className="text-primary">every farm</span>
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              From drip systems to filtration, find the equipment you need for efficient and sustainable farming.
            </p>
            <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline">
              View all products <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {categories.map(({ label, description, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="group rounded-xl border border-[hsl(var(--dt-stone-200))] bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))] hover:shadow-sm sm:p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--dt-green-50))] text-primary">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-2.5 text-xs font-bold leading-snug text-foreground sm:text-sm">{label}</h3>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground sm:text-[11px]">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>

    <ProductsShowcase hideStats hideBenefits />

    <section className="border-t border-[hsl(var(--dt-stone-200))] bg-[hsl(var(--dt-green-900)/0.98)] py-7 text-white sm:py-8">
      <div className="dt-container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--dt-gold-400))]" />
          <div>
            <p className="font-heading text-lg font-bold">Need a complete irrigation setup?</p>
            <p className="mt-0.5 text-xs text-white/70 sm:text-sm">Choose a ready package by plot size, crop and budget.</p>
          </div>
        </div>
        <Link to="/irrigation-kits" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-extrabold text-[hsl(var(--dt-green-900))] hover:bg-white/90">
          Explore irrigation kits <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  </>
);

export default HomeOfferings;
