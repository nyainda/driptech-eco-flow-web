import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import FAQSection from "@/components/SEO/FAQSection";
import SimpleContactForm from "@/components/common/SimpleContactForm";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import QuoteModal from "@/components/Home/QuoteModal";
import SEOHead from "@/components/common/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import {
  buildContactPageSchema,
  buildLocalBusinessSchema,
  SITE_COMPANY,
} from "@/config/company";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
  Wrench,
} from "lucide-react";

interface DepartmentDesk {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  primaryValue: string;
  secondaryValue?: string;
  secondaryNote?: string;
  icon: typeof Phone;
  phoneHref?: string;
  whatsappHref?: string;
  whatsappSource?: string;
  emailHref?: string;
  formTopicId: string;
  formButtonLabel: string;
}

const DEPARTMENT_DESKS: DepartmentDesk[] = [
  {
    id: "sales",
    badge: "Orders & Pricing",
    title: "Sales & Dispatch Desk",
    subtitle:
      "Drip kits, driplines, sprinklers, pumps, stock checks, and county courier arrangements.",
    primaryValue: SITE_COMPANY.phonePrimaryDisplay,
    secondaryNote: "Calls & WhatsApp orders • Mon–Sat",
    icon: Phone,
    phoneHref: `tel:${SITE_COMPANY.phonePrimary}`,
    whatsappHref: `https://wa.me/${SITE_COMPANY.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
      "Hi DripTech Sales! I would like product pricing and availability.",
    )}`,
    whatsappSource: "contact page sales desk",
    formTopicId: "kits-supply",
    formButtonLabel: "Request Product Quote",
  },
  {
    id: "engineering",
    badge: "BOQs & Site Surveys",
    title: "Engineering & Technical Desk",
    subtitle:
      "Custom hydraulic layouts, official BOQs, HDPE dam liner welding, and field installation.",
    primaryValue: SITE_COMPANY.phoneSecondaryDisplay,
    secondaryNote: "Technical sizing & site visit scheduling",
    icon: Compass,
    phoneHref: `tel:${SITE_COMPANY.phoneSecondary}`,
    whatsappHref: `https://wa.me/${SITE_COMPANY.phoneSecondary.replace(/\D/g, "")}?text=${encodeURIComponent(
      "Hi DripTech Engineering! I need technical assistance with irrigation design or installation.",
    )}`,
    whatsappSource: "contact page engineering desk",
    formTopicId: "design-boq",
    formButtonLabel: "Request Custom BOQ",
  },
  {
    id: "corporate",
    badge: "LPOs & Proforma",
    title: "Email & Institutional Desk",
    subtitle:
      "Tenders, NGO/institutional procurement, official proforma invoices, and schematic files.",
    primaryValue: SITE_COMPANY.email,
    secondaryValue: SITE_COMPANY.emailAlt,
    icon: Mail,
    emailHref: `mailto:${SITE_COMPANY.email}`,
    formTopicId: "corporate",
    formButtonLabel: "Send LPO / Tender Inquiry",
  },
];

const BUSINESS_HOURS = [
  { day: "Monday – Friday", hours: "8:00 AM – 6:00 PM EAT" },
  { day: "Saturday", hours: "9:00 AM – 12:00 PM EAT" },
  { day: "Sunday", hours: "Closed (Online form open)" },
];

const QUOTE_PREP_ITEMS = [
  {
    title: "Location (County & Town)",
    detail: "Helps confirm courier parcel routing, transport fees, or technician travel.",
  },
  {
    title: "Plot Size or Block Dimensions",
    detail: "Share acreage (e.g., ¼ acre, 1 acre) or length × width so dripline meters are accurate.",
  },
  {
    title: "Crop & Water Source",
    detail: "Note the crop and whether supply comes from an elevated tank, borehole, dam, or river.",
  },
  {
    title: "Install or Supply Scope",
    detail: "Let us know if you want equipment only, full installation, or an itemized bank/NGO BOQ.",
  },
];

