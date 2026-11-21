import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildGscCsv,
  buildGscDiagnosticBrief,
  buildWeightedIntentSummary,
  classifyIntent,
  classifyPageSection,
  computeLowCtrPages,
  computeQuickWins,
  findCannibalizedQueries,
  formatCountryName,
  formatSearchAppearanceLabel,
  isBrandedQuery,
  isXmlSitemapUrl,
  mapQueryToTopPages,
  readablePage,
  summarizeBrandSplit,
  summarizePageSections,
  summarizeSitemaps,
} from "../src/lib/gscHelpers.ts";

// 1. Readable page extraction
assert.equal(readablePage("https://www.dripstech.co.ke/products/y-filter?ref=gsc"), "/products/y-filter?ref=gsc");
assert.equal(readablePage("https://www.dripstech.co.ke/"), "/");
assert.equal(readablePage("/irrigation-kits"), "/irrigation-kits");

// 2. Brand detection & split
assert.equal(isBrandedQuery("driptech kenya"), true);
assert.equal(isBrandedQuery("drip tech nairobi"), true);
assert.equal(isBrandedQuery("dripstech.co.ke"), true);
assert.equal(isBrandedQuery("drip irrigation kits price in kenya"), false);
assert.equal(isBrandedQuery("drip irrigation technology in kenya"), false);

const sampleQueries = [
  { keys: ["driptech"], clicks: 80, impressions: 200, ctr: 0.4, position: 1.2 },
  { keys: ["drip irrigation price in kenya"], clicks: 45, impressions: 1000, ctr: 0.045, position: 6.0 },
  { keys: ["buy hdpe pipes eldoret"], clicks: 20, impressions: 500, ctr: 0.04, position: 8.5 },
  { keys: ["solar water pump sizing calculator"], clicks: 15, impressions: 400, ctr: 0.0375, position: 5.5 },
  { keys: ["kitchen garden drip kit"], clicks: 5, impressions: 300, ctr: 0.0167, position: 11.0 },
  { keys: ["irrigation pipes nakuru"], clicks: 10, impressions: 250, ctr: 0.04, position: 9.0 },
];

const split = summarizeBrandSplit(sampleQueries);
assert.equal(split.branded.queries, 1);
assert.equal(split.branded.clicks, 80);
assert.equal(split.nonBranded.queries, 5);
assert.equal(split.nonBranded.clicks, 95);
assert.equal(split.nonBranded.impressions, 2450);

// 3. Intent classification & weighted summaries
assert.equal(classifyIntent("driptech"), "Navigational / Brand");
assert.equal(classifyIntent("drip irrigation price in kenya"), "Commercial (Pricing / Cost)");
assert.equal(classifyIntent("buy hdpe pipes eldoret"), "Transactional (Buy / Quote / Supply)");
assert.equal(classifyIntent("solar water pump sizing calculator"), "Informational (Guide / How-To)");
assert.equal(classifyIntent("irrigation pipes nakuru"), "Local (Kenya / Counties)");
assert.equal(classifyIntent("kitchen garden drip kit"), "Product / Category");

const byClicks = buildWeightedIntentSummary(sampleQueries, "clicks");
assert.equal(byClicks[0].intent, "Navigational / Brand");
assert.ok(Math.abs(byClicks[0].share - 80 / 175) < 1e-6);

const byImpressions = buildWeightedIntentSummary(sampleQueries, "impressions");
assert.equal(byImpressions[0].intent, "Commercial (Pricing / Cost)");
assert.ok(Math.abs(byImpressions[0].share - 1000 / 2650) < 1e-6);

const byQueryCount = buildWeightedIntentSummary(sampleQueries, "queries");
assert.equal(byQueryCount.reduce((s, row) => s + row.queries, 0), sampleQueries.length);

