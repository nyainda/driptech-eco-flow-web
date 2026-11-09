import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { serializeJsonLd, toAbsoluteSiteAssetUrl } from "./seo-url-helpers.mjs";
import { buildOrganizationSchema } from "../src/config/company.ts";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://www.dripstech.co.ke";
const baseHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const landingPages = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/publicSeoPages.json"), "utf8"),
);
const locationPages = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/locationSeoPages.json"), "utf8"),
);
const irrigationPricePages = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/irrigationPriceSeoPages.json"), "utf8"),
);
const irrigationCropGapPages = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/irrigationCropGapPages.json"), "utf8"),
);

// Authored SEO guides are complete static documents, not React placeholders.
const staticSeoRoutes = new Set(
  [...landingPages, ...locationPages, ...irrigationPricePages, ...irrigationCropGapPages]
    .map((page) => page.route || (page.slug ? `/${page.slug}` : null))
    .filter((route) => route && route !== "/"),
);

const categoryPages = [
  {
    route: "/products",
    title: "Irrigation Products & Equipment Kenya | DripTech Catalog",
    description:
      "Browse driplines, sprinklers, pumps, filters, pipes, fittings and complete irrigation kits in Kenya from DripTech.",
    heading: "Irrigation products and equipment in Kenya",
    intro:
      "Browse the current DripTech catalogue for irrigation products, equipment and complete kits. Compare the available specifications, prices and stock, then ask for help matching equipment to your farm.",
    image: "/seed-products/plant_drip.jpg",
  },
  {
    route: "/products/drip",
    title: "Drip Irrigation Systems Kenya | Driplines & Fittings",
    description:
      "Shop drip irrigation products in Kenya including driplines, emitters, connectors, filters and fittings. Get sizing and installation support from DripTech.",
    heading: "Drip irrigation systems and components",
    intro:
      "Find driplines, emitters, connectors and related equipment for vegetable farms, greenhouses, kitchen gardens and larger irrigation projects in Kenya.",
    image: "/seed-products/dripline_roll.jpg",
  },
  {
    route: "/products/sprinklers",
    title: "Sprinkler & Rain Gun Products in Kenya | DripTech",
    description:
      "Compare farm sprinklers, rain guns and accessories in Kenya. Get help with coverage, operating pressure, spacing, pumps and installation from DripTech.",
    heading: "Farm sprinklers and rain guns in Kenya",
    intro:
      "Choose sprinkler equipment by coverage pattern, operating pressure, crop, wind exposure and water supply. Compare impact sprinklers and rain guns, then check pump capacity, pipe sizing and spacing as one system.",
    sections: [
      {
        heading: "Choose sprinklers for your field",
        paragraphs: [
          "Impact sprinklers and rain guns serve different field layouts. The correct choice depends on the required flow and pressure, the coverage pattern, wind exposure, crop needs and how the field is divided into irrigation zones.",
          "Do not select equipment by throw distance alone. Confirm the operating conditions from the product specification and plan enough overlap for the intended coverage."
        ]
      },
      {
        heading: "Check the complete water delivery system",
        bullets: [
          "Required flow and operating pressure at the sprinkler",
          "Pump capacity and total head, including elevation and friction losses",
          "Pipe diameter, line length, valves and fittings",
          "Sprinkler spacing, wind exposure and field shape",
          "Maintenance access and the ability to flush the system"
        ]
      }
    ],
    links: [
      { label: "Browse available sprinkler products", href: "/products/sprinklers" },
      { label: "Compare rain guns", href: "/products/rain-guns" },
      { label: "Read the pump sizing guide", href: "/irrigation-pump-sizing-kenya" },
      { label: "Troubleshoot low sprinkler pressure", href: "/low-irrigation-pressure-sprinklers-kenya" },
      { label: "Compare drip and sprinkler irrigation", href: "/drip-vs-sprinkler-irrigation-kenya" },
      { label: "Request irrigation advice", href: "/contact" }
    ],
    image: "/seed-products/sprinkler.jpg",
  },
  {
    route: "/products/pumps",
    title: "Irrigation Pumps Kenya | Farm Water Pumps | DripTech",
    description:
      "Find irrigation pumps and related farm water equipment in Kenya. Get help matching pump capacity to your water source and irrigation layout.",
    heading: "Irrigation pumps for Kenyan farms",
    intro:
      "A reliable irrigation pump must match the required flow, pressure, lift and power source. Browse current pump products and ask DripTech for sizing help.",
    image: "/seed-products/water1.jpg",
  },
  {
    route: "/products/pipes",
    title: "Irrigation Pipes & Fittings Kenya | DripTech",
    description:
      "Shop irrigation pipes, fittings and connectors in Kenya for drip and sprinkler systems. Get practical help planning your mainline and field connections.",
    heading: "Irrigation pipes and fittings in Kenya",
    intro:
      "Build a dependable irrigation layout with the right pipe diameter, connectors, valves and end fittings for your water source and field.",
    image: "/seed-products/pipes_industrial.jpg",
  },
  {
    route: "/products/filtration",
    title: "Irrigation Filters Kenya | Drip Filtration | DripTech",
    description:
      "Browse irrigation filters and strainers in Kenya for drip and sprinkler systems. Protect emitters and keep your irrigation lines working reliably.",
    heading: "Irrigation filters and strainers",
    intro:
      "Good filtration protects drip emitters and sprinkler equipment from blockage. Choose filtration with the water source, flow rate and maintenance routine in mind.",
    image: "/seed-products/drip2.jpg",
  },
  {
    route: "/products/solar",
    title: "Solar Irrigation Equipment Kenya | Solar Pumps | DripTech",
    description:
      "Explore solar irrigation equipment in Kenya, including solar pumping options and components for farms that need dependable water supply.",
    heading: "Solar irrigation equipment in Kenya",
    intro:
      "Solar irrigation can help farms move water where grid power is limited. Compare the current equipment and request help checking pump, tank and field requirements.",
    image: "/seed-products/solar_panel.jpg",
  },
  {
    route: "/products/greenhouse",
    title: "Greenhouse Irrigation Systems Kenya | DripTech",
    description:
      "Greenhouse irrigation systems and components in Kenya, including driplines, filters, fittings and control equipment for protected crops.",
    heading: "Greenhouse irrigation systems",
    intro:
      "Greenhouse crops need consistent application and clean water. DripTech supplies greenhouse irrigation components and can help match the system to your crop layout.",
    image: "/seed-products/greenhouse.jpg",
  },
  {
    route: "/irrigation-kits",
    title: "Drip Irrigation Kit Prices in Kenya | DripTech",
    description:
      "Compare drip irrigation kits for Kenyan farms by plot size, crop and included components. Request a farm-specific price and installation advice from DripTech.",
    heading: "Compare drip irrigation kits for your farm",
    intro:
      "Compare available kits by plot size, crop and included components. Check the driplines, filtration, fittings and water supply requirements, then request a quote matched to your field.",
    sections: [
      {
        heading: "What to check in a drip irrigation kit",
        bullets: [
          "Driplines or drip tape matched to crop and row spacing",
          "Mainline, connectors, valves and end closures",
          "Filtration suitable for the water source and emitter specification",
          "Flow and pressure available from the pump or gravity supply",
          "Whether delivery, installation and any additional fittings are included"
        ]
      },
      {
        heading: "Compare the whole farm requirement",
        paragraphs: [
          "A kit's acreage label is only a starting point. Crop layout, number of lines per bed, water availability, elevation and irrigation zones affect the final bill of materials.",
          "For a practical quote, share the crop, plot dimensions, water source and location. Confirm current product availability and included components before comparing supplier prices."
        ]
      }
    ],
    links: [
      { label: "Browse drip irrigation components", href: "/products/drip" },
      { label: "Compare irrigation filters", href: "/products/filtration" },
      { label: "Check pumps and motors", href: "/products/pumps" },
      { label: "Estimate irrigation costs", href: "/irrigation-cost-calculator-kenya" },
      { label: "Request a farm-specific quotation", href: "/contact" }
    ],
    image: "/seed-products/drip3.jpg",
  },
  {
    route: "/services",
    title: "Irrigation Services Kenya | Design & Install | DripTech",
    description:
      "Professional irrigation design, installation, maintenance and repair services in Kenya for farms, greenhouses and commercial projects.",
    heading: "Irrigation design and installation services",
    intro:
      "Get practical support from system planning through installation, testing and maintenance. DripTech serves farms and irrigation projects across Kenya.",
    image: "/seed-products/field_drip.jpg",
  },
  {
    route: "/technician-services",
    title: "Irrigation Technicians Kenya | Install & Repair | DripTech",
    description:
      "Book irrigation technician support in Kenya for installation, maintenance, troubleshooting and repairs on farm irrigation systems.",
    heading: "Irrigation technician services in Kenya",
    intro:
      "When an irrigation system needs hands-on help, DripTech can coordinate technician support for installation, repairs, maintenance and system checks.",
    image: "/seed-products/field_drip.jpg",
  },
  {
    route: "/installation-guides",
    title: "Irrigation Installation Guides Kenya | DripTech",
    description:
      "Read practical irrigation installation and maintenance guides for drip systems, sprinklers, filters, pumps and farm equipment in Kenya.",
    heading: "Irrigation installation guides",
    intro:
      "Use the guides to understand irrigation components, installation steps and routine checks before operating a drip or sprinkler system.",
  },
  {
    route: "/case-studies",
    title: "Irrigation Case Studies Kenya | Farm Projects | DripTech",
    description:
      "Explore DripTech irrigation case studies, farm projects and practical lessons from irrigation installations in Kenya.",
    heading: "Irrigation projects and case studies",
    intro:
      "See how irrigation equipment and system design are applied to real farms and projects. Each case study should connect the crop, water source, layout and equipment choice.",
  },
  {
    route: "/projects",
    title: "Irrigation Projects in Kenya | DripTech",
    description:
      "View irrigation projects and farm installations by DripTech in Kenya, including drip, sprinkler and greenhouse irrigation work.",
    heading: "DripTech irrigation projects",
    intro:
      "Explore irrigation work completed or documented by DripTech, with practical context about the farm, system and equipment used.",
  },
  {
    route: "/success-stories",
    title: "Irrigation Success Stories Kenya | DripTech",
    description:
      "Read irrigation success stories from Kenyan farms and customers using DripTech equipment, design and installation support.",
    heading: "Irrigation success stories",
    intro:
      "Learn from farmers and projects that used better irrigation planning, equipment selection and ongoing support.",
  },
  {
    route: "/blog",
    title: "Irrigation Advice for Kenyan Farmers | DripTech Blog",
    description:
      "Irrigation advice, crop watering guides, equipment explanations and farm water planning tips for Kenyan farmers from DripTech.",
    heading: "Irrigation advice for Kenyan farmers",
    intro:
      "Read practical guidance about drip irrigation, sprinklers, pumps, greenhouse systems, crop watering and farm equipment.",
  },
  {
    route: "/news",
    title: "Irrigation News and Updates Kenya | DripTech",
    description:
      "Irrigation news, DripTech updates and water-efficient farming information for farmers and agricultural businesses in Kenya.",
    heading: "Irrigation news and updates",
    intro:
      "Follow DripTech updates, irrigation developments and water-efficient farming information relevant to Kenya.",
  },
  {
    route: "/videos",
    title: "Irrigation Videos Kenya | Drip Guides | DripTech",
    description:
      "Watch drip irrigation installation, kit demonstrations and farm irrigation videos from DripTech in Kenya.",
    heading: "Irrigation videos and demonstrations",
    intro:
      "Watch product demonstrations and practical irrigation videos to understand installation, operation and equipment selection.",
  },
  {
    route: "/about",
    title: "About DripTech | Irrigation Solutions Provider Kenya",
    description:
      "Learn about DripTech, a Kenyan irrigation equipment and services provider helping farms with products, system design and installation support.",
    heading: "About DripTech",
    intro:
      "DripTech helps Kenyan farmers and agricultural businesses source irrigation equipment and plan systems that fit the crop, plot and water source.",
    image: "/seed-products/field_drip.jpg",
  },
  {
    route: "/contact",
    title: "Contact DripTech | Irrigation Consultation Kenya",
    description:
      "Contact DripTech for irrigation product advice, system sizing, installation support and delivery across Kenya.",
    heading: "Contact DripTech for irrigation support",
    intro:
      "Share your crop, acreage, water source and location to get practical guidance on irrigation products, complete kits and installation support.",
    image: "/seed-products/plant_drip.jpg",
  },
];

