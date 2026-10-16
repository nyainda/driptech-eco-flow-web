import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import SEOHead from "@/components/common/SEOHead";
import pages from "@/data/publicSeoPages.json";
import { SITE_COMPANY, buildLocalBusinessSchema } from "@/config/company";

type SeoPage = (typeof pages)[number];

const SEOContentPage = () => {
  // These landing pages are registered in App.tsx as fixed literal routes
  // (e.g. "/drip-irrigation-kenya"), not a dynamic "/:slug" route, so
  // useParams() has nothing to return here -- it was always undefined,
  // which meant every one of these pages rendered "Page not found"
  // regardless of the real slug in the URL. Derive it from the path instead.
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+|\/+$/g, "");
  const page = pages.find((candidate) => candidate.slug === slug) as SeoPage | undefined;

  if (!page) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={page.title}
        description={page.description}
        url={pageUrl}
        image={page.image ? `${SITE_COMPANY.url}${page.image}` : undefined}
        schema={[
          buildLocalBusinessSchema(),
          breadcrumbSchema,
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
            {page.image && (
              <figure className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={page.image}
                  alt={`${page.h1} — irrigation equipment and farm water delivery`}
                  width="1200"
                  height="675"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                  Irrigation equipment and field setup relevant to this guide. Confirm crop-specific layout and specifications for your farm.
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
              {page.sections.map((section) => (
                <article key={section.heading} className="dt-card p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
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
            </div>

            <aside className="h-fit rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-foreground">Continue exploring</h2>
              <nav className="mt-4 space-y-3" aria-label="Related irrigation pages">
                {(page.links || []).map((link) => (
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