const COUNTY_HUBS = [
  { label: "Nairobi", href: "/irrigation-systems-nairobi" },
  { label: "Nakuru", href: "/irrigation-systems-nakuru" },
  { label: "Eldoret & Uasin Gishu", href: "/irrigation-systems-eldoret-uasin-gishu" },
  { label: "Nanyuki & Laikipia", href: "/irrigation-systems-nanyuki-laikipia" },
  { label: "Meru", href: "/irrigation-systems-meru" },
  { label: "Nyeri", href: "/irrigation-systems-nyeri" },
  { label: "Mwea & Kirinyaga", href: "/irrigation-systems-mwea-kirinyaga" },
  { label: "Machakos", href: "/irrigation-systems-machakos" },
  { label: "Kajiado", href: "/irrigation-systems-kajiado" },
  { label: "Kisumu", href: "/irrigation-systems-kisumu" },
  { label: "Kilifi & Coast", href: "/irrigation-systems-kilifi" },
] as const;

const CONTACT_FAQS = [
  {
    question:
      "Which DripTech phone line should I contact — Sales (0723 407 849) or Engineering (0141294497)?",
    answer:
      "Call or WhatsApp Sales on 0723 407 849 for product pricing, drip kits, driplines, sprinklers, pumps, and parcel dispatch. Reach Engineering on 0141294497 for hydraulic sizing, custom BOQs, HDPE dam liner welding, and field installation support.",
  },
  {
    question: "What details should I include to get a faster quotation or BOQ?",
    answer:
      "Share your county or nearest town, irrigated area or plot dimensions, primary crop, water source (tank height, borehole, river, or dam), and whether you need materials only or installation included.",
  },
  {
    question: "How does equipment delivery work outside Nairobi?",
    answer:
      "DripTech dispatches irrigation equipment to towns and farming regions nationwide across Kenya. Before you pay, our sales team confirms stock availability, transport carrier options, and delivery costs for your destination.",
  },
  {
    question: "Can I arrange a farm assessment or technician installation visit?",
    answer:
      "Yes. Use the inquiry form above, call Engineering on 0141294497, or visit our Technician Services page. Availability, scope of work, and any applicable site-visit or travel charges are confirmed in writing before scheduling.",
  },
  {
    question: "How can institutions, NGOs, and commercial estates request formal quotes?",
    answer:
      "Select 'Corporate / NGO LPO' in the inquiry form or email info@dripstech.co.ke with your requirements. We prepare itemized BOQs and official proforma invoices separating materials, transport, and installation scope.",
  },
];

function getEatDeskStatus(now: Date): { isOpen: boolean; label: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Nairobi",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const rawHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const hour = rawHour % 24;
    const totalMinutes = hour * 60 + minute;

    if (weekday === "Sun") {
      return {
        isOpen: false,
        label: "Sunday • Online & WhatsApp messages queued for Monday 8:00 AM EAT",
      };
    }

    if (weekday === "Sat") {
      if (totalMinutes >= 9 * 60 && totalMinutes < 12 * 60) {
        return {
          isOpen: true,
          label: "Open Now (Saturday Hours until 12:00 PM EAT)",
        };
      }
      return {
        isOpen: false,
        label:
          totalMinutes < 9 * 60
            ? "Saturday desk opens at 9:00 AM EAT • Send an inquiry anytime"
            : "Saturday desk closed at 12:00 PM EAT • Reopens Monday 8:00 AM EAT",
      };
    }

    if (totalMinutes >= 8 * 60 && totalMinutes < 18 * 60) {
      return {
        isOpen: true,
        label: "Open Now • Sales & Engineering desks active until 6:00 PM EAT",
      };
    }

    return {
      isOpen: false,
      label: "After Hours • Form & WhatsApp inquiries answered next business morning",
    };
  } catch {
    return {
      isOpen: true,
      label: "Mon–Fri 8:00 AM – 6:00 PM EAT • Sat 9:00 AM – 12:00 PM EAT",
    };
  }
}