const homePage = {
  route: "/",
  title: "Drip Irrigation Kits & Sprinklers in Kenya | DripTech",
  description:
    "Shop drip irrigation kits, driplines, sprinklers, pumps and filters in Kenya. Get sizing help, supply and installation support from DripTech.",
  heading: "Driplines, kits and pumps that fit your farm",
  intro:
    "DripTech supplies irrigation equipment and complete systems for Kenyan farms, greenhouses and kitchen gardens. Browse products, compare kits and ask for help before you buy.",
  image: "/seed-products/field_drip.jpg",
  links: [
    { label: "Drip irrigation systems in Kenya", href: "/drip-irrigation-kenya" },
    { label: "Sprinkler systems in Kenya", href: "/sprinkler-systems-kenya" },
    { label: "Borehole and water pumps in Kenya", href: "/borehole-water-pumps-kenya" },
    { label: "Driplines for sale in Kenya", href: "/driplines-for-sale-kenya" },
    { label: "Fertigation systems in Kenya", href: "/fertigation-systems-kenya" },
    { label: "Water storage tanks in Kenya", href: "/water-storage-tanks-kenya" },
    { label: "Drip irrigation kit prices in Kenya", href: "/drip-irrigation-kit-price-kenya" },
    { label: "Irrigation companies in Kenya", href: "/irrigation-companies-kenya" },
    { label: "Drip irrigation pumps", href: "/products/pumps" },
    { label: "Driplines and emitters", href: "/products/drip" },
    { label: "Sprinklers and rain guns", href: "/products/sprinklers" },
  ],
};

const irrigationCostCalculatorPage = {
  route: "/irrigation-cost-calculator-kenya",
  title: "Drip Irrigation Cost Calculator Kenya | DripTech Eco Flow",
  description:
    "Estimate dripline length and a preliminary irrigation budget for your Kenyan farm. Enter your own prices and request a verified quote from DripTech.",
  heading: "Drip irrigation cost calculator for Kenya",
  intro:
    "Estimate a preliminary dripline quantity and build a budget using prices you enter. This is a planning aid—not a fixed DripTech price or a final engineering design.",
  image: "/seed-products/dripline_roll.jpg",
  sections: [
    {
      heading: "Estimate dripline quantity and farm costs",
      paragraphs: [
        "Enter the farm area, distance between crop rows and a layout allowance to estimate a preliminary dripline length. Add your own prices for dripline, filters and fittings, the pump or water supply, and installation to calculate a budget from your inputs.",
        "The calculation uses area divided by row spacing, then applies the allowance you choose. It assumes the whole plot is planted in rows and does not automatically account for headlands, paths, field shape, multiple lines per bed, mainlines or irrigation zones."
      ]
    },
    {
      heading: "Use the estimate as a starting point",
      paragraphs: [
        "The result is not a supplier quote, hydraulic design or pump-sizing recommendation. Actual quantities and costs depend on crop layout, water quality, available flow, elevation, pipe lengths, filtration and the components required for your farm.",
        "Share your crop, field dimensions, water source and location with DripTech Eco Flow to verify the layout and request a farm-specific quotation."
      ],
      bullets: [
        "Enter current supplier prices rather than relying on assumed prices",
        "Include filtration, fittings, pump or water supply and installation where applicable",
        "Confirm pressure, flow and system zones before purchasing equipment"
      ]
    }
  ],
  schema: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drip Irrigation Cost Calculator Kenya",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    description:
      "A preliminary dripline quantity and user-priced irrigation budget calculator for Kenyan farms. Results require farm-specific verification.",
    url: "https://www.dripstech.co.ke/irrigation-cost-calculator-kenya",
    image: "https://www.dripstech.co.ke/seed-products/dripline_roll.jpg",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KES" },
    publisher: { "@type": "Organization", name: "DripTech Eco Flow", url: "https://www.dripstech.co.ke/" }
  }
};

const allPages = [
  homePage,
  ...categoryPages,
  irrigationCostCalculatorPage,
  ...landingPages.map((page) => ({ ...page, route: `/${page.slug}` })),
  ...locationPages.map((page) => ({ ...page, route: `/${page.slug}` })),
  ...irrigationPricePages.map((page) => ({ ...page, route: `/${page.slug}` })),
  ...irrigationCropGapPages.map((page) => ({ ...page, route: `/${page.slug}` })),
];

