import { recordWhatsAppOutboundClick } from "@/lib/analyticsTelemetry";

const BUSINESS_WHATSAPP_NUMBERS = new Set(["254723407849", "254141294497"]);

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

  recordWhatsAppOutboundClick(details.phone, details.hasPrefilledMessage, source);
};

/** Opens WhatsApp and records the outbound customer-contact intent first. */
export const openTrackedWhatsApp = (url: string, source = "website") => {
  trackWhatsAppClick(url, source);
  window.open(url, "_blank", "noopener,noreferrer");
};
