import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Map,
  MessageCircle,
  Ruler,
  Sprout,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const engineeringServices = [
  {
    icon: Ruler,
    title: "Irrigation system design",
    description: "Plan a system around your field layout, crop spacing and water requirements.",
  },
  {
    icon: Droplets,
    title: "Water source & pumping",
    description: "Assess water availability, storage, flow and pumping needs.",
  },
  {
    icon: Map,
    title: "Farm layout & planning",
    description: "Map irrigation zones and plan practical water distribution across your farm.",
  },
  {
    icon: Wrench,
    title: "Technical consultation",
    description: "Get guidance on system selection, specifications and implementation.",
  },
];

const whatsappUrl =
  "https://wa.me/254723407849?text=" +
  encodeURIComponent(
    "Hi DripTech Eco-Flow, I would like to discuss irrigation engineering/design and consultation for my farm. My location, crop, farm size and water source are:",
  );

export default function HomeEngineeringServices() {
  return (
    <section
      className="relative overflow-hidden border-y border-border bg-muted/30 py-12 sm:py-16 lg:py-20"
      aria-labelledby="home-engineering-title"
    >
      <div className="dt-container">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
          <div>
            <p className="dt-section-label mb-3">Engineering services</p>
            <h2
              id="home-engineering-title"
              className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              More than equipment.
              <span className="block text-primary">We help you plan the system.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Our irrigation team can help you move from questions about water and
              field layout to a practical irrigation plan. Talk to us about your
              farm, project requirements and the right next steps.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="dt-btn-primary inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Talk to Our Engineers
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary/30 bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                Explore all services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              {["Farm-specific guidance", "Water-use planning", "Equipment matched to your needs"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative h-48 overflow-hidden sm:h-64">
              <img
                src="/engineering/drip-irrigation-layout.svg"
                alt="CAD-style conceptual drip irrigation layout showing four irrigation zones, mainline, sub-main, drip laterals, tank, pump and filter"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--dt-green-900)/0.9)] via-[hsl(var(--dt-green-900)/0.2)] to-transparent" />
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--dt-gold-400))] px-3 py-1.5 text-xs font-extrabold text-[hsl(var(--dt-green-900))]">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                  Designed around your farm
                </span>
                <p className="mt-2 max-w-md font-heading text-xl font-bold text-white sm:text-2xl">
                  Start with your crop, water source and field layout.
                </p>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              {engineeringServices.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className={`flex gap-3 p-4 sm:p-5 ${index % 2 === 0 ? "sm:border-r sm:border-border" : ""} ${index < 2 ? "border-b border-border" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