const Contact = () => {
  const { toast } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("kits-supply");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [deskStatus, setDeskStatus] = useState(() => ({
    isOpen: true,
    label: "Mon–Fri 8:00 AM – 6:00 PM EAT • Sat 9:00 AM – 12:00 PM EAT",
  }));

  useEffect(() => {
    const updateStatus = () => setDeskStatus(getEatDeskStatus(new Date()));
    updateStatus();
    const interval = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      toast({
        title: "Copied to Clipboard",
        description: `${label} (${value}) copied.`,
      });
      window.setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current));
      }, 2000);
    } catch {
      toast({
        title: "Copy Unavailable",
        description: `Please copy manually: ${value}`,
      });
    }
  };

  const jumpToFormWithTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    const el = document.getElementById("contact-form");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead
        title={`Contact ${SITE_COMPANY.name} | Irrigation Supplies & Services Kenya`}
        description={`Call or WhatsApp ${SITE_COMPANY.phonePrimaryDisplay} (Sales) or ${SITE_COMPANY.phoneSecondaryDisplay} (Engineering) for drip kits, driplines, BOQs, and irrigation supplies in Kenya. Email ${SITE_COMPANY.email}.`}
        keywords="contact DripTech, drip irrigation phone Kenya, irrigation WhatsApp Kenya, buy drip kit Nairobi contact, 0723407849, 0141294497"
        url="https://www.dripstech.co.ke/contact"
        image={`${SITE_COMPANY.url}/seed-products/plant_drip.jpg`}
        schema={[buildLocalBusinessSchema(), buildContactPageSchema()]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <div className="dt-container">
          <Breadcrumbs />
        </div>

        <main id="main-content" tabIndex={-1}>
          {/* Editorial Hero & Quick Department Router */}
          <section className="pb-10 pt-2 sm:pb-14">
            <div className="dt-container">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="dt-section-label mb-2">Direct Access • Kenya</p>
                    <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      Talk to Our{" "}
                      <span className="text-primary">Irrigation Specialists</span>
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Reach our Sales team for equipment prices and nationwide parcel
                      dispatch, or speak directly with Engineering for hydraulic layouts,
                      BOQs, HDPE dam liners, and farm installations.
                    </p>
                  </div>

                  {/* Live EAT Business Status Pill + Quick Hero Actions */}
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-foreground">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          deskStatus.isOpen ? "bg-primary" : "bg-accent"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{deskStatus.label}</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <a
                        href={`tel:${SITE_COMPANY.phonePrimary}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
                      >
                        <Phone className="h-4 w-4" />
                        Call {SITE_COMPANY.phonePrimaryDisplay}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          openTrackedWhatsApp(
                            `https://wa.me/${SITE_COMPANY.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
                              "Hi DripTech Eco Flow! I would like help with irrigation equipment or a quote.",
                            )}`,
                            "contact hero WhatsApp",
                          )
                        }
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[hsl(var(--dt-whatsapp))] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.9)] sm:text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Sales
                      </button>
                      <button
                        type="button"
                        onClick={() => jumpToFormWithTopic("kits-supply")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:text-sm"
                      >
                        Send Inquiry Form
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Department Routing Cards */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {DEPARTMENT_DESKS.map((desk) => {
                    const Icon = desk.icon;
                    const isCopiedPrimary = copiedValue === desk.primaryValue;
                    return (
                      <div
                        key={desk.id}
                        className="flex flex-col rounded-xl border border-border bg-background/80 p-5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="dt-badge-primary">{desk.badge}</span>
                          </div>

                          <h2 className="mt-3.5 font-heading text-lg font-bold text-foreground">
                            {desk.title}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {desk.subtitle}
                          </p>

                          <div className="mt-auto pt-4">
                            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/35 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="min-w-0 break-all font-mono text-xs font-bold text-foreground sm:text-sm">
                                  {desk.primaryValue}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(desk.primaryValue, desk.title)
                                  }
                                  aria-label={`Copy ${desk.title} contact`}
                                  className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {isCopiedPrimary ? (
                                    <>
                                      <Check className="h-3 w-3 text-primary" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>

                              {desk.secondaryValue ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                                  <span className="min-w-0 break-all font-mono text-xs font-medium text-muted-foreground">
                                    {desk.secondaryValue}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        desk.secondaryValue!,
                                        "Alternate Email",
                                      )
                                    }
                                    aria-label="Copy alternate email address"
                                    className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    {copiedValue === desk.secondaryValue ? (
                                      <>
                                        <Check className="h-3 w-3 text-primary" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                desk.secondaryNote && (
                                  <div className="border-t border-border/60 pt-2 text-[11px] font-medium text-muted-foreground">
                                    {desk.secondaryNote}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {desk.phoneHref && (
                            <a
                              href={desk.phoneHref}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                          )}

                          {desk.whatsappHref && (
                            <button
                              type="button"
                              onClick={() =>
                                openTrackedWhatsApp(
                                  desk.whatsappHref!,
                                  desk.whatsappSource || "contact desk",
                                )
                              }
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--dt-whatsapp))] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </button>
                          )}

                          {desk.emailHref && (
                            <a
                              href={desk.emailHref}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Compose Email
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => jumpToFormWithTopic(desk.formTopicId)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            {desk.formButtonLabel}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Main Contact Workspace: Form + Practical Sidebar */}
          <section
            id="contact-form"
            className="border-t border-border bg-muted/20 py-10 sm:py-14 lg:py-16"
          >
            <div className="dt-container">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                {/* Interactive Inquiry Form */}
                <div className="lg:col-span-7">
                  <SimpleContactForm
                    selectedTopicId={selectedTopicId}
                    onTopicChange={setSelectedTopicId}
                  />
                </div>

                {/* High-Utility Support Sidebar */}
                <aside className="space-y-5 lg:col-span-5">
                  {/* Interactive Tools Card */}
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                      <p className="dt-section-label mb-1">Interactive Tools</p>
                      <h2 className="font-heading text-xl font-bold text-foreground">
                        Prefer a Faster Route?
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Select specific products for WhatsApp, book a field
                        technician, or estimate dripline quantities before chatting.
                      </p>

                      <div className="mt-4 space-y-2.5">
                        <WhatsAppContact className="w-full justify-center" />

                        <QuoteModal>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span className="inline-flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Open Detailed Custom BOQ Form
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </QuoteModal>

                        <Link
                          to="/technician-services"
                          className="flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-primary" />
                            Book a Field Technician Visit
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>

                        <Link
                          to="/irrigation-cost-calculator-kenya"
                          className="flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            Estimate Setup Cost & Dripline Rolls
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Faster Quote Prep Checklist */}
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                      <p className="dt-section-label mb-1">Preparation Guide</p>
                      <h3 className="font-heading text-lg font-bold text-foreground">
                        What Helps Us Quote Faster
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {QUOTE_PREP_ITEMS.map((item) => (
                          <li key={item.title} className="flex items-start gap-2.5">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                              <span className="block text-sm font-semibold text-foreground">
                                {item.title}
                              </span>
                              <span className="block text-xs leading-relaxed text-muted-foreground">
                                {item.detail}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Business Hours Card */}
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                          <Clock className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-heading text-lg font-bold text-foreground">
                            Business Hours (EAT)
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            East Africa Time • Online form open 24/7
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {BUSINESS_HOURS.map((schedule) => (
                          <div
                            key={schedule.day}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm"
                          >
                            <span className="font-medium text-foreground">
                              {schedule.day}
                            </span>
                            <span className="font-semibold text-primary">
                              {schedule.hours}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </div>
          </section>

          {/* Nationwide Kenya Delivery & Field Coverage */}
          <section className="border-t border-border bg-background py-12 sm:py-16">
            <div className="dt-container">
              <div className="mx-auto max-w-2xl text-center">
                <p className="dt-section-label mb-2">Nationwide Coverage</p>
                <h2 className="dt-section-title">
                  Equipment Dispatch & Farm Support Across Kenya
                </h2>
                <p className="dt-section-subtitle mx-auto mt-3">
                  Share your county, nearest town, and equipment list. Delivery routes,
                  farm assessments, and installation schedules are confirmed upfront
                  according to your location and project scope.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Truck className="h-5 w-5" />
                      </span>
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        Equipment Dispatch Across 47 Counties
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      From dripline rolls and complete acreage kits to HDPE pipes,
                      filters, and pumps — our sales desk confirms stock, courier
                      routing, and transport arrangements before dispatch.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        On-Site Installation & Dam Liner Welding
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      For hydraulic installations, greenhouse drip setups, and HDPE
                      dam liner hot-wedge welding, send your location, crop, field
                      size, and water source to confirm technician scheduling.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Links to Regional Guides */}
              <div className="mt-8 rounded-2xl border border-border bg-muted/25 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Browse Regional Irrigation Guides & Dispatch Routes
                  </h3>
                  <Link
                    to="/irrigation-areas-kenya"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    View All Kenya Service Areas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {COUNTY_HUBS.map((hub) => (
                    <Link
                      key={hub.href}
                      to={hub.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <MapPin className="h-3 w-3 text-primary" />
                      {hub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Practical Contact & Ordering FAQs */}
          <FAQSection
            title="Questions about contacting or ordering?"
            faqs={CONTACT_FAQS}
            className="py-10 sm:py-14"
          />
        </main>

        <IrrigationKeywords />
        <Footer />
      </div>
    </>
  );
};

export default Contact;
