import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import SEOHead from "@/components/common/SEOHead";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
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
    desc: "Computes friction head loss across multi-section suction, borehole riser, and field mainline runs using real inner bore diameters rather than nominal OD.",
  },
  {
    title: "Altitude Suction & Cold-Voc Solar Safety",
    desc: "Adjusts barometric suction lift limits for Kenyan highland farms and checks morning cold-weather Voc spikes before matching solar controllers.",
  },
  {
    title: "Parabolic Q–H Headroom Matching",
    desc: "Never sizes a pump by dead-head shutoff rating alone — estimates operating delivery at your exact TDH and checks standard DC/AC cable mm² drop.",
  },
];

const PumpSolarCalculator = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={`Pump & Solar Sizing Calculator Kenya | ${SITE_COMPANY.name}`}
        description="Size borehole, suction, or booster pumps with Hazen-Williams pipe friction, solar PV strings, cable mm², and live DripTech pump matches in Kenya."
        url={`${SITE_COMPANY.url}/pump-solar-calculator-kenya`}
        schema={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Irrigation Pump & Solar PV Sizing Calculator Kenya",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          description:
            "Interactive hydraulic pump and solar PV sizing calculator for Kenyan farms: computes water demand, Hazen-Williams pipeline friction, Total Dynamic Head (TDH), solar string topology, DC/AC cable gauge, and pump recommendations.",
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
                  Engineering Disclaimer &amp; Borehole Verification
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  This tool provides a transparent preliminary hydraulic and PV array sizing model using
                  Hazen-Williams friction (C=140 HDPE, C=145 uPVC, C=120/100 GI) and a parabolic Q–H curve
                  approximation when only Qmax/Hmax datasheet endpoints are available. Before purchasing or
                  lowering a pump, always verify actual borehole yield test (m³/h), dynamic pumping water level
                  (PWL), casing diameter (3&quot; vs 4&quot;+), and exact manufacturer duty curves with our field team.
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
      </main>

      <IrrigationKeywords />
      <Footer />
    </div>
  );
};

export default PumpSolarCalculator;
