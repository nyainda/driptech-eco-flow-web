export interface MetricRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type QueryPageRow = MetricRow;
export type CountryMetricRow = MetricRow;
export type SearchAppearanceRow = MetricRow;

export interface TrendRow {
  keys: [string];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSitemapContent {
  type?: string;
  submitted?: string | number;
  indexed?: string | number;
}

export interface GscSitemapInfo {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  errors?: string | number;
  warnings?: string | number;
  contents?: GscSitemapContent[];
}

export interface VerifiedProperty {
  siteUrl: string;
  permissionLevel?: string;
}

export interface UrlInspectionResult {
  inspectionUrl: string;
  inspectionResultLink: string | null;
  verdict: string;
  coverageState: string;
  indexingState: string;
  robotsTxtState: string;
  pageFetchState: string;
  lastCrawlTime: string | null;
  crawledAs: string;
  googleCanonical: string | null;
  userCanonical: string | null;
  referringUrls: string[];
  mobileVerdict: string;
  richResultsVerdict: string;
  richResultTypes: string[];
}

export interface GscPayload {
  connected: boolean;
  reconnectRequired?: boolean;
  email?: string;
  property?: string;
  countryFilter?: string;
  startDate?: string;
  endDate?: string;
  previousStartDate?: string;
  previousEndDate?: string;
  totals?: GscTotals;
  previousTotals?: GscTotals;
  trend: TrendRow[];
  queries: MetricRow[];
  pages: MetricRow[];
  queryPages?: QueryPageRow[];
  devices: MetricRow[];
  countries?: CountryMetricRow[];
  searchAppearances?: SearchAppearanceRow[];
  sitemaps?: GscSitemapInfo[];
  verifiedProperties?: VerifiedProperty[];
  updatedAt?: string;
  error?: string;
}

export type IntentName =
  | "Commercial (Pricing / Cost)"
  | "Transactional (Buy / Quote / Supply)"
  | "Local (Kenya / Counties)"
  | "Informational (Guide / How-To)"
  | "Product / Category"
  | "Navigational / Brand";

export type PageSectionName =
  | "Products"
  | "Irrigation Guides"
  | "Solutions & Services"
  | "Irrigation Kits"
  | "Calculators & Tools"
  | "Home & Core";

export const INTENT_COLORS: Record<IntentName, string> = {
  "Commercial (Pricing / Cost)": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Transactional (Buy / Quote / Supply)": "bg-blue-100 text-blue-800 border-blue-200",
  "Local (Kenya / Counties)": "bg-amber-100 text-amber-800 border-amber-200",
  "Informational (Guide / How-To)": "bg-purple-100 text-purple-800 border-purple-200",
  "Product / Category": "bg-slate-100 text-slate-800 border-slate-200",
  "Navigational / Brand": "bg-teal-100 text-teal-800 border-teal-200",
};

const BRAND_PATTERN = /\bdrip\s*tech\b|driptech|dripstech/i;

const KENYA_LOCAL_MARKERS = [
  "kenya",
  "nairobi",
  "eldoret",
  "nakuru",
  "kisumu",
  "mombasa",
  "thika",
  "nyeri",
  "meru",
  "kiambu",
  "machakos",
  "naivasha",
  "kitale",
  "kericho",
  "embu",
  "kajiado",
  "laikipia",
  "uasin gishu",
  "bungoma",
  "kakamega",
];

const COUNTRY_NAMES: Record<string, string> = {
  ken: "Kenya",
  uga: "Uganda",
  tza: "Tanzania",
  rwa: "Rwanda",
  eth: "Ethiopia",
  ssd: "South Sudan",
  som: "Somalia",
  bdi: "Burundi",
  usa: "United States",
  gbr: "United Kingdom",
  ind: "India",
  are: "UAE",
  zaf: "South Africa",
  nga: "Nigeria",
  deu: "Germany",
  chn: "China",
  can: "Canada",
  aus: "Australia",
};

const SEARCH_APPEARANCE_LABELS: Record<string, string> = {
  PRODUCT_SNIPPET: "Product Snippet",
  MERCHANT_LISTINGS: "Merchant Listings",
  RICH_RESULT: "Rich Results",
  RICH_CARD: "Rich Card",
  REVIEW_SNIPPET: "Review Snippet",
  FAQ_RICH_RESULT: "FAQ Rich Result",
  VIDEO: "Video Result",
  WEBLITE: "Web Light",
  TRANSLATED_RESULT: "Translated Result",
};

export function readablePage(url: string): string {
  try {
    const parsed = new URL(url);
    return (parsed.pathname || "/") + (parsed.search || "");
  } catch {
    return url || "/";
  }
}

export function isBrandedQuery(query: string): boolean {
  return BRAND_PATTERN.test(query.trim());
}

export function classifyIntent(query: string): IntentName {
  const q = query.toLowerCase().trim();
  if (isBrandedQuery(q)) return "Navigational / Brand";
  if (/(how to|what is|guide|spacing|design|manual|calculate|sizing|calculator|chart|tutorial|tips|benefits)/.test(q)) {
    return "Informational (Guide / How-To)";
  }
  if (/(price|prices|cost|quote|rates|cheap|how much|budget)/.test(q)) {
    return "Commercial (Pricing / Cost)";
  }
  if (/(buy|shop|supplier|suppliers|dealer|dealers|company|companies|store|order|for sale|near me|install|installer|installation)/.test(q)) {
    return "Transactional (Buy / Quote / Supply)";
  }
  if (KENYA_LOCAL_MARKERS.some((marker) => q.includes(marker))) {
    return "Local (Kenya / Counties)";
  }
  return "Product / Category";
}

export function classifyPageSection(url: string): PageSectionName {
  const path = readablePage(url).toLowerCase();
  if (path === "/" || path.startsWith("/?")) return "Home & Core";
  if (path.startsWith("/products") || path.startsWith("/product")) return "Products";
  if (path.startsWith("/irrigation-guides") || path.startsWith("/guides") || path.startsWith("/blog")) {
    return "Irrigation Guides";
  }
  if (path.startsWith("/irrigation-kits") || path.startsWith("/kits")) return "Irrigation Kits";
  if (path.includes("calculator") || path.startsWith("/pump-solar-sizing")) {
    return "Calculators & Tools";
  }
  if (
    path.startsWith("/services") ||
    path.startsWith("/solutions") ||
    path.startsWith("/projects") ||
    path.startsWith("/greenhouse") ||
    path.startsWith("/solar")
  ) {
    return "Solutions & Services";
  }
  return "Home & Core";
}

export interface BrandSegmentSummary {
  queries: number;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

function summarizeGroup(rows: MetricRow[]): BrandSegmentSummary {
  const clicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const weightedPosSum = rows.reduce(
    (sum, row) => sum + (row.position || 0) * (row.impressions || 0),
    0,
  );
  const avgPosition =
    impressions > 0
      ? weightedPosSum / impressions
      : rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length
      : 0;

  return {
    queries: rows.length,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    avgPosition,
  };
}

export function summarizeBrandSplit(queries: MetricRow[]): {
  branded: BrandSegmentSummary;
  nonBranded: BrandSegmentSummary;
} {
  const brandedRows: MetricRow[] = [];
  const nonBrandedRows: MetricRow[] = [];

  for (const row of queries) {
    if (isBrandedQuery(row.keys[0] || "")) {
      brandedRows.push(row);
    } else {
      nonBrandedRows.push(row);
    }
  }

  return {
    branded: summarizeGroup(brandedRows),
    nonBranded: summarizeGroup(nonBrandedRows),
  };
}

export type IntentWeightMode = "clicks" | "impressions" | "queries";

export interface IntentSummaryRow {
  intent: IntentName;
  queries: number;
  clicks: number;
  impressions: number;
  share: number;
  avgCtr: number;
  avgPosition: number;
}

export function buildWeightedIntentSummary(
  queries: MetricRow[],
  mode: IntentWeightMode = "clicks",
): IntentSummaryRow[] {
  const groups = new Map<IntentName, MetricRow[]>();
  for (const row of queries) {
    const intent = classifyIntent(row.keys[0] || "");
    const existing = groups.get(intent);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(intent, [row]);
    }
  }