// Fail the build on sitemap structure problems that Google silently ignores:
// more than one <loc> in a <url>, duplicate URLs, off-domain URLs, or a missing
// <urlset>. Returns the list of <loc> values for further checks.
const validateSitemapXml = (xml, label) => {
  const problems = [];
  if (!/<urlset[\s>]/.test(xml) || !/<\/urlset>\s*$/.test(xml.trim())) {
    problems.push("missing or unterminated <urlset>");
  }
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const totalLocs = (xml.match(/<loc>/g) || []).length;
  if (blocks.length !== totalLocs) {
    problems.push(`${totalLocs} <loc> elements across ${blocks.length} <url> blocks (each <url> must contain exactly one <loc>)`);
  }
  const seen = new Set();
  for (const block of blocks) {
    const locs = [...block.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]);
    if (locs.length !== 1) {
      problems.push(`<url> with ${locs.length} locations: ${locs.slice(0, 3).join(", ") || "(empty)"}`);
      continue;
    }
    const loc = locs[0];
    if (!loc.startsWith(siteUrl)) problems.push(`off-domain or relative URL: ${loc}`);
    if (/\s/.test(loc)) problems.push(`URL contains whitespace: ${loc}`);
    if (seen.has(loc)) problems.push(`duplicate URL: ${loc}`);
    seen.add(loc);
  }
  if (problems.length) {
    throw new Error(`${label} is invalid:\n - ${problems.slice(0, 15).join("\n - ")}`);
  }
  return [...seen];
};

// Keep the HTML generated at build time aligned with the URLs submitted to
// search engines. A route missing from this list would otherwise fall through
// to the empty SPA document and lose its unique canonical and page content.
const sourceSitemapXml = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
validateSitemapXml(sourceSitemapXml, "public/sitemap.xml");
const sitemapRoutes = [
  ...sourceSitemapXml
    .matchAll(/<loc>https:\/\/www\.dripstech\.co\.ke(\/[^<]*)?<\/loc>/g),
].map((match) => match[1] || "/");

