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
  },
  {
    route: "/products/drip",
    title: "Drip Irrigation Systems Kenya | Driplines, Emitters & Fittings | DripTech",
    description:
      "Shop drip irrigation products in Kenya including driplines, emitters, connectors, filters and fittings. Get sizing and installation support from DripTech.",
    heading: "Drip irrigation systems and components",
    intro:
      "Find driplines, emitters, connectors and related equipment for vegetable farms, greenhouses, kitchen gardens and larger irrigation projects in Kenya.",
  },
  {
    route: "/products/sprinklers",
    title: "Sprinkler Systems Kenya | Farm Sprinklers & Accessories | DripTech",
    description:
      "Browse sprinkler systems and irrigation accessories in Kenya. Compare sprinklers, rain guns, pipes, pumps and fittings with DripTech support.",
    heading: "Sprinkler systems for farms in Kenya",
    intro:
      "Choose sprinkler equipment by coverage, operating pressure, crop and water source. DripTech supplies sprinkler systems and related components across Kenya.",
  },
  {
    route: "/products/pumps",
    title: "Irrigation Pumps Kenya | Farm Water Pumps & Accessories | DripTech",
    description:
      "Find irrigation pumps and related farm water equipment in Kenya. Get help matching pump capacity to your water source and irrigation layout.",
    heading: "Irrigation pumps for Kenyan farms",
    intro:
      "A reliable irrigation pump must match the required flow, pressure, lift and power source. Browse current pump products and ask DripTech for sizing help.",
  },
  {
    route: "/products/pipes",
    title: "Irrigation Pipes & Fittings Kenya | DripTech",
    description:
      "Shop irrigation pipes, fittings and connectors in Kenya for drip and sprinkler systems. Get practical help planning your mainline and field connections.",
    heading: "Irrigation pipes and fittings in Kenya",
    intro:
      "Build a dependable irrigation layout with the right pipe diameter, connectors, valves and end fittings for your water source and field.",
  },
  {
    route: "/products/filtration",
    title: "Irrigation Filters Kenya | Water Filtration for Drip Systems | DripTech",
    description:
      "Browse irrigation filters and strainers in Kenya for drip and sprinkler systems. Protect emitters and keep your irrigation lines working reliably.",
    heading: "Irrigation filters and strainers",
    intro:
      "Good filtration protects drip emitters and sprinkler equipment from blockage. Choose filtration with the water source, flow rate and maintenance routine in mind.",
  },
  {
    route: "/products/solar",
    title: "Solar Irrigation Equipment Kenya | Solar Pumps & Farm Systems | DripTech",
    description:
      "Explore solar irrigation equipment in Kenya, including solar pumping options and components for farms that need dependable water supply.",
    heading: "Solar irrigation equipment in Kenya",
    intro:
      "Solar irrigation can help farms move water where grid power is limited. Compare the current equipment and request help checking pump, tank and field requirements.",
  },
  {
    route: "/products/greenhouse",
    title: "Greenhouse Irrigation Systems Kenya | DripTech",
    description:
      "Greenhouse irrigation systems and components in Kenya, including driplines, filters, fittings and control equipment for protected crops.",
    heading: "Greenhouse irrigation systems",
    intro:
      "Greenhouse crops need consistent application and clean water. DripTech supplies greenhouse irrigation components and can help match the system to your crop layout.",
  },
  {
    route: "/irrigation-kits",
    title: "Drip Irrigation Kit Prices Kenya | Compare Farm Kits | DripTech",
    description:
      "Compare complete drip irrigation kits in Kenya by plot size, crop and included components. Get help with pricing, delivery and installation from DripTech.",
    heading: "Drip irrigation kits by plot size",
    intro:
      "Compare ready-to-use irrigation kit options by plot size, price and crop. Each farm still needs the correct lines, filtration and fittings for its water source.",
  },
  {
    route: "/services",
    title: "Irrigation Services Kenya | Design, Installation & Maintenance | DripTech",
    description:
      "Professional irrigation design, installation, maintenance and repair services in Kenya for farms, greenhouses and commercial projects.",
    heading: "Irrigation design and installation services",
    intro:
      "Get practical support from system planning through installation, testing and maintenance. DripTech serves farms and irrigation projects across Kenya.",
  },
  {
    route: "/technician-services",
    title: "Irrigation Technicians Kenya | Installation, Repair & Maintenance | DripTech",
    description:
      "Book irrigation technician support in Kenya for installation, maintenance, troubleshooting and repairs on farm irrigation systems.",
    heading: "Irrigation technician services in Kenya",
    intro:
      "When an irrigation system needs hands-on help, DripTech can coordinate technician support for installation, repairs, maintenance and system checks.",
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
  },
  {
    route: "/contact",
    title: "Contact DripTech | Irrigation Consultation Kenya",
    description:
      "Contact DripTech for irrigation product advice, system sizing, installation support and delivery across Kenya.",
    heading: "Contact DripTech for irrigation support",
    intro:
      "Share your crop, acreage, water source and location to get practical guidance on irrigation products, complete kits and installation support.",
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
};

const allPages = [
  homePage,
  ...categoryPages,
  ...landingPages.map((page) => ({ ...page, route: `/${page.slug}` })),
];

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
  html = replaceMeta(html, "twitter:title", page.title);
  html = replaceMeta(html, "twitter:description", page.description);
  html = replaceMeta(html, "twitter:url", canonical);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${pageBody(page)}</div>`,
  );

  return `${html.replace(
    "</head>",
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url: canonical,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@type": "Thing", name: "Irrigation in Kenya" },
    })}</script>\n</head>`,
  )}`;
};

for (const page of allPages) {
  const routeDirectory = page.route === "/" ? dist : path.join(dist, page.route);
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.writeFileSync(path.join(routeDirectory, "index.html"), renderPage(page));
}

console.log(`Generated ${allPages.length} crawlable SEO pages in dist/`);