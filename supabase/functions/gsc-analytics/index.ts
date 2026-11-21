import { createClient } from "npm:@supabase/supabase-js@2";
import { hasAdminRole } from "../_shared/admin-auth.ts";

const allowedOrigins = new Set([
  "https://www.dripstech.co.ke",
  "https://dripstech.co.ke",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
]);

const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  return /^https:\/\/[a-z0-9-]*driptech[a-z0-9-]*\.vercel\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.driptech-eco-flow-web\.pages\.dev$/i.test(origin);
};

const corsFor = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? origin
      : "https://www.dripstech.co.ke",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-my-custom-header",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });

type Period = { startDate: string; endDate: string };

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const shiftDate = (dateString: string, amount: number) => {
  const date = new Date(dateString + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDate(date);
};

const buildCountryFilter = (countryCode?: string) => {
  const normalized = (countryCode || "").trim().toLowerCase();
  if (!normalized || normalized === "all" || !/^[a-z]{3}$/.test(normalized)) {
    return {};
  }
  return {
    dimensionFilterGroups: [
      {
        groupType: "and",
        filters: [
          {
            dimension: "country",
            operator: "equals",
            expression: normalized,
          },
        ],
      },
    ],
  };
};

const querySearchAnalytics = async (
  property: string,
  accessToken: string,
  period: Period,
  dimensions?: string[],
  rowLimit = 100,
  countryFilter?: string,
) => {
  const response = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites/" +
      encodeURIComponent(property) +
      "/searchAnalytics/query",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: period.startDate,
        endDate: period.endDate,
        ...(dimensions ? { dimensions } : {}),
        ...buildCountryFilter(countryFilter),
        rowLimit,
        aggregationType: "auto",
      }),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.error?.message || "Google Search Console query failed.",
    );
  }
  return result;
};

const fetchGscSitemaps = async (property: string, accessToken: string) => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/webmasters/v3/sites/" +
        encodeURIComponent(property) +
        "/sitemaps",
      {
        headers: { Authorization: "Bearer " + accessToken },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.sitemap) ? data.sitemap : [];
  } catch {
    return [];
  }
};

const fetchVerifiedSites = async (accessToken: string) => {
  try {
    const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.siteEntry) ? data.siteEntry : [];
  } catch {
    return [];
  }
};

const normalizeInspectionUrl = (rawUrl: string, property: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("Enter a DripTech page URL or path to inspect.");
  const propertyOrigin =
    property.startsWith("http://") || property.startsWith("https://")
      ? new URL(property).origin
      : "https://www.dripstech.co.ke";

  const parsed =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, propertyOrigin);

  const host = parsed.hostname.toLowerCase();
  if (host !== "dripstech.co.ke" && host !== "www.dripstech.co.ke") {
    throw new Error("URL inspection only supports dripstech.co.ke URLs.");
  }

  // URL-prefix properties require the exact property origin, whereas domain properties accept either host.
  const targetOrigin =
    property.startsWith("http://") || property.startsWith("https://")
      ? propertyOrigin
      : parsed.origin;
  return `${targetOrigin}${parsed.pathname}${parsed.search}`;
};

