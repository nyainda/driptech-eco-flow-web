import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SITE_COMPANY, buildLocalBusinessSchema } from "@/config/company";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  schema?: any; // Single schema object or array of schema objects
}

export default function SEOHead({
  title = "Drip Irrigation Kits & Products Kenya | DripTech Eco Flow",
  description = "Drip irrigation kits, driplines, sprinklers, pumps and filters for Kenyan farms. Help with sizing, supply and installation.",
  keywords = "drip irrigation kenya, smart irrigation systems, irrigation kits prices kenya, water pumps for farming, sprinkler systems kenya, greenhouse irrigation, drip lines, agricultural water solutions, solar water pumps, precision farming kenya, smallholder irrigation, automated irrigation controller, soil moisture sensors",
  image = `${SITE_COMPANY.url}/driptech-logo.png`,
  imageAlt = `${SITE_COMPANY.name} irrigation solutions in Kenya`,
  url = SITE_COMPANY.url,
  type = "website",
  author = SITE_COMPANY.name,
  publishedTime,
  modifiedTime,
  noindex = false,
  schema,
}: SEOHeadProps) {
  const schemaData = schema || buildLocalBusinessSchema();
  const schemas = Array.isArray(schemaData) ? schemaData : [schemaData];
  const robotsContent = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  useEffect(() => {
    // Remove prerendered static head tags that lack data-rh="true" so react-helmet-async
    // never leaves duplicate canonical URLs, descriptions, or JSON-LD blocks after hydration
    // or client-side route transitions.
    const selectors = [
      'link[rel="canonical"]:not([data-rh])',
      'meta[name="title"]:not([data-rh])',
      'meta[name="description"]:not([data-rh])',
      'meta[name="keywords"]:not([data-rh])',
      'meta[name="author"]:not([data-rh])',
      'meta[name="robots"]:not([data-rh])',
      'meta[property^="og:"]:not([data-rh])',
      'meta[name^="twitter:"]:not([data-rh])',
      'script[type="application/ld+json"]:not([data-rh])',
    ];
    document.head
      .querySelectorAll(selectors.join(", "))
      .forEach((node) => node.remove());
  }, [url, title]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_COMPANY.name} />
      <meta property="og:locale" content="en_KE" />

      {/* Article specific tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Additional SEO Tags */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="bingbot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="revisit-after" content="7 days" />
      <meta name="language" content="English" />

      {/* Mobile Optimization */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
      />
      <meta name="theme-color" content="#2d6a4f" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />

      {/* Structured Data */}
      {!noindex &&
        schemas.map((s, idx) => (
          <script key={idx} type="application/ld+json">
            {JSON.stringify(s)}
          </script>
        ))}
    </Helmet>
  );
}
