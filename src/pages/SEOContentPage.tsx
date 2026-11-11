import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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

const allPages = [
  ...pages,
  ...locationPages,
  ...irrigationPricePages,
  ...irrigationCropGapPages,
];

const seoProductCategory = (slug: string): string | undefined => {
  if (/sprinkler|raingun|rain-hose/.test(slug)) return "sprinklers";
  if (/pump|borehole|solar/.test(slug)) return "pumps";
  if (/filter|filtration/.test(slug)) return "filtration";
  if (/pipe|fitting|hdpe/.test(slug)) return "pipes";
  if (/fertigation/.test(slug)) return "fertigation";
  if (/valve|control/.test(slug)) return "controls";
  if (/drip|greenhouse|irrigation|boq|installation|maintenance|consultation|design/.test(slug)) return "drip";
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

const SEOContentPage = () => {
  // These landing pages are registered in App.tsx as fixed literal routes
  // (e.g. "/drip-irrigation-kenya") or matched by "/:seoSlug", so derive
  // the slug from location.pathname.
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+|\/+$/g, "");
  const page = allPages.find((candidate) => candidate.slug === slug) as SeoPage | undefined;
  const [catalogueImage, setCatalogueImage] = useState<string>();

  useEffect(() => {
    let active = true;
    setCatalogueImage(undefined);
    const category = seoProductCategory(slug);
    if (page && category) {
      dataService.getProducts({ category, inStock: true, limit: 30, page: 1 })
        .then((result: any) => {
          const products = Array.isArray(result) ? result : result?.products ?? result?.data ?? [];
          const image = products.map(firstCatalogueImage).find(Boolean);
          if (active && image) setCatalogueImage(image);
        })
        .catch(() => undefined);
    }
    return () => { active = false; };
  }, [slug, page]);

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
            <Link to="/" className="dt-btn-primary mt-6 inline-flex">
              Return home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const pageUrl = `${SITE_COMPANY.url}/${page.slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_COMPANY.url },
      { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={page.title}
        description={page.description}
        url={pageUrl}
        image={catalogueImage || (page.image ? `${SITE_COMPANY.url}${page.image}` : undefined)}
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
        <section className="dt-section border-b border-border">
          <div className="dt-container max-w-5xl">
            <p className="dt-section-label mb-3">DripTech Kenya</p>
            <h1 className="dt-section-title max-w-4xl">{page.h1}</h1>
            <p className="dt-section-subtitle mt-5 max-w-3xl">{page.intro}</p>
            {(catalogueImage || page.image) && (
              <figure className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={catalogueImage || page.image}
                  alt={`${page.h1} — irrigation equipment and farm water delivery`}
                  width="1200"
                  height="675"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                  DripTech catalogue equipment relevant to this guide. Confirm crop-specific layout and specifications for your farm.
                </figcaption>
              </figure>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="dt-btn-primary inline-flex items-center gap-2">
                Browse products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="dt-btn-secondary inline-flex items-center gap-2">
                Talk to the team <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/irrigation-cost-calculator-kenya" className="dt-btn-secondary inline-flex items-center gap-2">
                Estimate irrigation costs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="dt-section">
          <div className="dt-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-10">
              {slug === "drip-irrigation-kit-price-kenya" && <KitPriceTable />}
              {page.sections.map((section) => (
                <article key={section.heading} className="dt-card p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {section.table && section.table.headers?.length > 0 && section.table.rows?.length > 0 && (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        {section.table.caption && (
                          <caption className="mb-2 text-left text-xs font-medium text-muted-foreground">
                            {section.table.caption}
                          </caption>
                        )}
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            {section.table.headers.map((header) => (
                              <th key={header} scope="col" className="px-4 py-3 font-semibold text-foreground">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {section.table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) =>
                                cellIndex === 0 ? (
                                  <th key={cellIndex} scope="row" className="px-4 py-3 font-medium text-foreground">
                                    {cell}
                                  </th>
                                ) : (
                                  <td key={cellIndex} className="px-4 py-3 text-muted-foreground">
                                    {cell}
                                  </td>
                                ),
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-muted-foreground">
                          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
              {faqItems.length > 0 && (
                <section aria-label="Frequently asked questions" className="dt-card p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
                  <div className="mt-5 space-y-6">
                    {faqItems.map((faq) => (
                      <div key={faq.q}>
                        <h3 className="text-lg font-semibold text-foreground">{faq.q}</h3>
                        <p className="mt-2 leading-7 text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="h-fit rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-foreground">Continue exploring</h2>
              <nav className="mt-4 space-y-3" aria-label="Related irrigation pages">
                {page.links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-start gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
              {page.sources?.length ? (
                <section className="mt-6 border-t border-border pt-6" aria-label="Background sources">
                  <h2 className="text-sm font-bold text-foreground">Local context and further reading</h2>
                  <ul className="mt-3 space-y-2">
                    {page.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {source.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-sm leading-6 text-muted-foreground">
                  Need help matching equipment to your farm? Send the crop, acreage and water source for practical guidance.
                </p>
                <a
                  href="https://wa.me/254723407849"
                  className="dt-btn-whatsapp mt-4 inline-flex w-full justify-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp DripTech
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SEOContentPage;