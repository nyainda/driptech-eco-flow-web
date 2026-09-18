import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://www.dripstech.co.ke";
const baseHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const landingPages = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/publicSeoPages.json"), "utf8"),
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
    title: "Drip Irrigation Systems Kenya | Driplines, Emitters & Fittings | DripTech",
    description:
      "Shop drip irrigation products in Kenya including driplines, emitters, connectors, filters and fittings. Get sizing and installation support from DripTech.",
    heading: "Drip irrigation systems and components",
    intro:
      "Find driplines, emitters, connectors and related equipment for vegetable farms, greenhouses, kitchen gardens and larger irrigation projects in Kenya.",
    image: "/seed-products/dripline_roll.jpg",
  },
  {
    route: "/products/sprinklers",
    title: "Sprinkler Systems Kenya | Farm Sprinklers & Accessories | DripTech",
    description:
      "Browse sprinkler systems and irrigation accessories in Kenya. Compare sprinklers, rain guns, pipes, pumps and fittings with DripTech support.",
    heading: "Sprinkler systems for farms in Kenya",
    intro:
      "Choose sprinkler equipment by coverage, operating pressure, crop and water source. DripTech supplies sprinkler systems and related components across Kenya.",
    image: "/seed-products/sprinkler.jpg",
  },
  {
    route: "/products/pumps",
    title: "Irrigation Pumps Kenya | Farm Water Pumps & Accessories | DripTech",
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
    title: "Irrigation Filters Kenya | Water Filtration for Drip Systems | DripTech",
    description:
      "Browse irrigation filters and strainers in Kenya for drip and sprinkler systems. Protect emitters and keep your irrigation lines working reliably.",
    heading: "Irrigation filters and strainers",
    intro:
      "Good filtration protects drip emitters and sprinkler equipment from blockage. Choose filtration with the water source, flow rate and maintenance routine in mind.",
    image: "/seed-products/drip2.jpg",
  },
  {
    route: "/products/solar",
    title: "Solar Irrigation Equipment Kenya | Solar Pumps & Farm Systems | DripTech",
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
    title: "Drip Irrigation Kit Prices Kenya | Compare Farm Kits | DripTech",
    description:
      "Compare complete drip irrigation kits in Kenya by plot size, crop and included components. Get help with pricing, delivery and installation from DripTech.",
    heading: "Drip irrigation kits by plot size",
    intro:
      "Compare ready-to-use irrigation kit options by plot size, price and crop. Each farm still needs the correct lines, filtration and fittings for its water source.",
    image: "/seed-products/drip3.jpg",
  },
  {
    route: "/services",
    title: "Irrigation Services Kenya | Design, Installation & Maintenance | DripTech",
    description:
      "Professional irrigation design, installation, maintenance and repair services in Kenya for farms, greenhouses and commercial projects.",
    heading: "Irrigation design and installation services",
    intro:
      "Get practical support from system planning through installation, testing and maintenance. DripTech serves farms and irrigation projects across Kenya.",
    image: "/seed-products/field_drip.jpg",
  },
  {
    route: "/technician-services",
    title: "Irrigation Technicians Kenya | Installation, Repair & Maintenance | DripTech",
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
    title: "Irrigation Case Studies Kenya | Farm Projects & Results | DripTech",
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
    title: "Irrigation Videos Kenya | Drip Installation Guides | DripTech",
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
  title: "Drip Irrigation Kits, Driplines & Sprinklers in Kenya | DripTech",
  description:
    "Shop drip irrigation kits, driplines, sprinklers, pumps and filters in Kenya. Get sizing help, supply and installation support from DripTech.",
  heading: "Driplines, kits and pumps that fit your farm",
  intro:
    "DripTech supplies irrigation equipment and complete systems for Kenyan farms, greenhouses and kitchen gardens. Browse products, compare kits and ask for help before you buy.",
  image: "/seed-products/field_drip.jpg",
};

const allPages = [
  homePage,
  ...categoryPages,
  ...landingPages.map((page) => ({ ...page, route: `/${page.slug}` })),
];

// Keep the HTML generated at build time aligned with the URLs submitted to
// search engines. A route missing from this list would otherwise fall through
// to the empty SPA document and lose its unique canonical and page content.
const sitemapRoutes = [
  ...fs
    .readFileSync(path.join(root, "public/sitemap.xml"), "utf8")
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
    "Irrigation Controllers Kenya | Timers & Automation | DripTech",
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

const fetchJson = async (url, headers = {}) => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};

