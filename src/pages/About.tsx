import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import SEOHead from "@/components/common/SEOHead";
import QuoteModal from "@/components/Home/QuoteModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dataService } from "@/services/dataService";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { buildOrganizationSchema, SITE_COMPANY } from "@/config/company";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Droplets,
  FileCheck2,
  HeartHandshake,
  Leaf,
  MapPinned,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  Sprout,
  Truck,
  Wrench,
} from "lucide-react";

/** Verified real field and equipment photos hosted via Cloudflare D1 catalogue/media records. */
const CF_REAL_MEDIA = {
  heroManifold:
    "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/kit-images/irrigation-kits/597p0ax7o7e-1760190959008.jpg",
  dripBedsField:
    "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/kit-images/irrigation-kits/pwwmoognjqq-1760190796903.jpg",
  damLinerField:
    "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/thumbnails/thumbnails/1759469079096_thumbnail.jpg",
  solarPumpProduct:
    "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/images/products/1791361915478-9yq50tqgrk.webp",
  sprinklerRainGun:
    "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/images/products/1755860407371-0vp7ashfupdg.jpg",
} as const;

const isVerifiedRealPhoto = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  if (trimmed.includes("/seed-products/") || trimmed.includes("/category-images/")) {
    return false;
  }
  return (
    trimmed.includes(".supabase.co/storage/v1/object/public/") ||
    trimmed.includes(".r2.dev/")
  );
};

const pickFirstRealImage = (images: unknown): string | null => {
  const list = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  return list.find(isVerifiedRealPhoto) || null;
};

const PILLARS = [
  {
    icon: MapPinned,
    badge: "47 Counties",
    title: "Nationwide Equipment Dispatch",
    description:
      "Consistent supply of driplines, HDPE pipes, filtration headworks, and pumps routed to towns and farms across Kenya.",
  },
  {
    icon: Sprout,
    badge: "⅛ to 50+ Acres",
    title: "Scalable Acreage Solutions",
    description:
      "Modular drip kits for smallholder plots alongside zoned hydraulic systems for commercial horticulture and orchards.",
  },
  {
    icon: FileCheck2,
    badge: "Transparent BOQs",
    title: "Itemized Quotes & Proformas",
    description:
      "Clear breakdown of pipe gauges, emitter spacing, fittings, transport, and labour prepared for farmers, banks, and NGOs.",
  },
  {
    icon: Wrench,
    badge: "Field Commissioning",
    title: "Installation & Liner Welding",
    description:
      "Technician support for mainline assembly, greenhouse drip, hot-wedge HDPE dam liner welding, and operator handover.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Water & Field Review",
    description:
      "We assess your water source (tank, borehole, river, or dam), field slope, soil type, and crop spacing before recommending hardware.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Hydraulic Sizing & BOQ",
    description:
      "Pipes, filtration, and pump heads are matched to friction limits so every irrigation block receives uniform discharge.",
    icon: Ruler,
  },
  {
    step: "03",
    title: "Quality Hardware Dispatch",
    description:
      "All components — UV-stabilized driplines, valves, fittings, and pumps — are checked against your Bill of Quantities prior to shipping.",
    icon: Truck,
  },
  {
    step: "04",
    title: "Install & Farm Handover",
    description:
      "For installation scopes, our field technicians flush laterals, test operating pressure, and train farm staff on maintenance.",
    icon: ShieldCheck,
  },
] as const;

interface SpecialtyItem {
  key: "dripBedsField" | "damLinerField" | "solarPumpProduct" | "sprinklerRainGun";
  title: string;
  detail: string;
  alt: string;
  href: string;
  linkLabel: string;
  fit: "cover" | "contain";
  imagePosition?: string;
}

