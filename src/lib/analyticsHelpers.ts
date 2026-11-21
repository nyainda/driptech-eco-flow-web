export const ANALYTICS_TIMEZONE = "Africa/Nairobi";
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes standard inactivity window

const TRACKING_QUERY_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "ttclid",
  "mc_cid",
  "mc_eid",
  "_gl",
  "_ga",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
]);

const AUTOMATED_UA_PATTERN =
  /(\bbot\b|googlebot|bingbot|duckduckbot|yandexbot|pinterestbot|exabot|ia_archiver|crawler|spider|slurp|mediapartners-google|apis-google|adsbot-google|google-inspectiontool|storebot-google|headlesschrome|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|pingdom|uptimerobot|statuscake|ptst\/|phantomjs|playwright|puppeteer|selenium|webdriver|facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|applebot|bingpreview|yandex|baiduspider|sogou|bytespider|semrush|ahrefs|mj12bot|dotbot|petalbot|gptbot|oai-searchbot|claudebot|anthropic-ai|perplexitybot|ccbot|curl\/|wget|python-requests|python-urllib|axios\/|node-fetch|go-http-client|okhttp|postmanruntime|insomnia)/i;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export const generateTrackingId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback RFC4122-v4-like hex string so PostgreSQL UUID columns accept it.
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
};

export const isLocalOrPreviewHost = (hostname?: string | null): boolean => {
  if (!hostname) return false;
  const host = hostname.trim().toLowerCase();
  return LOCAL_HOSTS.has(host) || host.endsWith(".local");
};

export const isAutomatedUserAgent = (userAgent?: string | null): boolean => {
  if (!userAgent) return false;
  return AUTOMATED_UA_PATTERN.test(userAgent);
};

export const shouldSkipClientTracking = (): boolean => {
  if (typeof window === "undefined") return true;
  if (window.location.pathname.startsWith("/admin")) return true;
  if (isLocalOrPreviewHost(window.location.hostname)) return true;
  if (typeof navigator !== "undefined" && navigator.webdriver) return true;
  if (typeof document !== "undefined" && (document as { visibilityState?: string }).visibilityState === "prerender") {
    return true;
  }
  if (typeof navigator !== "undefined" && isAutomatedUserAgent(navigator.userAgent)) {
    return true;
  }
  return false;
};

export const sanitizePathForAnalytics = (rawPath: string): string => {
  const input = (rawPath || "/").trim();
  try {
    const parsed = new URL(input, "https://www.dripstech.co.ke");
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    const qs = parsed.searchParams.toString();
    const pathname = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, "") : "/";
    return `${pathname}${qs ? `?${qs}` : ""}`.slice(0, 500);
  } catch {
    const stripped = input.split("#")[0] || "/";
    return stripped.slice(0, 500);
  }
};

export const getBrowserInfo = (userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""): string => {
  if (!userAgent) return "Other";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  return "Other";
};

export const getDeviceType = (userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""): string => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

export const normalizeDeviceType = (raw?: string | null): string => {
  const val = (raw || "").trim().toLowerCase();
  if (!val) return "unknown";
  if (val.includes("tablet") || val.includes("ipad")) return "tablet";
  if (val.includes("mobile") || val.includes("phone")) return "mobile";
  if (val.includes("desktop")) return "desktop";
  return val;
};

export const classifyReferrerSource = (referrer?: string | null): string => {
  const ref = (referrer || "").trim().toLowerCase();
  if (!ref) return "Direct";
  if (ref.includes("dripstech.co.ke")) return "Internal";
  if (/google\.|bing\.|duckduckgo\.|yahoo\.|yandex\.|ecosia\./.test(ref)) return "Organic Search";
  if (/facebook\.|fb\.|instagram\.|t\.co|twitter\.|x\.com|linkedin\.|tiktok\.|youtube\.|whatsapp/.test(ref)) {
    return "Social Media";
  }
  return "Referrals";
};

export const getLocationFromTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
  } catch {
    return "Unknown";
  }
};

const nairobiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const nairobiHourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ANALYTICS_TIMEZONE,
  hour: "2-digit",
  hour12: false,
});

export const formatNairobiDateKey = (dateInput: string | Date): string => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return nairobiDateFormatter.format(d);
};

export const getNairobiHour = (dateInput: string | Date): number => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 0;
  const hour = Number.parseInt(nairobiHourFormatter.format(d), 10);
  if (!Number.isFinite(hour)) return 0;
  return hour === 24 ? 0 : Math.min(23, Math.max(0, hour));
};

export const getPeriodStartDate = (range: string, now: Date = new Date()): Date | null => {
  if (range === "all") return null;
  const start = new Date(now.getTime());
  switch (range) {
    case "1d":
      start.setTime(now.getTime() - 24 * 60 * 60 * 1000);
      return start;
    case "7d":
      start.setDate(start.getDate() - 7);
      return start;
    case "30d":
      start.setDate(start.getDate() - 30);
      return start;
    case "90d":
      start.setDate(start.getDate() - 90);
      return start;
    case "year": {
      const yearStr = formatNairobiDateKey(now).slice(0, 4);
      return new Date(`${yearStr}-01-01T00:00:00+03:00`);
    }
    default:
      start.setDate(start.getDate() - 30);
      return start;
  }
};
