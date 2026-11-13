import { createClient } from "npm:@supabase/supabase-js@2";
import { hasAdminRole } from "../_shared/admin-auth.ts";

const MODEL = Deno.env.get("XAI_GROK_MODEL") || "grok-4.7";
const DEFAULT_DAILY_EMAIL_CAP = 25;
const MAX_DAILY_EMAIL_CAP = 50;
const UNSUBSCRIBE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const ALLOWED_ORIGINS = new Set([
  "https://www.dripstech.co.ke",
  "https://dripstech.co.ke",
  "https://driptech-eco-flow-web.vercel.app",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]);

const VERIFIED_DRIPTECH_LINKS = [
  { label: "Turnkey Irrigation Kits (1/8 to 1+ Acre)", url: "https://www.dripstech.co.ke/irrigation-kits" },
  { label: "Drip Irrigation Systems & Driplines", url: "https://www.dripstech.co.ke/products/drip" },
  { label: "Sprinklers & Rain Guns", url: "https://www.dripstech.co.ke/products/sprinklers" },
  { label: "Water Pumps & Solar Pumping", url: "https://www.dripstech.co.ke/products/pumps" },
  { label: "HDPE Pipes & Compression Fittings", url: "https://www.dripstech.co.ke/products/pipes" },
  { label: "Screen, Disc & Sand Media Filters", url: "https://www.dripstech.co.ke/products/filtration" },
  { label: "Fertigation & Dosing Systems", url: "https://www.dripstech.co.ke/products/fertigation" },
  { label: "Greenhouse Drip & Misting Systems", url: "https://www.dripstech.co.ke/products/greenhouse" },
  { label: "Irrigation Cost Calculator (Kenya)", url: "https://www.dripstech.co.ke/irrigation-cost-calculator-kenya" },
  { label: "Site Survey & Installation Services", url: "https://www.dripstech.co.ke/services" },
] as const;

const COMPETITOR_BLOCK_RE =
  /\b(grekkon|afrodrip|finetouch|davis\s*&?\s*shirtliff|irriguru|amiran\s*kenya|netafim|dripstech|driptech)\b/i;

const SHARED_DIRECTORY_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "ke.linkedin.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "www.youtube.com",
  "kenyaplex.com",
  "www.kenyaplex.com",
  "businesslist.co.ke",
  "www.businesslist.co.ke",
  "yellowpageskenya.com",
  "www.yellowpageskenya.com",
  "tenders.go.ke",
  "tendersoko.com",
  "www.tendersoko.com",
]);

const PLACEHOLDER_EMAIL_RE =
  /@(example\.com|example\.org|domain\.com|test\.com|yoursite\.com|company\.com)$/i;

type AdminClient = ReturnType<typeof createClient>;

const isAllowedOrigin = (origin: string) => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (
      hostname.endsWith(".replit.dev") ||
      hostname.endsWith(".replit.app") ||
      (hostname.startsWith("driptech-eco-flow-web-") && hostname.endsWith(".vercel.app"))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const corsFor = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-my-custom-header",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });

const htmlResponse = (title: string, message: string, status = 200) =>
  new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8faf8; color: #16241b; margin: 0; padding: 32px 16px; }
    .card { max-width: 520px; margin: 40px auto; background: #fff; border: 1px solid #d9e4dc; border-radius: 16px; padding: 28px; box-shadow: 0 6px 24px rgba(0,0,0,0.05); }
    h1 { font-size: 20px; margin: 0 0 12px; color: #14532d; }
    p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #374151; }
    a { color: #15803d; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="https://www.dripstech.co.ke">Return to DripTech Eco Flow</a></p>
  </div>
</body>
</html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHttpUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeDripTechUrl(value: unknown) {
  const candidate = normalizeHttpUrl(value);
  if (!candidate) return VERIFIED_DRIPTECH_LINKS[0].url;
  try {
    const parsed = new URL(candidate);
    if (parsed.hostname === "dripstech.co.ke" || parsed.hostname === "www.dripstech.co.ke") {
      parsed.protocol = "https:";
      parsed.hostname = "www.dripstech.co.ke";
      return parsed.toString();
    }
  } catch {
    // Fall back cleanly below.
  }
  return VERIFIED_DRIPTECH_LINKS[0].url;
}

function appendUtmParams(rawUrl: string, medium: "email" | "whatsapp") {
  try {
    const url = new URL(normalizeDripTechUrl(rawUrl));
    if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", "b2b_outreach");
    if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", medium);
    if (!url.searchParams.has("utm_campaign")) url.searchParams.set("utm_campaign", "grok_finder");
    return url.toString();
  } catch {
    return `${VERIFIED_DRIPTECH_LINKS[0].url}?utm_source=b2b_outreach&utm_medium=${medium}`;
  }
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase().replace(/^mailto:/, "");
  if (!trimmed || trimmed.length > 160) return "";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) return "";
  if (PLACEHOLDER_EMAIL_RE.test(trimmed)) return "";
  if (/^(no-?reply|donotreply)@/i.test(trimmed)) return "";
  return trimmed;
}

function normalizeKenyaWhatsapp(value: unknown) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12 && (digits[3] === "7" || digits[3] === "1")) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10 && (digits[1] === "7" || digits[1] === "1")) {
    return `254${digits.slice(1)}`;
  }
  if (digits.length === 9 && (digits[0] === "7" || digits[0] === "1")) {
    return `254${digits}`;
  }
  return "";
}