const sitemapFallbackPages = {
  "/products/controls": [
    "Irrigation Controls Kenya | Timers & Automation | DripTech",
    "Irrigation controls and automation",
    "Browse irrigation controls, timers and automation equipment in Kenya for efficient drip and sprinkler system operation.",
  ],
  "/products/filters-strainers": [
    "Irrigation Filters & Strainers Kenya | DripTech",
    "Irrigation filters and strainers",
    "Find irrigation filters and strainers in Kenya to protect drip emitters, sprinklers and farm water equipment from blockage.",
  ],
  "/products/controllers": [
    "Irrigation Controllers Kenya | Timers | DripTech",
    "Irrigation controllers and timers",
    "Browse irrigation controllers and timers in Kenya to schedule reliable watering for farms, greenhouses and gardens.",
  ],
  "/products/emitters": [
    "Drip Irrigation Emitters Kenya | DripTech",
    "Drip irrigation emitters in Kenya",
    "Browse drip irrigation emitters and related components in Kenya. DripTech can help match emitter flow and spacing to your crop and field layout.",
  ],
  "/products/valves": [
    "Irrigation Valves Kenya | DripTech",
    "Irrigation valves and controls",
    "Browse irrigation valves and control components for drip and sprinkler systems in Kenya. Get practical help selecting compatible fittings and connections.",
  ],
  "/products/accessories": [
    "Irrigation Accessories Kenya | DripTech",
    "Irrigation accessories and fittings",
    "Browse irrigation accessories, fittings and connectors in Kenya for reliable farm irrigation system installation and maintenance.",
  ],
  "/products/fertigation": [
    "Fertigation Equipment Kenya | DripTech",
    "Fertigation equipment for farms",
    "Explore fertigation equipment and components for applying nutrients through irrigation systems on Kenyan farms.",
  ],
  "/products/storage": [
    "Water Storage for Irrigation Kenya | DripTech",
    "Irrigation water storage",
    "Explore irrigation water storage options and equipment in Kenya. DripTech can help plan a dependable supply for your farm irrigation system.",
  ],
  "/products/rain-guns": [
    "Rain Guns Kenya | Farm Irrigation Equipment | DripTech",
    "Rain guns for farm irrigation",
    "Browse rain guns and related farm irrigation equipment in Kenya, with practical support for coverage, pressure and water-source requirements.",
  ],
  "/products/borehole": [
    "Borehole Irrigation Equipment Kenya | DripTech",
    "Borehole irrigation equipment",
    "Explore borehole irrigation equipment and components in Kenya. DripTech can help match pumping and irrigation equipment to your water source.",
  ],
  "/technical-support": [
    "Irrigation Technical Support Kenya | DripTech",
    "Irrigation technical support",
    "Get technical support for drip irrigation, sprinklers, pumps, filters and farm irrigation systems from DripTech in Kenya.",
  ],
  "/certifications": [
    "DripTech Certifications | Irrigation Solutions Kenya",
    "DripTech certifications",
    "Learn about DripTech's irrigation solutions and the standards that support dependable farm irrigation equipment and services in Kenya.",
  ],
  "/team": [
    "DripTech Team | Irrigation Specialists Kenya",
    "Meet the DripTech team",
    "Meet the people behind DripTech's irrigation equipment, farm system design and installation support in Kenya.",
  ],
  "/careers": [
    "Careers at DripTech | Irrigation Jobs Kenya",
    "Careers at DripTech",
    "Explore opportunities to work with DripTech, a Kenyan provider of irrigation equipment and farm water solutions.",
  ],
  "/privacy": [
    "Privacy Policy | DripTech",
    "DripTech privacy policy",
    "Read the DripTech privacy policy and how we handle customer and website information.",
  ],
  "/terms": [
    "Terms and Conditions | DripTech",
    "DripTech terms and conditions",
    "Read the terms and conditions for using the DripTech website, products and services.",
  ],
  "/cookies": [
    "Cookie Policy | DripTech",
    "DripTech cookie policy",
    "Read how DripTech uses cookies to support website functionality and improve visitor experience.",
  ],
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categoryPaths = {
  accessories: "accessories",
  borehole_equipment: "borehole",
  control_systems: "controls",
  drip_irrigation: "drip",
  emitters_drippers: "emitters",
  fertigation_systems: "fertigation",
  filtration_systems: "filtration",
  greenhouse_systems: "greenhouse",
  filters_strainers: "filters-strainers",
  pipes_fittings: "pipes",
  pumps_motors: "pumps",
  sprinkler_systems: "sprinklers",
  valves_regulators: "valves",
  controllers_timers: "controllers",
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Convert stored rich text into safe plain-text blocks for initial HTML. We do
// not inject CMS HTML into the page; all blocks are escaped at render time.
const extractTextBlocks = (value = "") =>
  String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|h[1-6]|li|blockquote|div|section|article|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .split(/\n+/)
    .map((block) => block.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

// Never print query strings or keys; the path is enough to identify a feed.
const describeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return String(url).split("?")[0];
  }
};

const fetchJson = async (url, headers = {}) => {
  let response;
  try {
    response = await fetch(url, { headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Request failed for ${url}: ${detail}`);
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} at ${url}`);
  }

  try {
    return await response.json();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON from ${url}: ${detail}`);
  }
};

// The Worker wraps paginated lists as { data: [...], pagination }; Supabase and
// the other Worker routes return bare arrays. Accept both, reject anything else
// with a message that names the feed instead of crashing later in .filter().
const toArray = (payload, label) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  throw new Error(`${label} feed must be an array or { data: [...] }, got ${payload === null ? "null" : typeof payload}`);
};

const getDynamicContent = async () => {
  const workerUrl = process.env.VITE_WORKER_URL?.replace(/\/$/, "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const fetchFromSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase SEO fallback requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
    const endpoint = `${supabaseUrl}/rest/v1`;
    const [products, posts, news] = await Promise.all([
      // Include public catalogue records even when they are temporarily out of stock.
      // Stock status is emitted separately in Product Offer structured data.
      fetchJson(`${endpoint}/products?select=*`, headers),
      fetchJson(`${endpoint}/blog_posts?select=*&published=eq.true`, headers),
      fetchJson(`${endpoint}/news_articles?select=*&published=eq.true`, headers),
    ]);
    return {
      products: toArray(products, "Supabase products"),
      posts: toArray(posts, "Supabase blog_posts"),
      news: toArray(news, "Supabase news_articles"),
    };
  };

  if (workerUrl) {
    try {
      const [products, posts, news] = await Promise.all([
        // Do not filter by in_stock: every public catalogue product needs a crawlable URL.
        fetchJson(`${workerUrl}/api/products?limit=1000`),
        fetchJson(`${workerUrl}/api/blog?limit=1000`),
        fetchJson(`${workerUrl}/api/news?limit=1000`),
      ]);
      const normalized = {
        products: toArray(products, `${describeUrl(`${workerUrl}/api/products`)}`),
        posts: toArray(posts, `${describeUrl(`${workerUrl}/api/blog`)}`),
        news: toArray(news, `${describeUrl(`${workerUrl}/api/news`)}`),
      };
      if (normalized.products.length === 0) {
        throw new Error(`${describeUrl(`${workerUrl}/api/products`)} returned no products`);
      }
      return normalized;
    } catch (error) {
      if (supabaseUrl && supabaseKey) {
        console.warn(`Worker SEO feed failed; trying Supabase instead: ${error.message}`);
        return fetchFromSupabase();
      }
      throw new Error(
        `Could not fetch the live SEO feed from the Cloudflare Worker (VITE_WORKER_URL host: ${new URL(workerUrl).host}). ${error.message}. ` +
        "Check the Worker hostname is correct (expected dripstech-api.<account>.workers.dev) and that /api/health responds.",
      );
    }
  }

  if (supabaseUrl && supabaseKey) return fetchFromSupabase();

  if (process.env.SEO_ALLOW_STATIC_ONLY === "true") {
    console.warn("SEO_ALLOW_STATIC_ONLY=true: generating static landing pages without dynamic product pages.");
    return { products: [], posts: [], news: [] };
  }

  throw new Error(
    "SEO generation requires VITE_WORKER_URL or both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. " +
    "Configure the production build environment, or set SEO_ALLOW_STATIC_ONLY=true only for intentional static-only previews.",
  );
};

const dynamicContent = await getDynamicContent();

// Do not silently publish a product sitemap that omits the live catalogue.
// Static-only generation is an explicit opt-in for isolated previews only.
if (!Array.isArray(dynamicContent.products)) {
  throw new Error("SEO product feed must return an array.");
}
if (dynamicContent.products.length === 0 && process.env.SEO_ALLOW_STATIC_ONLY !== "true") {
  throw new Error("SEO generation found zero products. Refusing to publish incomplete product pages and sitemap.");
}
console.log(`SEO generator loaded ${dynamicContent.products.length} catalogue products for crawlable product pages.`);

// Real, current kit prices for the price pages. Optional: a kits outage must not
// block a deploy, but it is reported so a missing table is never a surprise.
const toStringList = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const getKitRows = async () => {
  const workerUrl = process.env.VITE_WORKER_URL?.replace(/\/$/, "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const attempts = [];
  if (workerUrl) attempts.push(() => fetchJson(`${workerUrl}/api/irrigation-kits`));
  if (supabaseUrl && supabaseKey) {
    attempts.push(() =>
      fetchJson(`${supabaseUrl}/rest/v1/irrigation_kits?select=*&active=eq.true`, {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }),
    );
  }
  for (const attempt of attempts) {
    try {
      const kits = toArray(await attempt(), "irrigation kits");
      return kits
        .filter((kit) => typeof kit?.name === "string" && kit.name.trim())
        .map((kit) => ({
          name: kit.name.trim(),
          acres: Number(kit.coverage_area) > 0 ? Number(kit.coverage_area) : null,
          price: Number(kit.price) > 0 ? Number(kit.price) : null,
          crops: toStringList(kit.recommended_crops).slice(0, 4),
          warrantyMonths: Number(kit.warranty_months) > 0 ? Number(kit.warranty_months) : null,
        }))
        .sort((a, b) => (a.acres ?? Infinity) - (b.acres ?? Infinity) || (a.price ?? Infinity) - (b.price ?? Infinity));
    } catch (error) {
      console.warn(`Kit price feed failed (${error.message}); kit price tables will be omitted from static pages.`);
    }
  }
  return [];
};

const kitRows = await getKitRows();
console.log(`SEO generator loaded ${kitRows.length} irrigation kits (${kitRows.filter((kit) => kit.price).length} with a price).`);
const KIT_TABLE_ROUTES = new Set(["/irrigation-kits", "/drip-irrigation-kit-price-kenya"]);
const formatKes = (value) => `KES ${Math.round(value).toLocaleString("en-US")}`;
const formatAcres = (acres) => (acres ? `${acres} acre${acres === 1 ? "" : "s"}` : "Custom size");

const renderKitTable = () => {
  if (!kitRows.length) return "";
  const rows = kitRows
    .map(
      (kit) =>
        `<tr><th scope="row">${escapeHtml(kit.name)}</th><td>${escapeHtml(formatAcres(kit.acres))}</td><td>${
          kit.price ? escapeHtml(formatKes(kit.price)) : "Contact DripTech for a quote"
        }</td><td>${escapeHtml(kit.crops.join(", ") || "Ask for a crop-specific layout")}</td></tr>`,
    )
    .join("");
  return `<section><h2>Current drip irrigation kit prices</h2><table><caption>DripTech kit catalogue prices in Kenyan shillings</caption><thead><tr><th scope="col">Kit</th><th scope="col">Covers</th><th scope="col">Price</th><th scope="col">Suited to</th></tr></thead><tbody>${rows}</tbody></table><p>Prices are DripTech's catalogue prices when this page was last published. A kit's acreage is a starting point: crop layout, lines per bed, water source and distance change the final list, so confirm the included components, delivery and installation before you order.</p></section>`;
};

// Pull one real, representative image per product category straight from the
// live catalog (Cloudflare Worker/Supabase) instead of relying on the
// AI-generated seed placeholders in public/seed-products/. Falls back to the
// existing static path only if no real product with an image exists yet for
// that category.
const categoryImageMap = {};
for (const product of dynamicContent.products) {
  const cat = product?.category;
  const img = product?.images?.[0];
  if (cat && img && /^https?:\/\//i.test(img) && !categoryImageMap[cat]) {
    categoryImageMap[cat] = img;
  }
}

const routeCategoryMap = {
  "/": "drip_irrigation",
  "/products": "drip_irrigation",
  "/products/drip": "drip_irrigation",
  "/products/sprinklers": "sprinkler_systems",
  "/products/pumps": "pumps_motors",
  "/products/pipes": "pipes_fittings",
  "/products/filtration": "filtration_systems",
  "/products/solar": "solar_irrigation",
  "/products/greenhouse": "greenhouse_systems",
  "/irrigation-kits": "drip_irrigation",
  "/services": "drip_irrigation",
  "/technician-services": "drip_irrigation",
  "/about": "drip_irrigation",
  "/contact": "drip_irrigation",
  "drip-irrigation-kenya": "drip_irrigation",
  "drip-irrigation-kit-price-kenya": "drip_irrigation",
  "driplines-for-sale-kenya": "drip_irrigation",
  "irrigation-pipe-prices-kenya": "pipes_fittings",
  "hdpe-pipe-prices-kenya": "pipes_fittings",
  "rain-hose-prices-kenya": "pipes_fittings",
  "dripline-prices-kenya": "drip_irrigation",
  "drip-irrigation-for-garlic-kenya": "drip_irrigation",
  "passion-fruit-irrigation-kenya": "drip_irrigation",
  "macadamia-irrigation-kenya": "drip_irrigation",
  "strawberry-irrigation-kenya": "drip_irrigation",
  "french-beans-irrigation-kenya": "drip_irrigation",
  "sprinkler-systems-kenya": "sprinkler_systems",
  "irrigation-companies-kenya": "drip_irrigation",
  "solar-irrigation-pumps-kenya": "solar_irrigation",
  "borehole-water-pumps-kenya": "borehole_equipment",
  "water-storage-tanks-kenya": "water_storage",
  "greenhouse-drip-irrigation-kenya": "greenhouse_systems",
  "fertigation-systems-kenya": "fertigation_systems",
};

const applyRealCategoryImage = (page) => {
  const key = page.slug || page.route;
  const category = routeCategoryMap[key];
  const realImage = category && categoryImageMap[category];
  if (realImage) {
    page.image = realImage;
    page.imageIsAbsolute = true;
  }
};

for (const page of allPages) applyRealCategoryImage(page);

const dynamicPages = [
  ...dynamicContent.products
    .filter((product) => product?.id && product?.name)
    .map((product) => {
      const category = categoryPaths[product.category] || "all";
      const route = `/products/${category}/${slugify(product.name)}-${String(product.id).slice(0, 8)}`;
      const description = stripHtml(product.description) || `${product.name} irrigation equipment from DripTech in Kenya.`;
      const price = Number(product.price);
      const images = (Array.isArray(product.images) ? product.images : [])
        .map((image) => toAbsoluteSiteAssetUrl(image, siteUrl))
        .filter((url) => typeof url === "string");
      const features = Array.isArray(product.features)
        ? product.features.map(stripHtml).filter(Boolean)
        : [];
      const applications = Array.isArray(product.applications)
        ? product.applications.map(stripHtml).filter(Boolean)
        : [];
      const specifications = Array.isArray(product.specifications)
        ? product.specifications
            .map((item) => ({
              name: stripHtml(item?.name || item?.label || ""),
              value: stripHtml(item?.value ?? ""),
              unit: stripHtml(item?.unit || ""),
            }))
            .filter((item) => item.name && item.value)
        : product.specifications && typeof product.specifications === "object"
          ? Object.entries(product.specifications)
              .map(([name, value]) => ({
                name: stripHtml(name),
                value: stripHtml(typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")),
                unit: "",
              }))
              .filter((item) => item.name && item.value)
          : [];
      const variants = Array.isArray(product.variants)
        ? product.variants
            .map((variant) => ({
              name: stripHtml(variant?.name || ""),
              price: Number(variant?.price),
              inStock: Boolean(variant?.in_stock),
            }))
            .filter((variant) => variant.name)
        : [];
      // Distinct, spec-based metadata so near-identical catalogue items do not
      // all share one title/description template.
      const specSummary = specifications
        .slice(0, 3)
        .map((item) => `${item.name}: ${item.value}${item.unit ? " " + item.unit : ""}`)
        .join(", ");
      const modelSuffix = product.model_number ? ` (${stripHtml(product.model_number)})` : "";
      const seoTitle = `${product.name}${modelSuffix} Kenya${price > 0 ? ` | KSh ${price.toLocaleString("en-KE")}` : " | Specs & Quote"} | DripTech`;
      const seoDescription = (description.length >= 140 || !specSummary
        ? description
        : `${description} ${specSummary}.`
      ).slice(0, 300);
      // A page is "thin" when it has no photo and almost no distinguishing
      // detail. These stay crawlable and linked, but are kept out of the
      // index and sitemap so Google spends its crawl budget on real pages.
      const isThin = images.length === 0 && specifications.length < 3 && description.length < 120;
      return {
        route,
        thin: isThin,
        lastmod: product.updated_at || product.created_at || null,
        title: seoTitle,
        description: seoDescription,
        heading: product.name,
        intro: description,
        image: images[0] || undefined,
        imageIsAbsolute: Boolean(images[0]),
        productDetails: {
          name: product.name,
          modelNumber: stripHtml(product.model_number || ""),
          price: Number.isFinite(price) && price > 0 ? price : null,
          inStock: Boolean(product.in_stock),
          images,
          features,
          applications,
          specifications,
          variants,
        },
        // Only use Product structured data when there is a real, positive
        // catalog price to support a valid Offer. Never invent a price,
        // review, or rating just to qualify for a rich result.
        schema: price > 0
          ? {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description,
              ...(images.length ? { image: images } : {}),
              sku: product.model_number || product.id,
              brand: { "@type": "Brand", name: "DripTech Eco Flow" },
              url: `${siteUrl}${route}`,
              offers: {
                "@type": "Offer",
                price,
                priceCurrency: "KES",
                availability: product.in_stock
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                url: `${siteUrl}${route}`,
              },
            }
          : {
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: product.name,
              description,
              ...(images.length ? { image: images } : {}),
              url: `${siteUrl}${route}`,
              isPartOf: { "@id": `${siteUrl}/#website` },
            },
      };
    }),
  ...dynamicContent.posts
    .filter((post) => post?.slug && post?.title)
    .map((post) => {
      const description = stripHtml(post.excerpt || post.content).slice(0, 300);
      const articleBlocks = extractTextBlocks(post.content || post.body || post.article_body);
      const articleImage = toAbsoluteSiteAssetUrl(post.featured_image || post.image || post.cover_image, siteUrl);
      return {
        route: `/blog/${post.slug}`,
        title: `${post.title} | DripTech Blog`,
        description,
        heading: post.title,
        intro: description,
        articleContent: articleBlocks.length ? articleBlocks : extractTextBlocks(description),
        image: articleImage || undefined,
        imageIsAbsolute: Boolean(articleImage),
        articleImage: articleImage || null,
        articleDate: post.published_at || post.created_at || null,
        schema: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description,
          ...(articleImage ? { image: articleImage } : {}),
          url: `${siteUrl}/blog/${post.slug}`,
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.published_at || post.created_at,
          author: { "@type": "Organization", name: "DripTech Eco Flow" },
        },
      };
    }),
  ...dynamicContent.news
    .filter((article) => article?.slug && article?.title)
    .map((article) => {
      const description = stripHtml(article.excerpt || article.content).slice(0, 300);
      const articleBlocks = extractTextBlocks(article.content || article.body || article.article_body);
      const articleImage = toAbsoluteSiteAssetUrl(article.featured_image || article.image || article.cover_image, siteUrl);
      return {
        route: `/news/${article.slug}`,
        title: `${article.title} | DripTech News`,
        description,
        heading: article.title,
        intro: description,
        articleContent: articleBlocks.length ? articleBlocks : extractTextBlocks(description),
        image: articleImage || undefined,
        imageIsAbsolute: Boolean(articleImage),
        articleImage: articleImage || null,
        articleDate: article.published_at || article.created_at || null,
        schema: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description,
          ...(articleImage ? { image: articleImage } : {}),
          url: `${siteUrl}/news/${article.slug}`,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at || article.published_at || article.created_at,
          author: { "@type": "Organization", name: article.author || "DripTech Eco Flow" },
        },
      };
    }),
];