// 4. Query-to-page mapping & cannibalization detection
const queryPages = [
  {
    keys: ["drip irrigation price in kenya", "https://www.dripstech.co.ke/irrigation-kits"],
    clicks: 30,
    impressions: 700,
    ctr: 30 / 700,
    position: 5.1,
  },
  {
    keys: ["drip irrigation price in kenya", "https://www.dripstech.co.ke/products/drip-tape"],
    clicks: 15,
    impressions: 300,
    ctr: 15 / 300,
    position: 8.4,
  },
  {
    keys: ["solar water pump sizing calculator", "https://www.dripstech.co.ke/pump-solar-sizing"],
    clicks: 15,
    impressions: 398,
    ctr: 15 / 398,
    position: 5.5,
  },
  {
    keys: ["solar water pump sizing calculator", "https://www.dripstech.co.ke/"],
    clicks: 0,
    impressions: 2,
    ctr: 0,
    position: 28,
  },
];

const qpMap = mapQueryToTopPages(queryPages);
assert.equal(qpMap.get("drip irrigation price in kenya")?.length, 2);
assert.equal(
  qpMap.get("drip irrigation price in kenya")?.[0]?.keys[1],
  "https://www.dripstech.co.ke/irrigation-kits",
);

const cannibalized = findCannibalizedQueries(queryPages, 20);
assert.equal(cannibalized.length, 1);
assert.equal(cannibalized[0].query, "drip irrigation price in kenya");
assert.equal(cannibalized[0].totalImpressions, 1000);
assert.equal(cannibalized[0].pages[0].page, "https://www.dripstech.co.ke/irrigation-kits");
assert.ok(Math.abs(cannibalized[0].pages[1].share - 0.3) < 1e-6);

// 5. Quick wins & low-CTR pages
const quickWins = computeQuickWins(sampleQueries, qpMap, 15);
assert.equal(quickWins[0].keys[0], "drip irrigation price in kenya");
assert.equal(quickWins[0].upsideClicks, Math.round(1000 * 0.08 - 45));
assert.equal(quickWins[0].competingPages, 2);

const samplePages = [
  { keys: ["https://www.dripstech.co.ke/"], clicks: 120, impressions: 3000, ctr: 0.04, position: 3.1 },
  { keys: ["https://www.dripstech.co.ke/products/drippers"], clicks: 4, impressions: 500, ctr: 0.008, position: 9.2 },
  { keys: ["https://www.dripstech.co.ke/pump-solar-sizing"], clicks: 20, impressions: 400, ctr: 0.05, position: 4.5 },
  { keys: ["https://www.dripstech.co.ke/irrigation-guides-kenya/tomatoes"], clicks: 10, impressions: 600, ctr: 0.0167, position: 7.4 },
];
const lowCtr = computeLowCtrPages(samplePages, 50);
assert.equal(lowCtr.length, 2);
assert.equal(lowCtr[0].keys[0], "https://www.dripstech.co.ke/irrigation-guides-kenya/tomatoes");

// 6. Site section classification & rollups
assert.equal(classifyPageSection("https://www.dripstech.co.ke/products/drippers"), "Products");
assert.equal(classifyPageSection("https://www.dripstech.co.ke/pump-solar-sizing"), "Calculators & Tools");
assert.equal(classifyPageSection("https://www.dripstech.co.ke/irrigation-guides-kenya/tomatoes"), "Irrigation Guides");
assert.equal(classifyPageSection("https://www.dripstech.co.ke/"), "Home & Core");

const sectionSummary = summarizePageSections(samplePages);
assert.equal(sectionSummary.reduce((s, row) => s + row.clicks, 0), 154);

// 7. Formatting & Sitemap coverage
assert.equal(formatCountryName("ken"), "Kenya");
assert.equal(formatCountryName("UGA"), "Uganda");
assert.equal(formatSearchAppearanceLabel("PRODUCT_SNIPPET"), "Product Snippet");

const sitemapStats = summarizeSitemaps([
  {
    path: "https://www.dripstech.co.ke/sitemap.xml",
    errors: 0,
    warnings: "1",
    contents: [
      { type: "web", submitted: "280", indexed: "215" },
    ],
  },
]);
assert.equal(sitemapStats.sitemapCount, 1);
assert.equal(sitemapStats.totalSubmitted, 280);
assert.equal(sitemapStats.totalIndexed, 215);
assert.equal(sitemapStats.totalWarnings, 1);

