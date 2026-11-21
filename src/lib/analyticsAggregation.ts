import {
  classifyReferrerSource,
  formatNairobiDateKey,
  getNairobiHour,
  getPeriodStartDate,
  isAutomatedUserAgent,
  normalizeDeviceType,
  sanitizePathForAnalytics,
} from "./analyticsHelpers";

export interface RawVisitorSession {
  id: string;
  visitor_id: string;
  session_start: string;
  total_duration?: number | null;
  page_views?: number | null;
  page_views_count?: number | null;
  browser?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  is_bot?: boolean | null;
}

export interface RawPageView {
  id: string;
  visitor_id: string;
  session_id?: string | null;
  page_path: string;
  page_title?: string | null;
  timestamp: string;
  time_spent?: number | null;
  is_bot?: boolean | null;
}

export interface RawProductInteraction {
  id: string;
  visitor_id: string;
  session_id?: string | null;
  product_name: string;
  interaction_type: string;
  timestamp: string;
}

export interface RawWhatsAppClick {
  id: string;
  visitor_id: string;
  session_id?: string | null;
  clicked_at: string;
}

export interface LifetimeStats {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  filteredBotSessions: number;
  filteredBotPageViews: number;
  earliestSessionAt?: string | null;
  latestSessionAt?: string | null;
}

export interface TopPageItem {
  page_path: string;
  page_title: string;
  total_views: number;
  unique_visitors: number;
  avg_time_spent: number;
}

export interface TopProductItem {
  product_name: string;
  interaction_count: number;
  click_count: number;
  view_count: number;
  interaction_type: string;
  unique_visitors: number;
}

export interface PeriodStats {
  visitors: number;
  lifetimeVisitors: number;
  visitorsOutsidePeriod: number;
  whatsappClicks: number;
  uniqueWhatsappVisitors: number;
  pageViews: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  engagementRate: number;
  newVisitors: number;
  returningVisitors: number;
  peakHour: number;
  peakDay: string;
  avgTimeOnSite: number;
  topPages: TopPageItem[];
  topProducts: TopProductItem[];
  deviceBreakdown: Array<{
    device_type: string;
    total_sessions: number;
    unique_visitors: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    page_views: number;
    sessions: number;
  }>;
  dailyActivity: Array<{
    date: string;
    visitors: number;
    page_views: number;
    sessions: number;
  }>;
  browserStats: Array<{
    browser: string;
    sessions: number;
    percentage: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
    visitors: number;
    percentage: number;
  }>;
}

export interface WebsiteAnalyticsReport {
  lifetime: LifetimeStats;
  period: PeriodStats;
}

export const dedupeById = <T extends { id?: string }>(rows: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (row.id) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
    }
    out.push(row);
  }
  return out;
};

export const isSessionAutomated = (session: RawVisitorSession): boolean =>
  Boolean(session.is_bot) || isAutomatedUserAgent(session.user_agent);

