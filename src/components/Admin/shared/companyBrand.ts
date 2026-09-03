/** Shared company branding for quotes & invoices (UI + print). */

export const COMPANY = {
  name: "DripTech EcoFlow",
  tagline: "Smart Irrigation Systems",
  phone: "0794494515 / 0723407849",
  email: "info@dripstech.co.ke",
  emailAlt: "driptechs.info@gmail.com",
  address: "Nairobi, Kenya",
  primary: "#2d6a4f",
  primaryDark: "#1b4332",
} as const;

/** Official logo — same asset used for PWA / SEO (public/driptech-logo.png). */
export const LOGO_PATH = "/driptech-logo.png";

/** Absolute logo URL for print windows / PDF. */
export function getLogoUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${LOGO_PATH}`;
  }
  return `https://www.dripstech.co.ke${LOGO_PATH}`;
}
