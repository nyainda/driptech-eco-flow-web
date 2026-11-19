import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import SEOHead from "@/components/common/SEOHead";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import FAQSection from "@/components/SEO/FAQSection";
import PumpSolarSizingEngine from "@/components/Calculators/PumpSolarSizingEngine";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_COMPANY } from "@/config/company";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Sun,
} from "lucide-react";

const ENGINEERING_STANDARDS = [
  {
    title: "True PN10 Pipe Friction (Hazen-Williams)",
    desc: "Computes friction losses across suction, borehole riser, and mainline segments using real inner bore diameters rather than nominal OD.",
  },
  {
    title: "Kenya Weather, NOCT Heat & Worst-Month PSH",
    desc: "Models PVGIS/NASA POWER worst cloudy-season PSH (Jun–Jul / May–Jun), NOCT cell temp with wind speed, cold-dawn Voc, and cloud-cover VFD Hz cutoff.",
  },
  {
    title: "Casing, Submergence & Parabolic Duty Matching",
    desc: "Checks 3\" vs 4\"–8\" borehole casing clearance, submergence depth, altitude suction cavitation, DC/AC cable mm², and live DripTech Q–H pump fit.",
  },
];

const PUMP_SOLAR_FAQS = [
  {
    question: "How many solar panels do I need for a 1 HP, 2 HP, or 3 HP borehole pump in Kenya?",
    answer:
      "Because PV modules lose 10–15% efficiency at high daytime cell temperatures (50–65°C) plus 8–14% dust and controller losses, solar arrays should typically be oversized by 1.3× to 1.5× the motor wattage: roughly 1,100–1,400 Wp for 1 HP (750 W), 2,100–2,500 Wp for 1.5–2 HP, and 3,200–3,800 Wp for 3 HP (2.2 kW). Our calculator computes your exact panel string configuration using your region's Peak Sun Hours and controller voltage window.",
  },
  {
    question: "Why should solar irrigation systems in Kenya be sized for June–July cloudy weather?",
    answer:
      "Annual average sunlight hides steep mid-year drops: Central Highlands and Nairobi drop from ~5.9 PSH in February to ~4.2 PSH in June–July overcast skies, while coastal farms dip to ~4.7 PSH in May–June monsoon rains. Sizing your pump flow and array for the worst cloudy month—and buffering with a storage tank—ensures irrigation schedules keep running even during overcast weeks.",
  },
  {
    question: "How do I calculate Total Dynamic Head (TDH) for drip vs sprinkler irrigation?",
    answer:
      "TDH equals Static Water Depth + Borehole Drawdown + Ground Elevation Gain + Tank/Discharge Height + Working Pressure Head (1 bar = 10.2 m; drip uses ~1.0 bar while impact sprinklers require 2.5–3.5 bar and rain guns 4.5+ bar) + Filter/Valve Losses + Hazen-Williams Pipe Friction Losses across every suction, riser, and mainline section.",
  },
  {
    question: "Can a surface river or dam pump lift water more than 6 meters vertically in Nairobi or Nakuru?",
    answer:
      "Rarely. At Kenyan highland altitudes (1,500–2,000 m), lower barometric pressure reduces maximum practical suction lift—including suction pipe friction—to about 5.5–6.0 meters. Exceeding this causes cavitation that pits the impeller and stops priming; place surface pumps close to the water level or switch to a submersible pump.",
  },
  {
    question: "What borehole casing size and submergence depth does a submersible pump require?",
    answer:
      "Standard 4-inch submersible borehole pumps require at least a 4-inch (~100–102 mm ID) casing; narrow 3-inch (~76 mm ID) casings require slim 3-inch pumps. Submersible pumps should hang at least 5–10 meters below the dynamic pumping water level while staying 3–5 meters above borehole bottom silt, and wide 6\"–8\" wells need a motor cooling sleeve.",
  },
  {
    question: "Should I buy solar batteries or a raised water tank for irrigation?",
    answer:
      "For pure daytime irrigation, a raised masonry tank, PVC tank, or HDPE-lined reservoir sized for 1–2 days of crop water demand is usually far more economical than deep-cycle or LiFePO4 batteries. Use solar hybrid battery backup mainly when dawn/dusk pressurized sprinkler or booster pumping without gravity pressure is essential.",
  },
];

