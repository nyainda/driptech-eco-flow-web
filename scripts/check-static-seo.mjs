import fs from "node:fs";
import path from "node:path";
import { serializeJsonLd, toAbsoluteSiteAssetUrl } from "./seo-url-helpers.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://www.dripstech.co.ke";
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
  if (isProductDetailRoute && productSchemas.length === 0) {
    failures.push(route + ": product detail page is missing Product JSON-LD");
  }
  for (const schema of productSchemas) {
    if (schema.url !== siteUrl + route) {
      failures.push(route + ": Product JSON-LD URL does not match its canonical route");
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