const inspectSearchConsoleUrl = async (
  property: string,
  accessToken: string,
  rawUrl: string,
) => {
  const inspectionUrl = normalizeInspectionUrl(rawUrl, property);
  const response = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl: property,
        languageCode: "en",
      }),
    },
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.error?.message || "Google URL Inspection API request failed.",
    );
  }
  const idx = result?.inspectionResult?.indexStatusResult || {};
  const mobile = result?.inspectionResult?.mobileUsabilityResult || {};
  const rich = result?.inspectionResult?.richResultsResult || {};
  return {
    inspectionUrl,
    inspectionResultLink: result?.inspectionResult?.inspectionResultLink || null,
    verdict: idx.verdict || "VERDICT_UNSPECIFIED",
    coverageState: idx.coverageState || "Unknown",
    indexingState: idx.indexingState || "Unknown",
    robotsTxtState: idx.robotsTxtState || "Unknown",
    pageFetchState: idx.pageFetchState || "Unknown",
    lastCrawlTime: idx.lastCrawlTime || null,
    crawledAs: idx.crawledAs || "Unknown",
    googleCanonical: idx.googleCanonical || null,
    userCanonical: idx.userCanonical || null,
    referringUrls: Array.isArray(idx.referringUrls) ? idx.referringUrls.slice(0, 5) : [],
    mobileVerdict: mobile.verdict || "VERDICT_UNSPECIFIED",
    richResultsVerdict: rich.verdict || "VERDICT_UNSPECIFIED",
    richResultTypes: Array.isArray(rich.detectedItems)
      ? rich.detectedItems.map((item: any) => item?.richResultType).filter(Boolean)
      : [],
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsFor(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "POST required" }, 405);
  }

  const auth = req.headers.get("Authorization");
  if (!auth) {
    return json(req, { error: "Sign in required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const clientId = Deno.env.get("GSC_CLIENT_ID");
  const clientSecret = Deno.env.get("GSC_CLIENT_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !clientId || !clientSecret) {
    return json(req, { error: "Search Console server configuration is incomplete." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user || !(await hasAdminRole(admin, userData.user.id))) {
    return json(req, { error: "Admin access required" }, 403);
  }

  const { data: connection, error: connectionError } = await admin
    .from("gsc_oauth_tokens")
    .select("refresh_token,connected_email,property_url,updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (connectionError) {
    return json(req, { error: "Could not read the Search Console connection." }, 500);
  }
  if (!connection) {
    return json(req, {
      connected: false,
      queries: [],
      pages: [],
      queryPages: [],
      trend: [],
      devices: [],
      countries: [],
      searchAppearances: [],
      sitemaps: [],
    });
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return json(
        req,
        {
          connected: true,
          reconnectRequired: true,
          error:
            tokenData?.error_description ||
            "Google Search Console authorization expired. Click Reconnect Google to refresh permissions.",
        },
        502,
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "report";

    if (action === "inspect_url") {
      const inspection = await inspectSearchConsoleUrl(
        connection.property_url,
        tokenData.access_token,
        String(body?.url || ""),
      );
      return json(req, { connected: true, inspection });
    }

    if (action === "set_property") {
      const nextProperty = String(body?.propertyUrl || "").trim();
      const sites = await fetchVerifiedSites(tokenData.access_token);
      const matched = sites.find((s: any) => s?.siteUrl === nextProperty);
      if (!matched) {
        return json(
          req,
          { error: "Selected property is not verified under this Google account." },
          400,
        );
      }
      const { error: updateError } = await admin
        .from("gsc_oauth_tokens")
        .update({ property_url: nextProperty, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (updateError) {
        return json(req, { error: "Could not save Search Console property selection." }, 500);
      }
      return json(req, { connected: true, property: nextProperty });
    }

    const requestedDays = Number(body?.days) || 28;
    const days = Math.min(Math.max(Math.floor(requestedDays), 7), 90);
    const countryFilter =
      typeof body?.country === "string" && body.country !== "all" ? body.country : "all";

    // Search Console finalized data typically trails by 2-3 days.
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() - 3);
    const endDate = isoDate(end);
    const startDate = shiftDate(endDate, -(days - 1));

    const previousEndDate = shiftDate(startDate, -1);
    const previousStartDate = shiftDate(previousEndDate, -(days - 1));
    const currentPeriod = { startDate, endDate };
    const previousPeriod = {
      startDate: previousStartDate,
      endDate: previousEndDate,
    };

    const [
      totals,
      previousTotals,
      trend,
      queries,
      pages,
      queryPages,
      devices,
      countries,
      searchAppearances,
      sitemaps,
      verifiedSites,
    ] = await Promise.all([
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        undefined,
        1,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        previousPeriod,
        undefined,
        1,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["date"],
        1000,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["query"],
        1000,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["page"],
        1000,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["query", "page"],
        1000,
        countryFilter,
      ).catch(() => ({ rows: [] })),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["device"],
        10,
        countryFilter,
      ),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["country"],
        50,
        "all",
      ).catch(() => ({ rows: [] })),
      querySearchAnalytics(
        connection.property_url,
        tokenData.access_token,
        currentPeriod,
        ["searchAppearance"],
        25,
        countryFilter,
      ).catch(() => ({ rows: [] })),
      fetchGscSitemaps(connection.property_url, tokenData.access_token),
      fetchVerifiedSites(tokenData.access_token),
    ]);

    return json(req, {
      connected: true,
      email: connection.connected_email,
      property: connection.property_url,
      countryFilter,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      totals: totals.rows?.[0] || {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
      previousTotals: previousTotals.rows?.[0] || {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
      trend: trend.rows || [],
      queries: queries.rows || [],
      pages: pages.rows || [],
      queryPages: queryPages.rows || [],
      devices: devices.rows || [],
      countries: countries.rows || [],
      searchAppearances: searchAppearances.rows || [],
      sitemaps,
      verifiedProperties: verifiedSites.map((s: any) => ({
        siteUrl: s?.siteUrl,
        permissionLevel: s?.permissionLevel,
      })).filter((s: any) => s.siteUrl),
      updatedAt: connection.updated_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not retrieve Search Console data.";
    return json(req, { connected: true, error: message }, 502);
  }
});
