import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Sprout,
  Wrench,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import SEOHead from "@/components/common/SEOHead";
import KitPriceTable from "@/components/SEO/KitPriceTable";
import { dataService } from "@/services/dataService";
import pages from "@/data/publicSeoPages.json";
import locationPages from "@/data/locationSeoPages.json";
import irrigationPricePages from "@/data/irrigationPriceSeoPages.json";
import irrigationCropGapPages from "@/data/irrigationCropGapPages.json";
import { SITE_COMPANY, buildLocalBusinessSchema } from "@/config/company";
import {
  openInstantProductQuotePdf,
  openProductCataloguePdf,
} from "@/lib/catalogAndQuotePdf";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

const allPages = [
  ...pages,
  ...locationPages,
  ...irrigationPricePages,
  ...irrigationCropGapPages,
];

const locationSlugSet = new Set(locationPages.map((p) => p.slug));
const priceSlugSet = new Set([
  ...irrigationPricePages.map((p) => p.slug),
  "drip-irrigation-kit-price-kenya",
  "irrigation-system-cost-kenya",
  "one-acre-drip-irrigation-system-kenya",
  "irrigation-boq-kenya",
  "irrigation-bill-of-quantities-kenya",
  "dam-liner-prices-kenya",
]);
const cropSlugSet = new Set([
  ...irrigationCropGapPages.map((p) => p.slug),
  ...pages
    .map((p) => p.slug)
    .filter((s) => /^drip-irrigation-for-|-irrigation-kenya$/.test(s) && /tomato|onion|potato|capsicum|cabbage|watermelon|avocado|coffee|maize/.test(s)),
]);

type ClusterKey = "all" | "dam_storage" | "crops" | "prices_kits" | "locations" | "engineering";

function getGuideCluster(slug: string): Exclude<ClusterKey, "all"> {
  if (/dam-liner|water-pan|fish-pond|water-storage-tanks/.test(slug)) return "dam_storage";
  if (locationSlugSet.has(slug) || /^irrigation-systems-|^irrigation-areas-/.test(slug)) return "locations";
  if (cropSlugSet.has(slug)) return "crops";
  if (priceSlugSet.has(slug) || /price|cost|kit|driplines-for-sale/.test(slug)) return "prices_kits";
  return "engineering";
}

const CLUSTER_META: Record<
  Exclude<ClusterKey, "all">,
  { label: string; badgeClass: string }