const PumpSolarCalculator = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={`Pump & Solar Sizing Calculator Kenya | ${SITE_COMPANY.name}`}
        description="Size borehole, suction, or booster pumps with Hazen-Williams pipe friction, cloudy-season PSH, solar PV strings, cable mm², and live DripTech pump matches."
        url={`${SITE_COMPANY.url}/pump-solar-calculator-kenya`}
        schema={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Irrigation Pump & Solar PV Sizing Calculator Kenya",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          description:
            "Interactive hydraulic pump and solar PV sizing calculator for Kenyan farms: computes water demand, Hazen-Williams pipeline friction, Total Dynamic Head (TDH), worst-month weather derating, solar string topology, DC/AC cable gauge, and pump recommendations.",
          url: `${SITE_COMPANY.url}/pump-solar-calculator-kenya`,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "KES",
          },
          publisher: {
            "@type": "Organization",
            name: SITE_COMPANY.name,
            url: `${SITE_COMPANY.url}/`,
          },
        }}
      />

      <Header />

      <div className="dt-container">
        <Breadcrumbs />
      </div>

      <main id="main-content" tabIndex={-1} className="flex-1 pb-16">
        {/* Hero */}
        <section className="pb-8 pt-2 sm:pb-10">
          <div className="dt-container">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                    <Sun className="h-3.5 w-3.5" />
                    <span>Hydraulic &amp; Solar PV Engineering Workbench</span>
                  </div>

                  <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Irrigation Pump &amp;{" "}
                    <span className="text-primary">Solar Sizing Calculator</span>
                  </h1>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Size any borehole, river/dam surface suction, or pressure booster pump alongside its
                    solar PV panel array, controller Voc window, submersible cable gauge (mm²), and storage tank
                    — calibrated for Kenyan crops, pipe diameters, and regional solar irradiation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/irrigation-cost-calculator-kenya"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Calculator className="h-4 w-4 text-primary" />
                    Drip Cost Calculator
                  </Link>
                  <Link
                    to="/products/pumps"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    View Pumps Catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-3">
                {ENGINEERING_STANDARDS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border/80 bg-background/70 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>{item.title}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Engine */}
        <section className="dt-container">
          <PumpSolarSizingEngine />
        </section>

        {/* Engineering Verification Notice & Related Reading */}
        <section className="dt-container mt-12">
          <Card className="border-border bg-card">
            <CardContent className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-2 lg:col-span-8">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Engineering Verification &amp; Borehole Audit Checklist
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  This workbench models Hazen-Williams pipe losses (C=140 HDPE, C=145 uPVC, C=120/100 GI),
                  Sandia/NOCT module cell temperatures from ambient temperature and wind speed, seasonal Kenyan
                  Peak Sun Hours, centrifugal VFD affinity behavior under cloud cover, and parabolic Q–H curve
                  headroom. Before purchasing or lowering a pump, always verify actual borehole driller yield test
                  (m³/h), dynamic pumping water level (PWL), casing diameter, and manufacturer Q–H duty curves.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Link
                  to="/irrigation-pump-sizing-kenya"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Read Pump Sizing Guide
                </Link>
                <Link
                  to="/solar-irrigation-pumps-kenya"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <Sun className="h-3.5 w-3.5 text-primary" />
                  Solar Pumping Systems
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <FAQSection
          title="Pump & Solar Sizing Questions Answered"
          subtitle="Engineering answers on boreholes, surface suction pumps, cloudy-season PSH, solar panel strings, and storage across Kenya."
          faqs={PUMP_SOLAR_FAQS}
          className="mt-8"
        />
      </main>

      <IrrigationKeywords />
      <Footer />
    </div>
  );
};

export default PumpSolarCalculator;
