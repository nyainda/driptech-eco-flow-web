/** Shared company branding for quotes & invoices (UI + print). */

export const COMPANY = {
  name: "DripTech Eco Flow",
  tagline: "Smart Irrigation Systems",
  phone: "0757716018 / 0723407849",
  email: "info@dripstech.co.ke",
  emailAlt: "driptechs.info@gmail.com",
  address: "Nairobi, Kenya",
  primary: "#2d6a4f",
  primaryDark: "#1b4332",
} as const;

/**
 * Official logo = PWA icon (vite-plugin-pwa + manifest use favicon.svg).
 */
export const LOGO_PATH = "/favicon.svg";

/** Embedded PWA logo — reliable in print windows and PDF. */
export const LOGO_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjIuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzJjMzM5OCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMGI5NmUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgoKICA8cGF0aCBkPSJNNyAxNi4zYzIuMiAwIDQtMS44MyA0LTQuMDUgMC0xLjE2LS41Ny0yLjI2LTEuNzEtMy4xOVM3LjI5IDYuNzUgNyA1LjNjLS4yOSAxLjQ1LTEuMTQgMi44NC0yLjI5IDMuNzZTMyAxMS4xIDMgMTIuMjVjMCAyLjIyIDEuOCA0LjA1IDQgNC4wNXoiLz4KICA8cGF0aCBkPSJNMTIuNTYgNi42QTEwLjk3IDEwLjk3IDAgMCAwIDE0IDMuMDJjLjUgMi41IDIgNC45IDQgNi41czMgMy41IDMgNS41YTYuOTggNi45OCAwIDAgMS0xMS45MSA0Ljk3Ii8+Cjwvc3ZnPgo=";

/** Always use the PWA logo (embedded for print/PDF reliability). */
export function getLogoUrl(_options?: { forPrint?: boolean }): string {
  return LOGO_DATA_URL;
}