> = {
  dam_storage: {
    label: "Dam Liners & Water Storage",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  crops: {
    label: "Crop Irrigation Guide",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  prices_kits: {
    label: "Equipment, Kits & Pricing",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  locations: {
    label: "County & Regional Guide",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  engineering: {
    label: "Engineering, Design & Troubleshooting",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
};

const seoProductCategory = (slug: string): string | undefined => {
  if (/sprinkler|raingun|rain-gun|rain-hose|pop-up|fodder/.test(slug)) return "sprinkler_systems";
  if (/pump|borehole|solar/.test(slug)) return "pumps_motors";
  if (/filter|filtration|clog|blocked/.test(slug)) return "filtration_systems";
  if (/pipe|fitting|hdpe|upvc|leak/.test(slug)) return "pipes_fittings";
  if (/fertigation|venturi/.test(slug)) return "fertigation_systems";
  if (/valve|control|solenoid|timer/.test(slug)) return "valves_regulators";
  if (/greenhouse|shade-net|flower|rose/.test(slug)) return "greenhouse_systems";
  if (/button-dripper|orchard|avocado|macadamia|mango|citrus|banana|pawpaw/.test(slug)) return "emitters_drippers";
  if (/drip|irrigation|boq|installation|maintenance|consultation|design|dam-liner|water-pan/.test(slug)) return "drip_irrigation";
  return undefined;
};

const firstCatalogueImage = (product: any): string | undefined => {
  const images = Array.isArray(product?.images) ? product.images : [];
  return images.find((item: unknown) => typeof item === "string" && item.trim());
};

interface SeoSectionTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

interface SeoSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: SeoSectionTable;
}

type SeoPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  image?: string;
  schema?: Record<string, unknown>;
  sections: SeoSection[];
  links: Array<{ label: string; href: string }>;
  sources?: Array<{ label: string; url: string }>;
  faqs?: Array<{ q: string; a: string }>;
};

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SEOContentPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+|\/+$/g, "");
  const page = allPages.find((candidate) => candidate.slug === slug) as SeoPage | undefined;
  const [catalogueImage, setCatalogueImage] = useState<string>();
  const [matchingProducts, setMatchingProducts] = useState<any[]>([]);
  const [hubCluster, setHubCluster] = useState<ClusterKey>("all");
  const [hubQuery, setHubQuery] = useState("");
  const [downloadingCat, setDownloadingCat] = useState(false);

  useEffect(() => {
    let active = true;
    setCatalogueImage(undefined);
    setMatchingProducts([]);
    const category = seoProductCategory(slug);
    if (page && category) {
      dataService
        .getProducts({ category, limit: 24 })
        .then((result: any) => {
          if (!active) return;
          const products = Array.isArray(result) ? result : result?.products ?? result?.data ?? [];
          const withImages = products.filter((p: any) => firstCatalogueImage(p));
          const image = withImages.map(firstCatalogueImage).find(Boolean);
          if (image) setCatalogueImage(image);
          setMatchingProducts((withImages.length ? withImages : products).slice(0, 4));
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [slug, page]);

  const filteredHubPages = useMemo(() => {
    const q = hubQuery.trim().toLowerCase();
    return allPages.filter((item) => {
      if (item.slug === slug) return false;
      const itemCluster = getGuideCluster(item.slug);
      if (hubCluster !== "all" && itemCluster !== hubCluster) return false;
      if (!q) return true;
      return (
        item.h1.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [hubCluster, hubQuery, slug]);

  const handleDownloadCatalogue = async () => {
    setDownloadingCat(true);
    try {
      await openProductCataloguePdf({
        title: "Key Irrigation Equipment, Kits & Dam Liners Catalogue",
        mode: "executive",
      });
    } finally {
      setDownloadingCat(false);
    }
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEOHead
          title={`Page Not Found | ${SITE_COMPANY.name}`}
          description={`The requested irrigation guide could not be found. Browse current ${SITE_COMPANY.name} products and guides.`}
          url={`${SITE_COMPANY.url}${location.pathname}`}
          noindex
        />
        <Header />
        <main className="dt-section">
          <div className="dt-container text-center">
            <h1 className="dt-section-title">Page not found</h1>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="dt-btn-primary inline-flex">
                Return home
              </Link>
              <Link to="/irrigation-guides-kenya" className="dt-btn-secondary inline-flex">
                Browse all irrigation guides
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const clusterKey = getGuideCluster(page.slug);
  const clusterMeta = CLUSTER_META[clusterKey];
  const pageUrl = `${SITE_COMPANY.url}/${page.slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_COMPANY.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kenya Irrigation Guides",
        item: `${SITE_COMPANY.url}/irrigation-guides-kenya`,
      },
      { "@type": "ListItem", position: 3, name: page.h1, item: pageUrl },
    ],
  };
  const faqItems = (Array.isArray(page.faqs) ? page.faqs : []).filter(
    (faq) => faq?.q && faq?.a,
  );
  const faqSchema = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }
    : undefined;

  const isMasterHub = page.slug === "irrigation-guides-kenya";
  const resolvedPageImage = page.image
    ? /^https?:\/\//i.test(page.image)
      ? page.image
      : `${SITE_COMPANY.url}${page.image}`
    : undefined;
  const heroImageUrl =
    (page.image && /^https?:\/\//i.test(page.image) ? page.image : undefined) ||
    catalogueImage ||
    page.image;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={page.title}
        description={page.description}
        url={pageUrl}
        image={heroImageUrl || resolvedPageImage}
        schema={[
          buildLocalBusinessSchema(),
          breadcrumbSchema,
          ...(page.schema ? [page.schema] : []),
          ...(faqSchema ? [faqSchema] : []),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.h1,
            description: page.description,
            url: pageUrl,
            author: { "@type": "Organization", name: SITE_COMPANY.name },
            publisher: { "@type": "Organization", name: SITE_COMPANY.name, url: SITE_COMPANY.url },
          },
        ]}
      />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="dt-section border-b border-border bg-gradient-to-b from-primary/[0.04] via-background to-background">
          <div className="dt-container max-w-6xl">
            {/* Breadcrumb & Cluster Pill */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span>/</span>
                <Link to="/irrigation-guides-kenya" className="hover:text-primary">Kenya Irrigation Guides</Link>
                <span>/</span>
                <span className="text-foreground line-clamp-1">{page.h1}</span>
              </nav>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${clusterMeta.badgeClass}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {clusterMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
              <div className="min-w-0">
                <p className="dt-section-label mb-2">DripTech EcoFlow Engineering Guide</p>
                <h1 className="dt-section-title text-3xl sm:text-4xl lg:text-5xl">{page.h1}</h1>
                <p className="dt-section-subtitle mt-4 text-base sm:text-lg leading-relaxed">{page.intro}</p>

                {/* Primary Conversion CTA Bar */}
                <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3">
                  <Link
                    to="/products"
                    className="dt-btn-primary col-span-2 inline-flex min-h-11 items-center justify-center gap-2 sm:col-span-1"
                  >
                    Browse Products & Prices <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleDownloadCatalogue}
                    disabled={downloadingCat}
                    className="dt-btn-secondary inline-flex min-h-11 items-center justify-center gap-1.5 border-primary/40 bg-primary/5 px-3 text-xs sm:px-5 sm:text-sm text-primary hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="sm:hidden">{downloadingCat ? "PDF..." : "PDF Catalogue"}</span>
                    <span className="hidden sm:inline">{downloadingCat ? "Preparing PDF..." : "Download PDF Catalogue"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openTrackedWhatsApp(
                        `https://wa.me/254111409454?text=${encodeURIComponent(
                          `Hi DripTech EcoFlow, I am reading your guide on "${page.h1}" (${pageUrl}) and would like engineering advice and a quotation for my farm.`,
                        )}`,
                        `SEO guide hero WhatsApp: ${page.slug}`,
                      )
                    }
                    className="dt-btn-whatsapp inline-flex min-h-11 items-center justify-center gap-1.5 px-3 text-xs sm:px-5 sm:text-sm"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className="sm:hidden">WhatsApp</span>
                    <span className="hidden sm:inline">WhatsApp Engineer</span>
                  </button>
                  <Link
                    to="/irrigation-cost-calculator-kenya"
                    className="dt-btn-secondary col-span-2 inline-flex min-h-11 items-center justify-center gap-2 sm:col-span-1"
                  >
                    <Calculator className="h-4 w-4 shrink-0" />
                    Cost Calculator
                  </Link>
                </div>

                {/* Quick Jump Table of Contents */}
                {page.sections.length > 0 && (
                  <div className="mt-6 min-w-0 max-w-full rounded-xl border border-border/80 bg-card/60 p-3.5">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      In This Technical Guide:
                    </p>
                    <div className="scrollbar-hide -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                      {page.sections.map((section, idx) => (
                        <a
                          key={section.heading}
                          href={`#section-${slugifyHeading(section.heading)}`}
                          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary sm:whitespace-normal"
                        >
                          <span className="font-bold text-primary">{idx + 1}.</span>
                          {section.heading}
                        </a>
                      ))}
                      {faqItems.length > 0 && (
                        <a
                          href="#guide-faqs"
                          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          FAQs ({faqItems.length})
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {heroImageUrl && (
                <figure className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
                  <img
                    src={heroImageUrl}
                    alt={`${page.h1} — irrigation equipment and farm water delivery`}
                    width="1200"
                    height="675"
                    loading="eager"
                    {...({ fetchpriority: "high" } as Record<string, string>)}
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <figcaption className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                    <span>DripTech EcoFlow field & catalogue reference equipment</span>
                    <Link to="/products" className="font-semibold text-primary hover:underline">
                      View Catalogue →
                    </Link>
                  </figcaption>
                </figure>
              )}
            </div>
          </div>
        </section>

        {/* Main Content + Sticky Engineering Sidebar */}
        <section className="dt-section">
          <div className="dt-container max-w-6xl grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-8">
              {(slug === "drip-irrigation-kit-price-kenya" || slug === "eighth-quarter-half-acre-drip-kit-kenya") && (
                <KitPriceTable />
              )}

              {page.sections.map((section, idx) => (
                <article
                  key={section.heading}
                  id={`section-${slugifyHeading(section.heading)}`}
                  className="dt-card min-w-0 scroll-mt-24 p-4 sm:p-8"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Technical Specification & Planning
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {section.table && section.table.headers?.length > 0 && section.table.rows?.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground sm:hidden">
                        Swipe table horizontally to compare specs →
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[480px] border-collapse text-left text-xs sm:text-sm">
                        {section.table.caption && (
                          <caption className="border-b border-border bg-muted/20 px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                            {section.table.caption}
                          </caption>
                        )}
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            {section.table.headers.map((header) => (
                              <th key={header} scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-foreground">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {section.table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-muted/20">
                              {row.map((cell, cellIndex) =>
                                cellIndex === 0 ? (
                                  <th key={cellIndex} scope="row" className="px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-foreground">
                                    {cell}
                                  </th>
                                ) : (
                                  <td key={cellIndex} className="px-3 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">
                                    {cell}
                                  </td>
                                ),
                              )}
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {section.bullets && (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-1">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 rounded-lg border border-border/60 bg-muted/15 p-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}

              {/* Live Matching Catalogue Equipment Block */}
              {matchingProducts.length > 0 && (
                <section aria-label="Recommended equipment from DripTech catalogue" className="dt-card border-primary/25 bg-gradient-to-br from-primary/[0.03] to-background p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Live Catalogue Equipment
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        Recommended Equipment for This Guide
                      </h2>
                    </div>
                    <Link to="/products" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                      View All Products <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {matchingProducts.map((product) => {
                      const img = firstCatalogueImage(product) || "/driptech-logo.png";
                      const price = Number(product.price);
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                        >
                          <div className="flex gap-3.5">
                            <img
                              src={img}
                              alt={product.name}
                              loading="lazy"
                              className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover bg-muted"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm text-foreground line-clamp-2">
                                {product.name}
                              </h3>
                              {product.model_number && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  SKU: {product.model_number}
                                </p>
                              )}
                              <p className="mt-1.5 text-sm font-extrabold text-primary">
                                {price > 0 ? `KES ${price.toLocaleString()}` : "Request Custom Quote"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                            <button
                              type="button"
                              onClick={() => openInstantProductQuotePdf(product)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                              Instant PDF Quote
                            </button>
                            <Link
                              to="/products"
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                            >
                              Specs <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* FAQ Section */}
              {faqItems.length > 0 && (
                <section id="guide-faqs" aria-label="Frequently asked questions" className="dt-card scroll-mt-24 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Engineering Q&A
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
                  <div className="mt-6 divide-y divide-border">
                    {faqItems.map((faq) => (
                      <div key={faq.q} className="py-4 first:pt-0 last:pb-0">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">{faq.q}</h3>
                        <p className="mt-2 leading-7 text-muted-foreground text-sm sm:text-base">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky Engineering Sidebar */}
            <aside className="min-w-0 h-fit space-y-6 lg:sticky lg:top-24">
              {/* Related Guides Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Related Irrigation Guides
                </h2>
                <nav className="mt-4 space-y-2.5" aria-label="Related irrigation pages">
                  {page.links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="flex items-start gap-2 rounded-lg p-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 hover:underline"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  <Link
                    to="/irrigation-guides-kenya"
                    className="mt-2 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                  >
                    <span>Browse All {allPages.length}+ Kenya Guides</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </nav>

                {page.sources?.length ? (
                  <section className="mt-6 border-t border-border pt-5" aria-label="Background sources">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Local Context & Further Reading
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {page.sources.map((source) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {source.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              {/* Direct Engineering & PDF Catalogue Card */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.06] to-card p-6 shadow-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  Free Engineering Review
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">
                  Need a Custom Farm BOQ or PDF Catalogue?
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Share your crop, acreage, water source (borehole, river, dam or tank) and county location for a tailored Bill of Quantities.
                </p>

                <div className="mt-4 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      openTrackedWhatsApp(
                        `https://wa.me/254111409454?text=${encodeURIComponent(
                          `Hi DripTech EcoFlow, I read your guide "${page.h1}" and need help sizing a system / getting a quotation for my farm.`,
                        )}`,
                        `SEO sidebar WhatsApp: ${page.slug}`,
                      )
                    }
                    className="dt-btn-whatsapp inline-flex w-full items-center justify-center gap-2 text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp 0111 409 454
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCatalogue}
                    disabled={downloadingCat}
                    className="dt-btn-secondary inline-flex w-full items-center justify-center gap-2 text-xs font-semibold"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    {downloadingCat ? "Generating PDF..." : "Download Light PDF Catalogue"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Interactive Searchable All-Guides Directory Hub (Internal Link Mesh for Users & Search Engines) */}
        <section className="dt-section border-t border-border bg-muted/20" aria-label="Kenya irrigation guides directory">
          <div className="dt-container max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="dt-section-label mb-2">Complete Irrigation Knowledge Base</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isMasterHub
                    ? `Browse All ${allPages.length} Kenya Irrigation, Dam Liner & Crop Guides`
                    : `Explore More Kenya Irrigation Guides (${allPages.length} Technical Resources)`}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Filter by topic or search any crop, county, HDPE dam liner thickness, pump type or equipment price guide across Kenya.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={hubQuery}
                  onChange={(e) => setHubQuery(e.target.value)}
                  placeholder="Search crops, counties, dam liners..."
                  aria-label="Search irrigation guides"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="scrollbar-hide -mx-1 mt-6 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {([
                { key: "all", label: `All Guides (${allPages.length - 1})`, icon: Layers },
                { key: "dam_storage", label: "Dam Liners & Storage", icon: Sparkles },
                { key: "crops", label: "Crops & Orchards", icon: Sprout },
                { key: "prices_kits", label: "Prices, Kits & Equipment", icon: Calculator },
                { key: "locations", label: "Counties Served", icon: MapPin },
                { key: "engineering", label: "Engineering & Troubleshooting", icon: Wrench },
              ] as const).map((tab) => {
                const Icon = tab.icon;
                const active = hubCluster === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setHubCluster(tab.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Directory Grid */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(isMasterHub || hubQuery || hubCluster !== "all"
                ? filteredHubPages
                : filteredHubPages.slice(0, 18)
              ).map((item) => {
                const itemCluster = CLUSTER_META[getGuideCluster(item.slug)];
                return (
                  <Link
                    key={item.slug}
                    to={`/${item.slug}`}
                    className="group min-w-0 flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                  >
                    <div>
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${itemCluster.badgeClass}`}>
                        {itemCluster.label}
                      </span>
                      <h3 className="mt-2 text-sm font-bold text-foreground group-hover:text-primary line-clamp-2">
                        {item.h1}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Read Guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {!isMasterHub && !hubQuery && hubCluster === "all" && filteredHubPages.length > 18 && (
              <div className="mt-6 text-center">
                <Link
                  to="/irrigation-guides-kenya"
                  className="dt-btn-secondary inline-flex items-center gap-2 text-sm font-bold"
                >
                  View All {allPages.length} Kenya Irrigation Guides <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SEOContentPage;
