import { useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Droplets,
  FileCheck2,
  FileText,
  Gauge,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
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

const PACKAGE_INCLUDED_ITEMS = [
  {
    icon: Layers,
    title: "Hydraulic Block Zoning",
    detail: "Balanced blocks so every plant receives equal water & nutrients",
  },
  {
    icon: Gauge,
    title: "Pump & Filter Matching",
    detail: "Exact TDH pump sizing and micron filtration for your water source",
  },
  {
    icon: FileCheck2,
    title: "Corporate & Farm BOQs",
    detail: "Itemized quotes for private farms, estates, NGOs & county tenders",
  },
  {
    icon: ShieldCheck,
    title: "Field Warranty & Support",
    detail: "Direct access to DripTech agronomists and repair technicians",
  },
];

export default function HomeEngineeringServices() {
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
      className="relative overflow-hidden border-y border-border bg-gradient-to-b from-muted/30 via-background to-muted/20 py-14 sm:py-18 lg:py-22"
      aria-labelledby="home-engineering-title"
    >
      <div className="dt-container space-y-10 sm:space-y-12">
        {/* Top Header + Executive Positioning */}
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              End-to-End Irrigation Engineering & Installation
            </div>
            <h2
              id="home-engineering-title"
              className="font-heading text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              More than equipment supply.
              <span className="mt-1 block text-primary">
                We survey, design, supply &amp; install the complete system.
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Buying pipes and driplines is only half the job—an irrigation
              system succeeds or fails on pressure balance, pipe sizing, and
              filtration. From ¼-acre kitchen gardens to 50+ acre commercial
              estates, our engineers handle the entire journey from water source
              to harvest.
            </p>
          </div>

          {/* Right Quick Action & Assurance Card */}
          <div className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3.5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                  Engineering Desk • Nairobi &amp; Nationwide
                </p>
                <p className="mt-0.5 font-heading text-base font-bold text-foreground sm:text-lg">
                  Need a custom farm layout or official project BOQ?
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Engineers Online
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleEngineerWhatsApp}
                className="dt-btn-primary inline-flex flex-1 min-w-[190px] items-center justify-center gap-2 text-xs sm:text-sm shadow-sm"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Talk to an Irrigation Engineer
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>

              <QuoteModal
                trigger={
                  <button
                    type="button"
                    className="inline-flex flex-1 min-w-[170px] items-center justify-center gap-2 rounded-[10px] border-2 border-primary bg-primary/10 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Request Itemized BOQ
                  </button>
                }
              />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <Link
                to="/book-technician"
                className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                Book an On-Farm Site Survey →
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                View All Engineering Services →
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive 4-Stage Full-System Engineering Blueprint */}
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          {/* Left: 4 Selectable Engineering Stages */}
          <div className="flex flex-col justify-between gap-3">
            {ENGINEERING_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = pillar.id === activePillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActivePillarId(pillar.id)}
                  aria-pressed={isActive}
                  className={`group flex w-full items-start gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-card shadow-md ring-2 ring-primary/15"
                      : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black transition-colors ${
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
                    <h3 className="mt-1 font-heading text-base font-bold text-foreground sm:text-lg">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">
                      {pillar.subtitle}
                    </p>
                  </div>

                  <Icon
                    className={`mt-1 h-5 w-5 shrink-0 transition-transform ${
                      isActive
                        ? "text-primary translate-x-0.5"
                        : "text-muted-foreground/60 group-hover:text-primary"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Active Stage Deep-Dive + Visual Schematic Banner */}
          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            {/* Visual CAD Schematic Header */}
            <div className="relative h-48 overflow-hidden sm:h-56">
              <img
                src="/engineering/drip-irrigation-layout.svg"
                alt="Engineered drip irrigation layout showing zoned blocks, mainline, sub-main, filtration headworks, tank, and pump"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--dt-green-900)/0.94)] via-[hsl(var(--dt-green-900)/0.45)] to-transparent" />
              <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--dt-gold-400))] px-3 py-1 text-[11px] font-extrabold text-[hsl(var(--dt-green-900))] shadow-sm">
                  <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                  Stage {activePillar.step} of 04 • {activePillar.badge}
                </span>
                <span className="rounded-full bg-black/55 backdrop-blur-sm px-3 py-1 font-mono text-[11px] font-bold text-white border border-white/15">
                  {activePillar.metricLabel}: {activePillar.metricValue}
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-4 sm:inset-x-6 sm:bottom-5">
                <h3 className="font-heading text-xl font-bold text-white sm:text-2xl">
                  {activePillar.title}
                </h3>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  {activePillar.subtitle}
                </p>
              </div>
            </div>

            {/* Active Pillar Detailed Scope & Deliverables */}
            <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
              <div>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {activePillar.description}
                </p>

                <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary">
                    What You Receive in Stage {activePillar.step}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {activePillar.deliverables.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs font-semibold text-foreground sm:text-sm"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Designed for smallholder farms, estates &amp; NGO projects</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ENGINEERING_PILLARS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePillarId(p.id)}
                      className={`h-2.5 rounded-full transition-all ${
                        p.id === activePillar.id
                          ? "w-7 bg-primary"
                          : "w-2.5 bg-muted-foreground/30 hover:bg-primary/50"
                      }`}
                      aria-label={`Show stage ${p.step}: ${p.title}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 4-Card Guarantee Strip: Why Engineered Systems Outperform */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGE_INCLUDED_ITEMS.map(({ icon: Icon, title, detail }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
