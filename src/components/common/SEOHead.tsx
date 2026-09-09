import { Helmet } from "react-helmet-async";
import { SITE_COMPANY, buildLocalBusinessSchema } from "@/config/company";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schema?: any; // Single schema object or array of schema objects
}

export default function SEOHead({
  title = "Drip Irrigation Kits & Products Kenya | DripTech Eco Flow",
  description = "Drip irrigation kits, driplines, sprinklers, pumps and filters for Kenyan farms. Help with sizing, supply and installation.",
  keywords = "drip irrigation kenya, smart irrigation systems, irrigation kits prices kenya, water pumps for farming, sprinkler systems kenya, greenhouse irrigation, drip lines, agricultural water solutions, solar water pumps, precision farming kenya, smallholder irrigation, automated irrigation controller, soil moisture sensors",
  image = `${SITE_COMPANY.url}/driptech-logo.png`,
  url = SITE_COMPANY.url,
  type = "website",
  author = SITE_COMPANY.name,
  publishedTime,
  modifiedTime,
  schema,
}: SEOHeadProps) {
  const schemaData = schema || buildLocalBusinessSchema();
  const schemas = Array.isArray(schemaData) ? schemaData : [schemaData];

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
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO Tags */}
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="revisit-after" content="7 days" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kenya" />

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
      {schemas.map((s, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
