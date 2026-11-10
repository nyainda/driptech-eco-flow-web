export type SearchRow = {
  keys?: string[];
  clicks?: number | string | null;
  impressions?: number | string | null;
  ctr?: number | string | null;
  position?: number | string | null;
};

export type SearchInsightsInput = {
  queries: SearchRow[];
  queryPages: SearchRow[];
  countries: SearchRow[];
  devices: SearchRow[];
  overallCtr: number;
};

const metric = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const totals = (rows: SearchRow[]) => {
  const clicks = rows.reduce((sum, row) => sum + metric(row.clicks), 0);
  const impressions = rows.reduce((sum, row) => sum + metric(row.impressions), 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0 };
};

export function buildSearchInsights(input: SearchInsightsInput) {
  const queries = input.queries;
  const brandedRows = queries.filter((row) =>
    /\bdrip\s?tech\b|\bdripstech\b|\bdrip-tech\b/i.test(String(row.keys?.[0] || ""))
  );
  const nonBrandedRows = queries.filter((row) => !brandedRows.includes(row));
  const multiPageQueries = new Map<string, { pages: Set<string>; clicks: number; impressions: number }>();

  for (const row of input.queryPages) {
    const query = String(row.keys?.[0] || "").trim();
    const page = String(row.keys?.[1] || "").trim();
    if (!query || !page) continue;
    const existing = multiPageQueries.get(query) || { pages: new Set<string>(), clicks: 0, impressions: 0 };
    existing.pages.add(page);
    existing.clicks += metric(row.clicks);
    existing.impressions += metric(row.impressions);
    multiPageQueries.set(query, existing);
  }

  const ctrOpportunities = queries
    .filter((row) => metric(row.impressions) >= 25 && metric(row.ctr) < input.overallCtr)
    .sort((a, b) => metric(b.impressions) - metric(a.impressions))
    .slice(0, 8)
    .map((row) => ({
      query: row.keys?.[0] || "",
      clicks: metric(row.clicks),
      impressions: metric(row.impressions),
      ctr: metric(row.ctr),
      siteCtr: input.overallCtr,
    }));

  const pageOneOpportunities = queries
    .filter((row) => metric(row.position) > 10 && metric(row.position) <= 20 && metric(row.impressions) >= 10)
    .sort((a, b) => metric(b.impressions) - metric(a.impressions))
    .slice(0, 8)
    .map((row) => ({
      query: row.keys?.[0] || "",
      clicks: metric(row.clicks),
      impressions: metric(row.impressions),
      position: metric(row.position),
    }));

  const multipleLandingPages = [...multiPageQueries.entries()]
    .filter(([, value]) => value.pages.size > 1 && value.impressions >= 10)
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .slice(0, 8)
    .map(([query, value]) => ({
      query,
      pageCount: value.pages.size,
      pages: [...value.pages].slice(0, 5),
      clicks: value.clicks,
      impressions: value.impressions,
    }));

  return {
    brandedVsNonBranded: {
      branded: totals(brandedRows),
      nonBranded: totals(nonBrandedRows),
      queryRowsAreSampled: true,
    },
    ctrOpportunities,
    pageOneOpportunities,
    multipleLandingPages,
    topCountries: input.countries.slice(0, 10).map((row) => ({
      country: row.keys?.[0] || "",
      clicks: metric(row.clicks),
      impressions: metric(row.impressions),
      ctr: metric(row.ctr),
      position: metric(row.position),
    })),
    devices: input.devices.map((row) => ({
      device: row.keys?.[0] || "",
      clicks: metric(row.clicks),
      impressions: metric(row.impressions),
      ctr: metric(row.ctr),
      position: metric(row.position),
    })),
    notes: [
      "Insights are calculated from the returned Search Console sample; they are not complete keyword or page inventories.",
      "Multiple landing pages for one query are a review signal, not proof of ranking cannibalization.",
    ],
  };
}

export function getScanWindow(days: number, now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 3);
  const endDate = end.toISOString().slice(0, 10);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startDate = start.toISOString().slice(0, 10);
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (days - 1));

  return {
    startDate,
    endDate,
    previousStartDate: previousStart.toISOString().slice(0, 10),
    previousEndDate: previousEnd.toISOString().slice(0, 10),
  };
}
