import assert from "node:assert/strict";
import fs from "node:fs";
import {
  aggregateWebsiteAnalyticsReport,
  dedupeById,
} from "../src/lib/analyticsAggregation.ts";
import {
  classifyReferrerSource,
  formatNairobiDateKey,
  getNairobiHour,
  isAutomatedUserAgent,
  isLocalOrPreviewHost,
  normalizeDeviceType,
  sanitizePathForAnalytics,
} from "../src/lib/analyticsHelpers.ts";

// 1. Automated bot / crawler & localhost host detection
assert.equal(isAutomatedUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
assert.equal(isAutomatedUserAgent("Mozilla/5.0 Chrome/120.0.0.0 Chrome-Lighthouse"), true);
assert.equal(isAutomatedUserAgent("HeadlessChrome/125.0.0.0"), true);
assert.equal(isAutomatedUserAgent("GPTBot/1.0"), true);
assert.equal(isAutomatedUserAgent("curl/8.4.0"), true);
assert.equal(isAutomatedUserAgent("Mozilla/5.0 (Linux; Android 13; CUBOT P80) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"), false);
assert.equal(isAutomatedUserAgent("Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"), false);

assert.equal(isLocalOrPreviewHost("localhost"), true);
assert.equal(isLocalOrPreviewHost("127.0.0.1"), true);
assert.equal(isLocalOrPreviewHost("www.dripstech.co.ke"), false);

// 2. Path sanitization strips ephemeral click/UTM params while preserving functional filters
assert.equal(
  sanitizePathForAnalytics("/drip-irrigation-kenya/?fbclid=abc123&utm_source=meta#section"),
  "/drip-irrigation-kenya",
);
assert.equal(
  sanitizePathForAnalytics("/products?category=drip&gclid=xyz999"),
  "/products?category=drip",
);

// 3. Africa/Nairobi timezone (UTC+3) alignment
const lateUtc = "2026-11-20T22:30:00.000Z";
assert.equal(formatNairobiDateKey(lateUtc), "2026-11-21");
assert.equal(getNairobiHour(lateUtc), 1);

// 4. Device & referrer normalization
assert.equal(normalizeDeviceType("Desktop"), "desktop");
assert.equal(normalizeDeviceType("MOBILE"), "mobile");
assert.equal(classifyReferrerSource("https://www.google.co.ke/"), "Organic Search");
assert.equal(classifyReferrerSource("https://l.facebook.com/"), "Social Media");
assert.equal(classifyReferrerSource(""), "Direct");

// 5. >1000-row aggregation parity (verifies no 1000-row truncation, deduplication, bot filtering, New vs Returning)
const now = new Date("2026-11-21T10:00:00+03:00");
const allSessions = [];
const allPageViews = [];

// Create 1,250 unique human sessions across 30 days (half returning, half new in 7d)
for (let i = 0; i < 1250; i++) {
  const isRecent = i >= 625;
  const sessionStart = isRecent
    ? new Date(now.getTime() - (i % 5) * 86400_000 - 3600_000).toISOString()
    : new Date(now.getTime() - 20 * 86400_000).toISOString();
  const vid = i >= 1200 ? `visitor-${i - 1200}` : `visitor-${i}`; // last 50 are returning from earlier cohort
  const sid = `session-${i}`;
  allSessions.push({
    id: sid,
    visitor_id: vid,
    session_start: sessionStart,
    total_duration: i % 2 === 0 ? 120 : 0,
    browser: "Chrome",
    device_type: i % 3 === 0 ? "Desktop" : "mobile",
    user_agent: "Mozilla/5.0 (Linux; Android 13) Mobile Safari/537.36",
    referrer: i % 4 === 0 ? "https://www.google.com/" : null,
  });
  allPageViews.push({
    id: `pv-${i}-1`,
    visitor_id: vid,
    session_id: sid,
    page_path: i % 2 === 0 ? "/drip-irrigation-kenya?utm_source=google" : "/products",
    page_title: "Page",
    timestamp: sessionStart,
    time_spent: 45,
  });
  if (i % 2 === 1) {
    // Second view 150s later when total_duration === 0 -> triggers derived session duration!
    allPageViews.push({
      id: `pv-${i}-2`,
      visitor_id: vid,
      session_id: sid,
      page_path: "/contact",
      page_title: "Contact",
      timestamp: new Date(new Date(sessionStart).getTime() + 150_000).toISOString(),
      time_spent: 60,
    });
  }
}

// Add 100 historical bot sessions that should be excluded by default
for (let b = 0; b < 100; b++) {
  allSessions.push({
    id: `bot-${b}`,
    visitor_id: `bot-visitor-${b}`,
    session_start: new Date(now.getTime() - 3600_000).toISOString(),
    user_agent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
    device_type: "desktop",
  });
  allPageViews.push({
    id: `bot-pv-${b}`,
    visitor_id: `bot-visitor-${b}`,
    session_id: `bot-${b}`,
    page_path: "/drip-irrigation-kenya",
    timestamp: new Date(now.getTime() - 3600_000).toISOString(),
  });
}

// Inject duplicate row to verify dedupeById
const duplicatedSessions = [...allSessions, allSessions[0]];
assert.equal(dedupeById(duplicatedSessions).length, allSessions.length);

const report = aggregateWebsiteAnalyticsReport({
  allSessions: duplicatedSessions,
  allPageViews,
  periodInteractions: [
    {
      id: "pi-1",
      visitor_id: "visitor-700",
      session_id: "session-700",
      product_name: "HDPE Pipe 32mm",
      interaction_type: "view",
      timestamp: now.toISOString(),
    },
    {
      id: "pi-2",
      visitor_id: "visitor-701",
      session_id: "session-701",
      product_name: "1HP Solar Borehole Pump",
      interaction_type: "click",
      timestamp: now.toISOString(),
    },
    {
      id: "pi-3",
      visitor_id: "bot-visitor-1",
      session_id: "bot-1",
      product_name: "Bot Ignored Pump",
      interaction_type: "click",
      timestamp: now.toISOString(),
    },
    {
      id: "pi-4",
      visitor_id: "visitor-700",
      session_id: "session-700",
      product_name: "HDPE Pipe 32mm",
      interaction_type: "hover",
      timestamp: now.toISOString(),
    },
  ],
  periodWhatsappClicks: [
    {
      id: "wa-1",
      visitor_id: "visitor-701",
      session_id: "session-701",
      clicked_at: now.toISOString(),
    },
    {
      id: "wa-bot",
      visitor_id: "bot-visitor-1",
      session_id: "bot-1",
      clicked_at: now.toISOString(),
    },
  ],
  range: "7d",
  includeBots: false,
  now,
});

assert.equal(report.lifetime.totalSessions, 1250, "Must count all 1250 human sessions beyond 1000 cap");
assert.equal(report.lifetime.totalVisitors, 1200, "Must count exact 1200 unique human visitors");
assert.equal(report.lifetime.filteredBotSessions, 100, "Must report 100 excluded bot sessions");
assert.equal(report.lifetime.filteredBotPageViews, 100, "Must report 100 excluded bot page views");
assert.equal(report.period.sessions, 625, "7d window must count 625 recent sessions");
assert.equal(report.period.returningVisitors, 50, "Must detect 50 returning visitors seen 20d ago");
assert.equal(report.period.newVisitors, 575, "Must detect 575 truly new visitors in 7d");
assert.ok(report.period.avgDuration >= 130 && report.period.avgDuration <= 140, `Expected derived + explicit avgDuration ~135s, got ${report.period.avgDuration}`);
assert.equal(report.period.topProducts[0].product_name, "1HP Solar Borehole Pump", "Intent clicks rank ahead of passive views");
assert.equal(report.period.topProducts.some((p) => p.product_name === "Bot Ignored Pump"), false);
assert.equal(report.period.whatsappClicks, 1, "Bot WhatsApp click must be excluded");
assert.equal(report.period.deviceBreakdown.filter((d) => d.device_type === "desktop").length, 1, "Normalized device_type must not split Desktop vs desktop");

const withBotsReport = aggregateWebsiteAnalyticsReport({
  allSessions,
  allPageViews,
  periodInteractions: [],
  periodWhatsappClicks: [],
  range: "7d",
  includeBots: true,
  now,
});
assert.equal(withBotsReport.lifetime.totalSessions, 1350);

// 6. Verify wiring constraints in codebase files
const dashboardCode = fs.readFileSync("src/components/Admin/Analytics/AnalyticsDashboard.tsx", "utf8");
assert.ok(!dashboardCode.includes("PAGE_SIZE = 5000") && !dashboardCode.includes("CHUNK = 5000"), "Old 5000-row PostgREST truncation bug must stay removed");
assert.ok(dashboardCode.includes("POSTGREST_PAGE_SIZE = 1000"), "Fallback pagination must use 1000 matching PostgREST ceiling");
assert.ok(dashboardCode.includes("get_website_analytics_report"), "Dashboard must use server-side analytics RPC");

const mainCode = fs.readFileSync("src/main.tsx", "utf8");
assert.ok(mainCode.includes("initStaticSeoTracking"), "Static SEO pages in main.tsx must initialize telemetry");

const migrationSql = fs.readFileSync("supabase/migrations/202611210001_accurate_website_analytics.sql", "utf8");
assert.ok(migrationSql.includes("get_website_analytics_report"), "SQL migration must define get_website_analytics_report");
assert.ok(migrationSql.includes("record_visitor_engagement"), "SQL migration must define record_visitor_engagement");

console.log("check-website-analytics passed all assertions.");