const SPECIALTIES: SpecialtyItem[] = [
  {
    key: "dripBedsField",
    title: "Drip Kits & UV Driplines",
    detail: "15cm, 20cm & 30cm emitter spacing in ⅛, ¼, ½ and 1+ acre packages.",
    alt: "Drip irrigation lateral lines installed along Kenyan farm crop beds",
    href: "/irrigation-kits",
    linkLabel: "Explore Drip Kits",
    fit: "cover",
  },
  {
    key: "damLinerField",
    title: "HDPE Dam Liners & Piping",
    detail: "0.5mm–1.0mm geomembrane dam liners with on-site welding and pressure pipes.",
    alt: "Installed black HDPE geomembrane farm water pan dam liner",
    href: "/dam-liners-kenya",
    linkLabel: "View Dam Liners",
    fit: "cover",
  },
  {
    key: "solarPumpProduct",
    title: "Solar & Borehole Pumping",
    detail: "Total Dynamic Head pump matching, solar arrays, and elevated tank systems.",
    alt: "Stainless steel solar submersible borehole water pump",
    href: "/solar-irrigation-pumps-kenya",
    linkLabel: "Explore Solar Pumps",
    fit: "contain",
  },
  {
    key: "sprinklerRainGun",
    title: "Sprinklers, Rain Guns & Greenhouses",
    detail: "Gear-drive rain guns, pop-up lawn sprinklers, foggers, and greenhouse setups.",
    alt: "Gear drive rain gun agricultural sprinkler spraying water in the field",
    href: "/services",
    linkLabel: "See Engineering Services",
    fit: "cover",
    imagePosition: "object-center",
  },
];

const CORE_VALUES = [
  {
    icon: Leaf,
    title: "Water Stewardship",
    description:
      "Every layout prioritizes root-zone efficiency, helping Kenyan farms reduce water loss and fertilizer waste across dry seasons.",
  },
  {
    icon: Ruler,
    title: "Engineering Honesty",
    description:
      "We size emitters, disc filters, and pump head accurately from field constraints rather than overselling unnecessary parts.",
  },
  {
    icon: HeartHandshake,
    title: "Practical Farmer Support",
    description:
      "Direct phone and WhatsApp access to Sales and Engineering teams from initial sizing through flushing and seasonal care.",
  },
  {
    icon: ShieldCheck,
    title: "Dependable Materials",
    description:
      "We supply UV-stabilized driplines, virgin HDPE liners, and serviceable fittings selected to withstand Kenyan sun and field conditions.",
  },
] as const;

const MILESTONES = [
  {
    year: "2023",
    tag: "Foundation",
    title: "Built to Simplify Farm Irrigation Sourcing",
    description:
      "Started in Kenya with a clear goal: make accurate irrigation sizing, transparent equipment pricing, and complete kits accessible to everyday growers.",
  },
  {
    year: "2024",
    tag: "47-County Dispatch",
    title: "Standardized Acreage Kits & Courier Supply",
    description:
      "Launched matched ⅛, ¼, ½, and 1-acre drip kits alongside reliable parcel dispatch to farmers across Rift Valley, Central, Eastern, Western, and Coastal regions.",
  },
  {
    year: "2025",
    tag: "Turnkey Works",
    title: "HDPE Dam Liners, Greenhouses & Solar Pumping",
    description:
      "Expanded field services to cover hot-wedge dam liner welding, greenhouse construction, solar pumping calculations, and commercial hydraulic BOQs.",
  },
  {
    year: "Today",
    tag: "Ongoing Focus",
    title: "Supporting Estates, Institutions & Smallholders",
    description:
      "Dedicated Sales and Engineering desks supporting private farms, schools, agribusinesses, and NGOs with documented proformas and practical field execution.",
  },
] as const;

