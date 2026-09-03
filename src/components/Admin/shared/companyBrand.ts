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

/** Absolute logo URL for print windows / PDF. */
export function getLogoUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/favicon.svg`;
  }
  return "https://www.dripstech.co.ke/favicon.svg";
}

/** Inline SVG mark for print HTML when external images are blocked. */
export const LOGO_SVG_MARK = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
</svg>
`.trim();