for (const route of sitemapRoutes) {
  if (allPages.some((page) => page.route === route)) continue;

  const fallback = sitemapFallbackPages[route];
  if (!fallback) {
    throw new Error(
      `SEO sitemap route "${route}" has no static page definition. Add it to categoryPages, landingPages, irrigationCostCalculatorPage, or sitemapFallbackPages before building.`,
    );
  }

  const [title, heading, intro] = fallback;
  allPages.push({ route, title, description: intro, heading, intro });
}

allPages.push(...dynamicPages);

// ---------------------------------------------------------------------------
// Topic clusters: every guide links to the next few guides in its cluster so no
// page is an orphan and link equity flows between related pages (crawlable HTML).
// ---------------------------------------------------------------------------
const routesOf = (list) => list.map((page) => page.route || `/${page.slug}`);
const locationRoutes = routesOf(locationPages);
const priceRoutes = new Set([
  ...routesOf(irrigationPricePages),
  "/irrigation-system-cost-kenya",
  "/drip-irrigation-kit-price-kenya",
  "/one-acre-drip-irrigation-system-kenya",
  "/irrigation-boq-kenya",
  "/irrigation-bill-of-quantities-kenya",
]);
const troubleshootRegex = /troubleshoot|blocked|low-|leaks|clogging|problems|maintenance|startup|commissioning/;
const clusterOf = (route) => {
  if (locationRoutes.includes(route)) return "location";
  if (priceRoutes.has(route)) return "price";
  if (/^\/drip-irrigation-for-|\/[a-z-]+-irrigation-kenya$/.test(route) && routesOf(irrigationCropGapPages).concat(
    routesOf(landingPages).filter((r) => r.startsWith("/drip-irrigation-for-")),
  ).includes(route)) return "crop";
  if (troubleshootRegex.test(route)) return "troubleshoot";
  if (staticSeoRoutes.has(route)) return "planning";
  return null;
};
const clusterMembers = new Map();
for (const page of allPages) {
  const cluster = clusterOf(page.route);
  if (!cluster || page.thin) continue;
  clusterMembers.set(cluster, [...(clusterMembers.get(cluster) || []), page]);
}
const CLUSTER_HEADINGS = {
  crop: "More crop irrigation guides",
  location: "Irrigation by location in Kenya",
  price: "More irrigation pricing guides",
  troubleshoot: "More troubleshooting and maintenance guides",
  planning: "More irrigation planning guides",
};
for (const [cluster, members] of clusterMembers) {
  members.forEach((page, index) => {
    const existing = new Set((page.links || []).map((link) => link.href));
    const links = [];
    for (let step = 1; step < members.length && links.length < 5; step += 1) {
      const target = members[(index + step) % members.length];
      if (target.route === page.route || existing.has(target.route)) continue;
      links.push({ label: target.heading || target.h1 || target.title, href: target.route });
    }
    page.clusterLinks = links;
    page.clusterHeading = CLUSTER_HEADINGS[cluster];
  });
}