const QUICK_COMPANY_LINKS = [
  { label: "Meet Our Team", href: "/team" },
  { label: "Certifications & Standards", href: "/certifications" },
  { label: "Completed Projects", href: "/projects" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Book a Technician", href: "/technician-services" },
  { label: "47-County Coverage", href: "/irrigation-areas-kenya" },
] as const;

const About = () => {
  const [mediaMap, setMediaMap] = useState<Record<keyof typeof CF_REAL_MEDIA, string>>({
    ...CF_REAL_MEDIA,
  });

  useEffect(() => {
    let cancelled = false;

    const loadCloudflareMedia = async () => {
      try {
        const [kits, videos, pumps, sprinklers] = await Promise.all([
          dataService.getIrrigationKits().catch(() => []),
          dataService.getVideos().catch(() => []),
          dataService
            .getProducts({ category: "pumps_motors", inStock: true, limit: 8 })
            .catch(() => []),
          dataService
            .getProducts({ category: "sprinkler_systems", inStock: true, limit: 12 })
            .catch(() => []),
        ]);

        if (cancelled) return;

        const nextMedia: Record<keyof typeof CF_REAL_MEDIA, string> = {
          ...CF_REAL_MEDIA,
        };

        const oneAcreKit = (kits || []).find((k: any) =>
          String(k?.name || "").toLowerCase().includes("1 acre"),
        );
        const halfAcreKit = (kits || []).find((k: any) =>
          String(k?.name || "").toLowerCase().includes("1/2 acre"),
        );

        const oneAcrePhoto = pickFirstRealImage(oneAcreKit?.images);
        if (oneAcrePhoto) nextMedia.heroManifold = oneAcrePhoto;

        const halfAcrePhoto = pickFirstRealImage(halfAcreKit?.images);
        if (halfAcrePhoto) nextMedia.dripBedsField = halfAcrePhoto;

        const damVideo = (videos || []).find((v: any) =>
          String(v?.title || "").toLowerCase().includes("dam"),
        );
        if (isVerifiedRealPhoto(damVideo?.thumbnail_url)) {
          nextMedia.damLinerField = damVideo.thumbnail_url;
        }

        const sprinklerWithPhoto = (sprinklers || []).find((p: any) =>
          Boolean(pickFirstRealImage(p?.images)),
        );
        const sprinklerPhoto = pickFirstRealImage(sprinklerWithPhoto?.images);
        if (sprinklerPhoto) {
          nextMedia.sprinklerRainGun = sprinklerPhoto;
        }

        const pumpWithPhoto = (pumps || []).find((p: any) =>
          Boolean(pickFirstRealImage(p?.images)),
        );
        const pumpPhoto = pickFirstRealImage(pumpWithPhoto?.images);
        if (pumpPhoto) nextMedia.solarPumpProduct = pumpPhoto;

        setMediaMap(nextMedia);
      } catch (error) {
        console.error("Unable to refresh About photos from Cloudflare D1:", error);
      }
    };

    void loadCloudflareMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SEOHead
        title={`About ${SITE_COMPANY.name} | Irrigation Equipment & Engineering Kenya`}
        description="Learn how DripTech Eco Flow helps Kenyan farms, greenhouses, and estates plan, source, and install drip kits, driplines, HDPE dam liners, sprinklers, and solar pumps."
        url={`${SITE_COMPANY.url}/about`}
        image={mediaMap.heroManifold}
        schema={[buildOrganizationSchema()]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <div className="dt-container">
          <Breadcrumbs />
        </div>

        <main id="main-content" tabIndex={-1}>
          {/* Editorial Split Hero */}
          <section className="pb-12 pt-2 sm:pb-16">
            <div className="dt-container">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10 xl:p-12">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                        <Droplets className="h-3.5 w-3.5" />
                        <span>About DripTech Eco Flow • Since 2023</span>
                      </div>

                      <h1 className="mt-5 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Practical Irrigation Built{" "}
                        <span className="text-primary">for Kenyan Farms</span>
                      </h1>

                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
                        DripTech Eco Flow supplies agricultural irrigation hardware and
                        custom hydraulic engineering across Kenya. From kitchen gardens
                        and greenhouses to multi-acre orchards, we match equipment to your
                        crop, slope, and water source so every drop performs.
                      </p>

                      <ul className="mt-6 grid grid-cols-1 gap-2.5 text-sm text-foreground sm:grid-cols-2">
                        {[
                          "Custom hydraulic layouts & same-day BOQs",
                          "UV-stabilized driplines, filters & fittings",
                          "HDPE dam liner supply & hot-wedge welding",
                          "Equipment dispatch to all 47 Kenyan counties",
                        ].map((point) => (
                          <li key={point} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <QuoteModal>
                        <Button className="h-11 bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
                          Request Custom Quote
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </QuoteModal>

                      <Link
                        to="/products"
                        className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        Browse Catalogue
                      </Link>

                      <Link
                        to="/projects"
                        className="inline-flex h-11 items-center justify-center px-3 text-sm font-semibold text-primary transition-colors hover:underline"
                      >
                        View Field Projects
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Real Field Installation Photography Panel */}
                  <div className="relative min-h-[280px] border-t border-border bg-muted lg:col-span-5 lg:min-h-[480px] lg:border-l lg:border-t-0">
                    <img
                      src={mediaMap.heroManifold}
                      alt="DripTech HDPE mainline manifold and venturi headworks installed on a Kenyan farm"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                      <span className="inline-block rounded bg-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
                        Kenya Field Execution
                      </span>
                      <p className="mt-2 font-heading text-lg font-bold leading-snug sm:text-xl">
                        Engineered from water source to emitter.
                      </p>
                      <p className="mt-1 text-xs text-white/85">
                        Dedicated Sales ({SITE_COMPANY.phonePrimaryDisplay}) &amp;
                        Engineering ({SITE_COMPANY.phoneSecondaryDisplay}) desks
                        supporting growers nationwide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Capabilities Band */}
          <section className="border-y border-border bg-muted/25 py-12 sm:py-16">
            <div className="dt-container">
              <div className="mx-auto max-w-2xl text-center">
                <p className="dt-section-label mb-2">Why Growers Choose Us</p>
                <h2 className="dt-section-title">
                  Built Around Real Field Constraints
                </h2>
                <p className="dt-section-subtitle mx-auto mt-2.5">
                  Reliable irrigation starts with accurate calculations, compatible
                  fittings, and honest communication on delivery and installation scope.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <Card
                      key={pillar.title}
                      className="border-border bg-card transition-colors hover:border-primary/40"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="dt-badge-primary">{pillar.badge}</span>
                        </div>
                        <h3 className="mt-4 font-heading text-base font-bold text-foreground sm:text-lg">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {pillar.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Mission, Vision & 4-Step Execution Method */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="dt-container">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardContent className="p-6 sm:p-8">
                    <p className="dt-section-label mb-2">Our Mission</p>
                    <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                      Make Reliable Irrigation Easy to Plan, Buy &amp; Run
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      We help Kenyan farmers, commercial estates, and agricultural
                      organizations cut through guesswork by pairing correctly sized
                      equipment with straightforward Bills of Quantities and clear
                      installation guidance.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-6 sm:p-8">
                    <p className="dt-section-label mb-2">Our Vision</p>
                    <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                      Water-Smart Farming Across East Africa
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Every farm — from a ⅛-acre kitchen plot to a 50-acre orchard —
                      deserves durable piping, proper filtration, and responsive local
                      engineering support that keeps crops growing season after season.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 4-Step Approach */}
              <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
                  <div>
                    <p className="dt-section-label mb-1.5">How We Work</p>
                    <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                      Four Practical Steps From Farm Idea to Flowing Lines
                    </h3>
                  </div>
                  <Link
                    to="/irrigation-cost-calculator-kenya"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    Try Cost Estimator
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {WORKFLOW_STEPS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="relative">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="font-mono text-xl font-extrabold text-primary/35">
                            {item.step}
                          </span>
                        </div>
                        <h4 className="mt-4 font-heading text-base font-bold text-foreground">
                          {item.title}
                        </h4>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* What We Supply & Build (Real Cloudflare Catalogue & Field Photos) */}
          <section className="border-t border-border bg-muted/25 py-12 sm:py-16">
            <div className="dt-container">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="dt-section-label mb-2">Core Focus Areas</p>
                  <h2 className="dt-section-title">What We Supply &amp; Build</h2>
                </div>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  View Full Catalogue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {SPECIALTIES.map((item) => (
                  <Card
                    key={item.title}
                    className="group flex flex-col overflow-hidden border-border bg-card transition-colors hover:border-primary/40"
                  >
                    <div
                      className={`aspect-[16/10] overflow-hidden ${
                        item.fit === "contain" ? "bg-white p-3" : "bg-muted"
                      }`}
                    >
                      <img
                        src={mediaMap[item.key]}
                        alt={item.alt}
                        className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${
                          item.fit === "contain"
                            ? "object-contain"
                            : `object-cover ${item.imagePosition || "object-center"}`
                        }`}
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3 className="font-heading text-base font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {item.detail}
                        </p>
                      </div>
                      <Link
                        to={item.href}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        {item.linkLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Core Principles & Journey */}
          <section className="border-t border-border bg-background py-12 sm:py-16 lg:py-20">
            <div className="dt-container">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                {/* Core Values (5 cols) */}
                <div className="flex flex-col lg:col-span-5">
                  <p className="dt-section-label mb-2">Principles</p>
                  <h2 className="dt-section-title">What Guides Every Quote</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    We prioritize durable parts, honest hydraulic math, and responsive
                    communication over short-term sales hype.
                  </p>

                  <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
                    {CORE_VALUES.map((value) => {
                      const Icon = value.icon;
                      return (
                        <div
                          key={value.title}
                          className="flex flex-1 items-start gap-3.5 rounded-xl border border-border bg-card p-4"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="font-heading text-base font-bold text-foreground">
                              {value.title}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              {value.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Our Journey Cards (7 cols) */}
                <div className="flex flex-col lg:col-span-7">
                  <p className="dt-section-label mb-2">Milestones</p>
                  <h2 className="dt-section-title">How DripTech Has Grown</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    Expanding steadily from farm kit supply into nationwide equipment
                    dispatch, dam liner welding, and project engineering.
                  </p>

                  <div className="mt-6 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-fr">
                    {MILESTONES.map((milestone) => (
                      <Card
                        key={milestone.year}
                        className="flex h-full flex-col border-border bg-card transition-colors hover:border-primary/40"
                      >
                        <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-2xl font-extrabold text-primary">
                              {milestone.year}
                            </span>
                            <span className="dt-badge-primary">
                              {milestone.tag}
                            </span>
                          </div>
                          <h3 className="mt-3 font-heading text-base font-bold text-foreground sm:text-lg">
                            {milestone.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {milestone.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Explore Company Resources Strip */}
          <section className="border-t border-border bg-muted/25 py-8">
            <div className="dt-container">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-heading text-base font-bold text-foreground">
                    Explore More About DripTech Eco Flow
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_COMPANY_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {item.label}
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Band */}
          <section className="border-t border-border bg-background py-12 sm:py-16">
            <div className="dt-container">
              <Card className="border-border bg-card">
                <CardContent className="p-6 sm:p-10 lg:p-12">
                  <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <p className="dt-section-label mb-2">Start Your Project</p>
                      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                        Need Help Sizing Equipment or Planning a Farm System?
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Share your crop, acreage, water source, and county. Our Sales
                        and Engineering teams will prepare a clear quotation or BOQ and
                        confirm delivery or installation logistics upfront.
                      </p>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Mon–Fri 8:00 AM – 6:00 PM EAT • Sat 9:00 AM – 12:00 PM EAT •
                        Dispatch &amp; site visits scheduled by location
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:col-span-5">
                      <Link
                        to="/contact"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Contact Sales &amp; Engineering
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <a
                          href={`tel:${SITE_COMPANY.phonePrimary}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          <Phone className="h-4 w-4 text-primary" />
                          {SITE_COMPANY.phonePrimaryDisplay}
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            openTrackedWhatsApp(
                              `https://wa.me/${SITE_COMPANY.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
                                "Hi DripTech Eco Flow! I read your About page and would like guidance on an irrigation setup.",
                              )}`,
                              "about page CTA WhatsApp",
                            )
                          }
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[hsl(var(--dt-whatsapp))] px-4 text-sm font-bold text-white transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp Team
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <IrrigationKeywords />
        <Footer />
      </div>
    </>
  );
};

export default About;