function buildDedupeKey(companyName: string, websiteUrl: string, county: string) {
  const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cleanCounty = county.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    if (websiteUrl) {
      const host = new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
      if (host && !SHARED_DIRECTORY_HOSTS.has(host) && !SHARED_DIRECTORY_HOSTS.has(`www.${host}`)) {
        return `host:${host}:${cleanCompany.slice(0, 48)}`;
      }
    }
  } catch {
    // Fall back to normalized company + region key.
  }
  return `org:${cleanCompany.slice(0, 80)}:${cleanCounty.slice(0, 40) || "ke"}`;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

async function createUnsubscribeToken(secret: string, email: string) {
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ email: email.toLowerCase(), iat: Date.now() })),
  );
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

async function verifyUnsubscribeToken(secret: string, token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig) return null;
  const expectedSig = await hmacSign(secret, payloadB64);
  if (expectedSig.length !== providedSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as {
      email?: string;
      iat?: number;
    };
    const email = normalizeEmail(parsed.email);
    const iat = Number(parsed.iat || 0);
    if (!email || !Number.isFinite(iat) || Date.now() - iat > UNSUBSCRIBE_TTL_MS) return null;
    return email;
  } catch {
    return null;
  }
}

function getDailyEmailCap() {
  const parsed = Number(Deno.env.get("OUTREACH_DAILY_EMAIL_CAP") || DEFAULT_DAILY_EMAIL_CAP);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_DAILY_EMAIL_CAP;
  return Math.min(Math.floor(parsed), MAX_DAILY_EMAIL_CAP);
}

function getSenderAddress() {
  const configured = (Deno.env.get("OUTREACH_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) return configured;
  return "DripTech Eco Flow Sales <info@dripstech.co.ke>";
}

function isSubdomainSender(fromAddress: string) {
  const match = fromAddress.match(/@([a-z0-9.-]+)/i);
  const host = (match?.[1] || "").toLowerCase();
  return !!host && host !== "dripstech.co.ke" && host.endsWith(".dripstech.co.ke");
}

function extractResponseText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const fragments: string[] = [];
  for (const item of Array.isArray(response.output) ? response.output : []) {
    if (!item || typeof item !== "object") continue;
    for (const part of Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as Array<Record<string, unknown>>)
      : []) {
      if (typeof part.text === "string" && part.text.trim()) fragments.push(part.text.trim());
    }
  }
  return fragments.join("\n");
}

function extractCitations(response: Record<string, unknown>) {
  const citations: Array<{ title: string; url: string; domain: string }> = [];
  const seen = new Set<string>();
  const add = (title: unknown, url: unknown) => {
    const cleanUrl = normalizeHttpUrl(url);
    if (!cleanUrl || seen.has(cleanUrl)) return;
    seen.add(cleanUrl);
    const domain = new URL(cleanUrl).hostname;
    citations.push({
      title: typeof title === "string" && title.trim() ? title.trim().slice(0, 180) : domain,
      url: cleanUrl,
      domain,
    });
  };
  for (const citation of Array.isArray(response.citations) ? response.citations : []) {
    if (typeof citation === "string") add(undefined, citation);
    else if (citation && typeof citation === "object") {
      const item = citation as Record<string, unknown>;
      add(item.title, item.url);
    }
  }
  for (const item of Array.isArray(response.output) ? response.output : []) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const annotations = (part as Record<string, unknown>).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        if (citation.type === "url_citation") add(citation.title, citation.url);
      }
    }
  }
  return citations;
}

