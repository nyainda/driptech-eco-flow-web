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

export interface PdfProductItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  model_number?: string | null;
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
 * Generates and opens an Executive A4 Instant Product Quotation PDF (printable/saveable as PDF)
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

  const whatsappText = [
    `Hi DripTech EcoFlow! Here is my Instant Product Quotation request:`,
    `• Quote Ref: *${quoteNumber}*`,
    `• Item: *${quantity} × ${itemFullTitle}*`,
    hasNumericPrice
      ? `• Quoted Amount: *KES ${ lineTotal.toLocaleString("en-KE") }* (${formatPrice(unitPrice)} each)`
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
      <div class="toolbar-sub">Click "Save / Print PDF" (choose "Save as PDF") or send this quote reference directly to our WhatsApp desk.</div>
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
            <th style="width:45px;text-align:center;">Item</th>
            <th>Equipment Description &amp; Technical Specifications</th>
            <th style="width:65px;text-align:center;">Qty</th>
            <th style="width:115px;text-align:right;">Unit Price (KES)</th>
            <th style="width:120px;text-align:right;">Line Total (KES)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;font-weight:700;">01</td>
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
  ${
    autoPrint
      ? `<script>window.addEventListener("load", function() { setTimeout(function() { window.print(); }, 350); });</script>`
      : ""
  }
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
 * Generates and opens an Executive Multi-Category A4 Product & Contracting Catalogue PDF.
 */
export function openProductCataloguePdf(
  products: PdfProductItem[],
  categoryScopeLabel = "Complete Irrigation & Farm Equipment Catalogue",
  alsoOpenWhatsApp = false,
): void {
  const issueDate = new Date();
  const catalogueRef = `DT-CAT-${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, "0")}`;

  // Group products by category
  const grouped = new Map<string, PdfProductItem[]>();
  for (const product of products) {
    const label = getCategoryTitleFromCategory(product.category || "accessories");
    const list = grouped.get(label) || [];
    list.push(product);
    grouped.set(label, list);
  }

  const categoryEntries = Array.from(grouped.entries());

  const whatsappCatalogMsg = [
    `Hi DripTech EcoFlow! I have downloaded your *${categoryScopeLabel}* (Ref: *${catalogueRef}* with ${products.length} products).`,
    `Please share any current bulk discounts or assist me with a custom quotation for my farm.`,
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
          <td style="text-align:center;font-weight:700;color:#475569;">${String(idx + 1).padStart(2, "0")}</td>
          <td><strong>${escapeHtml(catName)}</strong></td>
          <td style="text-align:center;font-weight:700;">${items.length}</td>
          <td style="text-align:right;font-weight:700;color:#1b4332;">${minPrice}</td>
        </tr>`;
    })
    .join("");

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
                .slice(0, 4)
                .map((v) => `${v.name} (KES ${v.price.toLocaleString()})`)
                .join(" · ")}`
            : "";

          return `
            <tr>
              <td style="text-align:center;font-weight:700;color:#64748b;">${catIdx + 1}.${String(idx + 1).padStart(2, "0")}</td>
              <td>
                <div style="font-weight:800;color:#0f172a;font-size:11.5px;">${escapeHtml(item.name)}</div>
                ${item.description ? `<div style="color:#475569;font-size:10px;margin-top:2px;">${escapeHtml(item.description.slice(0, 140))}${item.description.length > 140 ? "..." : ""}</div>` : ""}
                ${variantSummary ? `<div style="color:#1b4332;font-size:9.5px;font-weight:700;margin-top:3px;">${escapeHtml(variantSummary)}</div>` : ""}
              </td>
              <td style="text-align:center;font-family:monospace;font-size:10px;color:#475569;">${escapeHtml(item.model_number || item.id.slice(0, 8).toUpperCase())}</td>
              <td style="text-align:center;font-size:10px;font-weight:700;color:${item.in_stock !== false ? "#15803d" : "#b45309"};">
                ${item.in_stock !== false ? "In Stock" : "On Request"}
              </td>
              <td style="text-align:right;font-weight:800;color:#0f172a;white-space:nowrap;">${escapeHtml(priceStr)}</td>
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
                <th style="width:48px;text-align:center;">Code</th>
                <th>Product Name, Specifications &amp; Available Options</th>
                <th style="width:82px;text-align:center;">Model / SKU</th>
                <th style="width:78px;text-align:center;">Stock</th>
                <th style="width:125px;text-align:right;">Unit Price (KES)</th>
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
      background: linear-gradient(135deg, #0d281e 0%, #1b4332 65%, #2d6a4f 100%);
      color: #fff;
      padding: 26px 30px 22px;
      border-bottom: 4px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .logo-box {
      width: 54px;
      height: 54px;
      border-radius: 12px;
      background: #fff;
      padding: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-title { font-size: 20px; font-weight: 800; color: #fff; }
    .brand-sub { font-size: 11px; color: #a7f3d0; font-weight: 600; margin-top: 2px; }
    .brand-meta { font-size: 10px; color: #cbd5e1; margin-top: 6px; line-height: 1.5; }
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
    .doc-type { font-size: 20px; font-weight: 900; letter-spacing: 0.05em; color: #fff; margin-top: 6px; }
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
    .doc-ref-row strong { color: #fff; }
    .body-wrap { padding: 22px 30px 28px; }
    .services-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .service-pill {
      border: 1px solid var(--line);
      border-top: 3px solid var(--primary);
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .service-pill strong { display: block; font-size: 10.5px; color: var(--primary); }
    .service-pill span { font-size: 9.5px; color: var(--muted); }
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
    .footer-cta {
      margin-top: 22px;
      border: 1.5px solid var(--primary);
      background: var(--primary-soft);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      break-inside: avoid;
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
      <div style="font-size:13px;font-weight:700;">${escapeHtml(COMPANY.name)} — Official PDF Product Catalogue (${escapeHtml(catalogueRef)})</div>
      <div style="font-size:11px;color:#94a3b8;">Click "Save / Download PDF" (choose "Save as PDF" in your print destination) or request a custom BOQ on WhatsApp.</div>
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
        <span class="doc-eyebrow">Official Price List &amp; Guide</span>
        <div class="doc-type">CATALOGUE</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Catalogue Ref:</span><strong>${escapeHtml(catalogueRef)}</strong></div>
          <div class="doc-ref-row"><span>Date Generated:</span><strong>${escapeHtml(formatDate(issueDate))}</strong></div>
          <div class="doc-ref-row"><span>Listed Products:</span><strong>${products.length} Items</strong></div>
          <div class="doc-ref-row"><span>Currency:</span><strong>KES (Kenya Shillings)</strong></div>
        </div>
      </div>
    </header>

    <div class="body-wrap">
      <div class="services-strip">
        <div class="service-pill">
          <strong>Drip &amp; Sprinkler Kits</strong>
          <span>¼ Acre to 50+ Acre farm packages</span>
        </div>
        <div class="service-pill">
          <strong>HDPE Dam Liners</strong>
          <span>0.5mm, 0.75mm &amp; 1.0mm + Welding</span>
        </div>
        <div class="service-pill">
          <strong>Greenhouses &amp; Nets</strong>
          <span>Steel/Timber structures &amp; misting</span>
        </div>
        <div class="service-pill">
          <strong>Solar &amp; Field Install</strong>
          <span>Pump sizing &amp; 47-county dispatch</span>
        </div>
      </div>

      <section>
        <div class="cat-banner">
          <span>EXECUTIVE CATEGORY INDEX — ${escapeHtml(categoryScopeLabel.toUpperCase())}</span>
          <span>${categoryEntries.length} Equipment Categories</span>
        </div>
        <table class="cat-table">
          <thead>
            <tr>
              <th style="width:48px;text-align:center;">Sec</th>
              <th>Equipment Category</th>
              <th style="width:90px;text-align:center;">Items Listed</th>
              <th style="width:150px;text-align:right;">Starting Price Range</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </section>

      ${categorySectionsHtml}

      <div class="footer-cta">
        <div>
          <div style="font-size:12px;font-weight:800;color:var(--primary);">Need an Official Multi-Item BOQ, LPO Proforma, or On-Farm Installation?</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">
            Call/WhatsApp <strong>${escapeHtml(COMPANY.phone)}</strong> or email <strong>${escapeHtml(COMPANY.email)}</strong> with your item codes or farm acreage.
          </div>
        </div>
        <div style="text-align:right;font-size:10px;font-weight:700;color:var(--primary);">
          ${escapeHtml(COMPANY.website)}<br>
          Ref: ${escapeHtml(catalogueRef)}
        </div>
      </div>
    </div>
  </div>
  <script>window.addEventListener("load", function() { setTimeout(function() { window.print(); }, 400); });</script>
</body>
</html>`;

  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }

  if (alsoOpenWhatsApp) {
    openTrackedWhatsApp(whatsappUrl, "catalogue pdf + whatsapp");
  }
}