const getDynamicContent = async () => {
  const workerUrl = process.env.VITE_WORKER_URL?.replace(/\/$/, "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    if (workerUrl) {
      const [products, posts, news] = await Promise.all([
        fetchJson(`${workerUrl}/api/products?in_stock=true&limit=1000`),
        fetchJson(`${workerUrl}/api/blog?limit=1000`),
        fetchJson(`${workerUrl}/api/news?limit=1000`),
      ]);
      return { products, posts, news };
    }

    if (supabaseUrl && supabaseKey) {
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
      const endpoint = `${supabaseUrl}/rest/v1`;
      const [products, posts, news] = await Promise.all([
        fetchJson(`${endpoint}/products?select=*&in_stock=eq.true`, headers),
        fetchJson(`${endpoint}/blog_posts?select=*&published=eq.true`, headers),
        fetchJson(`${endpoint}/news_articles?select=*&published=eq.true`, headers),
      ]);
      return { products, posts, news };
    }
  } catch (error) {
    console.warn(`Could not fetch dynamic SEO content; continuing with static pages: ${error.message}`);
  }

  return { products: [], posts: [], news: [] };
};

const dynamicContent = await getDynamicContent();

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
      return {
        route,
        title: `${product.name} Kenya | Price & Specifications | DripTech`,
        description,
        heading: product.name,
        intro: description,
        schema: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description,
          image: product.images?.[0],
          sku: product.model_number || product.id,
          brand: { "@type": "Brand", name: "DripTech Eco Flow" },
          url: `${siteUrl}${route}`,
          ...(price > 0
            ? {
                offers: {
                  "@type": "Offer",
                  price,
                  priceCurrency: "KES",
                  availability: product.in_stock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        },
      };
    }),
  ...dynamicContent.posts
    .filter((post) => post?.slug && post?.title)
    .map((post) => {
      const description = stripHtml(post.excerpt || post.content).slice(0, 300);
      return {
        route: `/blog/${post.slug}`,
        title: `${post.title} | DripTech Blog`,
        description,
        heading: post.title,
        intro: description,
        schema: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description,
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
      return {
        route: `/news/${article.slug}`,
        title: `${article.title} | DripTech News`,
        description,
        heading: article.title,
        intro: description,
        schema: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description,
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

  const [title, heading, intro] = sitemapFallbackPages[route] || [
    "Irrigation Solutions Kenya | DripTech",
    "Irrigation solutions from DripTech",
    "Explore irrigation products, farm system support and practical guidance from DripTech in Kenya.",
  ];
  allPages.push({ route, title, description: intro, heading, intro });
}

allPages.push(...dynamicPages);

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

const pageBody = (page) => {
  const sections = page.sections
    ? page.sections
        .map(
          (section) => `
            <section>
              <h2>${escapeHtml(section.heading)}</h2>
              ${(section.paragraphs || [])
                .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
                .join("")}
              ${
                section.bullets
                  ? `<ul>${section.bullets
                      .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
                      .join("")}</ul>`
                  : ""
              }
            </section>`,
        )
        .join("")
    : `<p>${escapeHtml(page.intro)}</p>`;

  return `
    <main data-seo-shell="true">
      <p>DripTech Kenya</p>
      <h1>${escapeHtml(page.heading || page.h1)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      ${sections}
      <nav aria-label="Related irrigation pages">
        <a href="/products">Browse irrigation products</a>
        <a href="/irrigation-kits">Compare irrigation kits</a>
        <a href="/contact">Contact DripTech</a>
      </nav>
    </main>`;
};

const renderPage = (page) => {
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
  html = replaceMeta(html, "robots", "index, follow, max-image-preview:large");
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
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${pageBody(page)}</div>`,
  );

  return `${html.replace(
    "</head>",
    `<script type="application/ld+json">${JSON.stringify(
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

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(allPages.map((page) => page.route))]
  .map(
    (route) => `  <url><loc>${xmlEscape(`${siteUrl}${route}`)}</loc><changefreq>weekly</changefreq><priority>${route === "/" ? "1.0" : "0.7"}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
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

console.log(
  `Generated ${allPages.length} crawlable SEO pages (${dynamicPages.length} dynamic) and one noindex admin page in dist/`,
);