function parseJsonObject(raw: string) {
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // Handled below.
      }
    }
    throw new Error("Grok returned invalid JSON. Try running the prospect scan again.");
  }
}

async function loadCatalogContext(admin: AdminClient) {
  const [productsResult, kitsResult] = await Promise.all([
    admin
      .from("products")
      .select("name,category,subcategory,description")
      .eq("in_stock", true)
      .limit(50),
    admin
      .from("irrigation_kits")
      .select("name,kit_type,coverage_area,recommended_crops,description")
      .eq("active", true)
      .limit(20),
  ]);

  const products = Array.isArray(productsResult.data) ? productsResult.data : [];
  const kits = Array.isArray(kitsResult.data) ? kitsResult.data : [];

  return {
    destinationPages: VERIFIED_DRIPTECH_LINKS,
    featuredProducts: products.slice(0, 30).map((item: Record<string, unknown>) => ({
      name: String(item.name || "").slice(0, 100),
      category: String(item.category || "").slice(0, 60),
    })),
    featuredKits: kits.slice(0, 12).map((kit: Record<string, unknown>) => ({
      name: String(kit.name || "").slice(0, 100),
      type: String(kit.kit_type || "").slice(0, 60),
      coverageArea: kit.coverage_area ?? null,
      crops: Array.isArray(kit.recommended_crops) ? kit.recommended_crops.slice(0, 6) : [],
    })),
  };
}

async function getDailyEmailsSentCount(admin: AdminClient) {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const { count, error } = await admin
    .from("b2b_outreach_leads")
    .select("id", { count: "exact", head: true })
    .gte("email_sent_at", startOfDay);
  if (error) return 0;
  return Number(count || 0);
}

async function loadOutreachContext(admin: AdminClient) {
  const [campaignsRes, leadsRes, suppressionRes, dailySentCount] = await Promise.all([
    admin
      .from("b2b_outreach_campaigns")
      .select("id,segment,region,product_focus,model,summary,source_links,lead_count,created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("b2b_outreach_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150),
    admin
      .from("b2b_outreach_suppression")
      .select("id", { count: "exact", head: true }),
    getDailyEmailsSentCount(admin),
  ]);

  if (campaignsRes.error) {
    throw new Error("Could not load outreach campaigns: " + campaignsRes.error.message);
  }
  if (leadsRes.error) {
    throw new Error("Could not load outreach leads: " + leadsRes.error.message);
  }

  const senderEmail = getSenderAddress();

  return {
    configured: !!Deno.env.get("XAI_API_KEY"),
    emailConfigured: !!Deno.env.get("RESEND_API_KEY"),
    senderEmail,
    usingSubdomainSender: isSubdomainSender(senderEmail),
    dailyEmailSentCount: dailySentCount,
    dailyEmailCap: getDailyEmailCap(),
    model: MODEL,
    catalogLinks: VERIFIED_DRIPTECH_LINKS,
    campaigns: campaignsRes.data || [],
    leads: leadsRes.data || [],
    suppressionCount: Number(suppressionRes.count || 0),
  };
}

