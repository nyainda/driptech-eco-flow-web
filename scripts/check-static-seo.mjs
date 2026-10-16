import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://www.dripstech.co.ke";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "src/data/publicSeoPages.json"), "utf8"));
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

  if (!title) failures.push(`${route}: missing title`);
  if (!description) failures.push(`${route}: missing meta description`);
  if (!heading) failures.push(`${route}: missing server-rendered H1`);
  if (canonical !== `${siteUrl}${route === "/" ? "/" : route}`) failures.push(`${route}: incorrect canonical URL (${canonical || "missing"})`);
  if (/^Irrigation Solutions Kenya \| DripTech$/i.test(title)) failures.push(`${route}: generic fallback title detected`);
  if (!html.includes('type="application/ld+json"')) failures.push(`${route}: missing JSON-LD structured data`);
}

const calculatorPath = path.join(dist, "irrigation-cost-calculator-kenya", "index.html");
if (fs.existsSync(calculatorPath)) {
  const html = fs.readFileSync(calculatorPath, "utf8");
  if (!html.includes("Drip Irrigation Cost Calculator Kenya")) failures.push("/irrigation-cost-calculator-kenya: calculator-specific content missing from initial HTML");
  if (!html.includes('"@type":"WebApplication"')) failures.push("/irrigation-cost-calculator-kenya: expected WebApplication JSON-LD missing");
} else {
  failures.push("/irrigation-cost-calculator-kenya: generated HTML missing");
}

// The build-time SEO shell must preserve contextual links from the manifest,
// not just the same generic navigation links on every page.
for (const page of manifest) {
  const route = `/${page.slug}`;
  const file = path.join(dist, route.slice(1), "index.html");
  if (!fs.existsSync(file)) {
    failures.push(`${route}: generated HTML missing for SEO manifest page`);
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  for (const link of page.links || []) {
    const expectedAnchor = `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`;
    if (!html.includes(expectedAnchor)) {
      failures.push(`${route}: contextual link missing from static HTML (${link.label})`);
    }
  }
}

// Pages without sections should not print their intro twice in the static shell.
const homepageHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const homepageIntro = "DripTech supplies irrigation equipment and complete systems for Kenyan farms, greenhouses and kitchen gardens. Browse products, compare kits and ask for help before you buy.";
const homepageIntroCount = homepageHtml.split(homepageIntro).length - 1;
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
console.log(`Static SEO validation passed for ${routes.length} sitemap URLs, including canonical URLs, titles, descriptions, server-rendered H1s, JSON-LD, calculator metadata, contextual manifest links and unique homepage intro text.`);