  const summaries = Array.from(groups.entries()).map(([intent, rows]) => {
    const stats = summarizeGroup(rows);
    return {
      intent,
      queries: stats.queries,
      clicks: stats.clicks,
      impressions: stats.impressions,
      share: 0,
      avgCtr: stats.ctr,
      avgPosition: stats.avgPosition,
    };
  });

  const metricFor = (item: IntentSummaryRow) => item[mode];
  const totalMetric = summaries.reduce((sum, item) => sum + metricFor(item), 0);

  return summaries
    .map((item) => ({
      ...item,
      share: totalMetric > 0 ? metricFor(item) / totalMetric : 0,
    }))
    .sort((a, b) => metricFor(b) - metricFor(a) || b.impressions - a.impressions);
}

export function mapQueryToTopPages(queryPages: QueryPageRow[]): Map<string, QueryPageRow[]> {
  const map = new Map<string, QueryPageRow[]>();
  for (const row of queryPages) {
    const query = (row.keys[0] || "").trim().toLowerCase();
    const page = row.keys[1] || "";
    if (!query || !page) continue;
    const list = map.get(query);
    if (list) {
      list.push(row);
    } else {
      map.set(query, [row]);
    }
  }

  for (const [query, list] of map.entries()) {
    list.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    map.set(query, list);
  }
  return map;
}

export interface CannibalizedQuery {
  query: string;
  totalClicks: number;
  totalImpressions: number;
  primaryPage: string;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    share: number;
  }>;
}

