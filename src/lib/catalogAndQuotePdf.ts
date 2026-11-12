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
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }

  if (alsoOpenWhatsApp) {
    openTrackedWhatsApp(whatsappUrl, "instant pdf quote + whatsapp");
  }

  return { quoteNumber, whatsappUrl };
}

/**
 * Generates and opens an Executive Multi-Category A4 Company Profile & Illustrated Master Product Catalogue PDF.
 * Automatically fetches ALL products and ALL irrigation kits from the database so the catalogue is 100% complete.
 */
export async function openProductCataloguePdf(
  initialProducts: PdfProductItem[] = [],
  categoryScopeLabel = "Master Irrigation Equipment & Engineering Catalogue",
  alsoOpenWhatsApp = false,
): Promise<void> {
  const issueDate = new Date();
  const catalogueRef = `DT-CAT-${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
  const fallbackLogo = getLogoUrl({ forPrint: true });

  // Open window synchronously so popup blockers never block it
  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preparing ${escapeHtml(COMPANY.name)} Catalogue...</title></head><body style="font-family:system-ui,sans-serif;background:#0d281e;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;max-width:440px;padding:24px;"><div style="font-size:18px;font-weight:800;color:#fde68a;margin-bottom:8px;">Compiling Full Illustrated Product Catalogue...</div><div style="font-size:13px;color:#cbd5e1;">Loading all products, Cloudflare images, and irrigation kits for ${escapeHtml(COMPANY.name)}.</div></div></body></html>`);
    printWin.document.close();
  }

  // Fetch the ENTIRE product catalogue and irrigation kits from dataService so nothing is missing
  let fullProducts: PdfProductItem[] = [...initialProducts];
  let kitsList: any[] = [];
  try {
    const [fetchedProducts, fetchedKits] = await Promise.all([
      dataService.getProducts({ limit: 500 }),
      dataService.getIrrigationKits().catch(() => []),
    ]);
    if (Array.isArray(fetchedProducts) && fetchedProducts.length > fullProducts.length) {
      fullProducts = fetchedProducts;
    } else if (Array.isArray(fetchedProducts) && fetchedProducts.length > 0) {
      const map = new Map<string, PdfProductItem>();
      [...fullProducts, ...fetchedProducts].forEach((p: any) => {
        if (p && p.id) map.set(p.id, p);
      });
      fullProducts = Array.from(map.values());
    }
    if (Array.isArray(fetchedKits)) {
      kitsList = fetchedKits;
    }
  } catch (err) {
    console.warn("Using currently loaded products for PDF catalogue:", err);
  }

  // Group products by category
  const grouped = new Map<string, PdfProductItem[]>();
  for (const product of fullProducts) {
    const label = getCategoryTitleFromCategory(product.category || "accessories");
    const list = grouped.get(label) || [];
    list.push(product);
    grouped.set(label, list);
  }

  const categoryEntries = Array.from(grouped.entries());

  const whatsappCatalogMsg = [
    `Hi DripTech EcoFlow! I have downloaded your *${categoryScopeLabel}* (Ref: *${catalogueRef}* with ${fullProducts.length} products & ${kitsList.length} complete kits).`,
    `Please share current bulk discounts or assist me with a custom BOQ quotation for my farm.`,
  ].join("\n");
  const whatsappUrl = `https://wa.me/254723407849?text=${encodeURIComponent(whatsappCatalogMsg)}`;

  const summaryRows = categoryEntries
    .map(([catName, items], idx) => {
      const prices = items
        .map((p) => {
          if (p.variants?.length) {
            return Math.min(...p.variants.map((v) => v.price));
          }
          return p.price ?? 0;
        })
        .filter((val) => val > 0);
      const minPrice = prices.length ? `From KES ${money(Math.min(...prices))}` : "Price on Request";
      return `
        <tr>
          <td style="text-align:center;font-weight:800;color:#1b4332;">SEC-${String(idx + 1).padStart(2, "0")}</td>
          <td><strong>${escapeHtml(catName)}</strong></td>
          <td style="text-align:center;font-weight:700;">${items.length} Items</td>
          <td style="text-align:right;font-weight:800;color:#1b4332;">${minPrice}</td>
        </tr>`;
    })
    .join("");

  const kitsSectionHtml =
    kitsList.length > 0
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
                <th style="width:74px;text-align:center;">Photo</th>
                <th>Kit Name, Target Acreage &amp; Included Components</th>
                <th style="width:90px;text-align:center;">Coverage</th>
                <th style="width:125px;text-align:right;">Package Price (KES)</th>
              </tr>
            </thead>
            <tbody>
              ${kitsList
                .map((kit: any, idx: number) => {
                  const imgs = parseJsonArray(kit.images);
                  const imgUrl = resolveImageUrl(imgs[0]) || fallbackLogo;
                  const isFallback = !imgs[0];
                  const coverage = kit.coverage_area ? `${kit.coverage_area} Acre(s)` : "Custom Plot";
                  const priceStr =
                    typeof kit.price === "number" && kit.price > 0
                      ? `KES ${money(kit.price)}`
                      : "On Request";
                  return `
                    <tr>
                      <td style="text-align:center;font-weight:800;color:#1b4332;vertical-align:middle;">K-${String(idx + 1).padStart(2, "0")}</td>
                      <td style="text-align:center;vertical-align:middle;padding:6px;">
                        <div class="cat-thumb">
                          <img
                            src="${escapeHtml(imgUrl)}"
                            alt="${escapeHtml(kit.name)}"
                            style="${isFallback ? "object-fit:contain;padding:8px;" : "object-fit:cover;"}"
                            onerror="this.onerror=null;this.src='${fallbackLogo}';this.style.objectFit='contain';this.style.padding='8px';"
                          />
                        </div>
                      </td>
                      <td>
                        <div style="font-weight:800;color:#0f172a;font-size:11.5px;">${escapeHtml(kit.name)}</div>
                        ${kit.description ? `<div style="color:#475569;font-size:10px;margin-top:2px;">${escapeHtml(kit.description)}</div>` : ""}
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

  const categorySectionsHtml = categoryEntries
    .map(([catName, items], catIdx) => {
      const rows = items
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
                .slice(0, 5)
                .map((v) => `${v.name} (KES ${v.price.toLocaleString()})`)
                .join(" · ")}`
            : "";
          const featuresLine =
            item.features && item.features.length > 0
              ? `Key Specs: ${item.features.filter(Boolean).slice(0, 3).join(" • ")}`
              : "";

          const imgUrl = resolveImageUrl(item.images?.[0]) || fallbackLogo;
          const isFallback = !item.images?.[0];

          return `
            <tr>
              <td style="text-align:center;font-weight:700;color:#64748b;vertical-align:middle;">${catIdx + 1}.${String(idx + 1).padStart(2, "0")}</td>
              <td style="text-align:center;vertical-align:middle;padding:6px;">
                <div class="cat-thumb">
                  <img
                    src="${escapeHtml(imgUrl)}"
                    alt="${escapeHtml(item.name)}"
                    style="${isFallback ? "object-fit:contain;padding:8px;" : "object-fit:cover;"}"
                    onerror="this.onerror=null;this.src='${fallbackLogo}';this.style.objectFit='contain';this.style.padding='8px';"
                  />
                </div>
              </td>
              <td>
                <div style="font-weight:800;color:#0f172a;font-size:11.5px;">${escapeHtml(item.name)}</div>
                ${item.description ? `<div style="color:#475569;font-size:10px;margin-top:2px;">${escapeHtml(item.description.slice(0, 160))}${item.description.length > 160 ? "..." : ""}</div>` : ""}
                ${featuresLine ? `<div style="color:#0f172a;font-size:9.5px;font-weight:600;margin-top:2px;">${escapeHtml(featuresLine)}</div>` : ""}
                ${variantSummary ? `<div style="color:#1b4332;font-size:9.5px;font-weight:700;margin-top:3px;">${escapeHtml(variantSummary)}</div>` : ""}
              </td>
              <td style="text-align:center;font-family:monospace;font-size:10px;color:#475569;vertical-align:middle;">${escapeHtml(item.model_number || item.id.slice(0, 8).toUpperCase())}</td>
              <td style="text-align:center;font-size:10px;font-weight:700;vertical-align:middle;color:${item.in_stock !== false ? "#15803d" : "#b45309"};">
                ${item.in_stock !== false ? "In Stock" : "On Request"}
              </td>
              <td style="text-align:right;font-weight:800;color:#0f172a;white-space:nowrap;vertical-align:middle;">${escapeHtml(priceStr)}</td>
            </tr>`;
        })
        .join("");

      return `
        <section class="cat-section">
          <div class="cat-banner">
            <span>SECTION ${String(catIdx + 1).padStart(2, "0")}: ${escapeHtml(catName.toUpperCase())}</span>
            <span>${items.length} ${items.length === 1 ? "Product" : "Products"}</span>
          </div>
          <table class="cat-table">
            <thead>
              <tr>
                <th style="width:42px;text-align:center;">Code</th>
                <th style="width:72px;text-align:center;">Photo</th>
                <th>Product Name, Technical Specifications &amp; Available Options</th>
                <th style="width:76px;text-align:center;">Model / SKU</th>
                <th style="width:70px;text-align:center;">Stock</th>
                <th style="width:118px;text-align:right;">Unit Price (KES)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(categoryScopeLabel)} (${escapeHtml(catalogueRef)}) - ${escapeHtml(COMPANY.name)}</title>
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
      line-height: 1.45;
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
      padding: 28px 30px 24px;
      border-bottom: 5px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .logo-box {
      width: 58px;
      height: 58px;
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
    .brand-title { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
    .brand-sub { font-size: 11.5px; color: #a7f3d0; font-weight: 700; margin-top: 2px; }
    .brand-meta { font-size: 10px; color: #cbd5e1; margin-top: 6px; line-height: 1.55; }
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
    .doc-type { font-size: 21px; font-weight: 900; letter-spacing: 0.04em; color: #fff; margin-top: 6px; }
    .doc-ref {
      margin-top: 8px;
      background: rgba(15, 23, 42, 0.38);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10px;
      text-align: left;
      min-width: 220px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 12px; padding: 1.5px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; }
    .body-wrap { padding: 22px 30px 28px; }

    /* Executive Company Profile Section */
    .profile-card {
      border: 1.5px solid var(--primary);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 18px;
      background: #fff;
    }
    .profile-header {
      background: var(--primary);
      color: #fff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .profile-header h2 {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fde68a;
    }
    .profile-header span {
      font-size: 10px;
      font-weight: 700;
      color: #a7f3d0;
    }
    .profile-body {
      padding: 14px 16px;
    }
    .profile-lead {
      font-size: 11.5px;
      line-height: 1.55;
      color: var(--ink);
      margin-bottom: 12px;
    }
    .divisions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .division-box {
      border: 1px solid var(--line);
      border-left: 3.5px solid var(--gold);
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .division-box strong {
      display: block;
      font-size: 10.5px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 2px;
    }
    .division-box p {
      font-size: 9.5px;
      line-height: 1.4;
      color: var(--muted);
    }

    .cat-section { margin-top: 20px; }
    .cat-banner {
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid #a7f3d0;
      border-left: 4px solid var(--primary);
      padding: 7px 12px;
      font-weight: 800;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.cat-table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); margin-top: 6px; }
    .cat-table thead { display: table-header-group; }
    .cat-table th {
      background: var(--primary);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 7px 8px;
      text-align: left;
    }
    .cat-table td {
      padding: 7px 8px;
      border-bottom: 1px solid var(--line-soft);
      border-right: 1px solid var(--line-soft);
      vertical-align: top;
    }
    .cat-table tbody tr { break-inside: avoid; page-break-inside: avoid; }
    .cat-table tbody tr:nth-child(even) td { background: #f8fafc; }
    .cat-thumb {
      width: 60px;
      height: 50px;
      margin: 0 auto;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: #fff;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cat-thumb img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .ordering-grid {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .order-box {
      border: 1.5px solid var(--primary);
      border-radius: 8px;
      padding: 12px 14px;
      background: var(--primary-soft);
    }
    .order-box h3 {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
      margin-bottom: 6px;
    }
    .order-box p {
      font-size: 10px;
      color: var(--ink);
      line-height: 1.5;
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
      <div style="font-size:13px;font-weight:700;">${escapeHtml(COMPANY.name)} — Master Illustrated Product Catalogue (${escapeHtml(catalogueRef)})</div>
      <div style="font-size:11px;color:#94a3b8;">Showing ${fullProducts.length} Products &amp; ${kitsList.length} Complete Farm Kits. Click "Save / Download PDF" or send an inquiry to WhatsApp.</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-pdf" onclick="window.print()">🖨️ Save / Download PDF Catalogue</button>
      <a class="btn btn-wa" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">💬 Send Catalogue Inquiry to WhatsApp</a>
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
        <span class="doc-eyebrow">Corporate Profile &amp; Price List</span>
        <div class="doc-type">MASTER CATALOGUE</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Catalogue Ref:</span><strong>${escapeHtml(catalogueRef)}</strong></div>
          <div class="doc-ref-row"><span>Date Issued:</span><strong>${escapeHtml(formatDate(issueDate))}</strong></div>
          <div class="doc-ref-row"><span>Total Catalogue:</span><strong>${fullProducts.length} Products + ${kitsList.length} Kits</strong></div>
          <div class="doc-ref-row"><span>KRA PIN:</span><strong>${escapeHtml(COMPANY.kraPin)}</strong></div>
        </div>
      </div>
    </header>

    <div class="body-wrap">
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
      </div>

      <!-- Master Category Index -->
      <section>
        <div class="cat-banner">
          <span>EXECUTIVE EQUIPMENT DIRECTORY — ${escapeHtml(categoryScopeLabel.toUpperCase())}</span>
          <span>${categoryEntries.length} Categories · ${fullProducts.length} Products</span>
        </div>
        <table class="cat-table">
          <thead>
            <tr>
              <th style="width:64px;text-align:center;">Section</th>
              <th>Equipment Category / Division</th>
              <th style="width:110px;text-align:center;">Products Listed</th>
              <th style="width:160px;text-align:right;">Starting Price Range</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </section>

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
  ${WAIT_FOR_IMAGES_PRINT_SCRIPT}
</body>
</html>`;

  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }

  if (alsoOpenWhatsApp) {
    openTrackedWhatsApp(whatsappUrl, "catalogue pdf + whatsapp");
  }
}
