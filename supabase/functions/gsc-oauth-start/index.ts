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

async function sha(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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
  const redirectUri = Deno.env.get("GSC_REDIRECT_URI") ||
    "https://cnvtnxesywbzwsxwpejw.supabase.co/functions/v1/gsc-oauth-callback";

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !clientId) {
    return json(req, { error: "Google OAuth server configuration is incomplete." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error } = await userClient.auth.getUser();
  const email = userData.user?.email || "";
  const isAdmin =
    email.endsWith("@driptech.com") ||
    ["admin@driptech.com", "support@driptech.com"].includes(email);

  if (error || !userData.user || !isAdmin) {
    return json(req, { error: "Admin access required" }, 403);
  }

  const state = crypto.randomUUID() + crypto.randomUUID();
  const stateHash = await sha(state);
  const { error: insertError } = await admin.from("gsc_oauth_states").insert({
    state_hash: stateHash,
    admin_user_id: userData.user.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (insertError) {
    return json(req, { error: "Unable to initiate OAuth state" }, 500);
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/webmasters.readonly");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return json(req, { url: url.toString() });
});
