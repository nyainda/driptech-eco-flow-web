import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://www.dripstech.co.ke",
  "https://dripstech.co.ke",
]);

const corsFor = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
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

const querySearchAnalytics = async (
  property: string,
  accessToken: string,
  period: Period,
  dimensions?: string[],
  rowLimit = 100,
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
  const email = userData.user?.email || "";
  const isAdmin =
    email.endsWith("@driptech.com") ||
    ["admin@driptech.com", "support@driptech.com"].includes(email);

  if (userError || !userData.user || !isAdmin) {
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
    return json(req, { connected: false, queries: [], pages: [], trend: [], devices: [] });
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
          error: "Google token refresh failed. Reconnect Search Console.",
          reconnectRequired: true,
        },
        502,
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedDays = Number(body?.days) || 28;
    const days = Math.min(Math.max(Math.floor(requestedDays), 7), 90);

    // Search Console data is normally delayed. End the report three days ago.
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

    const [totals, previousTotals, trend, queries, pages, devices] =
      await Promise.all([
        querySearchAnalytics(connection.property_url, tokenData.access_token, currentPeriod, undefined, 1),
        querySearchAnalytics(connection.property_url, tokenData.access_token, previousPeriod, undefined, 1),
        querySearchAnalytics(connection.property_url, tokenData.access_token, currentPeriod, ["date"], 1000),
        querySearchAnalytics(connection.property_url, tokenData.access_token, currentPeriod, ["query"], 100),
        querySearchAnalytics(connection.property_url, tokenData.access_token, currentPeriod, ["page"], 100),
        querySearchAnalytics(connection.property_url, tokenData.access_token, currentPeriod, ["device"], 10),
      ]);

    return json(req, {
      connected: true,
      email: connection.connected_email,
      property: connection.property_url,
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
      devices: devices.rows || [],
      updatedAt: connection.updated_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not retrieve Search Console data.";
    return json(req, { connected: true, error: message }, 502);
  }
});