export const aggregateWebsiteAnalyticsReport = (params: {
  allSessions: RawVisitorSession[];
  allPageViews: RawPageView[];
  periodInteractions: RawProductInteraction[];
  periodWhatsappClicks: RawWhatsAppClick[];
  range: string;
  includeBots?: boolean;
  now?: Date;
}): WebsiteAnalyticsReport => {
  const includeBots = Boolean(params.includeBots);
  const now = params.now ?? new Date();
  const periodStart = getPeriodStartDate(params.range, now);
  const periodStartMs = periodStart ? periodStart.getTime() : null;
  const nowMs = now.getTime();

  const dedupedSessions = dedupeById(params.allSessions);
  const dedupedViews = dedupeById(params.allPageViews);
  const dedupedInteractions = dedupeById(params.periodInteractions);
  const dedupedWhatsapp = dedupeById(params.periodWhatsappClicks);

  const botSessionIds = new Set<string>();
  let filteredBotSessions = 0;
  for (const s of dedupedSessions) {
    if (isSessionAutomated(s)) {
      botSessionIds.add(s.id);
      filteredBotSessions++;
    }
  }

  let filteredBotPageViews = 0;
  for (const pv of dedupedViews) {
    if (pv.is_bot || (pv.session_id && botSessionIds.has(pv.session_id))) {
      filteredBotPageViews++;
    }
  }

  const eligibleSessions = includeBots
    ? dedupedSessions
    : dedupedSessions.filter((s) => !botSessionIds.has(s.id));

  const eligibleViews = includeBots
    ? dedupedViews
    : dedupedViews.filter((pv) => !pv.is_bot && !(pv.session_id && botSessionIds.has(pv.session_id)));

  // Lifetime metrics
  const lifetimeVisitorFirstSeen = new Map<string, number>();
  let earliestMs = Infinity;
  let latestMs = -Infinity;

  for (const s of eligibleSessions) {
    const ts = new Date(s.session_start).getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts < earliestMs) earliestMs = ts;
    if (ts > latestMs) latestMs = ts;

    const prev = lifetimeVisitorFirstSeen.get(s.visitor_id);
    if (prev === undefined || ts < prev) {
      lifetimeVisitorFirstSeen.set(s.visitor_id, ts);
    }
  }

  const lifetime: LifetimeStats = {
    totalVisitors: lifetimeVisitorFirstSeen.size,
    totalSessions: eligibleSessions.length,
    totalPageViews: eligibleViews.length,
    filteredBotSessions,
    filteredBotPageViews,
    earliestSessionAt: Number.isFinite(earliestMs) ? new Date(earliestMs).toISOString() : null,
    latestSessionAt: Number.isFinite(latestMs) ? new Date(latestMs).toISOString() : null,
  };

  // Period filtering
  const periodSessions =
    periodStartMs === null
      ? eligibleSessions
      : eligibleSessions.filter((s) => {
          const ts = new Date(s.session_start).getTime();
          return Number.isFinite(ts) && ts >= periodStartMs && ts <= nowMs;
        });

  const periodViews =
    periodStartMs === null
      ? eligibleViews
      : eligibleViews.filter((pv) => {
          const ts = new Date(pv.timestamp).getTime();
          return Number.isFinite(ts) && ts >= periodStartMs && ts <= nowMs;
        });

  const periodInteractions = dedupedInteractions.filter((int) => {
    if (int.interaction_type === "hover") return false;
    if (!includeBots && int.session_id && botSessionIds.has(int.session_id)) return false;
    if (periodStartMs === null) return true;
    const ts = new Date(int.timestamp).getTime();
    return Number.isFinite(ts) && ts >= periodStartMs && ts <= nowMs;
  });

  const periodWhatsappClicks = dedupedWhatsapp.filter((w) => {
    if (!includeBots && w.session_id && botSessionIds.has(w.session_id)) return false;
    if (periodStartMs === null) return true;
    const ts = new Date(w.clicked_at).getTime();
    return Number.isFinite(ts) && ts >= periodStartMs && ts <= nowMs;
  });

  const periodVisitorIds = new Set(periodSessions.map((s) => s.visitor_id));
  let newVisitors = 0;
  let returningVisitors = 0;
  for (const vid of periodVisitorIds) {
    const firstSeenMs = lifetimeVisitorFirstSeen.get(vid);
    if (periodStartMs === null || firstSeenMs === undefined || firstSeenMs >= periodStartMs) {
      newVisitors++;
    } else {
      returningVisitors++;
    }
  }

  // Group page views by session for bounce rate, engagement & fallback duration
  const viewsBySession = new Map<string, { count: number; maxTsMs: number }>();
  for (const pv of periodViews) {
    if (!pv.session_id) continue;
    const tsMs = new Date(pv.timestamp).getTime();
    const cur = viewsBySession.get(pv.session_id);
    if (!cur) {
      viewsBySession.set(pv.session_id, {
        count: 1,
        maxTsMs: Number.isFinite(tsMs) ? tsMs : 0,
      });
    } else {
      cur.count++;
      if (Number.isFinite(tsMs) && tsMs > cur.maxTsMs) cur.maxTsMs = tsMs;
    }
  }

  let bounces = 0;
  let engagedSessions = 0;
  let durationSum = 0;
  let durationCount = 0;

  for (const s of periodSessions) {
    const pvStats = viewsBySession.get(s.id);
    const viewCount = pvStats?.count ?? 0;
    if (viewCount <= 1) bounces++;
    else engagedSessions++;

    let effectiveSec =
      typeof s.total_duration === "number" && s.total_duration > 0
        ? Math.min(s.total_duration, 14400)
        : 0;

    if (effectiveSec <= 0 && pvStats && pvStats.count > 1 && pvStats.maxTsMs > 0) {
      const startMs = new Date(s.session_start).getTime();
      if (Number.isFinite(startMs) && pvStats.maxTsMs > startMs) {
        effectiveSec = Math.min(14400, Math.round((pvStats.maxTsMs - startMs) / 1000));
      }
    }

    if (effectiveSec > 0) {
      durationSum += effectiveSec;
      durationCount++;
    }
  }

  const totalSessions = periodSessions.length;
  const totalPageViews = periodViews.length;
  const avgDuration = durationCount > 0 ? Math.round((durationSum / durationCount) * 10) / 10 : 0;
  const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 1000) / 10 : 0;
  const engagementRate =
    totalSessions > 0 ? Math.round((engagedSessions / totalSessions) * 1000) / 10 : 0;
  const pagesPerSession =
    totalSessions > 0 ? Math.round((totalPageViews / totalSessions) * 100) / 100 : 0;

  // Daily & hourly series (Africa/Nairobi)
  const dailyMap = new Map<
    string,
    { date: string; visitors: Set<string>; page_views: number; sessions: number }
  >();

  if (["1d", "7d", "30d", "90d"].includes(params.range)) {
    const daySpan = params.range === "1d" ? 1 : params.range === "7d" ? 7 : params.range === "30d" ? 30 : 90;
    for (let i = daySpan - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = formatNairobiDateKey(d);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, visitors: new Set(), page_views: 0, sessions: 0 });
      }
    }
  }

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    page_views: 0,
    sessions: 0,
  }));

  const daySessionCounts = new Map<string, number>();

  for (const s of periodSessions) {
    const key = formatNairobiDateKey(s.session_start);
    let bucket = dailyMap.get(key);
    if (!bucket) {
      bucket = { date: key, visitors: new Set(), page_views: 0, sessions: 0 };
      dailyMap.set(key, bucket);
    }
    bucket.sessions++;
    bucket.visitors.add(s.visitor_id);
    daySessionCounts.set(key, (daySessionCounts.get(key) || 0) + 1);

    const hr = getNairobiHour(s.session_start);
    hourlyActivity[hr].sessions++;
  }

  for (const pv of periodViews) {
    const key = formatNairobiDateKey(pv.timestamp);
    let bucket = dailyMap.get(key);
    if (!bucket) {
      bucket = { date: key, visitors: new Set(), page_views: 0, sessions: 0 };
      dailyMap.set(key, bucket);
    }
    bucket.page_views++;
    bucket.visitors.add(pv.visitor_id);

    const hr = getNairobiHour(pv.timestamp);
    hourlyActivity[hr].page_views++;
  }

  const dailyActivity = Array.from(dailyMap.values())
    .map((b) => ({
      date: b.date,
      visitors: b.visitors.size,
      page_views: b.page_views,
      sessions: b.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let peakHour = 0;
  let peakHourSessions = -1;
  for (const h of hourlyActivity) {
    if (h.sessions > peakHourSessions) {
      peakHourSessions = h.sessions;
      peakHour = h.hour;
    }
  }

  const peakDay =
    Array.from(daySessionCounts.entries()).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0] ||
    "N/A";

  // Top pages
  const pageGroups = new Map<
    string,
    { path: string; title: string; views: number; visitors: Set<string>; timeSum: number; timeCount: number }
  >();
  for (const pv of periodViews) {
    const cleanPath = sanitizePathForAnalytics(pv.page_path);
    let grp = pageGroups.get(cleanPath);
    if (!grp) {
      grp = {
        path: cleanPath,
        title: pv.page_title || cleanPath,
        views: 0,
        visitors: new Set(),
        timeSum: 0,
        timeCount: 0,
      };
      pageGroups.set(cleanPath, grp);
    }
    grp.views++;
    grp.visitors.add(pv.visitor_id);
    if (!grp.title && pv.page_title) grp.title = pv.page_title;
    if (typeof pv.time_spent === "number" && pv.time_spent > 0) {
      grp.timeSum += Math.min(pv.time_spent, 1800);
      grp.timeCount++;
    }
  }

  const topPages: TopPageItem[] = Array.from(pageGroups.values())
    .map((g) => ({
      page_path: g.path,
      page_title: g.title || g.path,
      total_views: g.views,
      unique_visitors: g.visitors.size,
      avg_time_spent: g.timeCount > 0 ? Math.round((g.timeSum / g.timeCount) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 15);

  // Top products (prioritize clicks/intent)
  const productGroups = new Map<
    string,
    { name: string; clicks: number; views: number; visitors: Set<string> }
  >();
  for (const int of periodInteractions) {
    let grp = productGroups.get(int.product_name);
    if (!grp) {
      grp = { name: int.product_name, clicks: 0, views: 0, visitors: new Set() };
      productGroups.set(int.product_name, grp);
    }
    if (int.interaction_type === "view") grp.views++;
    else grp.clicks++;
    grp.visitors.add(int.visitor_id);
  }

  const topProducts: TopProductItem[] = Array.from(productGroups.values())
    .map((g) => ({
      product_name: g.name,
      interaction_count: g.clicks + g.views,
      click_count: g.clicks,
      view_count: g.views,
      interaction_type: g.clicks > 0 ? "click" : "view",
      unique_visitors: g.visitors.size,
    }))
    .sort(
      (a, b) =>
        b.click_count - a.click_count ||
        b.unique_visitors - a.unique_visitors ||
        b.interaction_count - a.interaction_count,
    )
    .slice(0, 15);

  // Normalized device, browser & traffic sources
  const devMap = new Map<string, { sessions: number; visitors: Set<string> }>();
  const browserMap = new Map<string, number>();
  const sourceMap = new Map<string, { sessions: number; visitors: Set<string> }>();

  for (const s of periodSessions) {
    const dev = normalizeDeviceType(s.device_type);
    const devEntry = devMap.get(dev) || { sessions: 0, visitors: new Set<string>() };
    devEntry.sessions++;
    devEntry.visitors.add(s.visitor_id);
    devMap.set(dev, devEntry);

    const browser = (s.browser || "").trim() || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    const src = classifyReferrerSource(s.referrer);
    const srcEntry = sourceMap.get(src) || { sessions: 0, visitors: new Set<string>() };
    srcEntry.sessions++;
    srcEntry.visitors.add(s.visitor_id);
    sourceMap.set(src, srcEntry);
  }

  const deviceBreakdown = Array.from(devMap.entries())
    .map(([device_type, val]) => ({
      device_type,
      total_sessions: val.sessions,
      unique_visitors: val.visitors.size,
    }))
    .sort((a, b) => b.total_sessions - a.total_sessions);

  const browserStats = Array.from(browserMap.entries())
    .map(([browser, sessions]) => ({
      browser,
      sessions,
      percentage: totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const trafficSources = Array.from(sourceMap.entries())
    .map(([source, val]) => ({
      source,
      sessions: val.sessions,
      visitors: val.visitors.size,
      percentage: totalSessions > 0 ? Math.round((val.sessions / totalSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    lifetime,
    period: {
      visitors: periodVisitorIds.size,
      lifetimeVisitors: lifetime.totalVisitors,
      visitorsOutsidePeriod: Math.max(0, lifetime.totalVisitors - periodVisitorIds.size),
      whatsappClicks: periodWhatsappClicks.length,
      uniqueWhatsappVisitors: new Set(periodWhatsappClicks.map((w) => w.visitor_id)).size,
      pageViews: totalPageViews,
      sessions: totalSessions,
      avgDuration,
      bounceRate,
      pagesPerSession,
      engagementRate,
      newVisitors,
      returningVisitors,
      peakHour,
      peakDay,
      avgTimeOnSite: avgDuration,
      topPages,
      topProducts,
      deviceBreakdown,
      hourlyActivity,
      dailyActivity,
      browserStats,
      trafficSources,
    },
  };
};
