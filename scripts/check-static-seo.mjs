import fs from "node:fs";
import path from "node:path";
import { serializeJsonLd, toAbsoluteSiteAssetUrl } from "./seo-url-helpers.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://www.dripstech.co.ke";
const seoManifest = [
  ...JSON.parse(fs.readFileSync(path.join(root, "src/data/publicSeoPages.json"), "utf8")),
  ...JSON.parse(fs.readFileSync(path.join(root, "src/data/irrigationPriceSeoPages.json"), "utf8")),

  ...JSON.parse(fs.readFileSync(path.join(root, "src/data/irrigationCropGapPages.json"), "utf8")),
];
const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const sitemapPath = path.join(dist, "sitemap.xml");

if (!fs.existsSync(sitemapPath)) {
  throw new Error("Generated sitemap.xml is missing from dist/.");
}

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const routes = [...sitemap.matchAll(/<loc>https:\/\/www\.dripstech\.co\.ke(\/[^<]*)?<\/loc>/g)]
  .map((match) => match[1] || "/");

if (routes.length === 0) {
  throw new Error("Generated sitemap.xml contains no canonical site URLs.");
}
if (new Set(routes).size !== routes.length) {
  throw new Error("Generated sitemap.xml contains duplicate URLs.");
}

const failures = [];
const urlEntries = [...sitemap.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)];
const locEntries = [...sitemap.matchAll(/<loc\b[^>]*>[\s\S]*?<\/loc>/gi)];

if (urlEntries.length === 0) {
  failures.push("Generated sitemap.xml contains no <url> entries.");
}
urlEntries.forEach((entry, index) => {
  const locCount = [...entry[1].matchAll(/<loc\b[^>]*>[\s\S]*?<\/loc>/gi)].length;
  if (locCount !== 1) {
    failures.push(`Generated sitemap <url> entry ${index + 1} must contain exactly one <loc> (found ${locCount}).`);
  }
});
if (urlEntries.length !== locEntries.length) {
  failures.push(`Generated sitemap must have one <loc> per <url> (found ${locEntries.length} <loc> and ${urlEntries.length} <url>).`);
}

const imageUrlCases = [
  ["root-relative image", toAbsoluteSiteAssetUrl("/seed-products/dripline_roll.jpg", siteUrl), siteUrl + "/seed-products/dripline_roll.jpg"],
  ["absolute image", toAbsoluteSiteAssetUrl("https://cdn.example.test/product.jpg", siteUrl), "https://cdn.example.test/product.jpg"],
  ["protocol-relative image", toAbsoluteSiteAssetUrl("//cdn.example.test/product.jpg", siteUrl), undefined],
  ["unsupported image scheme", toAbsoluteSiteAssetUrl("javascript:alert(1)", siteUrl), undefined],
  ["blank image", toAbsoluteSiteAssetUrl("   ", siteUrl), undefined],
];
for (const [label, actual, expected] of imageUrlCases) {
  if (actual !== expected) failures.push("SEO helper test failed: " + label);
}