// Connect the existing catalogue URLs with crawlable HTML links. Category pages
// list a manageable set of real products, and product pages link to related
// products from the same category instead of relying on JavaScript navigation.
const productPages = allPages.filter((page) => page.productDetails);
const productPagesByCategory = new Map();
for (const product of productPages) {
  const category = product.route.split("/")[2];
  const group = productPagesByCategory.get(category) || [];
  group.push(product);
  productPagesByCategory.set(category, group);
}
for (const page of allPages) {
  if (page.route === "/products") {
    page.catalogLinks = productPages.filter((product) => !product.thin).slice(0, 12).map((product) => ({
      label: product.heading,
      href: product.route,
    }));
  } else if (/^\/products\/[^/]+$/.test(page.route)) {
    const category = page.route.split("/")[2];
    // List every indexable product so none sit deep in a prev/next chain.
    page.catalogLinks = (productPagesByCategory.get(category) || [])
      .filter((product) => !product.thin)
      .map((product) => ({ label: product.heading, href: product.route }));
  }
  if (page.productDetails) {
    const category = page.route.split("/")[2];
    const group = productPagesByCategory.get(category) || [];
    const index = group.findIndex((product) => product.route === page.route);
    // Always link to adjacent products so the whole category is crawlable as a
    // chain, even when the category contains hundreds of products.
    const adjacent = [
      ...(index > 0 ? [group[index - 1]] : []),
      ...(index >= 0 && index + 1 < group.length ? [group[index + 1]] : []),
    ];
    const related = group.filter((product) =>
      product.route !== page.route && !adjacent.some((item) => item.route === product.route),
    ).slice(0, 4);
    page.relatedProductLinks = [...adjacent, ...related].map((product) => ({
      label: product.heading,
      href: product.route,
    }));
  }
}

