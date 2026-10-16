/**
 * Canonical brand and contact details for SEO.
 * Only add a physical address or local-business schema when the location is verified.
 */
export const SITE_COMPANY = {
  name: "DripTech Eco Flow",
  legalName: "DripTech Eco Flow",
  tagline: "Smart Irrigation Systems",
  url: "https://www.dripstech.co.ke",
  logo: "https://www.dripstech.co.ke/driptech-logo.png",
  email: "info@dripstech.co.ke",
  emailAlt: "driptechs.info@gmail.com",
  /** Primary click-to-call / WhatsApp line */
  phonePrimary: "+254723407849",
  phonePrimaryDisplay: "0723 407 849",
  /** Secondary click-to-call / WhatsApp line */
  phoneSecondary: "+254757716018",
  phoneSecondaryDisplay: "0757 716 018",
  areaServed: [
    "Kenya",
    "Nairobi",
    "Kiambu",
    "Nakuru",
    "Machakos",
    "Kajiado",
    "Meru",
    "Nyeri",
    "Kisumu",
    "Mombasa",
    "Uasin Gishu",
  ],
  sameAs: [
    "https://www.facebook.com/dripstech",
    "https://www.instagram.com/dripstech",
    "https://www.tiktok.com/@driptech.ecoflow",
  ],
} as const;

/** Organization JSON-LD for a nationwide supplier without a verified walk-in address. */
export function buildOrganizationSchema() {
  const c = SITE_COMPANY;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${c.url}/#organization`,
    name: c.name,
    legalName: c.legalName,
    description:
      "Drip irrigation kits, driplines, sprinklers, pumps and fittings for Kenyan farms. Call or WhatsApp for pricing and delivery nationwide.",
    url: c.url,
    logo: c.logo,
    image: c.logo,
    telephone: [c.phonePrimary, c.phoneSecondary],
    email: c.email,
    areaServed: c.areaServed.map((name) => ({
      "@type": "Place",
      name,
    })),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: c.phonePrimary,
        contactType: "sales",
        areaServed: "KE",
        availableLanguage: ["en", "sw"],
      },
      {
        "@type": "ContactPoint",
        telephone: c.phoneSecondary,
        contactType: "customer service",
        areaServed: "KE",
        availableLanguage: ["en", "sw"],
      },
      {
        "@type": "ContactPoint",
        email: c.email,
        contactType: "customer support",
        areaServed: "KE",
        availableLanguage: ["en", "sw"],
      },
    ],
    knowsAbout: [
      "drip irrigation Kenya",
      "drip irrigation kit price Kenya",
      "1 acre drip irrigation kit",
      "driplines for sale Kenya",
      "sprinkler systems Kenya",
      "solar irrigation Kenya",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Irrigation equipment",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Drip irrigation kits",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "1/8 acre drip kit" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "1/4 acre drip kit" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "1/2 acre drip kit" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "1 acre drip kit" } },
          ],
        },
        {
          "@type": "OfferCatalog",
          name: "Irrigation products",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Driplines" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Sprinklers" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Pumps" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Filters and fittings" } },
          ],
        },
      ],
    },
    sameAs: c.sameAs,
  };
}

// Backward-compatible export for existing page imports; the emitted schema is Organization.
export const buildLocalBusinessSchema = buildOrganizationSchema;

export function buildContactPageSchema() {
  const c = SITE_COMPANY;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${c.name}`,
    url: `${c.url}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: c.name,
      telephone: [c.phonePrimary, c.phoneSecondary],
      email: c.email,
      url: c.url,
    },
  };
}
