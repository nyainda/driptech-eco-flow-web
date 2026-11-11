import { COMPANY, getLogoUrl, numberToWordsKES } from "../shared/companyBrand";
import { Quote, QuoteItem, Customer } from "./types";
import { calculateQuoteTotals } from "./quoteCalculations";

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });

const money = (value: number): string =>
  (Number.isFinite(value) ? value : 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/**
 * Self-contained, print-first Executive Engineering Quotation & Bill of Quantities (A4).
 * Designed for high-value commercial farms, estates, NGOs, institutional, and government tenders.
 */
export const generatePrintContent = (
  quote: Quote,
  items: QuoteItem[],
  customer?: Customer,
): string => {
  const { subtotal, vat: tax, total, vatRate } = calculateQuoteTotals(quote, items);
  const status = (quote.status || "draft").toUpperCase();

  const groupedItems = new Map<string, { name: string; items: QuoteItem[] }>();
  items.forEach((item) => {
    const name = item.section_name?.trim() || "General Irrigation Works";
    const key = item.section_id || `legacy:${name}`;
    const group = groupedItems.get(key) || { name, items: [] };
    group.items.push(item);
    groupedItems.set(key, group);
  });

  const groups = Array.from(groupedItems.values());

  const sectionSummaryRows =
    groups.length > 1
      ? groups
          .map((group, idx) => {
            const secTotal = group.items.reduce(
              (sum, i) => sum + Number(i.quantity || 0) * Number(i.unit_price || 0),
              0,
            );
            return `
              <tr>
                <td class="c-code">SEC-${String(idx + 1).padStart(2, "0")}</td>
                <td><strong>${escapeHtml(group.name)}</strong></td>
                <td class="c-center">${group.items.length}</td>
                <td class="c-money">${money(secTotal)}</td>
              </tr>`;
          })
          .join("")
      : "";

  const boqRows = groups
    .map((group, groupIndex) => {
      const sectionCode = String(groupIndex + 1).padStart(2, "0");
      const sectionTotal = group.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
      );
      const sectionHeading = `
      <tr class="section-row">
        <td colspan="6">
          <div class="section-row-inner">
            <span>SECTION ${sectionCode}: ${escapeHtml(group.name.toUpperCase())}</span>
            <span>SECTION SUBTOTAL: KES ${money(sectionTotal)}</span>
          </div>
        </td>
      </tr>`;

      const sectionRows = group.items
        .map((item, itemIdx) => {
          const itemCode = `${groupIndex + 1}.${String(itemIdx + 1).padStart(2, "0")}`;
          const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
          return `
        <tr>
          <td class="c-num">${itemCode}</td>
          <td class="c-desc">
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${item.description?.trim() ? `<div class="item-desc">${escapeHtml(item.description.trim())}</div>` : ""}
          </td>
          <td class="c-unit">${escapeHtml(item.unit || "unit")}</td>
          <td class="c-qty">${escapeHtml(item.quantity)}</td>
          <td class="c-money">${money(Number(item.unit_price || 0))}</td>
          <td class="c-money c-total">${money(lineTotal)}</td>
        </tr>`;
        })
        .join("");
      return sectionHeading + sectionRows;
    })
    .join("");

  const projectFacts = [
    ["Project Scope", quote.project_type || "Commercial Irrigation System"],
    ["Target Crop / Application", quote.crop_type || "Standard Agronomic Layout"],
    ["Net Irrigated Area", quote.area_size ? `${quote.area_size} Acres` : "As Specified"],
    ["Water Source", quote.water_source || "Client Site Supply"],
    ["Site / Terrain Profile", quote.terrain_info || "Standard Field Gradient"],
    ["Currency", "Kenya Shillings (KES)"],
  ];

  const validUntil = formatDate(quote.valid_until);
  const termsText = quote.notes?.trim() || COMPANY.defaultQuoteTerms;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BOQ Quotation ${escapeHtml(quote.quote_number)} - ${escapeHtml(COMPANY.name)}</title>
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
      font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
      color: var(--ink);
      background: #e2e8f0;
      padding: 20px 12px;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 10px 35px rgba(15, 23, 42, 0.14);
      position: relative;
      overflow: hidden;
    }
    .masthead {
      background: linear-gradient(135deg, #0d281e 0%, #1b4332 65%, #2d6a4f 100%);
      color: #fff;
      padding: 26px 32px 22px;
      border-bottom: 4px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .logo-box {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #fff;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      flex-shrink: 0;
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
    .brand-sub { font-size: 11px; color: #a7f3d0; font-weight: 600; margin-top: 2px; }
    .brand-meta { font-size: 10px; color: #cbd5e1; margin-top: 6px; line-height: 1.5; }
    .doc-box { text-align: right; flex-shrink: 0; }
    .doc-eyebrow {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #fde68a;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(253, 230, 138, 0.35);
      padding: 3px 9px;
      border-radius: 999px;
    }
    .doc-type {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.06em;
      color: #fff;
      margin-top: 6px;
    }
    .doc-ref {
      margin-top: 8px;
      background: rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10.5px;
      text-align: left;
      min-width: 215px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 14px; padding: 1.5px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; font-variant-numeric: tabular-nums; }

    .body-wrap { padding: 24px 32px 28px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 15px;
      background: #fff;
    }
    .panel-tinted { background: #f8fafc; }
    .panel-head {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--primary-mid);
      border-bottom: 1px solid var(--line-soft);
      padding-bottom: 5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .client-name { font-size: 13.5px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
    .info-line { font-size: 11px; color: var(--muted); line-height: 1.5; }
    .info-line strong { color: var(--ink); }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 12px;
    }
    .spec-item {
      border-left: 2.5px solid var(--gold);
      padding-left: 8px;
    }
    .spec-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; }
    .spec-val { font-size: 11px; font-weight: 700; color: var(--ink); }

    .section-block { margin-top: 20px; }
    .block-heading {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .block-heading h2 {
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .block-heading span {
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
    }

    table.boq { width: 100%; border-collapse: collapse; border: 1px solid var(--line); }
    .boq thead { display: table-header-group; }
    .boq th {
      background: var(--primary);
      color: #fff;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 9px;
      text-align: left;
      border-right: 1px solid rgba(255,255,255,0.12);
    }
    .boq td {
      padding: 7.5px 9px;
      border-bottom: 1px solid var(--line-soft);
      border-right: 1px solid var(--line-soft);
      vertical-align: top;
    }
    .boq tbody tr { break-inside: avoid; page-break-inside: avoid; }
    .boq tbody tr:nth-child(even) td { background: #f8fafc; }
    .c-num, .c-code { width: 48px; text-align: center; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
    .c-unit, .c-center { width: 58px; text-align: center; color: var(--muted); }
    .c-qty { width: 58px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
    .c-money { width: 105px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .c-total { font-weight: 700; color: var(--ink); }
    .boq th.c-num, .boq th.c-code, .boq th.c-qty, .boq th.c-unit, .boq th.c-center { text-align: center; }
    .boq th.c-money { text-align: right; }

    .section-row td {
      background: var(--primary-soft) !important;
      color: var(--primary);
      padding: 8px 10px;
      font-weight: 800;
      font-size: 10.5px;
      letter-spacing: 0.04em;
      border-top: 1.5px solid #a7f3d0;
      border-bottom: 1.5px solid #a7f3d0;
    }
    .section-row-inner { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .item-name { font-weight: 700; color: var(--ink); font-size: 11.5px; }
    .item-desc { color: var(--muted); font-size: 10.5px; margin-top: 2px; white-space: pre-wrap; }

    .financial-footer {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 18px;
      align-items: start;
      break-inside: avoid;
      page-break-inside: avoid;
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
      font-size: 10.5px;
      color: var(--muted);
      white-space: pre-line;
    }
    .remittance-box strong { color: var(--primary); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 4px; }

    .totals-card {
      border: 1.5px solid var(--primary);
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      border-bottom: 1px solid var(--line-soft);
      font-size: 11.5px;
      font-variant-numeric: tabular-nums;
    }
    .totals-row span:first-child { color: var(--muted); font-weight: 600; }
    .totals-row strong { color: var(--ink); }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 14px;
      background: var(--primary);
      color: #fff;
      font-size: 13.5px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .terms-box {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 14px;
      background: #fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .terms-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--primary);
      margin-bottom: 6px;
    }
    .terms-content {
      font-size: 10.5px;
      color: var(--muted);
      white-space: pre-wrap;
      line-height: 1.55;
    }

    .signatures {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 150px 1fr;
      gap: 20px;
      align-items: end;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-block {
      border-top: 1.5px solid var(--ink);
      padding-top: 6px;
    }
    .sig-title { font-size: 10.5px; font-weight: 800; color: var(--ink); }
    .sig-sub { font-size: 9.5px; color: var(--muted); margin-top: 2px; }
    .stamp-ring {
      width: 132px;
      height: 82px;
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
      padding: 6px;
    }
    .stamp-ring strong { font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; }
    .stamp-ring span { font-size: 8.5px; color: #15803d; margin-top: 2px; }

    .doc-footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
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
        <span class="doc-eyebrow">Commercial Proposal &amp; BOQ</span>
        <div class="doc-type">QUOTATION</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Quotation Ref:</span><strong>${escapeHtml(quote.quote_number)}</strong></div>
          <div class="doc-ref-row"><span>Date Issued:</span><strong>${formatDate(quote.created_at)}</strong></div>
          <div class="doc-ref-row"><span>Valid Until:</span><strong>${validUntil}</strong></div>
          <div class="doc-ref-row"><span>Status:</span><strong>${escapeHtml(status)}</strong></div>
        </div>
      </div>
    </header>

    <div class="body-wrap">
      <div class="grid-2">
        <div class="panel panel-tinted">
          <div class="panel-head">
            <span>Client / Prepared For</span>
            <span>Client Profile</span>
          </div>
          ${
            customer
              ? `
            <div class="client-name">${escapeHtml(customer.company_name || customer.contact_person)}</div>
            ${customer.company_name && customer.contact_person ? `<div class="info-line"><strong>Attention:</strong> ${escapeHtml(customer.contact_person)}</div>` : ""}
            ${customer.address ? `<div class="info-line"><strong>Address:</strong> ${escapeHtml(customer.address)}</div>` : ""}
            ${[customer.city, customer.country].filter(Boolean).length ? `<div class="info-line"><strong>Location:</strong> ${escapeHtml([customer.city, customer.country].filter(Boolean).join(", "))}</div>` : ""}
            ${customer.phone ? `<div class="info-line"><strong>Phone:</strong> ${escapeHtml(customer.phone)}</div>` : ""}
            ${customer.email ? `<div class="info-line"><strong>Email:</strong> ${escapeHtml(customer.email)}</div>` : ""}
          `
              : `<div class="info-line">Walk-In / Direct Commercial Inquiry</div>`
          }
        </div>

        <div class="panel">
          <div class="panel-head">
            <span>Agronomic &amp; Site Specifications</span>
            <span>Engineering Basis</span>
          </div>
          <div class="specs-grid">
            ${projectFacts
              .map(
                ([label, val]) => `
              <div class="spec-item">
                <div class="spec-label">${escapeHtml(label)}</div>
                <div class="spec-val">${escapeHtml(val)}</div>
              </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>

      ${
        sectionSummaryRows
          ? `
        <section class="section-block">
          <div class="block-heading">
            <h2>Executive BOQ Section Summary</h2>
            <span>${groups.length} Work Packages</span>
          </div>
          <table class="boq">
            <thead>
              <tr>
                <th class="c-code">Code</th>
                <th>Work Package / Section Description</th>
                <th class="c-center">Items</th>
                <th class="c-money">Section Subtotal (KES)</th>
              </tr>
            </thead>
            <tbody>${sectionSummaryRows}</tbody>
          </table>
        </section>`
          : ""
      }

      <section class="section-block">
        <div class="block-heading">
          <h2>Itemized Bill of Quantities (BOQ)</h2>
          <span>${items.length} Line ${items.length === 1 ? "Item" : "Items"} · Values in KES</span>
        </div>
        <table class="boq">
          <thead>
            <tr>
              <th class="c-num">Item</th>
              <th>Description &amp; Technical Specification</th>
              <th class="c-unit">Unit</th>
              <th class="c-qty">Qty</th>
              <th class="c-money">Unit Rate (KES)</th>
              <th class="c-money">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${boqRows || `<tr><td colspan="6" style="text-align:center;padding:18px;color:#64748b;">No BOQ items listed.</td></tr>`}
          </tbody>
        </table>
      </section>

      <div class="financial-footer">
        <div>
          <div class="words-box">
            <div class="words-label">Total Quotation Amount in Words</div>
            <div class="words-text">${escapeHtml(numberToWordsKES(total))}</div>
          </div>
          <div class="remittance-box">
            <strong>Official Payment &amp; Remittance Instructions</strong>${escapeHtml(COMPANY.defaultPaymentDetails)}
          </div>
        </div>

        <div class="totals-card">
          <div class="totals-row">
            <span>BOQ Subtotal (Excl. VAT)</span>
            <strong>KES ${money(subtotal)}</strong>
          </div>
          <div class="totals-row">
            <span>${vatRate > 0 ? `Value Added Tax (VAT ${escapeHtml(vatRate)}%)` : "Value Added Tax (VAT)"}</span>
            <strong>${vatRate > 0 ? `KES ${money(tax)}` : "Exempt / Not Applied"}</strong>
          </div>
          <div class="totals-grand">
            <span>TOTAL PAYABLE</span>
            <span>KES ${money(total)}</span>
          </div>
        </div>
      </div>

      <div class="terms-box">
        <div class="terms-title">Engineering Notes, Warranty &amp; Commercial Terms</div>
        <div class="terms-content">${escapeHtml(termsText)}</div>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-title">Prepared &amp; Authorized By</div>
          <div class="sig-sub">For: ${escapeHtml(COMPANY.name)} · Engineering &amp; Commercial Desk</div>
        </div>
        <div class="stamp-ring">
          <strong>${escapeHtml(COMPANY.name)}</strong>
          <span>VERIFIED COMMERCIAL PROPOSAL</span>
          <span>${escapeHtml(quote.quote_number)}</span>
        </div>
        <div class="sig-block">
          <div class="sig-title">Client Acceptance &amp; Order Confirmation</div>
          <div class="sig-sub">Authorized Name, Signature, Company Stamp &amp; Date</div>
        </div>
      </div>

      <footer class="doc-footer">
        <span><strong>${escapeHtml(COMPANY.name)}</strong> · ${escapeHtml(COMPANY.website)}</span>
        <span>Document Ref: ${escapeHtml(quote.quote_number)} · Generated by DripTech Enterprise BOQ Engine</span>
      </footer>
    </div>
  </div>
</body>
</html>`;
};