// ---------------------------------------------------------------------------
// "Products in this guide": real catalogue items with their own photos, so guides
// show products the reader can actually buy. Only products with a real photo
// (not a shared category placeholder) are used, and the selection rotates per
// guide so pages do not all show the same four items.
// ---------------------------------------------------------------------------
const guideCategoryRules = [
  [/sprinkler|rain-?gun|rain-hose|low-irrigation-pressure/, ["sprinklers"]],
  [/solar/, ["pumps", "solar"]],
  [/borehole/, ["pumps", "borehole"]],
  [/pump/, ["pumps"]],
  [/filter|filtration|clog|blocked/, ["filtration", "filters-strainers", "drip"]],
  [/pipe|hdpe|fitting|leak/, ["pipes"]],
  [/fertigation/, ["fertigation", "filtration"]],
  [/greenhouse/, ["greenhouse", "drip"]],
  [/valve|control|zone/, ["valves", "controls", "controllers"]],
  [/tank|storage/, ["storage", "pumps"]],
];
const isPlaceholderImage = (url = "") => /\/(category-images|seed-products)\//.test(url);
const hashOf = (value) => [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
const photoProducts = productPages.filter(
  (product) => !product.thin && product.productDetails.images.some((url) => !isPlaceholderImage(url)),
);
if (photoProducts.length) {
  for (const page of allPages) {
    if (page.productDetails || !staticSeoRoutes.has(page.route) || page.thin) continue;
    const rule = guideCategoryRules.find(([pattern]) => pattern.test(page.route));
    const wanted = rule ? rule[1] : ["drip", "filtration"];
    let pool = photoProducts.filter((product) => wanted.includes(product.route.split("/")[2]));
    if (pool.length < 4) pool = [...pool, ...photoProducts.filter((product) => !pool.includes(product))];
    pool = [...pool].sort(
      (a, b) =>
        Number(b.productDetails.inStock) - Number(a.productDetails.inStock) ||
        Number(Boolean(b.productDetails.price)) - Number(Boolean(a.productDetails.price)) ||
        a.route.localeCompare(b.route),
    );
    const start = pool.length ? hashOf(page.route) % pool.length : 0;
    page.guideProducts = Array.from({ length: Math.min(4, pool.length) }, (_, i) => pool[(start + i) % pool.length]).map(
      (product) => ({
        name: product.heading,
        href: product.route,
        image: product.productDetails.images.find((url) => !isPlaceholderImage(url)),
        price: product.productDetails.price,
      }),
    );
  }
}

// Catch duplicate static routes before they silently overwrite one another.
const seenRoutes = new Set();
for (const page of allPages) {
  if (seenRoutes.has(page.route)) {
    throw new Error(`Duplicate static SEO route detected: ${page.route}`);
  }
  seenRoutes.add(page.route);
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const replaceMeta = (html, name, content, attribute = "name") => {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']${name}["'][^>]*>`,
    "i",
  );
  const replacement = `<meta ${attribute}="${name}" content="${escaped}" />`;
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
};

const isSafeInternalHref = (href) =>
  typeof href === "string" &&
  href.startsWith("/") &&
  !href.startsWith("//") &&
  !/[\s"'<>]/.test(href);

const categoryLabels = {
  drip: "Drip Irrigation", sprinklers: "Sprinklers", pumps: "Pumps & Motors", pipes: "Pipes & Fittings",
  filtration: "Filtration", solar: "Solar Irrigation", greenhouse: "Greenhouse Systems", controls: "Controls",
  fertigation: "Fertigation", emitters: "Emitters & Drippers", valves: "Valves & Regulators",
  accessories: "Accessories", storage: "Water Storage", borehole: "Borehole", "rain-guns": "Rain Guns",
};
// Breadcrumb trail for any page below the homepage. Used both for the visible
// links (internal linking) and for BreadcrumbList structured data.
const getBreadcrumbs = (page) => {
  if (page.route === "/") return [];
  const parts = page.route.split("/").filter(Boolean);
  const trail = [{ name: "Home", href: "/" }];
  if (parts[0] === "products") {
    trail.push({ name: "Products", href: "/products" });
    if (parts[1]) {
      trail.push({
        name: categoryLabels[parts[1]] || parts[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: `/products/${parts[1]}`,
      });
    }
  } else if (parts[0] === "blog" || parts[0] === "news") {
    trail.push({ name: parts[0] === "blog" ? "Blog" : "News", href: `/${parts[0]}` });
  }
  trail.push({ name: page.heading || page.h1 || page.title, href: page.route });
  // A trail of Home > current page is still valid; just dedupe the tail.
  return trail.filter((item, i, arr) => i === arr.length - 1 || item.href !== page.route);
};

const pageBody = (page) => {
  // An intro belongs to the page shell exactly once. The old fallback rendered
  // it once here and a second time when a page did not define sections.
  const sections = (page.sections || [])
    .map((section) => {
      const paragraphs = (section.paragraphs || [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      const bullets = Array.isArray(section.bullets) && section.bullets.length
        ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join("");

  // Use page-specific related links for SEO landing pages. Keep site-wide
  // navigation as a fallback for pages that do not define contextual links.
  const relatedLinks = (Array.isArray(page.links) ? page.links : []).filter(
    (link) =>
      typeof link?.label === "string" &&
      link.label.trim().length > 0 &&
      isSafeInternalHref(link.href),
  );
  const relatedNav = relatedLinks.length
    ? `<nav aria-label="Related irrigation guides"><h2>Continue exploring</h2><ul>${relatedLinks
        .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join("")}</ul></nav>`
    : `<nav aria-label="Related irrigation pages">
        <a href="/products">Browse irrigation products</a>
        <a href="/irrigation-kits">Compare irrigation kits</a>
        <a href="/contact">Contact DripTech</a>
      </nav>`;

  const catalogNav = (Array.isArray(page.catalogLinks) && page.catalogLinks.length)
    ? `<nav aria-label="Products in this catalogue"><h2>Browse available products</h2><ul>${page.catalogLinks
        .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join("")}</ul></nav>`
    : "";
  const relatedProductsNav = (Array.isArray(page.relatedProductLinks) && page.relatedProductLinks.length)
    ? `<nav aria-label="Related products"><h2>Related products</h2><ul>${page.relatedProductLinks
        .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join("")}</ul></nav>`
    : "";

  const sourceLinks = (Array.isArray(page.sources) ? page.sources : []).filter((source) =>
    typeof source?.label === "string" && source.label.trim() &&
    typeof source?.url === "string" && /^https:\/\//i.test(source.url),
  );
  const sourceNav = sourceLinks.length
    ? `<section aria-label="Background sources"><h2>Local context and further reading</h2><ul>${sourceLinks
        .map((source) => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(source.label)}</a></li>`)
        .join("")}</ul><p>These references provide regional agricultural context. Confirm site-specific requirements, product specifications and service availability for each farm.</p></section>`
    : "";

  const articleImageUrl = page.articleImage
    ? toAbsoluteSiteAssetUrl(page.articleImage, siteUrl)
    : undefined;
  const articleImage = articleImageUrl
    ? `<figure><img src="${escapeHtml(articleImageUrl)}" alt="${escapeHtml(page.heading || "DripTech article")}" width="1200" height="675" decoding="async" /><figcaption>${escapeHtml(page.heading || "DripTech article")}</figcaption></figure>`
    : "";
  const articleBody = Array.isArray(page.articleContent) && page.articleContent.length
    ? `<section data-seo-article-body="true" aria-label="Article content">${page.articleContent.map((block) => `<p>${escapeHtml(block)}</p>`).join("")}</section>`
    : "";
  const articleDate = page.articleDate
    ? `<p><time datetime="${escapeHtml(page.articleDate)}">Published ${escapeHtml(page.articleDate.slice(0, 10))}</time></p>`
    : "";

  const product = page.productDetails;
  // Static guide pages are shown without React, so the hero photo must be in the
  // HTML itself (it was only rendered client-side before, leaving pages image-less).
  const FALLBACK_HERO = "/category-images/drip-irrigation-dripline-kenya.jpg";
  const heroSource = !product && !articleImageUrl && page.route !== "/admin"
    ? (page.image || FALLBACK_HERO)
    : null;
  const heroUrl = heroSource
    ? (page.imageIsAbsolute ? heroSource : toAbsoluteSiteAssetUrl(heroSource, siteUrl))
    : null;
  const heroImage = heroUrl
    ? `<figure data-seo-hero="true"><img src="${escapeHtml(heroUrl)}" alt="${escapeHtml(`${page.heading || page.h1 || "Irrigation"} - irrigation equipment and farm setup in Kenya`)}" width="1200" height="675" fetchpriority="high" decoding="async" /></figure>`
    : "";
  const productImage = product?.images?.[0]
    ? `<figure data-seo-product-image="true"><img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" width="900" height="900" fetchpriority="high" decoding="async" /><figcaption>${escapeHtml(product.name)} — irrigation equipment from DripTech Eco-Flow, Kenya.</figcaption></figure>`
    : "";
  const productFacts = product
    ? `<section data-seo-product-section="details" aria-label="Product details"><h2>Product details</h2>
        ${product.modelNumber ? `<p><strong>Model:</strong> ${escapeHtml(product.modelNumber)}</p>` : ""}
        ${product.price ? `<p><strong>Listed price:</strong> KSh ${escapeHtml(product.price.toLocaleString("en-KE"))}</p>` : `<p><strong>Pricing:</strong> Request a current quotation from DripTech Eco-Flow.</p>`}
        <p><strong>Availability:</strong> ${product.inStock ? "Listed as in stock; confirm current availability before ordering." : "Contact DripTech to confirm current availability."}</p>
      </section>`
    : "";
  const renderListSection = (heading, values, marker) => values?.length
    ? `<section data-seo-product-section="${marker}"><h2>${heading}</h2><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></section>`
    : "";
  const specifications = product?.specifications?.length
    ? `<section data-seo-product-section="specifications"><h2>Technical specifications</h2><dl>${product.specifications.map((spec) => `<div><dt><strong>${escapeHtml(spec.name)}</strong></dt><dd>${escapeHtml(spec.value)}${spec.unit ? " " + escapeHtml(spec.unit) : ""}</dd></div>`).join("")}</dl></section>`
    : "";
  const variants = product?.variants?.length
    ? `<section><h2>Available options</h2><ul>${product.variants.map((variant) => `<li>${escapeHtml(variant.name)}${variant.price > 0 ? " — KSh " + escapeHtml(variant.price.toLocaleString("en-KE")) : ""}</li>`).join("")}</ul></section>`
    : "";
  const productContact = product
    ? `<p><a href="/contact">Ask DripTech about this product</a> for confirmation of current price, specifications, stock and delivery options.</p>`
    : "";

  const clusterNav = Array.isArray(page.clusterLinks) && page.clusterLinks.length
    ? `<nav aria-label="${escapeHtml(page.clusterHeading)}"><h2>${escapeHtml(page.clusterHeading)}</h2><ul>${page.clusterLinks
        .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join("")}</ul></nav>`
    : "";
  const siteNavGroups = [
    ["Products", ["/products", "/products/drip", "/products/sprinklers", "/products/pumps", "/products/pipes", "/products/filtration", "/products/filters-strainers", "/products/valves", "/products/controls", "/products/controllers", "/products/fertigation", "/products/solar", "/products/storage", "/products/borehole", "/products/greenhouse", "/irrigation-kits"]],
    ["Company and resources", ["/about", "/contact", "/projects", "/case-studies", "/success-stories", "/blog", "/news", "/videos", "/installation-guides", "/certifications", "/team", "/careers"]],
    ["Legal", ["/privacy", "/terms", "/cookies"]],
  ];
  const routeLabels = new Map(allPages.map((candidate) => [candidate.route, candidate.nav || candidate.heading || candidate.h1 || candidate.title]));
  const siteNav = `<nav aria-label="DripTech site map">${siteNavGroups
    .map(([group, routes]) => {
      const items = routes.filter((route) => routeLabels.has(route) && route !== page.route);
      return items.length
        ? `<h2>${escapeHtml(group)}</h2><ul>${items.map((route) => `<li><a href="${route}">${escapeHtml(String(routeLabels.get(route)).replace(/\s*\|.*$/, ""))}</a></li>`).join("")}</ul>`
        : "";
    })
    .join("")}</nav>`;
  const guideProductsNav = Array.isArray(page.guideProducts) && page.guideProducts.length
    ? `<section aria-label="Products for this guide" data-seo-guide-products="true"><h2>Products you can use for this</h2><ul>${page.guideProducts
        .map(
          (item) =>
            `<li><a href="${escapeHtml(item.href)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="400" height="300" loading="lazy" decoding="async" /><span>${escapeHtml(item.name)}</span>${item.price ? `<small>KSh ${escapeHtml(item.price.toLocaleString("en-KE"))}</small>` : "<small>Ask for a quote</small>"}</a></li>`,
        )
        .join("")}</ul><p><a href="/products">Browse all irrigation products</a> or <a href="/contact">ask DripTech to size a system for your farm</a>.</p></section>`
    : "";
  const faqItems = (Array.isArray(page.faqs) ? page.faqs : []).filter((faq) => faq?.q && faq?.a);
  const faqSection = faqItems.length
    ? `<section aria-label="Frequently asked questions"><h2>Frequently asked questions</h2>${faqItems
        .map((faq) => `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`)
        .join("")}</section>`
    : "";

  return `
    <main data-seo-shell="true"${product ? ' data-seo-product="true"' : ""}>
      ${(() => {
        const trail = getBreadcrumbs(page);
        return trail.length > 1
          ? `<nav aria-label="Breadcrumb"><ol>${trail
              .map((item, i) => `<li>${i === trail.length - 1 ? escapeHtml(item.name) : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a>`}</li>`)
              .join("")}</ol></nav>`
          : "";
      })()}
      <p>DripTech Eco-Flow | Irrigation equipment in Kenya</p>
      <h1>${escapeHtml(page.heading || page.h1)}</h1>
      ${productImage}
      ${articleImage}
      ${heroImage}
      <p>${escapeHtml(page.intro)}</p>
      ${articleDate}
      ${articleBody}
      ${productFacts}
      ${renderListSection("Features", product?.features, "features")}
      ${renderListSection("Applications", product?.applications, "applications")}
      ${specifications}
      ${variants}
      ${productContact}
      ${KIT_TABLE_ROUTES.has(page.route) ? renderKitTable() : ""}
      ${sections}
      ${faqSection}
      ${guideProductsNav}
      ${catalogNav}
      ${relatedProductsNav}
      ${sourceNav}
      ${relatedNav}
      ${clusterNav}
      ${siteNav}
    </main>`;
};

// Titles over ~60 characters are truncated in Google results. Shorten the brand
// suffix first, then drop it, before giving up (the build still warns).
const fitTitle = (title = "") => {
  if (title.length <= 60) return title;
  const withShortBrand = title.replace(/\s*\|\s*DripTech Eco[- ]?Flow$/i, " | DripTech");
  if (withShortBrand.length <= 60) return withShortBrand;
  const withoutBrand = withShortBrand.replace(/\s*\|\s*DripTech$/i, "");
  return withoutBrand.length <= 60 ? withoutBrand : withShortBrand;
};

const toLastmod = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
};

const renderPage = (rawPage) => {
  const page = { ...rawPage, title: fitTitle(rawPage.title) };
  const canonical = `${siteUrl}${page.route === "/" ? "/" : page.route}`;
  const imageUrl = page.imageIsAbsolute
    ? page.image
    : `${siteUrl}${page.image || "/driptech-logo.png"}`;
  let html = baseHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(page.title)}</title>`,
  );

  html = replaceMeta(html, "description", page.description);
  html = replaceMeta(html, "title", page.title);
  html = replaceMeta(
    html,
    "robots",
    page.thin ? "noindex, follow" : "index, follow, max-image-preview:large",
  );
  html = html.replace(
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = replaceMeta(html, "og:title", page.title, "property");
  html = replaceMeta(html, "og:description", page.description, "property");
  html = replaceMeta(html, "og:url", canonical, "property");
  html = replaceMeta(html, "og:image", imageUrl, "property");
  html = replaceMeta(html, "twitter:title", page.title);
  html = replaceMeta(html, "twitter:description", page.description);
  html = replaceMeta(html, "twitter:url", canonical);
  html = replaceMeta(html, "twitter:image", imageUrl);
  const staticSeoPage = staticSeoRoutes.has(page.route);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"${staticSeoPage ? ' data-seo-static-page="true"' : ""}>${pageBody(page)}</div>`,
  );

  const crumbs = getBreadcrumbs(page);
  const extraSchemas = [];
  if (crumbs.length > 1) {
    extraSchemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: `${siteUrl}${item.href === "/" ? "/" : item.href}`,
      })),
    });
  }
  if (Array.isArray(page.catalogLinks) && page.catalogLinks.length && /^\/products\/[^/]+$/.test(page.route)) {
    extraSchemas.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.heading,
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: page.catalogLinks.length,
        itemListElement: page.catalogLinks.map((link, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}${link.href}`,
          name: link.label,
        })),
      },
    });
  }
  const pricedKits = kitRows.filter((kit) => kit.price);
  if (KIT_TABLE_ROUTES.has(page.route) && pricedKits.length) {
    extraSchemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "DripTech drip irrigation kits",
      numberOfItems: pricedKits.length,
      itemListElement: pricedKits.map((kit, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: kit.name,
          brand: { "@type": "Brand", name: "DripTech Eco Flow" },
          offers: {
            "@type": "Offer",
            price: String(Math.round(kit.price)),
            priceCurrency: "KES",
            url: `${siteUrl}/irrigation-kits`,
          },
        },
      })),
    });
  }
  // Organization + WebSite once per page so WebPage/Article can reference them by @id
  // even though most pages are served as static HTML without client-side schema.
  extraSchemas.push(buildOrganizationSchema());
  extraSchemas.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "DripTech Eco Flow",
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-KE",
  });
  const faqItems = (Array.isArray(page.faqs) ? page.faqs : []).filter((faq) => faq?.q && faq?.a);
  if (faqItems.length) {
    extraSchemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    });
  }
  if (!page.productDetails && page.route !== "/" && Array.isArray(page.sections) && page.sections.length) {
    extraSchemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: (page.heading || page.title || "").slice(0, 110),
      description: page.description,
      mainEntityOfPage: canonical,
      image: imageUrl,
      dateModified: toLastmod(page.lastmod) || undefined,
      author: { "@id": `${siteUrl}/#organization` },
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en-KE",
    });
  }
  const extraSchemaTags = extraSchemas
    .map((schema) => `<script type="application/ld+json">${serializeJsonLd(schema)}</script>`)
    .join("\n");
  return `${html.replace(
    "</head>",
    `${extraSchemaTags}\n<script type="application/ld+json">${serializeJsonLd(
      page.schema || {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: canonical,
        image: imageUrl,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@type": "Thing", name: "Irrigation in Kenya" },
      },
    )}</script>\n</head>`,
  )}`;
};

