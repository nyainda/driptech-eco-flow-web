/** Shared corporate branding, remittance details, and helpers for Quotes, BOQs, Invoices & Receipts. */

export const COMPANY = {
  name: "DripTech EcoFlow Ltd",
  legalName: "DripTech EcoFlow Irrigation & Water Systems",
  tagline: "Precision Irrigation, Solar Pumping & Water Engineering Solutions",
  phone: "Sales/WhatsApp: 0723 407 849 · Engineering/WhatsApp: 0141294497",
  email: "info@dripstech.co.ke",
  emailAlt: "driptechs.info@gmail.com",
  website: "www.dripstech.co.ke",
  address: "Industrial Area, Enterprise Road · P.O. Box 10452-00100, Nairobi, Kenya",
  kraPin: "P051984721K",
  currency: "KES",
  primary: "#1b4332",
  primaryMid: "#2d6a4f",
  primaryLight: "#40916c",
  accentGold: "#c59b27",
  defaultPaymentDetails: [
    "M-PESA PAYBILL / TILL: Contact Finance Desk (0723 407 849) for Official Reference",
    "BANK TRANSFER: DripTech EcoFlow · Account Currency: KES",
    "PAYMENT REFERENCE: Please quote the Document / Invoice Number on all remittances.",
  ].join("\n"),
  defaultQuoteTerms: [
    "1. Validity: This quotation and Bill of Quantities (BOQ) remains valid for 30 days from the date of issue.",
    "2. Payment Schedule: 70% mobilization deposit upon order confirmation; 30% balance upon delivery / commissioning.",
    "3. Delivery & Lead Time: Standard stock items dispatch within 24–72 hours after deposit clearance.",
    "4. Warranty: 12-month manufacturer warranty on pumps, filters, and primary HDPE/PVC mainline fittings.",
  ].join("\n"),
  defaultInvoiceTerms: [
    "1. Payment is due strictly within the stated payment terms from the date of invoice issue.",
    "2. Title to all supplied irrigation equipment and materials remains vested in DripTech EcoFlow Ltd until paid in full.",
    "3. Please share your M-Pesa confirmation code or bank remittance advice with info@dripstech.co.ke for instant receipting.",
  ].join("\n"),
} as const;

export const LOGO_PATH = "/favicon.svg";

/** Embedded vector logo for reliable offline/print/PDF rendering. */
export const LOGO_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjIuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFiNDMzMiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMGI5NmUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgoKICA8cGF0aCBkPSJNNyAxNi4zYzIuMiAwIDQtMS44MyA0LTQuMDUgMC0xLjE2LS41Ny0yLjI2LTEuNzEtMy4xOVM3LjI5IDYuNzUgNyA1LjNjLS4yOSAxLjQ1LTEuMTQgMi44NC0yLjI5IDMuNzZTMyAxMS4xIDMgMTIuMjVjMCAyLjIyIDEuOCA0LjA1IDQgNC4wNXoiLz4KICA8cGF0aCBkPSJNMTIuNTYgNi42QTEwLjk3IDEwLjk3IDAgMCAwIDE0IDMuMDJjLjUgMi41IDIgNC45IDQgNi41czMgMy41IDMgNS41YTYuOTggNi45OCAwIDAgMS0xMS45MSA0Ljk3Ii8+Cjwvc3ZnPgo=";

export function getLogoUrl(_options?: { forPrint?: boolean }): string {
  return LOGO_DATA_URL;
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertHundreds(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
    if (n > 0) parts.push("and");
  }
  if (n >= 20) {
    const tenWord = TENS[Math.floor(n / 10)];
    const oneWord = ONES[n % 10];
    parts.push(oneWord ? `${tenWord}-${oneWord}` : tenWord);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/**
 * Converts a numeric KES amount into formal corporate words for BOQs, Invoices, and Receipts.
 * Example: 145200 -> "Kenyan Shillings One Hundred and Forty-Five Thousand Two Hundred Only"
 */
export function numberToWordsKES(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Kenyan Shillings Zero Only";
  }

  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);

  if (whole === 0) {
    return `Kenyan Shillings Zero and ${cents}/100 Only`;
  }

  const scales = ["", "Thousand", "Million", "Billion"];
  let rem = whole;
  let scaleIdx = 0;
  const chunks: string[] = [];

  while (rem > 0 && scaleIdx < scales.length) {
    const group = rem % 1000;
    if (group > 0) {
      const groupWords = convertHundreds(group);
      const scale = scales[scaleIdx];
      chunks.unshift(scale ? `${groupWords} ${scale}` : groupWords);
    }
    rem = Math.floor(rem / 1000);
    scaleIdx++;
  }

  const words = chunks.join(", ");
  if (cents > 0) {
    return `Kenyan Shillings ${words} and ${String(cents).padStart(2, "0")}/100 Only`;
  }
  return `Kenyan Shillings ${words} Only`;
}