async function discoverProspectsWithGrok(params: {
  apiKey: string;
  segment: string;
  region: string;
  productFocus: string;
  maxLeads: number;
  catalogContext: Record<string, unknown>;
}) {
  const { apiKey, segment, region, productFocus, maxLeads, catalogContext } = params;

  const prompt = [
    "You are the B2B Agricultural & Irrigation Prospect Researcher for DripTech Eco Flow in Kenya (https://www.dripstech.co.ke).",
    "Your job is to use web_search to find REAL commercial organizations in East Africa / Kenya that genuinely buy or resell irrigation equipment, and draft tailored, respectful B2B introductions.",
    "",
    `TARGET BUYER SEGMENT: ${segment}`,
    `TARGET REGION / COUNTY: ${region}`,
    `EQUIPMENT FOCUS: ${productFocus || "General DripTech irrigation kits, driplines, sprinklers, pumps & HDPE fittings"}`,
    `TARGET COUNT: Up to ${maxLeads} real, distinct organizations.`,
    "",
    "DRIPTECH VERIFIED CATALOGUE & LANDING PAGES:",
    JSON.stringify(catalogContext, null, 2),
    "",
    "STRICT ANTI-SPAM & NO-FABRICATION RULES:",
    "1. NEVER invent a company name, website URL, public_email, public_phone, or source_url.",
    "2. Only include organizations that actually appear in live web_search results.",
    "3. Only fill public_email or public_phone if that exact email/phone appears publicly on the organization's own official site, public tender document, or verified public business listing from web_search. If not found, return empty string \"\". NEVER guess info@company.com or fake numbers.",
    "4. Focus ONLY on commercial B2B entities (commercial farms, orchards, exporters, greenhouses, agrovets/hardware stockists, irrigation contractors, schools/NGOs, county water/agricultural tenders, estate landscaping). Exclude private individuals.",
    "5. EXCLUDE direct irrigation competitors: Grekkon, Afrodrip, FineTouch Africa, Davis & Shirtliff, IrriGuru, Amiran Kenya, Netafim, DripTech.",
    "6. For recommended_url, pick ONLY one exact URL from DRIPTECH VERIFIED CATALOGUE & LANDING PAGES above that best fits that buyer's need.",
    "7. Draft email_body under 135 words: polite, practical, no hype, reference why DripTech fits their specific crops/business, mention nationwide delivery across Kenya and phone/WhatsApp +254 723 407 849, and link to the chosen recommended_url. Do NOT include placeholder brackets like [Your Name] — sign cleanly as 'DripTech Eco Flow Sales Team'.",
    "8. Draft whatsapp_message under 65 words: friendly B2B WhatsApp intro mentioning DripTech Eco Flow, the exact matched gear/kit, and the recommended_url.",
    "9. Return strict JSON only (no markdown code fences).",
    "",
    "Return exact JSON schema:",
    JSON.stringify(
      {
        search_summary: "1-2 sentence overview of real public sources reviewed and caveats.",
        leads: [
          {
            company_name: "Exact public entity name",
            organization_type: "Commercial Farm | Greenhouse Project | Agrovet / Stockist | County / NGO Tender | Estate / Landscaping | Institution",
            county_region: "County or Town",
            website_url: "Official website URL if found via web_search, else empty string",
            source_url: "Exact web_search citation URL proving this entity and details exist",
            source_title: "Page title from web_search",
            public_email: "Exact publicly listed B2B email if found, else empty string",
            public_phone: "Exact publicly listed B2B phone if found, else empty string",
            likely_needs: ["2 to 4 relevant DripTech products or kit types"],
            recommended_url: "Exact URL from VERIFIED_DRIPTECH_LINKS",
            why_they_need_irrigation: "Specific factual reason based on public info (crops grown, expansion, agrovet stockist, tender scope)",
            confidence_note: "Direct contact verified on site | Needs manual contact lookup on source page | Tender buyer contact",
            email_subject: "Short specific B2B subject line (<65 chars)",
            email_body: "Plain concise email text signed 'DripTech Eco Flow Sales Team'",
            whatsapp_message: "Short WhatsApp message ending with the DripTech link",
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");

  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(55_000),
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search" }],
      max_output_tokens: 4500,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      "Grok API error: " + String(payload?.error?.message || payload?.message || "Lead search failed."),
    );
  }

  const rawText = extractResponseText(payload);
  if (!rawText) {
    throw new Error("Grok did not return lead results. Try narrowing the segment or county.");
  }

  const parsed = parseJsonObject(rawText) as Record<string, unknown>;
  const citations = extractCitations(payload);
  const citationUrlSet = new Set(citations.map((item) => item.url));

  const rawLeads = Array.isArray(parsed.leads) ? parsed.leads : [];
  const normalizedLeads = rawLeads
    .slice(0, maxLeads)
    .map((entry) => {
      const item = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      const companyName = String(item.company_name || "").trim().slice(0, 140);
      if (!companyName || COMPETITOR_BLOCK_RE.test(companyName)) return null;

      const websiteUrl = normalizeHttpUrl(item.website_url);
      const rawSourceUrl = normalizeHttpUrl(item.source_url);
      const verifiedSourceUrl =
        rawSourceUrl && (citationUrlSet.size === 0 || citationUrlSet.has(rawSourceUrl))
          ? rawSourceUrl
          : websiteUrl || citations[0]?.url || "";

      const publicEmail = normalizeEmail(item.public_email);
      const publicPhone = String(item.public_phone || "").trim().slice(0, 40);
      const whatsappNumber = normalizeKenyaWhatsapp(publicPhone);
      const recommendedUrl = normalizeDripTechUrl(item.recommended_url);
      const countyRegion = String(item.county_region || region).trim().slice(0, 80);

      return {
        company_name: companyName,
        organization_type: String(item.organization_type || "Agribusiness").trim().slice(0, 80),
        county_region: countyRegion,
        website_url: websiteUrl,
        source_url: verifiedSourceUrl,
        source_title: String(item.source_title || "").trim().slice(0, 180),
        public_email: publicEmail,
        public_phone: publicPhone,
        whatsapp_number: whatsappNumber,
        likely_needs: Array.isArray(item.likely_needs)
          ? item.likely_needs.map((need) => String(need || "").trim()).filter(Boolean).slice(0, 5)
          : [],
        recommended_url: recommendedUrl,
        why_they_need_irrigation: String(item.why_they_need_irrigation || "").trim().slice(0, 600),
        confidence_note: String(item.confidence_note || "").trim().slice(0, 200),
        email_subject: String(
          item.email_subject || `Irrigation Equipment & Acreage Kits for ${companyName}`,
        )
          .trim()
          .slice(0, 160),
        email_body: String(item.email_body || "").trim().slice(0, 3000),
        whatsapp_message: String(item.whatsapp_message || "").trim().slice(0, 1000),
        dedupe_key: buildDedupeKey(companyName, websiteUrl, countyRegion),
      };
    })
    .filter((lead): lead is NonNullable<typeof lead> => !!lead);

  return {
    summary: String(parsed.search_summary || "Grok B2B web search completed.").slice(0, 1000),
    leads: normalizedLeads,
    citations: citations.slice(0, 30),
    usage: payload.usage || null,
  };
}

function renderOutreachEmailHtml(params: {
  companyName: string;
  bodyText: string;
  recommendedUrl: string;
  unsubscribeUrl: string;
}) {
  const { bodyText, recommendedUrl, unsubscribeUrl } = params;
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#1f2937;">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#1f2937;background:#ffffff;">
  ${paragraphs}
  <div style="margin:20px 0 24px;padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
    <div style="font-size:13px;font-weight:600;color:#166534;margin-bottom:6px;">DripTech Eco Flow — Recommended Catalogue Page</div>
    <a href="${escapeHtml(recommendedUrl)}" style="font-size:14px;color:#15803d;word-break:break-all;">${escapeHtml(recommendedUrl)}</a>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />
  <p style="margin:0 0 6px 0;font-size:12px;color:#4b5563;">
    <strong>DripTech Eco Flow</strong> · Smart Irrigation Equipment & Installations Across Kenya<br />
    Call / WhatsApp: +254 723 407 849 | +254 757 716 018 · <a href="https://www.dripstech.co.ke" style="color:#15803d;">www.dripstech.co.ke</a>
  </p>
  <p style="margin:8px 0 0 0;font-size:11px;color:#6b7280;">
    Sent as a B2B commercial introduction to publicly listed agricultural & project contacts. Prefer not to hear from us?
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#4b5563;text-decoration:underline;">Unsubscribe in one click</a>.
  </p>
</div>`.trim();
}

async function suppressContact(admin: AdminClient, email: string, phone: string, reason: string) {
  const cleanEmail = normalizeEmail(email);
  const rawPhone = phone.trim().slice(0, 40);
  const cleanPhone = normalizeKenyaWhatsapp(rawPhone) || rawPhone.replace(/[^+\d]/g, "");

  if (cleanEmail) {
    const { data: existingEmail } = await admin
      .from("b2b_outreach_suppression")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();
    if (!existingEmail) {
      await admin
        .from("b2b_outreach_suppression")
        .insert({ email: cleanEmail, phone: "", reason });
    }
    await admin
      .from("b2b_outreach_leads")
      .update({ status: "unsubscribed" })
      .ilike("public_email", cleanEmail);
  }

  if (cleanPhone) {
    const { data: existingPhone } = await admin
      .from("b2b_outreach_suppression")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();
    if (!existingPhone) {
      await admin
        .from("b2b_outreach_suppression")
        .insert({ email: "", phone: cleanPhone, reason });
    }
    await admin
      .from("b2b_outreach_leads")
      .update({ status: "unsubscribed" })
      .eq("whatsapp_number", cleanPhone);
    if (rawPhone) {
      await admin
        .from("b2b_outreach_leads")
        .update({ status: "unsubscribed" })
        .eq("public_phone", rawPhone);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsFor(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json(req, { error: "Supabase server configuration is incomplete." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const unsubSecret = Deno.env.get("OUTREACH_UNSUBSCRIBE_SECRET") || serviceRoleKey;

  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("unsubscribe") || "";
    const email = await verifyUnsubscribeToken(unsubSecret, token);
    if (!email) {
      return htmlResponse(
        "Invalid or expired unsubscribe link",
        "If you want us to remove your contact manually, please reply or email info@dripstech.co.ke.",
        400,
      );
    }
    await suppressContact(admin, email, "", "one_click_unsubscribe");
    return htmlResponse(
      "You have been unsubscribed",
      `${email} has been removed from DripTech Eco Flow B2B outreach emails and will not be contacted again.`,
    );
  }

  if (req.method !== "POST") {
    return json(req, { error: "POST required" }, 405);
  }

  const auth = req.headers.get("Authorization");
  if (!auth) return json(req, { error: "Sign in required." }, 401);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user || !(await hasAdminRole(admin, userData.user.id))) {
    return json(req, { error: "Admin access required." }, 403);
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "context");

  try {
    if (action === "context") {
      return json(req, await loadOutreachContext(admin));
    }

    if (action === "discover") {
      const apiKey = Deno.env.get("XAI_API_KEY");
      if (!apiKey) {
        return json(
          req,
          {
            error: "Grok is not configured. Add XAI_API_KEY in Supabase Edge Function Secrets, then retry.",
            configurationRequired: true,
          },
          503,
        );
      }

      const segment = String(body.segment || "Commercial Horticulture & Avocado Farms").trim().slice(0, 140);
      const region = String(body.region || "Kenya (Nationwide)").trim().slice(0, 100);
      const productFocus = String(body.productFocus || "").trim().slice(0, 140);
      const maxLeads = Math.min(Math.max(Math.floor(Number(body.maxLeads) || 6), 3), 10);

      const catalogContext = await loadCatalogContext(admin);
      const discovery = await discoverProspectsWithGrok({
        apiKey,
        segment,
        region,
        productFocus,
        maxLeads,
        catalogContext,
      });

      const candidateKeys = discovery.leads.map((l) => l.dedupe_key).filter(Boolean);
      const candidateEmails = discovery.leads.map((l) => l.public_email).filter(Boolean);
      const candidatePhones = discovery.leads.map((l) => l.whatsapp_number).filter(Boolean);

      const [existingRes, suppressedEmailRes, suppressedPhoneRes] = await Promise.all([
        candidateKeys.length
          ? admin.from("b2b_outreach_leads").select("id,dedupe_key,status").in("dedupe_key", candidateKeys)
          : Promise.resolve({ data: [] }),
        candidateEmails.length
          ? admin.from("b2b_outreach_suppression").select("email").in("email", candidateEmails)
          : Promise.resolve({ data: [] }),
        candidatePhones.length
          ? admin.from("b2b_outreach_suppression").select("phone").in("phone", candidatePhones)
          : Promise.resolve({ data: [] }),
      ]);

      const existingByKey = new Map<string, { id: string; status: string }>();
      for (const row of existingRes.data || []) {
        if (row.dedupe_key) existingByKey.set(String(row.dedupe_key), { id: String(row.id), status: String(row.status) });
      }
      const suppressedEmails = new Set(
        (suppressedEmailRes.data || []).map((r: Record<string, unknown>) => String(r.email || "").toLowerCase()).filter(Boolean),
      );
      const suppressedPhones = new Set(
        (suppressedPhoneRes.data || []).map((r: Record<string, unknown>) => String(r.phone || "")).filter(Boolean),
      );

      const { data: campaign, error: campaignError } = await admin
        .from("b2b_outreach_campaigns")
        .insert({
          segment,
          region,
          product_focus: productFocus,
          model: MODEL,
          summary: discovery.summary,
          source_links: discovery.citations,
          lead_count: 0,
          created_by: userData.user.id,
        })
        .select("id")
        .single();
      if (campaignError) {
        return json(req, { error: "Could not save discovery scan: " + campaignError.message }, 500);
      }

      const newRows = [];
      let skippedDuplicates = 0;
      let skippedSuppressed = 0;

      for (const lead of discovery.leads) {
        if (
          (lead.public_email && suppressedEmails.has(lead.public_email)) ||
          (lead.whatsapp_number && suppressedPhones.has(lead.whatsapp_number))
        ) {
          skippedSuppressed++;
          continue;
        }
        if (existingByKey.has(lead.dedupe_key)) {
          skippedDuplicates++;
          continue;
        }
        existingByKey.set(lead.dedupe_key, { id: "pending", status: "new" });
        newRows.push({
          ...lead,
          campaign_id: campaign.id,
          status: "new",
          created_by: userData.user.id,
        });
      }

      if (newRows.length > 0) {
        const { error: insertError } = await admin.from("b2b_outreach_leads").insert(newRows);
        if (insertError) {
          return json(req, { error: "Could not store discovered prospects: " + insertError.message }, 500);
        }
      }

      await admin
        .from("b2b_outreach_campaigns")
        .update({ lead_count: newRows.length })
        .eq("id", campaign.id);

      const context = await loadOutreachContext(admin);
      return json(req, {
        ...context,
        discoverySummary: discovery.summary,
        insertedCount: newRows.length,
        skippedDuplicates,
        skippedSuppressed,
      });
    }

    if (action === "update_lead") {
      const leadId = String(body.leadId || "").trim();
      if (!leadId) return json(req, { error: "Lead ID is required." }, 400);

      const updates: Record<string, unknown> = {};
      if (typeof body.public_email === "string") updates.public_email = normalizeEmail(body.public_email);
      if (typeof body.public_phone === "string") {
        const cleanPhone = body.public_phone.trim().slice(0, 40);
        updates.public_phone = cleanPhone;
        updates.whatsapp_number = normalizeKenyaWhatsapp(cleanPhone);
      }
      if (typeof body.whatsapp_number === "string") {
        updates.whatsapp_number = normalizeKenyaWhatsapp(body.whatsapp_number);
      }
      if (typeof body.email_subject === "string") updates.email_subject = body.email_subject.trim().slice(0, 160);
      if (typeof body.email_body === "string") updates.email_body = body.email_body.trim().slice(0, 4000);
      if (typeof body.whatsapp_message === "string") {
        updates.whatsapp_message = body.whatsapp_message.trim().slice(0, 1200);
      }
      if (typeof body.recommended_url === "string") {
        updates.recommended_url = normalizeDripTechUrl(body.recommended_url);
      }
      if (typeof body.notes === "string") updates.notes = body.notes.trim().slice(0, 1000);
      if (
        typeof body.status === "string" &&
        ["new", "approved", "email_sent", "whatsapp_sent", "replied", "converted", "unsubscribed", "archived"].includes(
          body.status,
        )
      ) {
        updates.status = body.status;
      }

      if (Object.keys(updates).length === 0) {
        return json(req, { error: "No editable fields supplied." }, 400);
      }

      const { data: updatedLead, error: updateError } = await admin
        .from("b2b_outreach_leads")
        .update(updates)
        .eq("id", leadId)
        .select("*")
        .single();
      if (updateError) return json(req, { error: "Could not update lead: " + updateError.message }, 500);
      return json(req, { success: true, lead: updatedLead });
    }

    if (action === "send_email") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return json(
          req,
          {
            error: "RESEND_API_KEY is not configured in Supabase Edge Function Secrets.",
            configurationRequired: true,
          },
          503,
        );
      }

      const leadId = String(body.leadId || "").trim();
      if (!leadId) return json(req, { error: "Lead ID is required." }, 400);

      const { data: lead, error: leadError } = await admin
        .from("b2b_outreach_leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();
      if (leadError || !lead) return json(req, { error: "Prospect lead not found." }, 404);

      if (lead.status === "unsubscribed" || lead.status === "archived") {
        return json(req, { error: "Cannot email an unsubscribed or archived contact." }, 400);
      }
      if (lead.email_sent_at) {
        return json(req, { error: "This prospect was already emailed. Use follow-up notes or WhatsApp." }, 400);
      }

      const toEmail = normalizeEmail(typeof body.public_email === "string" ? body.public_email : lead.public_email);
      if (!toEmail) {
        return json(req, { error: "Add a valid public business email address before sending." }, 400);
      }

      const { data: suppressed } = await admin
        .from("b2b_outreach_suppression")
        .select("id")
        .ilike("email", toEmail)
        .maybeSingle();
      if (suppressed) {
        await admin.from("b2b_outreach_leads").update({ status: "unsubscribed" }).eq("id", leadId);
        return json(req, { error: "This email address is on your suppression / opt-out list." }, 409);
      }

      const dailyCap = getDailyEmailCap();
      const sentToday = await getDailyEmailsSentCount(admin);
      if (sentToday >= dailyCap) {
        return json(
          req,
          {
            error: `Daily safety cap reached (${sentToday}/${dailyCap} emails sent today) to protect DripTech's domain reputation.`,
          },
          429,
        );
      }

      const subject = String(body.email_subject || lead.email_subject || "").trim().slice(0, 160);
      const emailBody = String(body.email_body || lead.email_body || "").trim().slice(0, 4000);
      if (!subject || !emailBody) {
        return json(req, { error: "Email subject and message body cannot be empty." }, 400);
      }

      const recommendedUrl = appendUtmParams(
        String(body.recommended_url || lead.recommended_url || ""),
        "email",
      );
      const token = await createUnsubscribeToken(unsubSecret, toEmail);
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/b2b-lead-outreach?unsubscribe=${encodeURIComponent(token)}`;
      const fromAddress = getSenderAddress();

      const html = renderOutreachEmailHtml({
        companyName: String(lead.company_name || ""),
        bodyText: emailBody,
        recommendedUrl,
        unsubscribeUrl,
      });
      const text =
        `${emailBody}\n\nRecommended page: ${recommendedUrl}\n\n--\n` +
        `DripTech Eco Flow · Smart Irrigation Equipment Kenya\n` +
        `Call/WhatsApp: +254 723 407 849 · https://www.dripstech.co.ke\n` +
        `Unsubscribe: ${unsubscribeUrl}`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          reply_to: "info@dripstech.co.ke",
          subject,
          html,
          text,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      const resendPayload = await resendRes.json().catch(() => ({}));
      if (!resendRes.ok) {
        const errMsg = String(resendPayload?.message || resendPayload?.error?.message || "Resend delivery failed.");
        await admin.from("b2b_outreach_leads").update({ last_error: errMsg.slice(0, 400) }).eq("id", leadId);
        return json(req, { error: errMsg }, 502);
      }

      const sentAt = new Date().toISOString();
      const { data: updatedLead, error: saveErr } = await admin
        .from("b2b_outreach_leads")
        .update({
          public_email: toEmail,
          email_subject: subject,
          email_body: emailBody,
          recommended_url: normalizeDripTechUrl(body.recommended_url || lead.recommended_url),
          status: "email_sent",
          email_sent_at: sentAt,
          resend_message_id: String(resendPayload?.id || ""),
          last_error: null,
        })
        .eq("id", leadId)
        .select("*")
        .single();

      if (saveErr) {
        return json(req, { error: "Email sent via Resend, but lead status update failed: " + saveErr.message }, 500);
      }

      return json(req, {
        success: true,
        lead: updatedLead,
        dailyEmailSentCount: sentToday + 1,
        dailyEmailCap: dailyCap,
      });
    }

    if (action === "mark_whatsapp_sent") {
      const leadId = String(body.leadId || "").trim();
      if (!leadId) return json(req, { error: "Lead ID is required." }, 400);

      const updates: Record<string, unknown> = {
        whatsapp_sent_at: new Date().toISOString(),
        status: "whatsapp_sent",
      };
      if (typeof body.whatsapp_message === "string" && body.whatsapp_message.trim()) {
        updates.whatsapp_message = body.whatsapp_message.trim().slice(0, 1200);
      }
      if (typeof body.whatsapp_number === "string") {
        updates.whatsapp_number = normalizeKenyaWhatsapp(body.whatsapp_number);
      }

      const { data: updatedLead, error: updateError } = await admin
        .from("b2b_outreach_leads")
        .update(updates)
        .eq("id", leadId)
        .select("*")
        .single();
      if (updateError) return json(req, { error: "Could not mark WhatsApp sent: " + updateError.message }, 500);
      return json(req, { success: true, lead: updatedLead });
    }

    if (action === "suppress") {
      const leadId = String(body.leadId || "").trim();
      const { data: lead } = leadId
        ? await admin
            .from("b2b_outreach_leads")
            .select("id,public_email,whatsapp_number,public_phone")
            .eq("id", leadId)
            .maybeSingle()
        : { data: null };

      const email = String(body.email || lead?.public_email || "");
      const phone = String(body.phone || lead?.whatsapp_number || lead?.public_phone || "");
      await suppressContact(admin, email, phone, "admin_suppressed");
      if (leadId) {
        await admin.from("b2b_outreach_leads").update({ status: "unsubscribed" }).eq("id", leadId);
      }
      return json(req, await loadOutreachContext(admin));
    }

    return json(req, { error: "Unsupported action." }, 400);
  } catch (error) {
    return json(
      req,
      { error: error instanceof Error ? error.message : "Outreach request failed." },
      500,
    );
  }
});
