import { createClient } from "npm:@supabase/supabase-js@2";
import { hasAdminRole } from "../_shared/admin-auth.ts";
import { loadRuntimeSettingsMap, maskSecretValue, saveRuntimeSecrets } from "../_shared/api-secrets.ts";
import {
  GrokRequestError,
  type GrokJsonSchemaSpec,
  type GrokUsageMetrics,
  buildCorsHeaders,
  callXaiResponses,
  estimateTokensFromText,
  isAllowedOrigin,
  parseGrokJsonObject,
} from "../_shared/grok-client.ts";
import {
  checkGrokDailyBudget,
  createGrokUsageReservation,
  loadGrokUsageTelemetry,
  persistGrokUsageSnapshot,
  recordGrokUsageFailure,
  recordGrokUsageSuccess,
} from "../_shared/market-jobs.ts";

type AdminClient = ReturnType<typeof createClient>;

const DEFAULT_MODEL = Deno.env.get("XAI_GROK_MODEL") || "grok-4.7";
const DEFAULT_LINKEDIN_VERSION = "202610";
const DEFAULT_ADMIN_REDIRECT = "https://www.dripstech.co.ke/admin?section=social-linkedin";

const VERIFIED_DRIPTECH_PAGES = [
  "https://www.dripstech.co.ke",
  "https://www.dripstech.co.ke/products/drip",
  "https://www.dripstech.co.ke/products/sprinklers",
  "https://www.dripstech.co.ke/products/pumps",
  "https://www.dripstech.co.ke/products/greenhouse",
  "https://www.dripstech.co.ke/irrigation-kits",
  "https://www.dripstech.co.ke/irrigation-cost-calculator-kenya",
  "https://www.dripstech.co.ke/projects",
  "https://www.dripstech.co.ke/services",
] as const;

const DAY_INDEX_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const LINKEDIN_BATCH_SCHEMA: GrokJsonSchemaSpec = {
  name: "linkedin_post_batch",
  strict: true,
  schema: {
    type: "object",
    properties: {
      trend_note: { type: "string" },
      posts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            content_pillar: {
              type: "string",
              enum: [
                "Field Case Study",
                "Crop Water ROI",
                "Equipment Spotlight",
                "Kenya Seasonal Advice",
                "Installation & Design",
              ],
            },
            commentary: { type: "string" },
            cta_url: { type: "string" },
            asset_id: { type: "string" },
          },
          required: ["topic", "content_pillar", "commentary", "cta_url", "asset_id"],
          additionalProperties: false,
        },
      },
    },
    required: ["trend_note", "posts"],
    additionalProperties: false,
  },
};

const LINKEDIN_SYSTEM_PROMPT = [
  "You are the B2B Agricultural & Irrigation Social Media Strategist for DripTech Eco-Flow in Kenya (https://www.dripstech.co.ke).",
  "Generate engaging, authentic LinkedIn posts tailored for Kenyan commercial farmers, greenhouse investors, agribusinesses, NGOs, and county water officers.",
  "RULES:",
  "1. Each post commentary should be 90-155 words: strong practical hook, concrete irrigation engineering insight, natural call-to-action with cta_url (chosen from verifiedUrls), and 3-5 focused hashtags (#DripTechEcoFlow #PrecisionIrrigation #KenyaAgriculture etc.).",
  "2. Pick a REAL asset_id from availableAssets that best fits the topic. Prefer assets with lowest `used` counts and never reuse the same asset_id twice in one batch.",
  "3. Do NOT repeat topics listed under recentTopics. Never fabricate fake client names, yields, or stats.",
  "4. If web_search is enabled, run at most 1 quick search for current East African agribusiness / rainfall / crop season relevance.",
].join("\n");

const corsFor = (req: Request) => buildCorsHeaders(req, "GET, POST, OPTIONS");
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });

async function sha256Hex(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeHttpUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || /^data:/i.test(trimmed)) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : "";
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeDripTechUrl(value: unknown, fallback = "https://www.dripstech.co.ke"): string {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.hostname === "dripstech.co.ke" || u.hostname === "www.dripstech.co.ke") {
      u.protocol = "https:";
      u.hostname = "www.dripstech.co.ke";
      return u.toString();
    }
  } catch {
    // Fallback below.
  }
  return fallback;
}

function isSupportedAssetUrl(url: string): boolean {
  if (!url) return false;
  if (/placeholder|no-image|favicon|\.svg(\?|$)/i.test(url)) return false;
  return /^https:\/\//i.test(url);
}

const ALLOWED_LINKEDIN_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "w_member_social",
  "r_organization_social",
  "w_organization_social",
  "rw_organization_admin",
]);

function getCallbackUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/social-linkedin-autopilot`;
}

function encodeOAuthState(origin: string | null | undefined): string {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const safeOrigin = origin && isAllowedOrigin(origin) ? origin : "https://www.dripstech.co.ke";
  const encodedOrigin = btoa(safeOrigin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${nonce}.${encodedOrigin}`;
}

