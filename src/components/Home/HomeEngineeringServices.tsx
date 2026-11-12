import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  FileText,
  Map,
  MessageCircle,
  Ruler,
  Sprout,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "@/components/Home/QuoteModal";

const engineeringServices = [
  {
    icon: Ruler,
    title: "Hydraulic & CAD System Design",
    description:
      "Custom block zoning, pipe sizing, and friction-loss calculations tailored to your crop spacing and topography.",
  },
  {
    icon: Droplets,
    title: "Water Source & Pump Engineering",
    description:
      "Solar, electric, and borehole pump sizing matched to dynamic head, storage tanks, and daily water demand.",
  },
  {
    icon: Map,
    title: "Itemized Bills of Quantities (BOQ)",
    description:
      "Transparent, corporate-grade BOQ proposals with exact component specs for farms, estates, and NGOs.",
  },
  {
    icon: Wrench,
    title: "Field Installation & Commissioning",
    description:
      "Certified technicians handle trenching, headworks assembly, pressure testing, and operator training.",
  },
];

const executionSteps = [
  {
    step: "01",
    title: "Site & Water Assessment",
    detail: "Share your farm size, crop, water source, and location (or book a physical site survey).",
  },
  {
    step: "02",
    title: "Custom BOQ & Layout",
    detail: "Receive an itemized engineering quotation with exact dripline, pipe, filter, and pump specs.",
  },
  {
    step: "03",
    title: "Nationwide Dispatch",
    detail: "Genuine UV-stabilized equipment dispatched from our Nairobi hub to any of the 47 counties.",
  },
  {
    step: "04",
    title: "Installation & Handover",
    detail: "Our field technicians install, pressure-test, and commission your system for peak crop yield.",
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
      <div className="dt-container space-y-12">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
          <div>
            <p className="dt-section-label mb-3">Turnkey Engineering & Design</p>
            <h2
              id="home-engineering-title"
              className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              More than equipment.
              <span className="block text-primary">
                We engineer the entire system.
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Whether you are setting up a 1-acre vegetable plot or a 50-acre
              commercial orchard, our irrigation engineers turn your water
              source and field dimensions into a reliable, pressure-balanced
              irrigation network.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
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

              <QuoteModal>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-primary bg-primary/10 px-4 py-2.5 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Request Project BOQ
                </button>
              </QuoteModal>

              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                Explore Services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              {[
                "Hydraulic pressure balancing",
                "Corporate & NGO LPO billing",
                "Certified technician dispatch",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            <div className="relative h-48 overflow-hidden sm:h-64">
              <img
                src="/engineering/drip-irrigation-layout.svg"
                alt="CAD-style conceptual drip irrigation layout showing four irrigation zones, mainline, sub-main, drip laterals, tank, pump and filter"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--dt-green-900)/0.92)] via-[hsl(var(--dt-green-900)/0.25)] to-transparent" />
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--dt-gold-400))] px-3 py-1.5 text-xs font-extrabold text-[hsl(var(--dt-green-900))]">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                  Precision Hydraulic Zoning
                </span>
                <p className="mt-2 max-w-md font-heading text-xl font-bold text-white sm:text-2xl">
                  Engineered around your crop spacing, water flow, and terrain.
                </p>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              {engineeringServices.map(
                ({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={`flex gap-3 p-4 sm:p-5 ${
                      index % 2 === 0 ? "sm:border-r sm:border-border" : ""
                    } ${index < 2 ? "border-b border-border" : ""}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* 4-Step Execution Pipeline */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
                How We Deliver
              </p>
              <h3 className="mt-0.5 font-heading text-lg sm:text-xl font-bold text-foreground">
                From First Inquiry to Irrigated Harvest in 4 Steps
              </h3>
            </div>
            <Link
              to="/technician-services"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
            >
              Book a Field Technician <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {executionSteps.map(({ step, title, detail }) => (
              <div
                key={step}
                className="relative rounded-xl border border-border/80 bg-background p-4"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground">
                  {step}
                </span>
                <h4 className="mt-3 font-heading text-sm font-bold text-foreground">
                  {title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