// <lastmod> only moves when a page's rendered content actually changes. The
// manifest (committed) maps route -> content hash + date, so unchanged pages keep
// a stable date and Google can trust the sitemap's freshness signal.
const lastmodManifestPath = path.join(root, "scripts/seo-lastmod.json");
const lastmodManifest = fs.existsSync(lastmodManifestPath)
  ? JSON.parse(fs.readFileSync(lastmodManifestPath, "utf8"))
  : {};
const today = new Date().toISOString().slice(0, 10);
const nextLastmodManifest = {};
for (const page of allPages) {
  if (page.lastmod || page.thin || page.productDetails) continue; // dynamic pages carry real dates
  const hash = createHash("sha1")
    .update(JSON.stringify([page.title, page.description, pageBody(page)]))
    .digest("hex")
    .slice(0, 12);
  const previous = lastmodManifest[page.route];
  nextLastmodManifest[page.route] = previous?.hash === hash ? previous : { hash, date: today };
  page.lastmod = nextLastmodManifest[page.route].date;
}
if (!process.env.CI && !process.env.VERCEL) {
  fs.writeFileSync(lastmodManifestPath, `${JSON.stringify(nextLastmodManifest, null, 2)}\n`);
}

for (const page of allPages) {
  const routeDirectory = page.route === "/" ? dist : path.join(dist, page.route);
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.writeFileSync(path.join(routeDirectory, "index.html"), renderPage(page));
}

const xmlEscape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const sitemapPages = new Map();
for (const page of allPages) {
  if (page.thin) continue; // noindex pages must not be in the sitemap
  if (!sitemapPages.has(page.route)) sitemapPages.set(page.route, page);
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...sitemapPages.entries()]
  .map(([route, page]) => {
    const lastmod = toLastmod(page.lastmod || page.articleDate);
    return `  <url><loc>${xmlEscape(`${siteUrl}${route}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  })
  .join("\n")}
</urlset>
`;
// Search snippets get truncated past roughly these lengths. Warn (not fail) so
// admin-authored product and blog titles can be reviewed without blocking deploys.
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;
const longSnippets = allPages.filter(
  (page) => !page.thin && (fitTitle(page.title || "").length > TITLE_LIMIT || (page.description || "").length > DESCRIPTION_LIMIT),
);
if (longSnippets.length) {
  console.warn(`WARNING: ${longSnippets.length} page(s) exceed ${TITLE_LIMIT}-char titles or ${DESCRIPTION_LIMIT}-char descriptions and may be truncated in search results:`);
  for (const page of longSnippets.slice(0, 20)) {
    console.warn(`  ${page.route} (title ${fitTitle(page.title || "").length}, description ${(page.description || "").length})`);
  }
}

const generatedLocs = validateSitemapXml(sitemap, "Generated dist/sitemap.xml");
const missingFiles = generatedLocs
  .map((loc) => loc.slice(siteUrl.length) || "/")
  .filter((route) => route !== "/" && !fs.existsSync(path.join(dist, route.replace(/^\//, ""), "index.html")));
if (missingFiles.length) {
  throw new Error(`Generated sitemap lists ${missingFiles.length} URL(s) with no generated HTML file: ${missingFiles.slice(0, 10).join(", ")}`);
}
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

// /admin is intentionally a real static document so no crawler has to execute
// React before seeing its noindex directive. Do not add it to robots.txt: bots
// must be allowed to fetch this response in order to process the noindex.
const adminHtml = baseHtml
  .replace(/<title>[\s\S]*?<\/title>/i, "<title>DripTech Admin</title>")
  .replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex, nofollow, noarchive" />')
  .replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${siteUrl}/admin" />`)
  .replace('<div id="root"></div>', '<div id="root"><main><h1>DripTech Admin</h1></main></div>');
fs.mkdirSync(path.join(dist, "admin"), { recursive: true });
fs.writeFileSync(path.join(dist, "admin", "index.html"), adminHtml);

{
  const total = dynamicPages.filter((p) => p.productDetails).length;
  const thin = dynamicPages.filter((p) => p.thin).length;
  if (total > 0 && thin / total > 0.5) {
    console.warn(`WARNING: ${thin} of ${total} product pages are thin and set to noindex. Add images, specs or longer descriptions in the admin to get them indexed.`);
  }
}
console.log(`Thin product pages kept out of index and sitemap: ${dynamicPages.filter((p) => p.thin).length} of ${dynamicPages.filter((p) => p.productDetails).length}`);
console.log(
  `Generated ${allPages.length} crawlable SEO pages (${dynamicPages.length} dynamic) and one noindex admin page in dist/`,
);
