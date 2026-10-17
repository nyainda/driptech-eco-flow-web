import {
  ArrowRight,
  Calculator,
  MessageCircle,
  Package,
  Ruler,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";

const planningPaths = [
  {
    number: "01",
    icon: Calculator,
    eyebrow: "Plan your budget",
    title: "Estimate irrigation costs",
    description:
      "Build a starting estimate, then confirm the design and quotation for your actual farm conditions.",
    action: "Open cost calculator",
    href: "/irrigation-cost-calculator-kenya",
    tone: "bg-primary/10 text-primary",
  },
  {
    number: "02",
    icon: Package,
    eyebrow: "Choose a package",
    title: "Explore irrigation kits",
    description:
      "Compare available kits and check coverage, included components and current pricing before you buy.",
    action: "Compare available kits",
    href: "/irrigation-kits",
    tone: "bg-accent/15 text-accent-foreground",
  },
  {
    number: "03",
    icon: Ruler,
    eyebrow: "Plan for your farm",
    title: "Get system guidance",
    description:
      "The crop, field layout, water source and pressure all help determine which setup is suitable.",
    action: "Explore irrigation services",
    href: "/services",
    tone: "bg-muted text-muted-foreground",
  },
];

export default function HomePlanningSection() {
  return (
    <section
      className="relative overflow-hidden border-y border-border bg-muted/25 py-12 sm:py-16 lg:py-20"
      aria-labelledby="home-planning-title"
    >
      <div className="dt-container">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <p className="dt-section-label mb-3">Make your next step easier</p>
          <h2
            id="home-planning-title"
            className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            From product selection to a{" "}
            <span className="text-primary">farm-ready plan.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Whether you need a few components or a complete irrigation system,
            start with the option that matches where you are today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 sm:gap-5">
          {planningPaths.map(({ number, icon: Icon, eyebrow, title, description, action, href, tone }) => (
            <Link
              key={number}
              to={href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.15em] text-muted-foreground/70">
                  {number}
                </span>
              </div>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">
                {eyebrow}
              </p>
              <h3 className="mt-1.5 font-heading text-xl font-bold leading-snug text-foreground">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                {action}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[hsl(var(--dt-green-900))] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[hsl(var(--dt-gold-400))]">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-heading text-lg font-bold sm:text-xl">
                Not sure what your farm needs?
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/75">
                Tell us your crop, approximate area and water source. We can help you identify what to check before requesting a quote.
              </p>
            </div>
          </div>
          <a
            href={"https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech! I need help choosing an irrigation setup. My crop, farm area and water source are:")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--dt-gold-500))] px-4 py-3 text-sm font-extrabold text-[hsl(var(--dt-green-900))] transition-colors hover:bg-[hsl(var(--dt-gold-400))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--dt-green-900))]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
