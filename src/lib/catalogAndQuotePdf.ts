import {
  COMPANY,
  getLogoUrl,
  numberToWordsKES,
} from "@/components/Admin/shared/companyBrand";
import {
  formatPrice,
  getCategoryTitleFromCategory,
} from "@/lib/productUrl";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { dataService } from "@/services/dataService";

export interface PdfProductItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  model_number?: string | null;
  images?: string[] | null;
  featured?: boolean | null;
  in_stock?: boolean | null;
  features?: string[] | null;
  applications?: string[] | null;
  specifications?: any | null;
  variants?: { name: string; price: number; in_stock: boolean }[] | null;
}

export interface InstantQuoteOptions {
  product: PdfProductItem;
  quantity?: number;
  selectedVariant?: { name: string; price: number; in_stock: boolean } | null;
  customerName?: string;
  customerPhone?: string;
  customerLocation?: string;
  autoPrint?: boolean;
  alsoOpenWhatsApp?: boolean;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });

const money = (value: number): string =>
  (Number.isFinite(value) ? value : 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Resolves Cloudflare R2 URLs or relative public paths into absolute URLs for the PDF window. */
const resolveImageUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://www.dripstech.co.ke";
  return trimmed.startsWith("/") ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
};

const parseJsonArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((x) => typeof x === "string");
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const generateWebQuoteNumber = (productId?: string): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = productId
    ? productId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()
    : String(Math.floor(1000 + Math.random() * 9000));
  return `DT-QTE-${y}${m}${d}-${suffix}`;
};

/**
 * Script injected into the print window that waits for all Cloudflare/product images
 * to finish loading (up to 3500ms max) before opening the browser Save-as-PDF dialog.
 */
const WAIT_FOR_IMAGES_PRINT_SCRIPT = `
<script>
  window.addEventListener("load", function () {
    var imgs = Array.prototype.slice.call(document.images || []);
    var pending = imgs.filter(function (img) { return !img.complete; });
    if (pending.length === 0) {
      setTimeout(function () { window.print(); }, 250);
      return;
    }
    var done = false;
    var trigger = function () {
      if (done) return;
      done = true;
      setTimeout(function () { window.print(); }, 250);
    };
    var remaining = pending.length;
    pending.forEach(function (img) {
      var onFinish = function () {
        remaining -= 1;
        if (remaining <= 0) trigger();
      };
      img.addEventListener("load", onFinish);
      img.addEventListener("error", onFinish);
    });
    setTimeout(trigger, 3500);
  });
</script>`;

/**
 * Renders generated HTML in the opened window, falling back to a hidden printable iframe
 * if browser popup blockers or mobile in-app webviews block window.open().
 */
const deliverPrintableHtml = (printWin: Window | null, html: string): void => {
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    return;
  }

  if (typeof document === "undefined" || !document.body) return;

  const existing = document.getElementById("dt-pdf-print-iframe");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "dt-pdf-print-iframe";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
};

/**
 * Generates and opens an Executive A4 Instant Product Quotation PDF (with Cloudflare product images)
 * and optionally launches WhatsApp with the matching Quote Reference Number.
 */
