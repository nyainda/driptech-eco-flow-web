import { useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Compass,
  FileText,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Sprout,
  Truck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuoteModal from "@/components/Home/QuoteModal";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

interface EngineeringPillar {
  id: string;
  step: string;
  badge: string;
  icon: typeof Ruler;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  metricLabel: string;
  metricValue: string;
}

const ENGINEERING_PILLARS: EngineeringPillar[] = [
  {
    id: "survey",
    step: "01",
    badge: "Site & Water Audit",
    icon: Compass,
    title: "Site Survey & Water Source Assessment",
    subtitle: "Accurate field data before a single pipe is ordered",
    description:
      "We evaluate your borehole, river, dam, or raised tank yield alongside field slope, soil type, and crop row spacing so your system never suffers from dry ends or low pressure.",
    deliverables: [
      "GPS acreage & elevation slope profiling",
      "Water flow rate (m³/hr) & quality assessment",
      "Crop spacing & daily peak water demand calculation",
    ],
    metricLabel: "Coverage",
    metricValue: "All 47 Counties",
  },
  {
    id: "design",
    step: "02",
    badge: "Hydraulic & BOQ Design",
    icon: Ruler,
    title: "Custom Hydraulic Design & Itemized BOQ",
    subtitle: "Engineered pipe sizing, block zoning & transparent costing",
    description:
      "Our engineers design pressure-balanced irrigation blocks, match mainlines and sub-mains to friction-loss limits, and prepare an itemized Bill of Quantities (BOQ) ready for farm owners, banks, or NGO procurement.",
    deliverables: [
      "Zoned block layout for uniform emitter discharge",
      "Total Dynamic Head (TDH) solar/electric pump sizing",
      "Itemized BOQ & Proforma Invoice (LPO & bank financing ready)",
    ],
    metricLabel: "Turnaround",
    metricValue: "Same-Day BOQ",
  },
  {
    id: "supply",
    step: "03",
    badge: "Verified Equipment Supply",
    icon: Truck,
    title: "Genuine UV-Stabilized Equipment Dispatch",
    subtitle: "Complete headworks, pipes, driplines & pumps from one hub",
    description:
      "Every component—from heavy-duty HDPE mainlines and disc/screen filters to turbulent or pressure-compensating (PC) driplines—is checked against your BOQ and dispatched from our Nairobi hub.",
    deliverables: [
      "UV-stabilized driplines (15cm, 20cm & 30cm spacing)",
      "Matched disc/screen filtration & venturi fertigation kits",
      "Fast county-wide dispatch with full packing checklist",
    ],
    metricLabel: "Lifespan",
    metricValue: "5–10+ Yrs UV Rated",
  },
  {
    id: "install",
    step: "04",
    badge: "Installation & Handover",
    icon: Wrench,
    title: "Certified Field Installation & Commissioning",
    subtitle: "On-site assembly, pressure testing & farm team training",
    description:
      "Our field technicians handle trenching guidance, manifold and headworks assembly, lateral flushing, operating pressure calibration, and hands-on training for your farm operators.",
    deliverables: [
      "Full headworks, mainline & sub-main installation",
      "Operating pressure & emitter uniformity testing (1.0–2.5 bar)",
      "Operator maintenance training & after-sales support",
    ],
    metricLabel: "Uniformity",
    metricValue: "92%+ Distribution",
  },
];

const SPECIALIZED_INSTALLATIONS = [
  {
    badge: "0.5mm • 0.75mm • 1.0mm HDPE",
    title: "Dam Liners & Water Pan Installation",
    description:
      "UV-stabilized virgin HDPE geomembrane liners with professional on-site hot-wedge welding, trench anchoring, and water pan volume calculation.",
    bullets: [
      "0.5mm (fine soil), 0.75mm (murram) & 1.0mm (rocky/commercial dams)",
      "On-site technician welding, repair & spillway integration",
    ],
    ctaLabel: "Quote Dam Liner & Welding",
    whatsappPrompt:
      "Hi DripTech! I need a quotation for an HDPE Dam Liner and installation. My dam dimensions (length × width × depth) and location are:",
  },
  {
    badge: "¼ Acre to 50+ Acres",
    title: "Drip & Sprinkler System Installation",
    description:
      "Complete field installation from water source headworks and mainline trenching to sub-main manifolds, lateral flushing, and pressure testing.",
    bullets: [
      "HDPE/PVC mainline piping, gate valves & filtration headworks",
      "Turbulent/PC driplines, rain guns, or pop-up lawn sprinklers",
    ],
    ctaLabel: "Quote Field Installation",
    whatsappPrompt:
      "Hi DripTech! I need a quotation for full irrigation system installation. My farm size, crop, and location are:",
  },
  {
    badge: "Galvanized Steel & Shade Nets",
    title: "Greenhouses & Shade House Construction",
    description:
      "Galvanized steel or treated-timber greenhouses and shade net structures fitted with UV polythene, insect nets, crop support wires, and drip/misting kits.",
    bullets: [
      "8×15m, 8×24m, 8×30m & custom multi-span commercial units",
      "Complete with elevated tank, venturi fertigation & foggers",
    ],
    ctaLabel: "Quote Greenhouse / Shade Net",
    whatsappPrompt:
      "Hi DripTech! I would like a quotation for Greenhouse / Shade House construction and irrigation. My preferred size and location are:",
  },
  {
    badge: "Borehole, River & Tank",
    title: "Solar Pumping & Water Storage Setup",
    description:
      "Off-grid solar water pumping, submersible/surface pump installation, and raised tank plumbing to power your drip or sprinkler blocks with zero fuel cost.",
    bullets: [
      "Total Dynamic Head (TDH) pump & solar PV panel array sizing",
      "Borehole drawdown protection, float switches & booster pumps",
    ],
    ctaLabel: "Size & Quote Solar Pump",
    whatsappPrompt:
      "Hi DripTech! I need help sizing and installing a solar/electric water pump for my farm. My water source, depth/distance, and location are:",
  },
];

export default function HomeEngineeringServices() {
  const [activeView, setActiveView] = useState<"contracting" | "process">("contracting");
  const [activePillarId, setActivePillarId] = useState<string>("design");
  const activePillar =
    ENGINEERING_PILLARS.find((p) => p.id === activePillarId) ||
    ENGINEERING_PILLARS[1];

  const handleEngineerWhatsApp = () => {
    const msg = encodeURIComponent(
      "Hi DripTech Engineering Team! I would like to discuss full-system irrigation design, BOQ, and installation for my farm. My location, acreage, crop, and water source are:"
    );
    openTrackedWhatsApp(
      `https://wa.me/254723407849?text=${msg}`,
      "home engineering section whatsapp"
    );
  };

  return (
    <section
      className="relative overflow-hidden border-y border-border bg-gradient-to-b from-muted/30 via-background to-muted/20 py-8 sm:py-16"
      aria-labelledby="home-engineering-title"
    >
      <div className="dt-container space-y-5 sm:space-y-8">
        {/* Top Header + Executive Action Card */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 sm:mb-3 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-primary">
              <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              End-to-End Engineering &amp; Installation
            </div>
            <h2
              id="home-engineering-title"
              className="font-heading text-2xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-[42px]"
            >
              More than equipment supply.
              <span className="mt-1 block text-primary">
                We survey, design, supply &amp; install the complete system.
              </span>
            </h2>
            <p className="mt-2 sm:mt-3 max-w-2xl text-xs leading-5 sm:text-base sm:leading-6 text-muted-foreground">
              From <strong>HDPE dam liners</strong>, <strong>greenhouses</strong>, and{" "}
              <strong>solar borehole pumps</strong> to complete ¼-acre through 50+ acre
              commercial drip installations—our engineers handle the entire project.
            </p>
          </div>

          {/* Right Quick Action & Assurance Card */}
          <div className="min-w-0 rounded-2xl border border-primary/20 bg-card p-3.5 sm:p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 sm:pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                  Engineering &amp; Contracting Desk • 47 Counties
                </p>
                <p className="mt-0.5 font-heading text-sm font-bold text-foreground sm:text-base">
                  Need a site survey, dam liner, or official project BOQ?
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Engineers Online
              </span>
            </div>

            <div className="mt-3 sm:mt-3.5 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEngineerWhatsApp}
                className="dt-btn-primary inline-flex sm:flex-1 items-center justify-center gap-2 text-xs sm:text-sm py-2.5 shadow-sm"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Talk to an Engineer
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>

              <QuoteModal
                trigger={
                  <button
                    type="button"
                    className="inline-flex sm:flex-1 items-center justify-center gap-2 rounded-[10px] border-2 border-primary bg-primary/10 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Request Itemized BOQ
                  </button>
                }
              />
            </div>

            <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <Link
                to="/book-technician"
                className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                Book On-Farm Site Survey →
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                All Engineering Services →
              </Link>
            </div>
          </div>
        </div>

        {/* Compact View Switcher: Contracting Services vs 4-Stage Engineering Process */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-border pb-2.5 sm:pb-3">
          <div className="grid w-full grid-cols-2 rounded-xl border border-border bg-muted/50 p-1 sm:inline-flex sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveView("contracting")}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                activeView === "contracting"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="sm:hidden">Services &amp; Liners</span>
              <span className="hidden sm:inline">Dam Liners, Installation &amp; Greenhouses</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("process")}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                activeView === "process"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="sm:hidden">4-Step Process</span>
              <span className="hidden sm:inline">How We Engineer Your System (4 Steps)</span>
            </button>
          </div>

          <p className="hidden sm:block text-xs font-semibold text-muted-foreground">
            {activeView === "contracting"
              ? "Click any service below for an instant WhatsApp quotation"
              : "Click any stage to inspect our engineering deliverables"}
          </p>
        </div>

        {/* Tab 1: Specialized Farm Infrastructure & Installation Solutions */}
        {activeView === "contracting" ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {SPECIALIZED_INSTALLATIONS.map((item) => (
              <div
                key={item.title}
                className="flex w-[78vw] max-w-[290px] shrink-0 snap-start sm:w-auto sm:max-w-none flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
              >
                <div>
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {item.badge}
                  </span>
                  <h3 className="mt-2.5 sm:mt-3 font-heading text-base font-bold leading-snug text-foreground sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                  <ul className="hidden sm:block mt-3 space-y-1.5 border-t border-border/70 pt-3">
                    {item.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-[11px] font-medium leading-4 text-foreground/90"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openTrackedWhatsApp(
                      `https://wa.me/254723407849?text=${encodeURIComponent(item.whatsappPrompt)}`,
                      `specialized installation card: ${item.title}`
                    )
                  }
                  className="mt-3.5 sm:mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {item.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Tab 2: Interactive 4-Stage Full-System Engineering Blueprint */
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="flex flex-col justify-between gap-2 sm:gap-2.5">
              {ENGINEERING_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                const isActive = pillar.id === activePillar.id;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActivePillarId(pillar.id)}
                    aria-pressed={isActive}
                    className={`group flex w-full items-start gap-3 sm:gap-3.5 rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-card shadow-md ring-2 ring-primary/15"
                        : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-primary/10 text-primary group-hover:bg-primary/20"
                      }`}
                    >
                      {pillar.step}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                          {pillar.badge}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                          {pillar.metricValue}
                        </span>
                      </div>
                      <h3 className="mt-0.5 font-heading text-sm font-bold text-foreground sm:text-base">
                        {pillar.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {pillar.subtitle}
                      </p>
                    </div>

                    <Icon
                      className={`mt-1 h-4 w-4 shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground/60"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              <div className="relative h-44 overflow-hidden sm:h-48">
                <img
                  src="/engineering/drip-irrigation-layout.svg"
                  alt="Engineered drip irrigation layout showing zoned blocks, mainline, sub-main, filtration headworks, tank, and pump"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--dt-green-900)/0.94)] via-[hsl(var(--dt-green-900)/0.45)] to-transparent" />
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--dt-gold-400))] px-3 py-1 text-[11px] font-extrabold text-[hsl(var(--dt-green-900))] shadow-sm">
                    <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                    Stage {activePillar.step} of 04 • {activePillar.badge}
                  </span>
                  <span className="rounded-full bg-black/55 backdrop-blur-sm px-3 py-1 font-mono text-[11px] font-bold text-white border border-white/15">
                    {activePillar.metricLabel}: {activePillar.metricValue}
                  </span>
                </div>
                <div className="absolute inset-x-5 bottom-3.5">
                  <h3 className="font-heading text-lg font-bold text-white sm:text-xl">
                    {activePillar.title}
                  </h3>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="text-xs sm:text-sm leading-6 text-muted-foreground">
                    {activePillar.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">
                      What You Receive in Stage {activePillar.step}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {activePillar.deliverables.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs font-semibold text-foreground"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Smallholder farms, commercial estates &amp; NGOs
                  </span>
                  <Link
                    to="/irrigation-design-consultation-kenya"
                    className="font-bold text-primary hover:underline"
                  >
                    Design details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
