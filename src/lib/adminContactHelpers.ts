import type { FieldSystemType } from "@/lib/engineeringReportEngine";

/** Normalizes Kenya/international phone numbers to digits-only format for wa.me links. */
export function normalizeKenyaWhatsAppDigits(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  } else if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    digits = `254${digits}`;
  }

  return digits.length >= 9 ? digits : null;
}

/** Builds a WhatsApp click-to-chat URL with an optional prefilled message. */
export function buildWhatsAppChatUrl(
  rawPhone?: string | null,
  message?: string,
): string | null {
  const digits = normalizeKenyaWhatsAppDigits(rawPhone);
  if (!digits) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/** Parses an acreage number from free-form text or area strings (e.g. "2.5 acres", "5 ha"). */
export function parseAcreageFromText(text?: string | null): number | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  const haMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ha|hectare|hectares)\b/);
  if (haMatch) {
    const val = parseFloat(haMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      return Number((val * 2.47105).toFixed(2));
    }
  }

  const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ac)\b/);
  if (acreMatch) {
    const val = parseFloat(acreMatch[1]);
    if (Number.isFinite(val) && val > 0) return val;
  }

  const plainNum = parseFloat(lower.replace(/,/g, ""));
  if (Number.isFinite(plainNum) && plainNum > 0 && plainNum <= 2000) {
    return plainNum;
  }
  return undefined;
}

/** Infers the Engineering Studio systemType from project type / kit text. */
export function inferIrrigationSystemType(
  ...hints: Array<string | null | undefined>
): FieldSystemType | undefined {
  const combined = hints
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!combined) return undefined;

  if (combined.includes("rain gun") || combined.includes("raingun")) {
    return "raingun";
  }
  if (combined.includes("sprinkler") || combined.includes("overhead")) {
    return "sprinkler";
  }
  if (combined.includes("drip") || combined.includes("greenhouse") || combined.includes("orchard")) {
    return "drip";
  }
  if (combined.includes("pump") || combined.includes("solar") || combined.includes("borehole")) {
    return "drip";
  }
  return undefined;
}