// 8. Formula-safe CSV export
const csv = buildGscCsv(
  [
    ...sampleQueries.slice(0, 2),
    { keys: ["=cmd|'/c calc'!A0"], clicks: 1, impressions: 20, ctr: 0.05, position: 10 },
  ],
  qpMap,
);
assert.ok(csv.includes('"\'=cmd|\'/c calc\'!A0"'));
assert.ok(csv.includes("Top Landing Page"));
assert.ok(csv.includes("/irrigation-kits"));

// 9. Static contract verification for Edge Functions & UI
const gscEdge = fs.readFileSync("supabase/functions/gsc-analytics/index.ts", "utf8");
assert.ok(gscEdge.includes("1000"), "gsc-analytics must raise rowLimit to 1000");
assert.ok(gscEdge.includes("inspect_url"), "gsc-analytics must support inspect_url action");
assert.ok(gscEdge.includes("set_property"), "gsc-analytics must support set_property action");
assert.ok(gscEdge.includes("dimensionFilterGroups"), "gsc-analytics must support country filters");
assert.ok(gscEdge.includes("fetchGscSitemaps"), "gsc-analytics must fetch GSC sitemaps");
assert.ok(gscEdge.includes('["query", "page"]'), "gsc-analytics must query query-page pairs");
assert.ok(!gscEdge.includes("(?:\\.driptech[a-z0-9-]*|)"), "CORS regex must not allow arbitrary *.vercel.app");

const oauthStart = fs.readFileSync("supabase/functions/gsc-oauth-start/index.ts", "utf8");
assert.ok(oauthStart.includes("userinfo.email"), "gsc-oauth-start should request userinfo.email scope");
assert.ok(!oauthStart.includes("(?:\\.driptech[a-z0-9-]*|)"), "CORS regex must be tight in gsc-oauth-start");

const oauthCallback = fs.readFileSync("supabase/functions/gsc-oauth-callback/index.ts", "utf8");
assert.ok(oauthCallback.includes("resolvePreferredProperty"), "callback must auto-resolve verified GSC property");

const gscUi = fs.readFileSync("src/components/Admin/Analytics/GSCAnalytics.tsx", "utf8");
assert.ok(gscUi.includes("extractEdgeFunctionError"), "GSCAnalytics must use extractEdgeFunctionError");
assert.ok(gscUi.includes("parseErrorContextJson"), "GSCAnalytics must parse reconnectRequired from HTTP error JSON");
assert.ok(gscUi.includes("setNotice"), "GSCAnalytics must separate success notice from error alert");

const dashboardUi = fs.readFileSync("src/components/Admin/Analytics/AnalyticsDashboard.tsx", "utf8");
assert.ok(dashboardUi.includes("getInitialAnalyticsSection"), "AnalyticsDashboard must initialize tab from URL params");
assert.ok(dashboardUi.includes('params.has("gsc")'), "AnalyticsDashboard must auto-open seo tab when ?gsc= is present");

// 10. Non-XML sitemap detection and diagnostic brief generation
assert.equal(isXmlSitemapUrl("https://www.dripstech.co.ke/sitemap.xml"), true);
assert.equal(isXmlSitemapUrl("https://www.dripstech.co.ke/sitemap-index.xml.gz"), true);
assert.equal(isXmlSitemapUrl("https://www.dripstech.co.ke/drip-irrigation-kit-price-kenya"), false);

const brief = buildGscDiagnosticBrief({
  connected: true,
  property: "sc-domain:dripstech.co.ke",
  countryFilter: "ken",
  startDate: "2026-10-21",
  endDate: "2026-11-18",
  totals: { clicks: 175, impressions: 2650, ctr: 175 / 2650, position: 7.4 },
  trend: [],
  queries: sampleQueries,
  pages: samplePages,
  queryPages,
  devices: [],
  sitemaps: [{ path: "https://www.dripstech.co.ke/drip-irrigation-kit-price-kenya", errors: 1, warnings: 0, contents: [] }],
});
assert.ok(brief.includes("Kenya Only"));
assert.ok(brief.includes("## Cannibalization Conflicts"));
assert.ok(brief.includes("errors=1"));

console.log("GSC analytics tests passed cleanly.");