export function openInstantProductQuotePdf({
  product,
  quantity = 1,
  selectedVariant = null,
  customerName = "Valued Farm / Commercial Client",
  customerPhone = "",
  customerLocation = "Kenya",
  autoPrint = true,
  alsoOpenWhatsApp = false,
}: InstantQuoteOptions): { quoteNumber: string; whatsappUrl: string } {
  const quoteNumber = generateWebQuoteNumber(product.id);
  const issueDate = new Date();
  const validUntilDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  const hasVariants = Boolean(product.variants?.length);
  const chosenVariant =
    selectedVariant || (hasVariants ? product.variants![0] : null);
  const unitPrice = chosenVariant
    ? chosenVariant.price
    : hasVariants
      ? Math.min(...product.variants!.map((v) => v.price))
      : product.price ?? 0;

  const hasNumericPrice = typeof unitPrice === "number" && unitPrice > 0;
  const lineTotal = hasNumericPrice ? unitPrice * quantity : 0;
  const categoryLabel = getCategoryTitleFromCategory(product.category);
  const itemFullTitle = chosenVariant
    ? `${product.name} — Option: ${chosenVariant.name}`
    : product.name;

  const productImages = (product.images || [])
    .map((u) => resolveImageUrl(u))
    .filter(Boolean);
  const primaryImage = productImages[0] || getLogoUrl({ forPrint: true });
  const fallbackLogo = getLogoUrl({ forPrint: true });

  const whatsappText = [
    `Hi DripTech EcoFlow! Here is my Instant Product Quotation request:`,
    `• Quote Ref: *${quoteNumber}*`,
    `• Item: *${quantity} × ${itemFullTitle}*`,
    hasNumericPrice
      ? `• Quoted Amount: *KES ${lineTotal.toLocaleString("en-KE")}* (${formatPrice(unitPrice)} each)`
      : `• Pricing: *Please confirm current unit price*`,
    `Please confirm availability, delivery cost to my location, and payment details.`,
  ].join("\n");

  const whatsappUrl = `https://wa.me/254723407849?text=${encodeURIComponent(whatsappText)}`;

  const featureBullets = (product.features || []).filter(Boolean).slice(0, 4);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Instant Quotation ${escapeHtml(quoteNumber)} - ${escapeHtml(product.name)}</title>
  <style>
    :root {
      --primary: #12372a;
      --primary-mid: #1b4332;
      --primary-soft: #eef5f0;
      --gold: #c59b27;
      --gold-soft: #fbf7eb;
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --line-soft: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.48;
      color: var(--ink);
      background: #e2e8f0;
      padding: 16px 12px 32px;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 14px;
      background: #0f172a;
      color: #fff;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
    }
    .toolbar-title { font-size: 13px; font-weight: 700; }
    .toolbar-sub { font-size: 11px; color: #94a3b8; }
    .toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-pdf { background: var(--gold); color: #0f172a; }
    .btn-wa { background: #16a34a; color: #fff; }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 10px 35px rgba(15, 23, 42, 0.14);
      border-radius: 4px;
      overflow: hidden;
    }
    .masthead {
      background: linear-gradient(135deg, #0d281e 0%, #1b4332 65%, #2d6a4f 100%);
      color: #fff;
      padding: 24px 30px 20px;
      border-bottom: 4px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .logo-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: #fff;
      padding: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-title { font-size: 19px; font-weight: 800; color: #fff; }
    .brand-sub { font-size: 11px; color: #a7f3d0; font-weight: 600; margin-top: 2px; }
    .brand-meta { font-size: 10px; color: #cbd5e1; margin-top: 5px; line-height: 1.5; }
    .doc-box { text-align: right; flex-shrink: 0; }
    .doc-eyebrow {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #fde68a;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(253, 230, 138, 0.35);
      padding: 3px 9px;
      border-radius: 999px;
    }
    .doc-type { font-size: 20px; font-weight: 900; letter-spacing: 0.05em; color: #fff; margin-top: 5px; }
    .doc-ref {
      margin-top: 8px;
      background: rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 10px;
      text-align: left;
      min-width: 210px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 12px; padding: 1.5px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; font-variant-numeric: tabular-nums; }
    .body-wrap { padding: 22px 30px 26px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .panel { border: 1px solid var(--line); border-radius: 8px; padding: 11px 14px; background: #f8fafc; }
    .panel-head {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--primary-mid);
      border-bottom: 1px solid var(--line-soft);
      padding-bottom: 4px;
      margin-bottom: 7px;
    }
    .client-name { font-size: 13px; font-weight: 800; color: var(--ink); margin-bottom: 3px; }
    .info-line { font-size: 10.5px; color: var(--muted); line-height: 1.5; }
    table.boq { width: 100%; border-collapse: collapse; border: 1px solid var(--line); margin-top: 18px; }
    .boq th {
      background: var(--primary);
      color: #fff;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 10px;
      text-align: left;
    }
    .boq td { padding: 10px; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft); vertical-align: top; }
    .quote-img-box {
      width: 78px;
      height: 78px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #fff;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .quote-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-name { font-weight: 800; font-size: 12.5px; color: var(--ink); }
    .item-desc { color: var(--muted); font-size: 10.5px; margin-top: 4px; }
    .feature-list { margin-top: 6px; padding-left: 16px; color: var(--primary-mid); font-size: 10px; }
    .financial-footer {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 16px;
      align-items: start;
    }
    .words-box {
      border: 1px solid var(--line);
      border-left: 4px solid var(--gold);
      background: var(--gold-soft);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .words-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #92400e; }
    .words-text { font-size: 11px; font-weight: 700; color: var(--ink); margin-top: 3px; font-style: italic; }
    .remittance-box {
      margin-top: 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
      font-size: 10px;
      color: var(--muted);
      white-space: pre-line;
    }
    .remittance-box strong { color: var(--primary); font-size: 9.5px; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .totals-card { border: 1.5px solid var(--primary); border-radius: 8px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid var(--line-soft); font-size: 11px; }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 14px;
      background: var(--primary);
      color: #fff;
      font-size: 13.5px;
      font-weight: 800;
    }
    .terms-box {
      margin-top: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 10px;
      color: var(--muted);
      white-space: pre-line;
    }
    .terms-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: var(--primary); margin-bottom: 4px; }
    .signatures {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1fr 140px 1fr;
      gap: 18px;
      align-items: end;
    }
    .sig-block { border-top: 1.5px solid var(--ink); padding-top: 6px; }
    .sig-title { font-size: 10px; font-weight: 800; color: var(--ink); }
    .sig-sub { font-size: 9px; color: var(--muted); margin-top: 2px; }
    .stamp-ring {
      width: 128px;
      height: 76px;
      margin: 0 auto;
      border: 2px dashed #1b4332;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #1b4332;
      background: #f0fdf4;
      padding: 5px;
    }
    .stamp-ring strong { font-size: 9px; text-transform: uppercase; }
    .stamp-ring span { font-size: 8px; color: #15803d; margin-top: 2px; }
    .doc-footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: var(--muted);
    }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; max-width: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div>
      <div class="toolbar-title">Official DripTech Product Quotation (${escapeHtml(quoteNumber)})</div>
      <div class="toolbar-sub">Click "Save / Download as PDF" (choose "Save as PDF") or send this quote reference directly to our WhatsApp desk.</div>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-pdf" onclick="window.print()">🖨️ Save / Download as PDF</button>
      <a class="btn btn-wa" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">💬 Send Quote to WhatsApp</a>
    </div>
  </div>

  <div class="page">
    <header class="masthead">
      <div class="brand">
        <div class="logo-box">
          <img src="${getLogoUrl({ forPrint: true })}" alt="${escapeHtml(COMPANY.name)}">
        </div>
        <div>
          <div class="brand-title">${escapeHtml(COMPANY.name)}</div>
          <div class="brand-sub">${escapeHtml(COMPANY.tagline)}</div>
          <div class="brand-meta">
            ${escapeHtml(COMPANY.address)}<br>
            Tel: ${escapeHtml(COMPANY.phone)} · Email: ${escapeHtml(COMPANY.email)} · Web: ${escapeHtml(COMPANY.website)}
          </div>
        </div>
      </div>

      <div class="doc-box">
        <span class="doc-eyebrow">Official Equipment Proforma</span>
        <div class="doc-type">INSTANT QUOTE</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Quotation Ref:</span><strong>${escapeHtml(quoteNumber)}</strong></div>
          <div class="doc-ref-row"><span>Date Issued:</span><strong>${escapeHtml(formatDate(issueDate))}</strong></div>
          <div class="doc-ref-row"><span>Valid Until:</span><strong>${escapeHtml(formatDate(validUntilDate))}</strong></div>
          <div class="doc-ref-row"><span>KRA PIN:</span><strong>${escapeHtml(COMPANY.kraPin)}</strong></div>
        </div>
      </div>
    </header>

    <div class="body-wrap">
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">Prepared For (Client Details)</div>
          <div class="client-name">${escapeHtml(customerName)}</div>
          <div class="info-line"><strong>Delivery Region:</strong> ${escapeHtml(customerLocation)} (47-County Dispatch Available)</div>
          ${customerPhone ? `<div class="info-line"><strong>Contact:</strong> ${escapeHtml(customerPhone)}</div>` : ""}
          <div class="info-line"><strong>Inquiry Channel:</strong> Online Storefront Instant Quote &amp; WhatsApp Desk</div>
        </div>
        <div class="panel">
          <div class="panel-head">Equipment &amp; Order Summary</div>
          <div class="info-line"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</div>
          <div class="info-line"><strong>Model / SKU:</strong> ${escapeHtml(product.model_number || product.id.slice(0, 8).toUpperCase())}</div>
          <div class="info-line"><strong>Availability:</strong> ${product.in_stock !== false ? "In Stock — Ready for Dispatch" : "Order on Request"}</div>
          <div class="info-line"><strong>Currency:</strong> Kenya Shillings (KES)</div>
        </div>
      </div>

      <table class="boq">
        <thead>
          <tr>
            <th style="width:94px;text-align:center;">Product Photo</th>
            <th>Equipment Description &amp; Technical Specifications</th>
            <th style="width:58px;text-align:center;">Qty</th>
            <th style="width:110px;text-align:right;">Unit Price (KES)</th>
            <th style="width:118px;text-align:right;">Line Total (KES)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;">
              <div class="quote-img-box" style="margin:0 auto;">
                <img src="${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null;this.src='${fallbackLogo}';this.style.objectFit='contain';this.style.padding='12px';" />
              </div>
            </td>
            <td>
              <div class="item-name">${escapeHtml(itemFullTitle)}</div>
              <div class="item-desc">${escapeHtml(product.description || "Field-grade UV-stabilized irrigation equipment supplied by DripTech EcoFlow Ltd.")}</div>
              ${
                featureBullets.length > 0
                  ? `<ul class="feature-list">${featureBullets.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`
                  : ""
              }
            </td>
            <td style="text-align:center;font-weight:800;font-size:12px;">${escapeHtml(quantity)}</td>
            <td style="text-align:right;font-weight:700;">${hasNumericPrice ? money(unitPrice) : "On Request"}</td>
            <td style="text-align:right;font-weight:800;color:var(--primary);font-size:12.5px;">${hasNumericPrice ? money(lineTotal) : "Confirm on WhatsApp"}</td>
          </tr>
        </tbody>
      </table>

      <div class="financial-footer">
        <div>
          <div class="words-box">
            <div class="words-label">Total Quoted Amount in Words</div>
            <div class="words-text">${escapeHtml(hasNumericPrice ? numberToWordsKES(lineTotal) : "Subject to final specification confirmation")}</div>
          </div>
          <div class="remittance-box">
            <strong>Official Payment &amp; LPO Instructions</strong>${escapeHtml(COMPANY.defaultPaymentDetails)}
          </div>
        </div>

        <div class="totals-card">
          <div class="totals-row">
            <span>Equipment Subtotal</span>
            <strong>${hasNumericPrice ? `KES ${money(lineTotal)}` : "On Request"}</strong>
          </div>
          <div class="totals-row">
            <span>County Delivery / Transport</span>
            <strong>Calculated by Destination</strong>
          </div>
          <div class="totals-grand">
            <span>TOTAL QUOTED</span>
            <span>${hasNumericPrice ? `KES ${money(lineTotal)}` : "On Request"}</span>
          </div>
        </div>
      </div>

      <div class="terms-box">
        <div class="terms-title">Commercial Terms, Delivery &amp; Engineering Support</div>
        ${escapeHtml(COMPANY.defaultQuoteTerms)}
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-title">Issued By: ${escapeHtml(COMPANY.name)}</div>
          <div class="sig-sub">Sales &amp; Irrigation Engineering Desk · ${escapeHtml(COMPANY.phone)}</div>
        </div>
        <div class="stamp-ring">
          <strong>${escapeHtml(COMPANY.name)}</strong>
          <span>VERIFIED WEB QUOTE</span>
          <span>${escapeHtml(quoteNumber)}</span>
        </div>
        <div class="sig-block">
          <div class="sig-title">Client Confirmation</div>
          <div class="sig-sub">Share Quote Ref ${escapeHtml(quoteNumber)} on WhatsApp or Email to confirm order</div>
        </div>
      </div>

      <footer class="doc-footer">
        <span><strong>${escapeHtml(COMPANY.name)}</strong> · ${escapeHtml(COMPANY.website)}</span>
        <span>Quote Ref: ${escapeHtml(quoteNumber)} · Instant Proforma Generator</span>
      </footer>
    </div>
  </div>
  ${autoPrint ? WAIT_FOR_IMAGES_PRINT_SCRIPT : ""}
</body>
</html>`;

  const printWin = window.open("", "_blank");
  deliverPrintableHtml(printWin, html);

  if (alsoOpenWhatsApp) {
    openTrackedWhatsApp(whatsappUrl, "instant pdf quote + whatsapp");
  }

  return { quoteNumber, whatsappUrl };
}

export type CataloguePdfMode = "executive" | "category" | "compact-full";

export interface CataloguePdfOptions {
  products?: PdfProductItem[];
  title?: string;
  categoryKey?: string;
  categoryLabel?: string;
  mode?: CataloguePdfMode;
  maxPerCategory?: number;
  includeImages?: boolean;
  alsoOpenWhatsApp?: boolean;
  autoPrint?: boolean;
  categoryCounts?: Record<string, number>;
}

const CATALOGUE_CATEGORY_ORDER = [
  "drip_irrigation",
  "sprinkler_systems",
  "pumps_motors",
  "filtration_systems",
  "fertigation_systems",
  "greenhouse_systems",
  "emitters_drippers",
  "valves_regulators",
  "control_systems",
  "pipes_fittings",
  "borehole_equipment",
  "filters_strainers",
  "controllers_timers",
  "accessories",
] as const;

const scoreProductImportance = (item: PdfProductItem): number => {
  let score = 0;
  if (item.featured) score += 100;
  if (item.in_stock !== false) score += 50;
  const hasPrice =
    (typeof item.price === "number" && item.price > 0) ||
    Boolean(item.variants?.some((v) => v.price > 0));
  if (hasPrice) score += 30;
  if (item.features?.length) score += 10;
  if (item.images?.length) score += 5;
  return score;
};

const getOrderedCategoryKeys = (keys: Iterable<string>): string[] => {
  const rank = new Map<string, number>(
    CATALOGUE_CATEGORY_ORDER.map((k, idx) => [k, idx]),
  );
  return Array.from(new Set(keys)).sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999),
  );
};

/**
 * Generates and opens a lightweight, fast-printing Executive A4 Company Profile & Product Catalogue PDF.
 * Defaults to a curated Key Highlights edition (~5-7 pages, no heavy image bloat) unless a specific
 * category or compact full SKU ledger is requested.
 */
export async function openProductCataloguePdf(
  options: CataloguePdfOptions,
): Promise<void>;
export async function openProductCataloguePdf(
  initialProducts?: PdfProductItem[],
  categoryScopeLabel?: string,
  alsoOpenWhatsApp?: boolean,
): Promise<void>;
export async function openProductCataloguePdf(
  arg1: PdfProductItem[] | CataloguePdfOptions = [],
  categoryScopeLabel = "Key Irrigation Equipment & Kits Catalogue",
  alsoOpenWhatsAppArg = false,
): Promise<void> {
  const opts: CataloguePdfOptions = Array.isArray(arg1)
    ? {
        products: arg1,
        title: categoryScopeLabel,
        alsoOpenWhatsApp: alsoOpenWhatsAppArg,
      }
    : arg1 || {};

  const initialProducts = Array.isArray(opts.products) ? opts.products : [];
  const rawCategoryKey = (opts.categoryKey || "all").trim();
  const inferredMode: CataloguePdfMode =
    opts.mode ||
    (rawCategoryKey && rawCategoryKey !== "all" ? "category" : "executive");
  const maxPerCategory = Math.max(2, opts.maxPerCategory ?? 4);
  const alsoOpenWhatsApp = Boolean(opts.alsoOpenWhatsApp);
  const scopeLabel =
    opts.title ||
    (inferredMode === "category" && opts.categoryLabel
      ? `${opts.categoryLabel} Catalogue`
      : inferredMode === "compact-full"
        ? "Complete Stocked SKU Price List (Compact Ledger)"
        : "Key Irrigation Equipment & Engineering Catalogue");

  const issueDate = new Date();
  const catalogueRef = `DT-CAT-${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
  const fallbackLogo = getLogoUrl({ forPrint: true });

  // Open window synchronously so popup blockers never block it
  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preparing ${escapeHtml(COMPANY.name)} Catalogue...</title></head><body style="font-family:system-ui,sans-serif;background:#0d281e;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;max-width:440px;padding:24px;"><div style="font-size:18px;font-weight:800;color:#fde68a;margin-bottom:8px;">Compiling Light PDF Catalogue...</div><div style="font-size:13px;color:#cbd5e1;">Organizing ${escapeHtml(scopeLabel)} for ${escapeHtml(COMPANY.name)}.</div></div></body></html>`,
    );
    printWin.document.close();
  }

  // Load only the scope actually needed instead of unconditionally dumping 575+ heavy records
  let loadedProducts: PdfProductItem[] = [...initialProducts];
  const categoryCountMap: Record<string, number> = {
    ...(opts.categoryCounts || {}),
  };
  let kitsList: any[] = [];

  try {
    const needsCounts =
      Object.keys(categoryCountMap).length === 0 && inferredMode !== "category";
    const needsKits = inferredMode !== "category";
    const needsCategoryFetch =
      inferredMode === "category" &&
      rawCategoryKey !== "all" &&
      initialProducts.filter((p) => p.category === rawCategoryKey).length <
        (categoryCountMap[rawCategoryKey] || 9999);
    const needsStoreFetch =
      (inferredMode === "compact-full" && initialProducts.length < 250) ||
      (inferredMode === "executive" && initialProducts.length < 40);

    const [fetchedCounts, fetchedKits, fetchedScopeProducts] = await Promise.all([
      needsCounts ? dataService.getProductCategoryCounts().catch(() => []) : Promise.resolve(null),
      needsKits ? dataService.getIrrigationKits().catch(() => []) : Promise.resolve([]),
      needsCategoryFetch
        ? dataService.getProducts({ category: rawCategoryKey, limit: 500 }).catch(() => [])
        : needsStoreFetch
          ? dataService.getProducts({ limit: 500 }).catch(() => [])
          : Promise.resolve(null),
    ]);

    if (Array.isArray(fetchedCounts)) {
      fetchedCounts.forEach((row: { category: string; count: number }) => {
        if (row?.category) {
          categoryCountMap[row.category] = Number(row.count || 0);
        }
      });
    }
    if (Array.isArray(fetchedKits)) {
      kitsList = fetchedKits;
    }
    if (Array.isArray(fetchedScopeProducts) && fetchedScopeProducts.length > 0) {
      const mergedMap = new Map<string, PdfProductItem>();
      [...loadedProducts, ...fetchedScopeProducts].forEach((p: any) => {
        if (p?.id) mergedMap.set(p.id, p);
      });
      loadedProducts = Array.from(mergedMap.values());
    }
  } catch (err) {
    console.warn("Using loaded products for lightweight PDF catalogue:", err);
  }

  // Restrict to single category when requested
  if (inferredMode === "category" && rawCategoryKey !== "all") {
    loadedProducts = loadedProducts.filter((p) => p.category === rawCategoryKey);
  }

  // Group products by raw category key in consistent order
  const rawGrouped = new Map<string, PdfProductItem[]>();
  for (const product of loadedProducts) {
    const key = product.category || "accessories";
    const list = rawGrouped.get(key) || [];
    list.push(product);
    rawGrouped.set(key, list);
  }

  const orderedKeys = getOrderedCategoryKeys([
    ...rawGrouped.keys(),
    ...(inferredMode === "executive" ? Object.keys(categoryCountMap) : []),
  ]);

  // Build selected sections (full list for category/compact-full, curated priority items for executive)
  const sections = orderedKeys
    .map((key) => {
      const rawItems = rawGrouped.get(key) || [];
      const sorted = [...rawItems].sort(
        (a, b) => scoreProductImportance(b) - scoreProductImportance(a),
      );
      const totalInCategory = Math.max(
        categoryCountMap[key] || 0,
        sorted.length,
      );
      const shownItems =
        inferredMode === "executive" ? sorted.slice(0, maxPerCategory) : sorted;
      return {
        key,
        label: getCategoryTitleFromCategory(key),
        items: shownItems,
        allLoadedItems: sorted,
        totalInCategory,
      };
    })
    .filter((section) => section.items.length > 0 || section.totalInCategory > 0);

  const displayedCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const totalStoreCount = Math.max(
    Object.values(categoryCountMap).reduce((sum, n) => sum + n, 0),
    loadedProducts.length,
  );

  // Only include product photos when explicitly opted in AND <= 25 items so PDF stays fast and compact
  const showPhotos =
    Boolean(opts.includeImages) &&
    displayedCount > 0 &&
    displayedCount <= 25 &&
    inferredMode !== "compact-full";
  const isDenseLedger = inferredMode === "compact-full" || displayedCount > 45;

  const editionBadge =
    inferredMode === "category"
      ? `${opts.categoryLabel || getCategoryTitleFromCategory(rawCategoryKey)} Edition`
      : inferredMode === "compact-full"
        ? "Compact Master Price Ledger"
        : "Executive Highlights Edition";

  const whatsappCatalogMsg = [
    `Hi DripTech EcoFlow! I just viewed your *${scopeLabel}* (Ref: *${catalogueRef}* — ${displayedCount} listed items${kitsList.length ? ` & ${kitsList.length} complete kits` : ""}).`,
    `Please share current bulk discounts or prepare a custom BOQ quotation for my farm.`,
  ].join("\n");
  const whatsappUrl = `https://wa.me/254723407849?text=${encodeURIComponent(whatsappCatalogMsg)}`;

  const summaryRows = sections
    .map((sec, idx) => {
      const prices = sec.allLoadedItems
        .map((p) => {
          if (p.variants?.length) {
            return Math.min(...p.variants.map((v) => v.price));
          }
          return p.price ?? 0;
        })
        .filter((val) => val > 0);
      const minPrice = prices.length
        ? `From KES ${money(Math.min(...prices))}`
        : "Price on Request";
      return `
        <tr>
          <td style="text-align:center;font-weight:800;color:#1b4332;">SEC-${String(idx + 1).padStart(2, "0")}</td>
          <td><strong>${escapeHtml(sec.label)}</strong></td>
          <td style="text-align:center;font-weight:700;">${sec.totalInCategory} SKUs${inferredMode === "executive" ? ` <span style="color:#64748b;font-weight:500;">(${sec.items.length} highlighted)</span>` : ""}</td>
          <td style="text-align:right;font-weight:800;color:#1b4332;">${minPrice}</td>
        </tr>`;
    })
    .join("");

  const kitsSectionHtml =
    kitsList.length > 0 && inferredMode !== "category"
      ? `
        <section class="cat-section">
          <div class="cat-banner" style="background:linear-gradient(90deg,#12372a,#1b4332);color:#fff;border-color:#c59b27;">
            <span>COMPLETE ACREAGE IRRIGATION KITS (READY-TO-INSTALL FARM PACKAGES)</span>
            <span style="color:#fde68a;">${kitsList.length} Complete Packages</span>
          </div>
          <table class="cat-table">
            <thead>
              <tr>
                <th style="width:44px;text-align:center;">Kit</th>
                <th>Kit Name &amp; Plot Application</th>
                <th style="width:92px;text-align:center;">Coverage</th>
                <th style="width:125px;text-align:right;">Package Price (KES)</th>
              </tr>
            </thead>
            <tbody>
              ${kitsList
                .map((kit: any, idx: number) => {
                  const coverage = kit.coverage_area
                    ? `${kit.coverage_area} Acre(s)`
                    : "Custom Plot";
                  const priceStr =
                    typeof kit.price === "number" && kit.price > 0
                      ? `KES ${money(kit.price)}`
                      : "On Request";
                  return `
                    <tr>
                      <td style="text-align:center;font-weight:800;color:#1b4332;vertical-align:middle;">K-${String(idx + 1).padStart(2, "0")}</td>
                      <td>
                        <div style="font-weight:800;color:#0f172a;font-size:11px;">${escapeHtml(kit.name)}</div>
                        ${kit.description ? `<div style="color:#475569;font-size:9.5px;margin-top:2px;">${escapeHtml(String(kit.description).slice(0, 140))}${String(kit.description).length > 140 ? "..." : ""}</div>` : ""}
                      </td>
                      <td style="text-align:center;font-weight:700;font-size:10px;color:#1b4332;vertical-align:middle;">${escapeHtml(coverage)}</td>
                      <td style="text-align:right;font-weight:800;color:#0f172a;white-space:nowrap;vertical-align:middle;">${escapeHtml(priceStr)}</td>
                    </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </section>`
      : "";

  const categorySectionsHtml = sections
    .filter((sec) => sec.items.length > 0)
    .map((sec, catIdx) => {
      const rows = sec.items
        .map((item, idx) => {
          const hasVariants = Boolean(item.variants?.length);
          const displayPrice = hasVariants
            ? Math.min(...item.variants!.map((v) => v.price))
            : item.price;
          const priceStr =
            typeof displayPrice === "number" && displayPrice > 0
              ? `${hasVariants ? "From " : ""}KES ${money(displayPrice)}`
              : "On Request";
          const variantSummary = hasVariants
            ? `Options (${item.variants!.length}): ${item.variants!
                .slice(0, 4)
                .map((v) => `${v.name} (KES ${v.price.toLocaleString()})`)
                .join(" · ")}`
            : "";
          const featuresLine =
            !isDenseLedger && item.features && item.features.length > 0
              ? item.features.filter(Boolean).slice(0, 2).join(" • ")
              : "";
          const cleanDesc =
            !isDenseLedger && item.description
              ? item.description.replace(/\s+/g, " ").trim()
              : "";

          const photoCell = showPhotos
            ? (() => {
                const imgUrl = resolveImageUrl(item.images?.[0]) || fallbackLogo;
                const isFallback = !item.images?.[0];
                return `
                  <td style="text-align:center;vertical-align:middle;padding:5px;">
                    <div class="cat-thumb">
                      <img
                        src="${escapeHtml(imgUrl)}"
                        alt="${escapeHtml(item.name)}"
                        style="${isFallback ? "object-fit:contain;padding:8px;" : "object-fit:cover;"}"
                        onerror="this.onerror=null;this.src='${fallbackLogo}';this.style.objectFit='contain';this.style.padding='8px';"
                      />
                    </div>
                  </td>`;
              })()
            : "";

          return `
            <tr>
              <td style="text-align:center;font-weight:700;color:#64748b;vertical-align:middle;${isDenseLedger ? "padding:4px 6px;font-size:9.5px;" : ""}">${catIdx + 1}.${String(idx + 1).padStart(2, "0")}</td>
              ${photoCell}
              <td style="${isDenseLedger ? "padding:4px 7px;" : ""}">
                <div style="font-weight:800;color:#0f172a;font-size:${isDenseLedger ? "10px" : "11px"};">${escapeHtml(item.name)}${item.featured ? ' <span style="display:inline-block;margin-left:4px;padding:1px 5px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:8px;font-weight:800;vertical-align:middle;">KEY</span>' : ""}</div>
                ${cleanDesc ? `<div style="color:#475569;font-size:9.5px;margin-top:2px;">${escapeHtml(cleanDesc.slice(0, 115))}${cleanDesc.length > 115 ? "..." : ""}</div>` : ""}
                ${featuresLine ? `<div style="color:#0f172a;font-size:9px;font-weight:600;margin-top:2px;">${escapeHtml(featuresLine)}</div>` : ""}
                ${variantSummary ? `<div style="color:#1b4332;font-size:9px;font-weight:700;margin-top:2px;">${escapeHtml(variantSummary)}</div>` : ""}
              </td>
              <td style="text-align:center;font-family:monospace;font-size:9.5px;color:#475569;vertical-align:middle;${isDenseLedger ? "padding:4px 6px;" : ""}">${escapeHtml(item.model_number || item.id.slice(0, 8).toUpperCase())}</td>
              <td style="text-align:center;font-size:9.5px;font-weight:700;vertical-align:middle;color:${item.in_stock !== false ? "#15803d" : "#b45309"};${isDenseLedger ? "padding:4px 6px;" : ""}">
                ${item.in_stock !== false ? "In Stock" : "On Order"}
              </td>
              <td style="text-align:right;font-weight:800;color:#0f172a;white-space:nowrap;vertical-align:middle;${isDenseLedger ? "padding:4px 7px;font-size:10px;" : ""}">${escapeHtml(priceStr)}</td>
            </tr>`;
        })
        .join("");

      const bannerCountText =
        inferredMode === "executive" && sec.totalInCategory > sec.items.length
          ? `Top ${sec.items.length} of ${sec.totalInCategory} SKUs shown`
          : `${sec.items.length} ${sec.items.length === 1 ? "Product" : "Products"}`;

      return `
        <section class="cat-section">
          <div class="cat-banner">
            <span>SECTION ${String(catIdx + 1).padStart(2, "0")}: ${escapeHtml(sec.label.toUpperCase())}</span>
            <span>${escapeHtml(bannerCountText)}</span>
          </div>
          <table class="cat-table">
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">Code</th>
                ${showPhotos ? '<th style="width:68px;text-align:center;">Photo</th>' : ""}
                <th>Product Name${isDenseLedger ? " &amp; Available Sizes" : ", Key Specs &amp; Available Options"}</th>
                <th style="width:76px;text-align:center;">SKU</th>
                <th style="width:66px;text-align:center;">Stock</th>
                <th style="width:116px;text-align:right;">Unit Price (KES)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${
            inferredMode === "executive" && sec.totalInCategory > sec.items.length
              ? `<p style="margin-top:4px;font-size:9px;color:#64748b;text-align:right;">Showing ${sec.items.length} fast-moving items out of ${sec.totalInCategory} stocked in ${escapeHtml(sec.label)}. Download the Category PDF or visit ${escapeHtml(COMPANY.website)}/products for all ${sec.totalInCategory} SKUs.</p>`
              : ""
          }
        </section>`;
    })
    .join("");

  const profileHtml =
    inferredMode === "category"
      ? `
      <div class="profile-card">
        <div class="profile-header">
          <h2>${escapeHtml(COMPANY.name)} — ${escapeHtml(scopeLabel)}</h2>
          <span>47 Counties Delivery · LPO &amp; M-Pesa</span>
        </div>
        <div class="profile-body" style="padding:10px 14px;">
          <p class="profile-lead" style="margin-bottom:0;">
            Genuine UV-stabilized equipment with same-day BOQs, hydraulic design, and certified installation across Kenya. Call/WhatsApp <strong>${escapeHtml(COMPANY.phone)}</strong> for volume discounts or project quotations.
          </p>
        </div>
      </div>`
      : `
      <!-- Executive Company Profile: Who We Are & What We Do -->
      <div class="profile-card">
        <div class="profile-header">
          <h2>About ${escapeHtml(COMPANY.name)} — What We Do as a Company</h2>
          <span>Serving All 47 Counties in Kenya</span>
        </div>
        <div class="profile-body">
          <p class="profile-lead">
            <strong>${escapeHtml(COMPANY.name)}</strong> is Kenya's trusted irrigation engineering, water harvesting, and agricultural infrastructure partner. We combine <strong>agronomic &amp; hydraulic system design</strong>, <strong>direct supply of genuine UV-stabilized equipment</strong>, and <strong>certified on-farm installation</strong> for smallholder farmers, commercial estates, greenhouses, NGOs, and government water projects.
          </p>
          <div class="divisions-grid">
            <div class="division-box">
              <strong>1. Drip &amp; Sprinkler Irrigation</strong>
              <p>Complete ¼-acre to 50+ acre systems, 15cm/20cm/30cm driplines, rain guns, pop-up sprinklers &amp; HDPE/PVC mainlines.</p>
            </div>
            <div class="division-box">
              <strong>2. HDPE Dam Liners &amp; Welding</strong>
              <p>Supply and on-site hot-wedge welding of 0.5mm, 0.75mm &amp; 1.0mm virgin UV-stabilized geomembrane dam liners.</p>
            </div>
            <div class="division-box">
              <strong>3. Greenhouses &amp; Shade Houses</strong>
              <p>Galvanized steel &amp; timber greenhouses (8×15m to multi-span), UV polythene, insect/shade nets &amp; misting setups.</p>
            </div>
            <div class="division-box">
              <strong>4. Solar Borehole &amp; Water Pumping</strong>
              <p>Total Dynamic Head (TDH) pump sizing, submersible/surface solar pumps, PV arrays, controllers &amp; raised tanks.</p>
            </div>
            <div class="division-box">
              <strong>5. Filtration, Fertigation &amp; Valves</strong>
              <p>Screen &amp; disc filters, Venturi fertilizer injectors, pressure regulators, air release valves &amp; smart timers.</p>
            </div>
            <div class="division-box">
              <strong>6. Survey, BOQ Design &amp; Installation</strong>
              <p>On-farm GPS site surveys, bank/LPO-ready Bills of Quantities (BOQ), trenching, commissioning &amp; staff training.</p>
            </div>
          </div>
        </div>
      </div>`;

  const directoryHtml =
    inferredMode === "category"
      ? ""
      : `
      <section>
        <div class="cat-banner">
          <span>EXECUTIVE EQUIPMENT DIRECTORY — ALL ${totalStoreCount} STOCKED SKUS</span>
          <span>${sections.length} Categories · Showing ${displayedCount} ${inferredMode === "executive" ? "Priority Items" : "Items"}</span>
        </div>
        <table class="cat-table">
          <thead>
            <tr>
              <th style="width:64px;text-align:center;">Section</th>
              <th>Equipment Category / Division</th>
              <th style="width:170px;text-align:center;">Catalogue Coverage</th>
              <th style="width:150px;text-align:right;">Starting Price Range</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </section>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(scopeLabel)} (${escapeHtml(catalogueRef)}) - ${escapeHtml(COMPANY.name)}</title>
  <style>
    :root {
      --primary: #12372a;
      --primary-mid: #1b4332;
      --primary-soft: #eef5f0;
      --gold: #c59b27;
      --gold-soft: #fbf7eb;
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --line-soft: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.42;
      color: var(--ink);
      background: #e2e8f0;
      padding: 16px 12px 32px;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 14px;
      background: #0f172a;
      color: #fff;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-pdf { background: var(--gold); color: #0f172a; }
    .btn-wa { background: #16a34a; color: #fff; }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 10px 35px rgba(15, 23, 42, 0.14);
      border-radius: 4px;
      overflow: hidden;
    }
    .masthead {
      background: linear-gradient(135deg, #0d281e 0%, #1b4332 62%, #2d6a4f 100%);
      color: #fff;
      padding: 24px 28px 20px;
      border-bottom: 5px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .logo-box {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #fff;
      padding: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.22);
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-title { font-size: 21px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
    .brand-sub { font-size: 11px; color: #a7f3d0; font-weight: 700; margin-top: 2px; }
    .brand-meta { font-size: 10px; color: #cbd5e1; margin-top: 5px; line-height: 1.5; }
    .doc-box { text-align: right; flex-shrink: 0; }
    .doc-eyebrow {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #fde68a;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(253, 230, 138, 0.35);
      padding: 3px 9px;
      border-radius: 999px;
    }
    .doc-type { font-size: 19px; font-weight: 900; letter-spacing: 0.04em; color: #fff; margin-top: 6px; }
    .doc-ref {
      margin-top: 8px;
      background: rgba(15, 23, 42, 0.38);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 10px;
      text-align: left;
      min-width: 215px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 12px; padding: 1.5px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; }
    .body-wrap { padding: 20px 26px 26px; }

    .profile-card {
      border: 1.5px solid var(--primary);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 16px;
      background: #fff;
    }
    .profile-header {
      background: var(--primary);
      color: #fff;
      padding: 9px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .profile-header h2 {
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fde68a;
    }
    .profile-header span {
      font-size: 10px;
      font-weight: 700;
      color: #a7f3d0;
    }
    .profile-body { padding: 12px 14px; }
    .profile-lead {
      font-size: 11px;
      line-height: 1.5;
      color: var(--ink);
      margin-bottom: 10px;
    }
    .divisions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .division-box {
      border: 1px solid var(--line);
      border-left: 3.5px solid var(--gold);
      background: #f8fafc;
      border-radius: 6px;
      padding: 7px 9px;
    }
    .division-box strong {
      display: block;
      font-size: 10px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 2px;
    }
    .division-box p {
      font-size: 9px;
      line-height: 1.38;
      color: var(--muted);
    }

    .cat-section { margin-top: 16px; }
    .cat-banner {
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid #a7f3d0;
      border-left: 4px solid var(--primary);
      padding: 6px 11px;
      font-weight: 800;
      font-size: 10.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.cat-table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); margin-top: 5px; }
    .cat-table thead { display: table-header-group; }
    .cat-table th {
      background: var(--primary);
      color: #fff;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 6px 8px;
      text-align: left;
    }
    .cat-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--line-soft);
      border-right: 1px solid var(--line-soft);
      vertical-align: top;
    }
    .cat-table tbody tr { break-inside: avoid; page-break-inside: avoid; }
    .cat-table tbody tr:nth-child(even) td { background: #f8fafc; }
    .cat-thumb {
      width: 54px;
      height: 44px;
      margin: 0 auto;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: #fff;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cat-thumb img { width: 100%; height: 100%; display: block; }
    .ordering-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .order-box {
      border: 1.5px solid var(--primary);
      border-radius: 8px;
      padding: 11px 13px;
      background: var(--primary-soft);
    }
    .order-box h3 {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
      margin-bottom: 5px;
    }
    .order-box p {
      font-size: 9.5px;
      color: var(--ink);
      line-height: 1.48;
      white-space: pre-line;
    }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; max-width: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div>
      <div style="font-size:13px;font-weight:700;">${escapeHtml(COMPANY.name)} — ${escapeHtml(scopeLabel)} (${escapeHtml(catalogueRef)})</div>
      <div style="font-size:11px;color:#94a3b8;">${escapeHtml(editionBadge)} · ${displayedCount} listed items${kitsList.length ? ` &amp; ${kitsList.length} complete farm kits` : ""}${showPhotos ? " (with thumbnails)" : " (fast text-light PDF)"}.</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-pdf" onclick="window.print()">🖨️ Save / Download PDF</button>
      <a class="btn btn-wa" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">💬 Request Bulk Quote on WhatsApp</a>
    </div>
  </div>

  <div class="page">
    <header class="masthead">
      <div class="brand">
        <div class="logo-box">
          <img src="${getLogoUrl({ forPrint: true })}" alt="${escapeHtml(COMPANY.name)}">
        </div>
        <div>
          <div class="brand-title">${escapeHtml(COMPANY.name)}</div>
          <div class="brand-sub">${escapeHtml(COMPANY.tagline)}</div>
          <div class="brand-meta">
            ${escapeHtml(COMPANY.address)}<br>
            Tel: ${escapeHtml(COMPANY.phone)} · Email: ${escapeHtml(COMPANY.email)} · Web: ${escapeHtml(COMPANY.website)}
          </div>
        </div>
      </div>

      <div class="doc-box">
        <span class="doc-eyebrow">${escapeHtml(editionBadge)}</span>
        <div class="doc-type">${inferredMode === "category" ? "CATEGORY PRICE LIST" : "PRODUCT CATALOGUE"}</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Catalogue Ref:</span><strong>${escapeHtml(catalogueRef)}</strong></div>
          <div class="doc-ref-row"><span>Date Issued:</span><strong>${escapeHtml(formatDate(issueDate))}</strong></div>
          <div class="doc-ref-row"><span>Items Included:</span><strong>${displayedCount}${kitsList.length ? ` + ${kitsList.length} Kits` : ""}</strong></div>
          <div class="doc-ref-row"><span>KRA PIN:</span><strong>${escapeHtml(COMPANY.kraPin)}</strong></div>
        </div>
      </div>
    </header>

    <div class="body-wrap">
      ${profileHtml}
      ${directoryHtml}
      ${kitsSectionHtml}
      ${categorySectionsHtml}

      <div class="ordering-grid">
        <div class="order-box">
          <h3>How to Order, Request a Custom BOQ, or Book Installation</h3>
          <p>1. <strong>Instant Order / Quote:</strong> Share the Item Code or Product Name via WhatsApp to <strong>${escapeHtml(COMPANY.phone)}</strong> or email <strong>${escapeHtml(COMPANY.email)}</strong>.
2. <strong>Corporate &amp; NGO Procurement:</strong> We issue official Proforma Invoices, itemized BOQs, and accept LPOs, Bank Transfers, and M-Pesa.
3. <strong>Nationwide Dispatch &amp; Field Installation:</strong> Same-day/next-day dispatch from our Nairobi Industrial Area hub to all 47 counties.</p>
        </div>
        <div class="order-box" style="background:var(--gold-soft);border-color:var(--gold);">
          <h3 style="color:#92400e;">Official Payment &amp; Contact Desk</h3>
          <p>${escapeHtml(COMPANY.defaultPaymentDetails)}
Tel: <strong>${escapeHtml(COMPANY.phone)}</strong>
Web: <strong>${escapeHtml(COMPANY.website)}</strong></p>
        </div>
      </div>
    </div>
  </div>
  ${
    (opts.autoPrint ??
    !(
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("no-print")
    ))
      ? WAIT_FOR_IMAGES_PRINT_SCRIPT
      : ""
  }
</body>
</html>`;

  deliverPrintableHtml(printWin, html);

  if (alsoOpenWhatsApp) {
    openTrackedWhatsApp(whatsappUrl, "catalogue pdf + whatsapp");
  }
}