function decodeOriginFromState(stateParam: string | null | undefined): string | null {
  if (!stateParam) return null;
  const parts = stateParam.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/") + "===".slice((parts[1].length + 3) % 4);
    const candidate = atob(padded);
    return isAllowedOrigin(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(jwt: unknown): Record<string, unknown> | null {
  if (typeof jwt !== "string") return null;
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/") + "===".slice((parts[1].length + 3) % 4);
    const parsed = JSON.parse(atob(padded));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function buildAdminRedirectUrl(origin: string | null | undefined, status: string, detail = ""): string {
  const baseOrigin = origin && isAllowedOrigin(origin) ? origin : "https://www.dripstech.co.ke";
  const url = new URL("/admin", baseOrigin);
  url.searchParams.set("section", "social-linkedin");
  url.searchParams.set("linkedin", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 240));
  return url.toString();
}

function computeUpcomingScheduleSlots(params: {
  count: number;
  postingDays: string[];
  preferredHourEat: number;
  occupiedIsoDates: string[];
}): string[] {
  const { count, postingDays, preferredHourEat, occupiedIsoDates } = params;
  const targetDaySet = new Set(
    (postingDays.length ? postingDays : ["mon", "wed", "fri"])
      .map((d) => DAY_INDEX_MAP[d.toLowerCase().slice(0, 3)])
      .filter((n): n is number => Number.isInteger(n)),
  );
  if (targetDaySet.size === 0) {
    targetDaySet.add(1);
    targetDaySet.add(3);
    targetDaySet.add(5);
  }

  // Convert EAT (UTC+3) date strings occupied so we place max 1 auto post per scheduled day.
  const occupiedDates = new Set<string>();
  for (const iso of occupiedIsoDates) {
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) continue;
    const eatDate = new Date(ms + 3 * 3600_000).toISOString().slice(0, 10);
    occupiedDates.add(eatDate);
  }

  const slots: string[] = [];
  const now = Date.now();
  const clampedHourEat = Math.min(Math.max(Math.floor(preferredHourEat || 9), 5), 22);
  const utcHour = (clampedHourEat - 3 + 24) % 24;
  const utcDayOffset = clampedHourEat < 3 ? -1 : 0;

  for (let dayOffset = 0; dayOffset < 60 && slots.length < count; dayOffset++) {
    const eatProbe = new Date(now + 3 * 3600_000 + dayOffset * 86_400_000);
    const eatDay = eatProbe.getUTCDay();
    const eatDateStr = eatProbe.toISOString().slice(0, 10);
    if (!targetDaySet.has(eatDay) || occupiedDates.has(eatDateStr)) continue;

    const slot = new Date(`${eatDateStr}T00:00:00.000Z`);
    slot.setUTCDate(slot.getUTCDate() + utcDayOffset);
    slot.setUTCHours(utcHour, 0, 0, 0);
    // Keep at least 15 minutes in the future so queued posts don't fire unpredictably mid-edit unless scheduled manually.
    if (slot.getTime() <= now + 15 * 60_000) continue;

    occupiedDates.add(eatDateStr);
    slots.push(slot.toISOString());
  }

  while (slots.length < count) {
    const fallbackMs = now + (slots.length + 1) * 2 * 86_400_000;
    slots.push(new Date(fallbackMs).toISOString());
  }
  return slots;
}

async function getSettingsAndConnection(admin: AdminClient) {
  const [settingsRes, connRes, secrets] = await Promise.all([
    admin.from("social_linkedin_settings").select("*").eq("id", 1).maybeSingle(),
    admin.from("social_linkedin_connections").select("*").eq("id", 1).maybeSingle(),
    loadRuntimeSettingsMap(
      admin,
      ["xai_api_key", "xai_grok_model", "linkedin_client_id", "linkedin_client_secret"],
      {
        xai_api_key: "XAI_API_KEY",
        xai_grok_model: "XAI_GROK_MODEL",
        linkedin_client_id: "LINKEDIN_CLIENT_ID",
        linkedin_client_secret: "LINKEDIN_CLIENT_SECRET",
      },
    ),
  ]);

  if (settingsRes.error) {
    throw new Error("Social autopilot tables not migrated yet: " + settingsRes.error.message);
  }

  const settings = (settingsRes.data || {}) as Record<string, unknown>;
  const conn = (connRes.data || {}) as Record<string, unknown>;

  return {
    settings: {
      autopilot_enabled: !!settings.autopilot_enabled,
      auto_replenish_queue: settings.auto_replenish_queue !== false,
      min_queue_buffer: Number(settings.min_queue_buffer || 3),
      posts_per_week: Number(settings.posts_per_week || 3),
      preferred_post_hour_eat: Number(settings.preferred_post_hour_eat ?? 9),
      posting_days: Array.isArray(settings.posting_days) && settings.posting_days.length
        ? (settings.posting_days as string[])
        : ["mon", "wed", "fri"],
      use_live_web_trends: settings.use_live_web_trends !== false,
      default_cta_url: String(settings.default_cta_url || "https://www.dripstech.co.ke"),
      brand_voice: String(
        settings.brand_voice ||
          "Practical Kenyan irrigation engineering partner sharing real farm setups, crop yield ROI, and water savings.",
      ),
      linkedin_api_version: String(settings.linkedin_api_version || DEFAULT_LINKEDIN_VERSION),
      last_generated_at: (settings.last_generated_at as string) || null,
      last_published_at: (settings.last_published_at as string) || null,
    },
    connection: {
      connected: !!conn.connected && !!conn.access_token,
      access_token: String(conn.access_token || ""),
      refresh_token: String(conn.refresh_token || ""),
      access_token_expires_at: (conn.access_token_expires_at as string) || null,
      author_urn: String(conn.author_urn || ""),
      account_name: String(conn.account_name || ""),
      account_avatar_url: String(conn.account_avatar_url || ""),
      post_target: conn.post_target === "organization" ? "organization" : "member",
      organization_id: String(conn.organization_id || ""),
      scope: String(conn.scope || ""),
      updated_at: (conn.updated_at as string) || null,
    },
    secrets: {
      xaiApiKey: secrets.xai_api_key || "",
      grokModel: secrets.xai_grok_model || DEFAULT_MODEL,
      linkedinClientId: secrets.linkedin_client_id || "",
      linkedinClientSecret: secrets.linkedin_client_secret || "",
    },
  };
}

async function syncCatalogImagesToAssetDb(admin: AdminClient, userId: string | null) {
  const [productsRes, projectsRes, kitsRes, storiesRes, uploadsRes, existingRes] = await Promise.all([
    admin.from("products").select("id,name,category,subcategory,images").limit(150),
    admin.from("projects").select("id,name,project_type,location,project_images,after_images").limit(80),
    admin.from("irrigation_kits").select("id,name,kit_type,coverage_area,images,recommended_crops").eq("active", true).limit(60),
    admin.from("success_stories").select("id,title,client_company,results,image_url,after_image").limit(60),
    admin.from("image_uploads").select("id,file_name,file_url").limit(80),
    admin.from("social_media_assets").select("image_url"),
  ]);

  const existingUrls = new Set(
    (Array.isArray(existingRes.data) ? existingRes.data : []).map((r: any) => String(r.image_url || "")),
  );

  const candidates: Array<Record<string, unknown>> = [];
  const addCandidate = (entry: {
    title: string;
    imageUrl: unknown;
    category: string;
    tags: string[];
    captionHint: string;
    location?: string;
    sourceType: "uploaded" | "product" | "project" | "kit" | "story";
    sourceId: string;
  }) => {
    const cleanUrl = normalizeHttpUrl(entry.imageUrl);
    if (!isSupportedAssetUrl(cleanUrl) || existingUrls.has(cleanUrl)) return;
    existingUrls.add(cleanUrl);
    candidates.push({
      title: entry.title.slice(0, 140) || "DripTech Irrigation Photo",
      image_url: cleanUrl,
      category: entry.category.slice(0, 60) || "general",
      tags: entry.tags.filter(Boolean).slice(0, 8),
      caption_hint: entry.captionHint.slice(0, 260),
      location: (entry.location || "").slice(0, 80),
      source_type: entry.sourceType,
      source_id: entry.sourceId.slice(0, 80),
      active: true,
      created_by: userId,
    });
  };

  for (const p of Array.isArray(productsRes.data) ? productsRes.data : []) {
    const imgs = Array.isArray(p.images) ? p.images : [];
    for (const img of imgs.slice(0, 2)) {
      addCandidate({
        title: String(p.name || "Irrigation Equipment"),
        imageUrl: img,
        category: String(p.category || "products"),
        tags: ["equipment", String(p.category || ""), String(p.subcategory || "")].filter(Boolean),
        captionHint: `${p.name} (${p.category || "irrigation equipment"}) supplied by DripTech Eco-Flow Kenya`,
        sourceType: "product",
        sourceId: String(p.id),
      });
    }
  }

  for (const proj of Array.isArray(projectsRes.data) ? projectsRes.data : []) {
    const imgs = [
      ...(Array.isArray(proj.after_images) ? proj.after_images : []),
      ...(Array.isArray(proj.project_images) ? proj.project_images : []),
    ];
    for (const img of imgs.slice(0, 2)) {
      addCandidate({
        title: `${proj.name}${proj.location ? ` (${proj.location})` : ""}`,
        imageUrl: img,
        category: "projects",
        tags: ["installation", String(proj.project_type || ""), String(proj.location || "")].filter(Boolean),
        captionHint: `Completed ${proj.project_type || "irrigation"} project: ${proj.name} in ${proj.location || "Kenya"}`,
        location: String(proj.location || ""),
        sourceType: "project",
        sourceId: String(proj.id),
      });
    }
  }

  for (const kit of Array.isArray(kitsRes.data) ? kitsRes.data : []) {
    const imgs = Array.isArray(kit.images) ? kit.images : [];
    for (const img of imgs.slice(0, 1)) {
      addCandidate({
        title: String(kit.name || "Irrigation Kit"),
        imageUrl: img,
        category: "kits",
        tags: [
          "irrigation-kit",
          String(kit.kit_type || ""),
          ...(Array.isArray(kit.recommended_crops) ? kit.recommended_crops.slice(0, 3).map(String) : []),
        ].filter(Boolean),
        captionHint: `Complete ${kit.name}${kit.coverage_area ? ` (${kit.coverage_area})` : ""}`,
        sourceType: "kit",
        sourceId: String(kit.id),
      });
    }
  }

  for (const s of Array.isArray(storiesRes.data) ? storiesRes.data : []) {
    for (const img of [s.after_image, s.image_url]) {
      if (!img) continue;
      addCandidate({
        title: String(s.title || "Customer Success Story"),
        imageUrl: img,
        category: "projects",
        tags: ["case-study", String(s.client_company || "")].filter(Boolean),
        captionHint: `${s.title}${s.results ? ` — ${s.results}` : ""}`,
        sourceType: "story",
        sourceId: String(s.id),
      });
      break;
    }
  }

  for (const u of Array.isArray(uploadsRes.data) ? uploadsRes.data : []) {
    addCandidate({
      title: String(u.file_name || "Uploaded Media").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "),
      imageUrl: u.file_url,
      category: "general",
      tags: ["library"],
      captionHint: `DripTech gallery image (${u.file_name || "campaign asset"})`,
      sourceType: "uploaded",
      sourceId: String(u.id),
    });
  }

  if (candidates.length === 0) {
    return { imported: 0, totalKnown: existingUrls.size };
  }

  const chunk = candidates.slice(0, 100);
  const { error: insertError } = await admin.from("social_media_assets").insert(chunk);
  if (insertError) throw new Error("Failed to import images: " + insertError.message);

  return { imported: chunk.length, totalKnown: existingUrls.size };
}

async function generateLinkedInPostBatch(params: {
  admin: AdminClient;
  userId: string | null;
  count: number;
  autoApprove: boolean;
  topicFocus?: string;
}) {
  const { admin, userId, count, autoApprove, topicFocus = "" } = params;
  const clampedCount = Math.min(Math.max(Math.floor(count || 3), 1), 5);
  const state = await getSettingsAndConnection(admin);
  if (!state.secrets.xaiApiKey) {
    throw new Error("xAI Grok API key is missing. Add it in Admin -> System Settings -> API Keys.");
  }

  const budget = await checkGrokDailyBudget(admin);
  if (!budget.ok) {
    throw new Error(
      `Daily Grok cost budget reached ($${budget.dailySpendUsd.toFixed(2)}/$${budget.budgetUsd.toFixed(2)} USD). Cannot generate posts today.`,
    );
  }

  const [assetsRes, recentPostsRes, productsRes, blogsRes] = await Promise.all([
    admin
      .from("social_media_assets")
      .select("id,title,image_url,category,tags,caption_hint,location,used_count,last_used_at")
      .eq("active", true)
      .order("used_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(20),
    admin
      .from("social_linkedin_posts")
      .select("topic,status,scheduled_for,asset_id")
      .in("status", ["queued", "draft", "published"])
      .order("created_at", { ascending: false })
      .limit(12),
    admin.from("products").select("name,category").eq("in_stock", true).limit(12),
    admin.from("blog_posts").select("title,slug").eq("published", true).order("created_at", { ascending: false }).limit(6),
  ]);

  const assets = (Array.isArray(assetsRes.data) ? assetsRes.data : []) as Array<Record<string, unknown>>;
  if (assets.length === 0) {
    throw new Error("Your Image Database is empty. Import existing product/project photos or upload at least 1 image first.");
  }

  const recentPosts = Array.isArray(recentPostsRes.data) ? recentPostsRes.data : [];
  const assetById = new Map(assets.map((a) => [String(a.id), a]));

  const verifiedUrls = [
    ...VERIFIED_DRIPTECH_PAGES,
    ...(Array.isArray(blogsRes.data) ? blogsRes.data : [])
      .filter((b: any) => b.slug)
      .map((b: any) => `https://www.dripstech.co.ke/blog/${b.slug}`),
  ];

  const userPayload = {
    requestedPostCount: clampedCount,
    brandVoice: state.settings.brand_voice,
    topicFocus: topicFocus.trim() || "Kenyan commercial irrigation, crop yields, solar water pumping, greenhouse efficiency",
    verifiedUrls: verifiedUrls.slice(0, 12),
    sampleCatalog: (Array.isArray(productsRes.data) ? productsRes.data : []).slice(0, 8).map((p: any) => `${p.name} (${p.category})`),
    recentTopicsToAvoid: recentPosts.slice(0, 8).map((p: any) => p.topic),
    availableAssets: assets.map((a) => ({
      id: a.id,
      title: a.title,
      cat: a.category,
      loc: a.location || undefined,
      hint: String(a.caption_hint || "").slice(0, 140),
      used: Number(a.used_count || 0),
    })),
  };

  const userPrompt = JSON.stringify(userPayload);
  const promptEstimatedTokens = estimateTokensFromText(LINKEDIN_SYSTEM_PROMPT + userPrompt);
  const useWebSearch = state.settings.use_live_web_trends;
  const startedAt = Date.now();
  let usageLogId: number | null = null;
  let usagePersisted = false;

  try {
    usageLogId = await createGrokUsageReservation(admin, {
      jobId: null,
      functionName: "social-linkedin-autopilot",
      model: state.secrets.grokModel,
      estimatedPromptTokens: promptEstimatedTokens,
      useWebSearch,
      maxTurns: useWebSearch ? 1 : 0,
      metadata: { requested_posts: clampedCount, topic_focus: topicFocus || null },
    });

    // Strict single-shot call with maxTurns=1 when trends enabled and structured json_schema output.
    const grokResult = await callXaiResponses({
      apiKey: state.secrets.xaiApiKey,
      model: state.secrets.grokModel,
      systemPrompt: LINKEDIN_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 2400,
      timeoutMs: 95_000,
      useWebSearch,
      maxTurns: 1,
      reasoningEffort: "low",
      jsonSchema: LINKEDIN_BATCH_SCHEMA,
    });

    await persistGrokUsageSnapshot(admin, usageLogId, startedAt, grokResult.usage, {
      requested_posts: clampedCount,
      use_web_search: useWebSearch,
    });
    usagePersisted = true;

    const parsed = parseGrokJsonObject(grokResult.text);
    const rawPosts = Array.isArray(parsed.posts) ? parsed.posts : [];
    if (rawPosts.length === 0) {
      throw new Error("Grok returned no LinkedIn post drafts.");
    }

    const occupiedIsoDates = recentPosts
      .filter((p: any) => p.status === "queued" && p.scheduled_for)
      .map((p: any) => String(p.scheduled_for));

    const scheduleSlots = computeUpcomingScheduleSlots({
      count: Math.min(rawPosts.length, clampedCount),
      postingDays: state.settings.posting_days,
      preferredHourEat: state.settings.preferred_post_hour_eat,
      occupiedIsoDates,
    });

    const usedAssetsInBatch = new Set<string>();
    const pickFallbackAsset = () =>
      assets.find((a) => !usedAssetsInBatch.has(String(a.id))) || assets[0];

    const rowsToInsert = rawPosts.slice(0, clampedCount).map((entry, idx) => {
      const item = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      const requestedId = String(item.asset_id || "").trim();
      const matched = requestedId && assetById.has(requestedId) && !usedAssetsInBatch.has(requestedId)
        ? assetById.get(requestedId)!
        : pickFallbackAsset();
      usedAssetsInBatch.add(String(matched.id));

      return {
        status: autoApprove ? "queued" : "draft",
        source_mode: "grok_batch",
        topic: String(item.topic || `Irrigation Update #${idx + 1}`).trim().slice(0, 180),
        content_pillar: String(item.content_pillar || "Field Insights").slice(0, 80),
        commentary: String(item.commentary || "").trim().slice(0, 2900),
        cta_url: normalizeDripTechUrl(item.cta_url, state.settings.default_cta_url),
        asset_id: String(matched.id),
        image_url: String(matched.image_url || ""),
        scheduled_for: scheduleSlots[idx] || null,
        research_citations: grokResult.citations.slice(0, 10),
        created_by: userId,
      };
    });

    const { data: inserted, error: insertError } = await admin
      .from("social_linkedin_posts")
      .insert(rowsToInsert)
      .select("*");
    if (insertError) throw new Error("Failed to save generated LinkedIn posts: " + insertError.message);

    await Promise.all([
      admin.from("social_linkedin_settings").update({
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", 1),
      recordGrokUsageSuccess(admin, usageLogId, startedAt, grokResult.usage, {
        posts_generated: rowsToInsert.length,
        use_web_search: useWebSearch,
        prompt_estimated_tokens: promptEstimatedTokens,
      }),
    ]);

    return {
      trendNote: String(parsed.trend_note || ""),
      posts: inserted || [],
      usage: grokResult.usage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate LinkedIn posts.";
    if (usageLogId) {
      const attachedUsage: GrokUsageMetrics | null =
        error instanceof GrokRequestError ? error.usage : null;
      await recordGrokUsageFailure(admin, usageLogId, startedAt, message, {
        usage: usagePersisted ? undefined : attachedUsage,
        model: state.secrets.grokModel,
        estimatedPromptTokens: promptEstimatedTokens,
        useWebSearch,
      });
    }
    throw error;
  }
}

async function ensureValidLinkedInAccessToken(admin: AdminClient) {
  const state = await getSettingsAndConnection(admin);
  const conn = state.connection;
  if (!conn.connected || !conn.access_token) {
    throw new Error("LinkedIn is not connected yet. Connect LinkedIn in the Settings tab first.");
  }
  if (!conn.author_urn) {
    throw new Error(
      "LinkedIn token is saved, but Author URN is missing. Enter your Author URN (urn:li:person:... or urn:li:organization:...) under LinkedIn & Schedule, or enable OpenID Connect and Reconnect.",
    );
  }

  const expiresMs = conn.access_token_expires_at ? new Date(conn.access_token_expires_at).getTime() : 0;
  const needsRefresh = Number.isFinite(expiresMs) && expiresMs > 0 && expiresMs < Date.now() + 5 * 60_000;

  if (!needsRefresh) {
    return {
      accessToken: conn.access_token,
      authorUrn: conn.author_urn,
      linkedinVersion: state.settings.linkedin_api_version || DEFAULT_LINKEDIN_VERSION,
    };
  }

  if (!conn.refresh_token || !state.secrets.linkedinClientId || !state.secrets.linkedinClientSecret) {
    throw new Error("LinkedIn access token expired. Click Connect LinkedIn again to renew authorization.");
  }

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(12_000),
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
      client_id: state.secrets.linkedinClientId,
      client_secret: state.secrets.linkedinClientSecret,
    }),
  });
  const tokenPayload = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok || typeof tokenPayload.access_token !== "string") {
    throw new Error(
      `LinkedIn token refresh failed: ${String(tokenPayload.error_description || tokenPayload.error || res.status)}`,
    );
  }

  const expiresIn = Number(tokenPayload.expires_in || 5184000);
  const nextExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  await admin
    .from("social_linkedin_connections")
    .update({
      access_token: tokenPayload.access_token,
      refresh_token: typeof tokenPayload.refresh_token === "string" ? tokenPayload.refresh_token : conn.refresh_token,
      access_token_expires_at: nextExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return {
    accessToken: tokenPayload.access_token,
    authorUrn: conn.author_urn,
    linkedinVersion: state.settings.linkedin_api_version || DEFAULT_LINKEDIN_VERSION,
  };
}

async function uploadImageToLinkedIn(params: {
  imageUrl: string;
  authorUrn: string;
  accessToken: string;
  linkedinVersion: string;
}): Promise<string> {
  const { imageUrl, authorUrn, accessToken, linkedinVersion } = params;
  const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
  if (!imgResponse.ok) {
    throw new Error(`Could not fetch campaign image (${imgResponse.status}): ${imageUrl}`);
  }
  const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
  if (!/image\/(jpeg|jpg|png|gif)/i.test(contentType)) {
    throw new Error(`LinkedIn Images API requires JPG, PNG, or GIF (got ${contentType}). Swap this post's image.`);
  }
  const bytes = new Uint8Array(await imgResponse.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error("Campaign image is empty.");
  }

  const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Linkedin-Version": linkedinVersion,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({
      initializeUploadRequest: { owner: authorUrn },
    }),
  });
  const initPayload = await initRes.json().catch(() => ({})) as Record<string, any>;
  if (!initRes.ok || !initPayload?.value?.uploadUrl || !initPayload?.value?.image) {
    throw new Error(
      `LinkedIn image init failed (${initRes.status}): ${String(initPayload?.message || JSON.stringify(initPayload)).slice(0, 240)}`,
    );
  }

  const uploadUrl = String(initPayload.value.uploadUrl);
  const imageUrn = String(initPayload.value.image);

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    signal: AbortSignal.timeout(20_000),
    body: bytes,
  });
  if (!putRes.ok) {
    throw new Error(`LinkedIn image binary upload failed (${putRes.status}).`);
  }

  return imageUrn;
}

