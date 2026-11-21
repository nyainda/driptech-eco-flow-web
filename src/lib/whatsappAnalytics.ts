import { fetchSupabaseRest } from "@/integrations/supabase/config";

const BUSINESS_WHATSAPP_NUMBERS = new Set(["254723407849", "254141294497"]);

const getOrCreateId = (storage: Storage, key: string) => {
  let id = storage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(key, id);
  }
  return id;
};

const getWhatsAppDetails = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    const phone = parsed.hostname === "wa.me"
      ? parsed.pathname.replace(/\D/g, "")
      : (parsed.searchParams.get("phone") || "").replace(/\D/g, "");
    const isWhatsApp = parsed.hostname === "wa.me" || parsed.hostname.endsWith("whatsapp.com");

    return {
      isBusinessLink: isWhatsApp && BUSINESS_WHATSAPP_NUMBERS.has(phone),
      phone: phone || null,
      hasPrefilledMessage: parsed.searchParams.has("text"),
    };
  } catch {
    return { isBusinessLink: false, phone: null, hasPrefilledMessage: false };
  }
};

/** Records that a DripTech WhatsApp conversation was opened from this site. */
export const trackWhatsAppClick = (url: string, source = "website") => {
  const details = getWhatsAppDetails(url);
  if (!details.isBusinessLink) return;

  const visitorId = getOrCreateId(localStorage, "visitor_id");
  const sessionId = getOrCreateId(sessionStorage, "session_id");
  void fetchSupabaseRest("whatsapp_click_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      source: source.trim().slice(0, 200) || "website",
      target_number: details.phone,
      has_prefilled_message: details.hasPrefilledMessage,
      clicked_at: new Date().toISOString(),
    }),
  }).then(({ error }) => {
    if (error) console.error("Unable to record WhatsApp click:", error);
  });
};

/** Opens WhatsApp and records the outbound customer-contact intent first. */
export const openTrackedWhatsApp = (url: string, source = "website") => {
  trackWhatsAppClick(url, source);
  window.open(url, "_blank", "noopener,noreferrer");
};
