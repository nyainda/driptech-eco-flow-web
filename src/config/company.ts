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
  phoneSecondary: "+254141294497",
  phoneSecondaryDisplay: "0141294497",
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
    // Keep this as a catalogue of categories, not a list of fake Product entities.
    // Category labels and acreage-kit sizes are collections; they are not individual
    // purchasable products and should not trigger Google's Product rich-result checks.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Irrigation equipment",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Drip irrigation kits by plot size",
          description:
            "Drip irrigation kit options for different plot sizes. Request a current quote for the kit contents and price.",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "1/8 acre drip kit",
              description: "Drip irrigation kit category for a 1/8-acre plot; ask DripTech for current availability and pricing.",
            },
            {
              "@type": "OfferCatalog",
              name: "1/4 acre drip kit",
              description: "Drip irrigation kit category for a 1/4-acre plot; ask DripTech for current availability and pricing.",
            },
            {
              "@type": "OfferCatalog",
              name: "1/2 acre drip kit",
              description: "Drip irrigation kit category for a 1/2-acre plot; ask DripTech for current availability and pricing.",
            },
            {
              "@type": "OfferCatalog",
              name: "1 acre drip kit",
              description: "Drip irrigation kit category for a 1-acre plot; ask DripTech for current availability and pricing.",
            },
          ],
        },
        {
          "@type": "OfferCatalog",
          name: "Irrigation product categories",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Driplines",
              description: "Drip irrigation lines and related components.",
            },
            {
              "@type": "OfferCatalog",
              name: "Sprinklers",
              description: "Sprinkler equipment and accessories for irrigation systems.",
            },
            {
              "@type": "OfferCatalog",
              name: "Pumps",
              description: "Water pumps and related irrigation equipment.",
            },
            {
              "@type": "OfferCatalog",
              name: "Filters and fittings",
              description: "Irrigation filtration products, pipes, fittings and connectors.",
            },
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