async function publishPostToLinkedIn(admin: AdminClient, postId: string) {
  const { data: post, error: fetchErr } = await admin
    .from("social_linkedin_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !post) throw new Error("LinkedIn post not found.");
  if (post.status === "published") {
    return { post, alreadyPublished: true };
  }
  if (post.status === "publishing") {
    throw new Error("This post is already being published.");
  }

  // Optimistically claim the post to prevent duplicate concurrent publishes.
  const { data: claimed, error: claimErr } = await admin
    .from("social_linkedin_posts")
    .update({ status: "publishing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .in("status", ["queued", "draft", "failed"])
    .select("*")
    .maybeSingle();

  if (claimErr || !claimed) {
    throw new Error("Could not lock post for publishing.");
  }

  try {
    const { accessToken, authorUrn, linkedinVersion } = await ensureValidLinkedInAccessToken(admin);

    let linkedinImageUrn = "";
    const imageUrl = String(claimed.image_url || "").trim();
    if (imageUrl) {
      linkedinImageUrn = await uploadImageToLinkedIn({
        imageUrl,
        authorUrn,
        accessToken,
        linkedinVersion,
      });
    }

    const postBody: Record<string, unknown> = {
      author: authorUrn,
      commentary: String(claimed.commentary || "").trim(),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (linkedinImageUrn) {
      postBody.content = {
        media: {
          id: linkedinImageUrn,
          altText: String(claimed.topic || "DripTech Eco-Flow Irrigation Kenya").slice(0, 120),
        },
      };
    }

    const postRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Linkedin-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify(postBody),
    });

    if (!postRes.ok) {
      const errData = await postRes.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(
        `LinkedIn Posts API error (${postRes.status}): ${String(errData?.message || JSON.stringify(errData)).slice(0, 320)}`,
      );
    }

    const postUrn = String(postRes.headers.get("x-restli-id") || postRes.headers.get("x-linkedin-id") || "");
    const liveUrl = postUrn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/` : "";
    const nowIso = new Date().toISOString();

    const { data: publishedPost, error: updateErr } = await admin
      .from("social_linkedin_posts")
      .update({
        status: "published",
        published_at: nowIso,
        linkedin_post_urn: postUrn,
        linkedin_post_url: liveUrl,
        linkedin_image_urn: linkedinImageUrn,
        error_message: null,
        updated_at: nowIso,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (updateErr) throw new Error("Published on LinkedIn, but failed updating local record: " + updateErr.message);

    await admin
      .from("social_linkedin_settings")
      .update({ last_published_at: nowIso, updated_at: nowIso })
      .eq("id", 1);

    if (claimed.asset_id) {
      const { data: assetRow } = await admin
        .from("social_media_assets")
        .select("used_count")
        .eq("id", String(claimed.asset_id))
        .maybeSingle();
      await admin
        .from("social_media_assets")
        .update({
          used_count: Number(assetRow?.used_count || 0) + 1,
          last_used_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", String(claimed.asset_id));
    }

    return { post: publishedPost, alreadyPublished: false };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "LinkedIn publish failed.";
    await admin
      .from("social_linkedin_posts")
      .update({
        status: "failed",
        error_message: errMsg.slice(0, 600),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);
    throw err;
  }
}

async function runAutopilotCycle(admin: AdminClient, options: { manualTrigger: boolean; userId: string | null }) {
  const state = await getSettingsAndConnection(admin);
  if (!options.manualTrigger && !state.settings.autopilot_enabled) {
    return { skipped: true, reason: "autopilot_disabled" };
  }

  let replenishedCount = 0;
  let publishedPost: Record<string, unknown> | null = null;
  let note = "";

  // Step 1: Replenish queue using 1 compact Grok batch if queued count dropped below buffer.
  if (state.settings.auto_replenish_queue) {
    const { count: queuedCount } = await admin
      .from("social_linkedin_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued");

    const lastGenMs = state.settings.last_generated_at ? new Date(state.settings.last_generated_at).getTime() : 0;
    const genCooldownPassed = !lastGenMs || Date.now() - lastGenMs > 6 * 3600_000;

    if (Number(queuedCount || 0) < state.settings.min_queue_buffer && (options.manualTrigger || genCooldownPassed)) {
      if (state.secrets.xaiApiKey) {
        const batch = await generateLinkedInPostBatch({
          admin,
          userId: options.userId,
          count: 3,
          autoApprove: true,
        });
        replenishedCount = batch.posts.length;
      } else {
        note = "Skipped auto-generation (no Grok API key configured).";
      }
    }
  }

  // Step 2: Publish at most 1 due queued post per run (with 16h anti-spam cooldown on automated runs).
  if (!state.connection.connected) {
    return {
      replenishedCount,
      publishedPost: null,
      note: note || "LinkedIn account is not connected; queued drafts preserved.",
    };
  }

  const lastPubMs = state.settings.last_published_at ? new Date(state.settings.last_published_at).getTime() : 0;
  const pubCooldownOk = options.manualTrigger || !lastPubMs || Date.now() - lastPubMs >= 16 * 3600_000;

  if (!pubCooldownOk) {
    return {
      replenishedCount,
      publishedPost: null,
      note: "Recently published a LinkedIn post; waiting for the next cadence window.",
    };
  }

  const nowIso = new Date().toISOString();
  const { data: duePosts } = await admin
    .from("social_linkedin_posts")
    .select("id")
    .eq("status", "queued")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(1);

  const due = duePosts?.[0];
  if (due?.id) {
    const result = await publishPostToLinkedIn(admin, String(due.id));
    publishedPost = result.post as Record<string, unknown>;
  } else {
    note = note || "No queued LinkedIn post is due yet.";
  }

  return { replenishedCount, publishedPost, note };
}

function parseOrganizationInput(raw: string): { numericId: string; vanityName: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { numericId: "", vanityName: "" };
  const urnMatch = trimmed.match(/urn:li:organization:(\d+)/i);
  if (urnMatch) return { numericId: urnMatch[1], vanityName: "" };
  if (/^\d+$/.test(trimmed)) return { numericId: trimmed, vanityName: "" };

  const urlNumMatch = trimmed.match(/linkedin\.com\/company\/(\d+)/i);
  if (urlNumMatch) return { numericId: urlNumMatch[1], vanityName: "" };

  const urlSlugMatch = trimmed.match(/linkedin\.com\/company\/([a-z0-9-]+)/i);
  if (urlSlugMatch) return { numericId: "", vanityName: urlSlugMatch[1].toLowerCase() };

  if (/^[a-z0-9-]+$/i.test(trimmed)) return { numericId: "", vanityName: trimmed.toLowerCase() };
  return { numericId: trimmed.replace(/\D/g, ""), vanityName: "" };
}

type ManagedOrg = { id: string; urn: string; name: string; vanityName: string };

async function discoverManagedOrganizations(params: {
  accessToken: string;
  linkedinVersion: string;
}): Promise<{ orgs: ManagedOrg[]; scopeError: string }> {
  const { accessToken, linkedinVersion } = params;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Linkedin-Version": linkedinVersion,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  try {
    const aclsRes = await fetch(
      "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      { headers, signal: AbortSignal.timeout(10_000) },
    );
    const aclsPayload = (await aclsRes.json().catch(() => ({}))) as Record<string, unknown>;
    if (!aclsRes.ok) {
      return {
        orgs: [],
        scopeError: String(aclsPayload?.message || `HTTP ${aclsRes.status} loading managed Company Pages`),
      };
    }

    const elements = Array.isArray(aclsPayload.elements) ? aclsPayload.elements : [];
    const orgIds = elements
      .map((el) => {
        const urn = String((el as Record<string, unknown>)?.organization || "");
        const m = urn.match(/urn:li:organization:(\d+)/i);
        return m ? m[1] : "";
      })
      .filter(Boolean);

    const uniqueIds = Array.from(new Set(orgIds)).slice(0, 10);
    if (uniqueIds.length === 0) return { orgs: [], scopeError: "" };

    const lookupRes = await fetch(
      `https://api.linkedin.com/rest/organizations?ids=List(${uniqueIds.join(",")})`,
      { headers, signal: AbortSignal.timeout(10_000) },
    );
    const lookupPayload = (await lookupRes.json().catch(() => ({}))) as Record<string, unknown>;
    const results = (lookupPayload.results && typeof lookupPayload.results === "object"
      ? lookupPayload.results
      : {}) as Record<string, Record<string, unknown>>;

    const orgs: ManagedOrg[] = uniqueIds.map((id) => {
      const info = results[id] || {};
      const name = String(info.localizedName || info.vanityName || `Company ${id}`);
      const vanityName = String(info.vanityName || "");
      return { id, urn: `urn:li:organization:${id}`, name, vanityName };
    });

    return { orgs, scopeError: "" };
  } catch (err) {
    return { orgs: [], scopeError: err instanceof Error ? err.message : "Could not check Company Pages." };
  }
}

async function resolveOrganizationByVanity(params: {
  vanityName: string;
  accessToken: string;
  linkedinVersion: string;
}): Promise<ManagedOrg | null> {
  const { vanityName, accessToken, linkedinVersion } = params;
  if (!vanityName) return null;
  try {
    const res = await fetch(
      `https://api.linkedin.com/rest/organizations?q=vanityName&vanityName=${encodeURIComponent(vanityName)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Linkedin-Version": linkedinVersion,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const first = Array.isArray(data.elements) ? (data.elements[0] as Record<string, unknown> | undefined) : undefined;
    const id = first?.id != null ? String(first.id) : "";
    if (!/^\d+$/.test(id)) return null;
    return {
      id,
      urn: `urn:li:organization:${id}`,
      name: String(first?.localizedName || vanityName),
      vanityName: String(first?.vanityName || vanityName),
    };
  } catch {
    return null;
  }
}

async function handleOAuthCallback(req: Request, admin: AdminClient, supabaseUrl: string) {
  const url = new URL(req.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const decodedOrigin = decodeOriginFromState(stateParam);

  if (oauthError) {
    const errDesc = url.searchParams.get("error_description") || oauthError;
    const clearMsg = oauthError === "unauthorized_scope_error"
      ? `unauthorized_scope_error: ${errDesc}. Match your selected checkboxes under LinkedIn & Schedule to ONLY the scopes shown under Auth -> OAuth 2.0 scopes in LinkedIn Developer Portal.`
      : errDesc;
    return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "error", clearMsg), 303);
  }
  if (!code || !stateParam) {
    return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "error", "Missing OAuth parameters"), 303);
  }

  const stateHash = await sha256Hex(stateParam);
  const { data: stateRow } = await admin
    .from("social_linkedin_oauth_states")
    .select("*")
    .eq("state_hash", stateHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!stateRow) {
    return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "error", "Expired or invalid OAuth state"), 303);
  }
  await admin.from("social_linkedin_oauth_states").delete().eq("state_hash", stateHash);

  const stateData = await getSettingsAndConnection(admin);
  const clientId = stateData.secrets.linkedinClientId;
  const clientSecret = stateData.secrets.linkedinClientSecret;
  if (!clientId || !clientSecret) {
    return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "error", "LinkedIn Client ID/Secret missing"), 303);
  }

  const redirectUri = getCallbackUrl(supabaseUrl);
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(12_000),
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenPayload = await tokenRes.json().catch(() => ({})) as Record<string, unknown>;
  if (!tokenRes.ok || typeof tokenPayload.access_token !== "string") {
    return Response.redirect(
      buildAdminRedirectUrl(
        decodedOrigin,
        "error",
        String(tokenPayload.error_description || tokenPayload.error || "Token exchange failed"),
      ),
      303,
    );
  }

  const accessToken = tokenPayload.access_token;
  const refreshToken = typeof tokenPayload.refresh_token === "string" ? tokenPayload.refresh_token : "";
  const expiresIn = Number(tokenPayload.expires_in || 5184000);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Extract identity from OIDC id_token (if returned) and/or /v2/userinfo.
  const idClaims = decodeJwtPayload(tokenPayload.id_token);
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  const profile = profileRes?.ok ? (await profileRes.json().catch(() => ({})) as Record<string, unknown>) : {};

  const memberSub = String(profile.sub || idClaims?.sub || "").trim();
  let postTarget: "member" | "organization" = stateRow.post_target === "organization" ? "organization" : "member";
  let orgId = stateData.connection.organization_id;
  let accountName = String(profile.name || idClaims?.name || "LinkedIn Account");
  let detailNote = "";

  if (postTarget === "organization") {
    const discovered = await discoverManagedOrganizations({
      accessToken,
      linkedinVersion: stateData.settings.linkedin_api_version || DEFAULT_LINKEDIN_VERSION,
    });
    const matched = (orgId ? discovered.orgs.find((o) => o.id === orgId) : undefined) || discovered.orgs[0];
    if (matched) {
      orgId = matched.id;
      accountName = matched.name;
    } else if (!/^\d+$/.test(orgId)) {
      if (memberSub) {
        postTarget = "member";
        detailNote = discovered.scopeError
          ? "connected_personal_org_scope_missing"
          : "connected_personal_no_admin_org_found";
      }
    } else {
      accountName = `Company ${orgId}`;
    }
  }

  const authorUrn =
    postTarget === "organization" && /^\d+$/.test(orgId)
      ? `urn:li:organization:${orgId}`
      : memberSub
        ? `urn:li:person:${memberSub}`
        : stateData.connection.author_urn || "";

  if (!authorUrn && !detailNote) {
    detailNote = "author_urn_needed";
    accountName = "Token Saved (Author URN needed)";
  }

  const { error: saveError } = await admin.from("social_linkedin_connections").upsert({
    id: 1,
    connected: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_expires_at: expiresAt,
    author_urn: authorUrn,
    account_name: accountName,
    account_avatar_url: String(profile.picture || idClaims?.picture || ""),
    post_target: postTarget,
    organization_id: orgId,
    scope: String(tokenPayload.scope || ""),
    updated_by: stateRow.admin_user_id,
    updated_at: new Date().toISOString(),
  });

  if (saveError) {
    return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "error", "Database save failed"), 303);
  }
  return Response.redirect(buildAdminRedirectUrl(decodedOrigin, "connected", detailNote), 303);
}

async function buildContextResponse(admin: AdminClient, supabaseUrl: string) {
  const [state, assetsRes, postsRes, usageTelemetry] = await Promise.all([
    getSettingsAndConnection(admin),
    admin
      .from("social_media_assets")
      .select("*")
      .order("active", { ascending: false })
      .order("used_count", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(120),
    admin
      .from("social_linkedin_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
    loadGrokUsageTelemetry(admin),
  ]);

  return {
    grokConfigured: !!state.secrets.xaiApiKey,
    grokModel: state.secrets.grokModel,
    oauthReady: !!state.secrets.linkedinClientId && !!state.secrets.linkedinClientSecret,
    clientIdPreview: maskSecretValue(state.secrets.linkedinClientId),
    clientSecretConfigured: !!state.secrets.linkedinClientSecret,
    redirectUri: getCallbackUrl(supabaseUrl),
    verifiedPages: VERIFIED_DRIPTECH_PAGES,
    settings: state.settings,
    connection: {
      connected: state.connection.connected,
      author_urn: state.connection.author_urn,
      account_name: state.connection.account_name,
      account_avatar_url: state.connection.account_avatar_url,
      post_target: state.connection.post_target,
      organization_id: state.connection.organization_id,
      access_token_expires_at: state.connection.access_token_expires_at,
      has_refresh_token: !!state.connection.refresh_token,
      scope: state.connection.scope,
      updated_at: state.connection.updated_at,
    },
    assets: assetsRes.data || [],
    posts: postsRes.data || [],
    usageTelemetry,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json(req, { error: "Supabase server configuration is incomplete." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  if (req.method === "GET") {
    return await handleOAuthCallback(req, admin, supabaseUrl);
  }
  if (req.method !== "POST") return json(req, { error: "POST required" }, 405);

  const cronSecret = Deno.env.get("SOCIAL_CRON_SECRET");
  const suppliedCronSecret = req.headers.get("x-social-cron-secret") || "";
  const isScheduledCall = !!cronSecret && suppliedCronSecret.length > 0 && suppliedCronSecret === cronSecret;

  let userId: string | null = null;
  if (!isScheduledCall) {
    const auth = req.headers.get("Authorization");
    if (!auth) return json(req, { error: "Sign in required." }, 401);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user || !(await hasAdminRole(admin, userData.user.id))) {
      return json(req, { error: "Admin access required." }, 403);
    }
    userId = userData.user.id;
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "context");

  try {
    if (isScheduledCall && action !== "run_autopilot") {
      return json(req, { error: "Scheduled caller may only invoke run_autopilot." }, 403);
    }

    if (action === "context") {
      return json(req, await buildContextResponse(admin, supabaseUrl));
    }

    if (action === "save_credentials") {
      const updates: Record<string, string | null | undefined> = {};
      if (typeof body.linkedin_client_id === "string" && body.linkedin_client_id.trim()) {
        updates.linkedin_client_id = body.linkedin_client_id.trim();
      }
      if (typeof body.linkedin_client_secret === "string" && body.linkedin_client_secret.trim()) {
        updates.linkedin_client_secret = body.linkedin_client_secret.trim();
      }
      if (Object.keys(updates).length > 0 && userId) {
        await saveRuntimeSecrets(admin, userId, updates);
      }

      const currentState = await getSettingsAndConnection(admin);
      const current = currentState.connection;
      const manualToken = typeof body.manual_access_token === "string" ? body.manual_access_token.trim() : "";
      const manualUrn = typeof body.manual_author_urn === "string" ? body.manual_author_urn.trim() : "";
      const postTarget = body.post_target === "organization" ? "organization" : body.post_target === "member" ? "member" : current.post_target;

      let resolvedOrgId = current.organization_id;
      let resolvedAccountName = current.account_name;
      if (typeof body.organization_id === "string") {
        const parsedOrg = parseOrganizationInput(body.organization_id);
        if (parsedOrg.numericId) {
          resolvedOrgId = parsedOrg.numericId;
        } else if (parsedOrg.vanityName) {
          const activeToken = manualToken || current.access_token;
          if (activeToken) {
            const foundOrg = await resolveOrganizationByVanity({
              vanityName: parsedOrg.vanityName,
              accessToken: activeToken,
              linkedinVersion: currentState.settings.linkedin_api_version || DEFAULT_LINKEDIN_VERSION,
            });
            if (!foundOrg) {
              return json(req, {
                error: `Could not resolve Company Page slug "${parsedOrg.vanityName}" to a numeric ID. Paste the numeric Company ID from your LinkedIn Admin URL (e.g. linkedin.com/company/12345678/admin/) or click "Detect Company Pages" after connecting OAuth.`,
              }, 400);
            }
            resolvedOrgId = foundOrg.id;
            resolvedAccountName = foundOrg.name;
          } else {
            return json(req, {
              error: `Cannot look up Company URL slug "${parsedOrg.vanityName}" before LinkedIn is connected. Either paste the numeric Company ID or connect LinkedIn first, then click "Detect Company Pages".`,
            }, 400);
          }
        } else {
          resolvedOrgId = "";
        }
      }

      if (manualToken && manualUrn) {
        await admin.from("social_linkedin_connections").upsert({
          id: 1,
          connected: true,
          access_token: manualToken,
          refresh_token: "",
          access_token_expires_at: new Date(Date.now() + 59 * 86_400_000).toISOString(),
          author_urn: manualUrn,
          account_name: String(body.account_name || manualUrn).slice(0, 120),
          post_target: manualUrn.includes("organization") ? "organization" : postTarget,
          organization_id: resolvedOrgId,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        });
      } else if (manualUrn || body.organization_id !== undefined || body.post_target !== undefined) {
        let nextUrn = manualUrn || current.author_urn;
        if (!manualUrn && postTarget === "organization" && /^\d+$/.test(resolvedOrgId)) {
          nextUrn = `urn:li:organization:${resolvedOrgId}`;
        } else if (!manualUrn && postTarget === "member" && current.connected && current.access_token) {
          const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${current.access_token}` },
            signal: AbortSignal.timeout(8_000),
          }).catch(() => null);
          const profile = profileRes?.ok ? (await profileRes.json().catch(() => ({})) as Record<string, unknown>) : null;
          if (profile?.sub) {
            nextUrn = `urn:li:person:${String(profile.sub)}`;
            resolvedAccountName = String(profile.name || resolvedAccountName);
          }
        }
        await admin.from("social_linkedin_connections").upsert({
          id: 1,
          post_target: manualUrn.includes("organization") ? "organization" : postTarget,
          organization_id: resolvedOrgId,
          account_name: manualUrn ? manualUrn.slice(0, 120) : resolvedAccountName,
          ...(nextUrn ? { author_urn: nextUrn } : {}),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        });
      }

      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "test_connection") {
      const { accessToken, authorUrn, linkedinVersion } = await ensureValidLinkedInAccessToken(admin);
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      });
      const profile = profileRes.ok ? (await profileRes.json().catch(() => ({})) as Record<string, unknown>) : null;
      const orgDiscovery = await discoverManagedOrganizations({ accessToken, linkedinVersion });
      const conn = (await getSettingsAndConnection(admin)).connection;
      const grantedScopes = conn.scope.split(/[\s,]+/).filter(Boolean);
      const canPostPersonal = grantedScopes.length === 0 || grantedScopes.includes("w_member_social");
      const canPostOrganization = grantedScopes.includes("w_organization_social") || orgDiscovery.orgs.length > 0;

      return json(req, {
        success: true,
        profileOk: !!profile?.sub,
        profileName: profile?.name ? String(profile.name) : null,
        profileSub: profile?.sub ? String(profile.sub) : null,
        authorUrn,
        canPostPersonal,
        canPostOrganization,
        managedOrganizations: orgDiscovery.orgs,
        organizationCheckNote: orgDiscovery.scopeError || null,
        ...(await buildContextResponse(admin, supabaseUrl)),
      });
    }

    if (action === "oauth_start") {
      const stateData = await getSettingsAndConnection(admin);
      const clientId = stateData.secrets.linkedinClientId;
      if (!clientId || !stateData.secrets.linkedinClientSecret) {
        return json(req, { error: "Save your LinkedIn Client ID & Client Secret first." }, 400);
      }

      const rawState = encodeOAuthState(req.headers.get("origin"));
      const postTarget = body.post_target === "organization" ? "organization" : "member";
      const { error: stateErr } = await admin.from("social_linkedin_oauth_states").insert({
        state_hash: await sha256Hex(rawState),
        admin_user_id: userId,
        post_target: postTarget,
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      });
      if (stateErr) return json(req, { error: "Unable to start LinkedIn OAuth state: " + stateErr.message }, 500);

      const requestedScopes = Array.isArray(body.scopes)
        ? body.scopes.map((s) => String(s).trim()).filter((s) => ALLOWED_LINKEDIN_SCOPES.has(s))
        : [];
      const fallbackScopes = postTarget === "organization"
        ? ["r_organization_social", "w_organization_social", "rw_organization_admin"]
        : ["w_member_social"];
      const finalScopes = requestedScopes.length ? Array.from(new Set(requestedScopes)) : fallbackScopes;

      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", getCallbackUrl(supabaseUrl));
      authUrl.searchParams.set("state", rawState);
      authUrl.searchParams.set("scope", finalScopes.join(" "));

      return json(req, { url: authUrl.toString(), scopes: finalScopes });
    }

    if (action === "disconnect") {
      await admin.from("social_linkedin_connections").upsert({
        id: 1,
        connected: false,
        access_token: "",
        refresh_token: "",
        access_token_expires_at: null,
        author_urn: "",
        account_name: "",
        account_avatar_url: "",
        updated_by: userId,
        updated_at: new Date().toISOString(),
      });
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "save_settings") {
      const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const postingDays = Array.isArray(body.posting_days)
        ? body.posting_days.map((d) => String(d).toLowerCase().slice(0, 3)).filter((d) => validDays.includes(d))
        : undefined;

      const patch: Record<string, unknown> = {
        id: 1,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
      if (typeof body.autopilot_enabled === "boolean") patch.autopilot_enabled = body.autopilot_enabled;
      if (typeof body.auto_replenish_queue === "boolean") patch.auto_replenish_queue = body.auto_replenish_queue;
      if (body.min_queue_buffer != null) {
        patch.min_queue_buffer = Math.min(Math.max(Math.floor(Number(body.min_queue_buffer) || 3), 1), 14);
      }
      if (body.preferred_post_hour_eat != null) {
        patch.preferred_post_hour_eat = Math.min(Math.max(Math.floor(Number(body.preferred_post_hour_eat) || 9), 5), 22);
      }
      if (postingDays && postingDays.length > 0) patch.posting_days = Array.from(new Set(postingDays));
      if (typeof body.use_live_web_trends === "boolean") patch.use_live_web_trends = body.use_live_web_trends;
      if (typeof body.default_cta_url === "string") patch.default_cta_url = normalizeDripTechUrl(body.default_cta_url);
      if (typeof body.brand_voice === "string") patch.brand_voice = body.brand_voice.trim().slice(0, 500);
      if (typeof body.linkedin_api_version === "string" && /^\d{6}(\.\d{2})?$/.test(body.linkedin_api_version.trim())) {
        patch.linkedin_api_version = body.linkedin_api_version.trim();
      }

      const { error } = await admin.from("social_linkedin_settings").upsert(patch);
      if (error) return json(req, { error: "Could not save autopilot settings: " + error.message }, 500);
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "sync_catalog_images") {
      const result = await syncCatalogImagesToAssetDb(admin, userId);
      return json(req, { success: true, ...result, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "upsert_asset") {
      const imageUrl = normalizeHttpUrl(body.image_url);
      if (!isSupportedAssetUrl(imageUrl)) {
        return json(req, { error: "A valid HTTPS image URL (JPG/PNG/GIF) is required." }, 400);
      }
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
        : String(body.tags || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);

      const record: Record<string, unknown> = {
        title: String(body.title || "Campaign Photo").trim().slice(0, 140),
        image_url: imageUrl,
        storage_path: String(body.storage_path || "").trim().slice(0, 240),
        category: String(body.category || "general").trim().slice(0, 60),
        tags,
        caption_hint: String(body.caption_hint || "").trim().slice(0, 300),
        location: String(body.location || "").trim().slice(0, 80),
        active: body.active !== false,
        updated_at: new Date().toISOString(),
      };

      const assetId = typeof body.id === "string" ? body.id.trim() : "";
      if (assetId) {
        const { error } = await admin.from("social_media_assets").update(record).eq("id", assetId);
        if (error) return json(req, { error: "Could not update image asset: " + error.message }, 500);
      } else {
        const { error } = await admin.from("social_media_assets").upsert(
          { ...record, source_type: "uploaded", created_by: userId },
          { onConflict: "image_url" },
        );
        if (error) return json(req, { error: "Could not save image asset: " + error.message }, 500);
      }
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "delete_asset") {
      const assetId = String(body.id || "").trim();
      if (!assetId) return json(req, { error: "Asset ID required." }, 400);
      const { error } = await admin.from("social_media_assets").delete().eq("id", assetId);
      if (error) return json(req, { error: "Could not delete image asset: " + error.message }, 500);
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "generate_batch") {
      const count = Math.min(Math.max(Math.floor(Number(body.count) || 3), 1), 5);
      const autoApprove = body.autoApprove !== false;
      const topicFocus = String(body.topicFocus || "");
      const batch = await generateLinkedInPostBatch({
        admin,
        userId,
        count,
        autoApprove,
        topicFocus,
      });
      return json(req, {
        success: true,
        trendNote: batch.trendNote,
        generatedCount: batch.posts.length,
        usage: batch.usage,
        ...(await buildContextResponse(admin, supabaseUrl)),
      });
    }

    if (action === "create_manual_post") {
      const commentary = String(body.commentary || "").trim().slice(0, 2900);
      if (!commentary) return json(req, { error: "Post text cannot be empty." }, 400);
      const publishNow = body.publish_now === true;
      const assetId = typeof body.asset_id === "string" && body.asset_id.trim() ? body.asset_id.trim() : null;
      let imageUrl = normalizeHttpUrl(body.image_url);
      if (assetId && !imageUrl) {
        const { data: asset } = await admin.from("social_media_assets").select("image_url").eq("id", assetId).maybeSingle();
        if (asset?.image_url) imageUrl = String(asset.image_url);
      }
      const { data: insertedPost, error } = await admin
        .from("social_linkedin_posts")
        .insert({
          status: !publishNow && body.status === "draft" ? "draft" : "queued",
          source_mode: "manual",
          topic: String(body.topic || "Manual LinkedIn Post").trim().slice(0, 180),
          content_pillar: String(body.content_pillar || "Field Insights").slice(0, 80),
          commentary,
          cta_url: normalizeDripTechUrl(body.cta_url),
          asset_id: assetId,
          image_url: imageUrl,
          scheduled_for: typeof body.scheduled_for === "string" && body.scheduled_for ? body.scheduled_for : new Date().toISOString(),
          created_by: userId,
        })
        .select("*")
        .single();
      if (error || !insertedPost) return json(req, { error: "Could not save post: " + (error?.message || "insert failed") }, 500);

      if (publishNow) {
        const publishedRes = await publishPostToLinkedIn(admin, String(insertedPost.id));
        return json(req, {
          success: true,
          publishedNow: true,
          post: publishedRes.post,
          ...(await buildContextResponse(admin, supabaseUrl)),
        });
      }

      return json(req, { success: true, post: insertedPost, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "update_post") {
      const postId = String(body.id || "").trim();
      if (!postId) return json(req, { error: "Post ID required." }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof body.topic === "string") patch.topic = body.topic.trim().slice(0, 180);
      if (typeof body.commentary === "string") patch.commentary = body.commentary.trim().slice(0, 2900);
      if (typeof body.cta_url === "string") patch.cta_url = normalizeDripTechUrl(body.cta_url);
      if (typeof body.scheduled_for === "string") patch.scheduled_for = body.scheduled_for || null;
      if (
        typeof body.status === "string" &&
        ["draft", "queued", "skipped"].includes(body.status)
      ) {
        patch.status = body.status;
      }
      if (typeof body.asset_id === "string") {
        const aid = body.asset_id.trim();
        if (aid) {
          const { data: asset } = await admin.from("social_media_assets").select("image_url").eq("id", aid).maybeSingle();
          patch.asset_id = aid;
          patch.image_url = asset?.image_url ? String(asset.image_url) : "";
        } else {
          patch.asset_id = null;
          patch.image_url = "";
        }
      }
      const { error } = await admin.from("social_linkedin_posts").update(patch).eq("id", postId);
      if (error) return json(req, { error: "Could not update post: " + error.message }, 500);
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "delete_post") {
      const postId = String(body.id || "").trim();
      if (!postId) return json(req, { error: "Post ID required." }, 400);
      const { error } = await admin.from("social_linkedin_posts").delete().eq("id", postId);
      if (error) return json(req, { error: "Could not delete post: " + error.message }, 500);
      return json(req, { success: true, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "publish_post") {
      const postId = String(body.id || "").trim();
      if (!postId) return json(req, { error: "Post ID required." }, 400);
      const res = await publishPostToLinkedIn(admin, postId);
      return json(req, { success: true, ...res, ...(await buildContextResponse(admin, supabaseUrl)) });
    }

    if (action === "run_autopilot") {
      const result = await runAutopilotCycle(admin, {
        manualTrigger: !isScheduledCall && body.manualTrigger !== false,
        userId,
      });
      return json(req, {
        success: true,
        ...result,
        ...(isScheduledCall ? {} : await buildContextResponse(admin, supabaseUrl)),
      });
    }

    return json(req, { error: "Unsupported action." }, 400);
  } catch (err) {
    return json(req, { error: err instanceof Error ? err.message : "Social autopilot request failed." }, 500);
  }
});
