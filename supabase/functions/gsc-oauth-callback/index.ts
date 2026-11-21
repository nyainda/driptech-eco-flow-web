import { createClient } from "npm:@supabase/supabase-js@2";

const redirect = (status: string) =>
  Response.redirect(
    "https://www.dripstech.co.ke/admin?section=analytics&gsc=" + encodeURIComponent(status),
    303,
  );

async function sha(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolvePreferredProperty(accessToken: string): Promise<string> {
  const preferredOrder = [
    "sc-domain:dripstech.co.ke",
    "https://www.dripstech.co.ke/",
    "https://dripstech.co.ke/",
  ];
  try {
    const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!sitesRes.ok) return "sc-domain:dripstech.co.ke";
    const data = await sitesRes.json();
    const entries = Array.isArray(data?.siteEntry) ? data.siteEntry : [];
    const verified = entries
      .map((item: { siteUrl?: string }) => item?.siteUrl)
      .filter((u: unknown): u is string => typeof u === "string");
    for (const candidate of preferredOrder) {
      if (verified.includes(candidate)) return candidate;
    }
    const domainMatch = verified.find((u: string) => u.includes("dripstech.co.ke"));
    return domainMatch || verified[0] || "sc-domain:dripstech.co.ke";
  } catch {
    return "sc-domain:dripstech.co.ke";
  }
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  if (u.searchParams.get("error")) return redirect("denied");
  if (!code || !state) return redirect("missing_parameters");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const stateHash = await sha(state);
  const { data: row } = await admin
    .from("gsc_oauth_states")
    .select("*")
    .eq("state_hash", stateHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!row) return redirect("invalid_state");
  await admin.from("gsc_oauth_states").delete().eq("state_hash", stateHash);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get("GSC_CLIENT_ID")!,
      client_secret: Deno.env.get("GSC_CLIENT_SECRET")!,
      redirect_uri:
        Deno.env.get("GSC_REDIRECT_URI") ||
        "https://cnvtnxesywbzwsxwpejw.supabase.co/functions/v1/gsc-oauth-callback",
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) return redirect("token_exchange_failed");

  const [profileRes, selectedProperty] = await Promise.all([
    fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token },
    }),
    resolvePreferredProperty(tokens.access_token),
  ]);
  const profile = profileRes.ok ? await profileRes.json() : {};

  const { error } = await admin.from("gsc_oauth_tokens").upsert({
    id: 1,
    refresh_token: tokens.refresh_token,
    connected_email: profile.email || null,
    property_url: selectedProperty,
    updated_at: new Date().toISOString(),
  });
  return redirect(error ? "save_failed" : "connected");
});