export function findCannibalizedQueries(
  queryPages: QueryPageRow[],
  minImpressions = 20,
): CannibalizedQuery[] {
  const grouped = mapQueryToTopPages(queryPages);
  const results: CannibalizedQuery[] = [];

  for (const [, rows] of grouped.entries()) {
    // Merge rows pointing to the exact same readable path (e.g. www vs non-www or query fragments)
    const byUrl = new Map<string, { clicks: number; impressions: number; weightedPos: number }>();
    let displayQuery = rows[0]?.keys[0] || "";
    for (const row of rows) {
      const pageUrl = row.keys[1] || "";
      const existing = byUrl.get(pageUrl) || { clicks: 0, impressions: 0, weightedPos: 0 };
      existing.clicks += row.clicks || 0;
      existing.impressions += row.impressions || 0;
      existing.weightedPos += (row.position || 0) * (row.impressions || 0);
      byUrl.set(pageUrl, existing);
      if ((row.impressions || 0) > 0) displayQuery = row.keys[0] || displayQuery;
    }

    if (byUrl.size < 2) continue;

    const totalImpressions = Array.from(byUrl.values()).reduce((s, v) => s + v.impressions, 0);
    const totalClicks = Array.from(byUrl.values()).reduce((s, v) => s + v.clicks, 0);
    if (totalImpressions < minImpressions) continue;

    const pages = Array.from(byUrl.entries())
      .map(([page, stats]) => ({
        page,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.impressions > 0 ? stats.clicks / stats.impressions : 0,
        position: stats.impressions > 0 ? stats.weightedPos / stats.impressions : 0,
        share: totalImpressions > 0 ? stats.impressions / totalImpressions : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);

    const secondary = pages[1];
    if (!secondary || (secondary.share < 0.08 && secondary.impressions < 15)) {
      continue;
    }

    results.push({
      query: displayQuery,
      totalClicks,
      totalImpressions,
      primaryPage: pages[0].page,
      pages,
    });
  }

  return results.sort((a, b) => b.totalImpressions - a.totalImpressions);
}

export interface QuickWinRow extends MetricRow {
  upsideClicks: number;
  topPage: string | null;
  competingPages: number;
}

export function computeQuickWins(
  queries: MetricRow[],
  queryPageMap?: Map<string, QueryPageRow[]>,
  minImpressions = 15,
): QuickWinRow[] {
  return queries
    .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= minImpressions)
    .map((q) => {
      const key = (q.keys[0] || "").trim().toLowerCase();
      const matched = queryPageMap?.get(key) || [];
      return {
        ...q,
        upsideClicks: Math.max(0, Math.round(q.impressions * 0.08 - q.clicks)),
        topPage: matched[0]?.keys[1] || null,
        competingPages: matched.length,
      };
    })
    .sort((a, b) => b.upsideClicks - a.upsideClicks || b.impressions - a.impressions);
}

export function computeLowCtrPages(pages: MetricRow[], minImpressions = 50): MetricRow[] {
  return pages
    .filter((p) => p.impressions >= minImpressions && p.ctr < 0.025)
    .sort((a, b) => b.impressions - a.impressions);
}

export interface PageSectionSummary {
  section: PageSectionName;
  pages: number;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export function summarizePageSections(pages: MetricRow[]): PageSectionSummary[] {
  const groups = new Map<PageSectionName, MetricRow[]>();
  for (const row of pages) {
    const section = classifyPageSection(row.keys[0] || "");
    const existing = groups.get(section);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(section, [row]);
    }
  }

  return Array.from(groups.entries())
    .map(([section, rows]) => {
      const stats = summarizeGroup(rows);
      return {
        section,
        pages: stats.queries,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.ctr,
        avgPosition: stats.avgPosition,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

export function formatCountryName(iso3: string): string {
  const normalized = (iso3 || "").trim().toLowerCase();
  if (!normalized) return "Unknown";
  if (COUNTRY_NAMES[normalized]) return COUNTRY_NAMES[normalized];
  return normalized.toUpperCase();
}

export function formatSearchAppearanceLabel(raw: string): string {
  const normalized = (raw || "").trim().toUpperCase();
  if (!normalized) return "Standard Result";
  if (SEARCH_APPEARANCE_LABELS[normalized]) return SEARCH_APPEARANCE_LABELS[normalized];
  return normalized
    .toLowerCase()
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export interface SitemapSummary {
  sitemapCount: number;
  totalSubmitted: number;
  totalIndexed: number;
  totalErrors: number;
  totalWarnings: number;
}

export function summarizeSitemaps(sitemaps: GscSitemapInfo[]): SitemapSummary {
  let totalSubmitted = 0;
  let totalIndexed = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const sitemap of sitemaps) {
    totalErrors += Number(sitemap.errors || 0);
    totalWarnings += Number(sitemap.warnings || 0);
    for (const content of sitemap.contents || []) {
      totalSubmitted += Number(content.submitted || 0);
      totalIndexed += Number(content.indexed || 0);
    }
  }

  return {
    sitemapCount: sitemaps.length,
    totalSubmitted,
    totalIndexed,
    totalErrors,
    totalWarnings,
  };
}

function escapeCsvCell(value: string | number): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildGscCsv(
  rows: MetricRow[],
  queryPageMap?: Map<string, QueryPageRow[]>,
): string {
  const header = [
    "Query",
    "Clicks",
    "Impressions",
    "CTR %",
    "Position",
    "Intent",
    "Segment",
    "Top Landing Page",
    "Competing URLs",
  ].join(",");

  const body = rows.map((row) => {
    const query = row.keys[0] || "";
    const matched = queryPageMap?.get(query.trim().toLowerCase()) || [];
    const topPage = matched[0]?.keys[1] ? readablePage(matched[0].keys[1]) : "";
    return [
      escapeCsvCell(query),
      row.clicks,
      row.impressions,
      (row.ctr * 100).toFixed(2),
      row.position.toFixed(1),
      escapeCsvCell(classifyIntent(query)),
      escapeCsvCell(isBrandedQuery(query) ? "Branded" : "Non-Branded"),
      escapeCsvCell(topPage),
      matched.length,
    ].join(",");
  });

  return [header, ...body].join("\n");
}