const jsonLdProbeValue = "</script><img src=x>";
const serializedProbe = serializeJsonLd({ description: jsonLdProbeValue });
try {
  const parsedProbe = JSON.parse(serializedProbe);
  if (parsedProbe.description !== jsonLdProbeValue) {
    failures.push("SEO helper test failed: JSON-LD escaping changed the parsed value");
  }
} catch {
  failures.push("SEO helper test failed: serialized JSON-LD is not valid JSON");
}
if (serializedProbe.toLowerCase().includes("</script>")) {
  failures.push("SEO helper test failed: JSON-LD may terminate its script element");
}
for (const route of routes) {
  const directory = route === "/" ? dist : path.join(dist, route.replace(/^\/+/, ""));
  const file = path.join(directory, "index.html");
  if (!fs.existsSync(file)) {
    failures.push(`${route}: missing generated HTML file`);
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)?.[1]?.trim() || "";
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["'][^>]*>/i)?.[1]?.trim() || "";
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
  const schemaScripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsedSchemas = [];
  for (const match of schemaScripts) {
    try {
      parsedSchemas.push(JSON.parse(match[1]));
    } catch {
      failures.push(route + ": invalid JSON-LD block");
    }
  }
  const productSchemas = parsedSchemas.filter((schema) =>
    (Array.isArray(schema?.["@type"]) ? schema["@type"] : [schema?.["@type"]]).includes("Product"),
  );
  const isProductDetailRoute = /^\/products\/[^/]+\/[^/]+$/.test(route);
  const isArticleRoute = /^\/(?:blog|news)\/[^/]+$/.test(route);
  if (isArticleRoute) {
    if (!html.includes('data-seo-article-body="true"')) {
      failures.push(route + ": article body must be present in initial HTML");
    }
    if (!/<section data-seo-article-body="true"[^>]*><p>[^<\s][\s\S]*?<\/p><\/section>/.test(html)) {
      failures.push(route + ": article body must contain readable text in initial HTML");
    }
  }
  if (isProductDetailRoute) {
    // Product pages must be useful in the first HTML response, not only after
    // React fetches and renders the product detail view in the browser.
    if (!html.includes('data-seo-product="true"')) {
      failures.push(route + ": missing server-rendered product content marker");
    }
    if (!html.includes('data-seo-product-section="details"')) {
      failures.push(route + ": product details must be present in initial HTML");
    }
    if (!html.includes("<h2>Product details</h2>")) {
      failures.push(route + ": product details heading missing from initial HTML");
    }
    if (html.includes('data-seo-product-image="true"')) {
      const productImage = html.match(/<figure data-seo-product-image="true"><img\s+src="([^"]+)"\s+alt="([^"]*)"/i);
      if (!productImage || !/^https?:\/\//i.test(productImage[1]) || !productImage[2].trim()) {
        failures.push(route + ": server-rendered product image must have an absolute URL and descriptive alt text");
      }
    }
    if (html.includes('data-seo-product-section="features"') && !/<section data-seo-product-section="features"><h2>Features<\/h2><ul><li>/.test(html)) {
      failures.push(route + ": product features section is empty or malformed");
    }
    if (html.includes('data-seo-product-section="applications"') && !/<section data-seo-product-section="applications"><h2>Applications<\/h2><ul><li>/.test(html)) {
      failures.push(route + ": product applications section is empty or malformed");
    }
    if (html.includes('data-seo-product-section="specifications"') && !/<section data-seo-product-section="specifications"><h2>Technical specifications<\/h2><dl><div>/.test(html)) {
      failures.push(route + ": technical specifications section is empty or malformed");
    }
  }
  if (isProductDetailRoute && productSchemas.length === 0 && !parsedSchemas.some((schema) =>
    (Array.isArray(schema?.["@type"]) ? schema["@type"] : [schema?.["@type"]]).includes("WebPage"),
  )) {
    failures.push(route + ": product detail page must have Product or WebPage JSON-LD");
  }
  for (const schema of productSchemas) {
    if (schema.url !== siteUrl + route) {
      failures.push(route + ": Product JSON-LD URL does not match its canonical route");
    }
    // Product rich-result markup must include an offer, review, or rating.
    // We do not fabricate reviews/ratings, so require a genuine priced Offer.
    if (!schema.offers && !schema.review && !schema.aggregateRating) {
      failures.push(route + ": Product JSON-LD must include offers, review, or aggregateRating");
    }
    if (schema.offers) {
      const offers = Array.isArray(schema.offers) ? schema.offers : [schema.offers];
      for (const offer of offers) {
        if (offer?.["@type"] !== "Offer" || !(Number(offer.price) > 0) || !offer.priceCurrency) {
          failures.push(route + ": Product Offer must have a positive price and currency");
        }
      }
    }
    const images = schema.image == null ? [] : Array.isArray(schema.image) ? schema.image : [schema.image];
    for (const image of images) {
      if (typeof image !== "string" || !/^https?:\/\//i.test(image)) {
        failures.push(route + ": Product JSON-LD image must be an absolute HTTP(S) URL");
      }
    }
  }

  if (!title) failures.push(`${route}: missing title`);
  if (!description) failures.push(`${route}: missing meta description`);
  if (!heading) failures.push(`${route}: missing server-rendered H1`);
  if (canonical !== `${siteUrl}${route === "/" ? "/" : route}`) failures.push(`${route}: incorrect canonical URL (${canonical || "missing"})`);
  if (/^Irrigation Solutions Kenya \| DripTech$/i.test(title)) failures.push(`${route}: generic fallback title detected`);
  if (schemaScripts.length === 0) failures.push(`${route}: missing JSON-LD structured data`);
}

const calculatorPath = path.join(dist, "irrigation-cost-calculator-kenya", "index.html");
if (fs.existsSync(calculatorPath)) {
  const html = fs.readFileSync(calculatorPath, "utf8");
  if (!html.includes("Drip Irrigation Cost Calculator Kenya")) failures.push("/irrigation-cost-calculator-kenya: calculator-specific content missing from initial HTML");
  if (!html.includes('"@type":"WebApplication"')) failures.push("/irrigation-cost-calculator-kenya: expected WebApplication JSON-LD missing");
} else {
  failures.push("/irrigation-cost-calculator-kenya: generated HTML missing");
}

// Validate the generated static shell for every editorial SEO landing page:
// contextual links must be crawlable in the initial HTML, and the intro must
// render once (not twice) when a page has no content sections.
for (const page of seoManifest) {
  const route = `/${page.slug}`;
  const file = path.join(dist, page.slug, "index.html");
  if (!fs.existsSync(file)) {
    failures.push(`${route}: generated HTML missing for SEO manifest page`);
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const intro = escapeHtml(page.intro || "");
  const introCount = intro ? html.split(intro).length - 1 : 0;
  if (introCount !== 1) {
    failures.push(`${route}: intro must appear exactly once in static HTML (found ${introCount})`);
  }

  if (!Array.isArray(page.links) || page.links.length === 0) {
    failures.push(`${route}: SEO manifest page must define contextual links`);
    continue;
  }

  for (const link of page.links) {
    const safeHref =
      typeof link?.href === "string" &&
      link.href.startsWith("/") &&
      !link.href.startsWith("//") &&
      !/[\s"'<>]/.test(link.href);
    if (!safeHref || typeof link?.label !== "string" || !link.label.trim()) {
      failures.push(`${route}: unsafe or incomplete contextual link`);
      continue;
    }
    const expectedAnchor = `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`;
    if (!html.includes(expectedAnchor)) {
      failures.push(`${route}: contextual link missing from static HTML (${link.label})`);
    }
  }
}

// The homepage copy has a separate build-time SEO shell. Guard against the
// previous regression where the fallback duplicated that introduction.
const homepageHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!homepageHtml.includes("SEO HTML is generated per route at build time")) {
  failures.push("/: missing visible-static-HTML architecture marker in document head");
}
const homepageIntro =
  "DripTech supplies irrigation equipment and complete systems for Kenyan farms, greenhouses and kitchen gardens. Browse products, compare kits and ask for help before you buy.";
const homepageIntroCount = homepageHtml.split(escapeHtml(homepageIntro)).length - 1;
if (homepageIntroCount !== 1) {
  failures.push(`/: homepage intro must appear once in static HTML (found ${homepageIntroCount})`);
}

const adminPath = path.join(dist, "admin", "index.html");
if (fs.existsSync(adminPath)) {
  const adminHtml = fs.readFileSync(adminPath, "utf8");
  if (!/noindex, nofollow, noarchive/.test(adminHtml)) failures.push("/admin: expected noindex directive missing");
  if (routes.includes("/admin")) failures.push("/admin must not be included in the public sitemap");
}

if (failures.length) {
  console.error("Static SEO validation failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Static SEO validation passed for ${routes.length} sitemap URLs, including canonical URLs, titles, descriptions, server-rendered H1s, JSON-LD and calculator metadata.`);
