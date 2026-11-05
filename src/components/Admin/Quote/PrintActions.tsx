import { COMPANY, getLogoUrl } from "../shared/companyBrand";
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

const formatDate = (value?: string): string =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

/**
 * Self-contained, print-first quotation document (A4).
 * No external scripts/fonts: renders identically offline, in print preview and "Save as PDF".
 * All user-supplied text is HTML-escaped; line breaks in descriptions and notes are preserved.
 */
export const generatePrintContent = (
  quote: Quote,
  items: QuoteItem[],
  customer?: Customer,
): string => {
  const { subtotal, vat: tax, total, vatRate } = calculateQuoteTotals(quote, items);

  const customerLines = customer
    ? [
        `<div class="party-name">${escapeHtml(customer.company_name || customer.contact_person)}</div>`,
        customer.company_name ? `<div>Attn: ${escapeHtml(customer.contact_person)}</div>` : "",
        customer.address ? `<div>${escapeHtml(customer.address)}</div>` : "",
        [customer.city, customer.country].filter(Boolean).length
          ? `<div>${escapeHtml([customer.city, customer.country].filter(Boolean).join(", "))}</div>`
          : "",
        customer.phone ? `<div>Tel: ${escapeHtml(customer.phone)}</div>` : "",
        `<div>${escapeHtml(customer.email)}</div>`,
      ].join("")
    : `<div class="muted">Customer information not available</div>`;

  const projectFacts = [
    ["Project", quote.project_type],
    ["Crop", quote.crop_type],
    ["Area", quote.area_size ? `${quote.area_size} acres` : ""],
    ["Water source", quote.water_source],
    ["Terrain", quote.terrain_info],
  ].filter(([, value]) => Boolean(value));

  const projectSection = projectFacts.length
    ? `
    <section class="block avoid-break">
      <h2 class="section-title">Project overview</h2>
      <div class="facts">
        ${projectFacts
          .map(
            ([label, value]) =>
              `<div class="fact"><span class="fact-label">${label}</span><span class="fact-value">${escapeHtml(value)}</span></div>`,
          )
          .join("")}
      </div>
    </section>`
    : "";

  const groupedItems = new Map<string, { name: string; items: QuoteItem[] }>();
  items.forEach((item) => {
    const name = item.section_name?.trim() || "General";
    const key = item.section_id || `legacy:${name}`;
    const group = groupedItems.get(key) || { name, items: [] };
    group.items.push(item);
    groupedItems.set(key, group);
  });

  let lineNumber = 0;
  const rows = Array.from(groupedItems.values())
    .map((group, groupIndex) => {
      const sectionTotal = group.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
      );
      const sectionHeading = `
      <tr class="section-row">
        <td colspan="6">
          <span>${groupIndex + 1}. ${escapeHtml(group.name)}</span>
          <strong>KES ${money(sectionTotal)}</strong>
        </td>
      </tr>`;
      const sectionRows = group.items.map((item) => {
        lineNumber += 1;
        return `
        <tr>
          <td class="c-num">${lineNumber}</td>
          <td class="c-desc">
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${item.description?.trim() ? `<div class="item-desc">${escapeHtml(item.description.trim())}</div>` : ""}
          </td>
          <td class="c-qty">${escapeHtml(item.quantity)}</td>
          <td class="c-unit">${escapeHtml(item.unit)}</td>
          <td class="c-money">${money(item.unit_price)}</td>
          <td class="c-money c-total">${money(Number(item.quantity || 0) * Number(item.unit_price || 0))}</td>
        </tr>`;
      }).join("");
      return sectionHeading + sectionRows;
    })
    .join("");

  const notesSection = quote.notes?.trim()
    ? `
    <section class="block">
      <h2 class="section-title">Technical specifications, commercial terms &amp; notes</h2>
      <div class="notes">${escapeHtml(quote.notes.trim())}</div>
    </section>`
    : "";

  const validUntil = formatDate(quote.valid_until);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quotation ${escapeHtml(quote.quote_number)} - ${escapeHtml(COMPANY.name)}</title>
  <style>
    :root {
      --brand: ${COMPANY.primary};
      --brand-dark: ${COMPANY.primaryDark};
      --brand-tint: #eef6f1;
      --ink: #1c2521;
      --muted: #5f6b66;
      --line: #dfe6e2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px; line-height: 1.45; color: var(--ink); background: #eceff0; padding: 24px 12px;
    }
    .page { max-width: 794px; margin: 0 auto; background: #fff; box-shadow: 0 2px 18px rgba(0,0,0,.1); }
    .topbar { height: 8px; background: linear-gradient(90deg, var(--brand-dark), var(--brand)); }
    .inner { padding: 28px 34px 22px; }

    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .logo { width: 52px; height: 52px; border: 1px solid var(--line); border-radius: 10px; padding: 7px; display: flex; align-items: center; justify-content: center; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .brand h1 { font-size: 20px; font-weight: 800; color: var(--brand-dark); letter-spacing: -.01em; }
    .brand .tag { color: var(--muted); font-size: 11px; }
    .doc-title { text-align: right; }
    .doc-title .word { font-size: 26px; font-weight: 800; letter-spacing: .14em; color: var(--brand); line-height: 1; }
    .meta { margin-top: 10px; display: inline-grid; grid-template-columns: auto auto; gap: 3px 14px; text-align: left; font-size: 11.5px; }
    .meta dt { color: var(--muted); }
    .meta dd { font-weight: 700; text-align: right; }

    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
    .party { border: 1px solid var(--line); border-radius: 8px; padding: 11px 14px; }
    .party-label { font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--brand); margin-bottom: 5px; }
    .party-name { font-weight: 700; font-size: 13px; }
    .party div { overflow-wrap: anywhere; }
    .muted { color: var(--muted); }

    .block { margin-top: 20px; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    .section-title { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--brand-dark); padding-bottom: 6px; border-bottom: 2px solid var(--brand); margin-bottom: 10px; }

    .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .fact { background: var(--brand-tint); border-radius: 6px; padding: 7px 10px; }
    .fact-label { display: block; font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
    .fact-value { display: block; font-weight: 600; overflow-wrap: anywhere; }

    table.boq { width: 100%; border-collapse: collapse; }
    .boq thead { display: table-header-group; }
    .boq th { background: var(--brand-dark); color: #fff; font-size: 9.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 8px 8px; text-align: left; }
    .boq td { padding: 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
    .boq tbody tr { break-inside: avoid; page-break-inside: avoid; }
    .boq tbody tr:nth-child(even) td { background: #f8faf9; }
    .c-num { width: 28px; text-align: center; color: var(--muted); }
    .c-qty, .c-unit { width: 52px; text-align: center; }
    .c-money { width: 96px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .c-total { font-weight: 700; }
    .section-row td { background: var(--brand-tint) !important; color: var(--brand-dark); padding: 9px 10px; font-weight: 700; }
    .section-row td strong { float: right; font-size: 10.5px; font-variant-numeric: tabular-nums; }
    .boq th.c-num, .boq th.c-qty, .boq th.c-unit { text-align: center; }
    .boq th.c-money { text-align: right; }
    .item-name { font-weight: 700; }
    .item-desc { color: var(--muted); font-size: 11px; margin-top: 2px; white-space: pre-wrap; overflow-wrap: anywhere; }

    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
    .totals { width: 285px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    .totals .row { display: flex; justify-content: space-between; padding: 8px 14px; font-variant-numeric: tabular-nums; }
    .totals .row + .row { border-top: 1px solid var(--line); }
    .totals .grand { background: var(--brand); color: #fff; font-size: 14px; font-weight: 800; }
    .currency-note { text-align: right; font-size: 10px; color: var(--muted); margin-top: 5px; }

    .notes { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--brand-tint); border-left: 4px solid var(--brand); border-radius: 0 6px 6px 0; padding: 11px 14px; }

    .accept { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 28px; break-inside: avoid; page-break-inside: avoid; }
    .sign { border-top: 1px solid var(--ink); padding-top: 5px; font-size: 10.5px; color: var(--muted); }

    .foot { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--line); text-align: center; font-size: 10.5px; color: var(--muted); }
    .foot strong { color: var(--brand-dark); }

    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; max-width: none; }
      .inner { padding: 18px 8px 8px; }
    }
    @media screen and (max-width: 600px) {
      .head, .parties { grid-template-columns: 1fr; flex-direction: column; }
      .doc-title { text-align: left; }
      .facts { grid-template-columns: 1fr 1fr; }
      .inner { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar"></div>
    <div class="inner">

      <header class="head">
        <div class="brand">
          <div class="logo"><img src="${getLogoUrl({ forPrint: true })}" alt=""></div>
          <div>
            <h1>${escapeHtml(COMPANY.name)}</h1>
            <div class="tag">${escapeHtml(COMPANY.tagline)}</div>
          </div>
        </div>
        <div class="doc-title">
          <div class="word">QUOTATION</div>
          <dl class="meta">
            <dt>Quote no.</dt><dd>${escapeHtml(quote.quote_number)}</dd>
            <dt>Date</dt><dd>${formatDate(quote.created_at)}</dd>
            ${validUntil ? `<dt>Valid until</dt><dd>${validUntil}</dd>` : ""}
          </dl>
        </div>
      </header>

      <section class="parties avoid-break">
        <div class="party">
          <div class="party-label">From</div>
          <div class="party-name">${escapeHtml(COMPANY.name)}</div>
          <div>${escapeHtml(COMPANY.address)}</div>
          <div>Tel: ${escapeHtml(COMPANY.phone)}</div>
          <div>${escapeHtml(COMPANY.email)}</div>
        </div>
        <div class="party">
          <div class="party-label">Quoted to</div>
          ${customerLines}
        </div>
      </section>

      ${projectSection}

      <section class="block">
        <h2 class="section-title">Bill of quantities</h2>
        <table class="boq">
          <thead>
            <tr>
              <th class="c-num">#</th>
              <th>Item &amp; specification</th>
              <th class="c-qty">Qty</th>
              <th class="c-unit">Unit</th>
              <th class="c-money">Unit price</th>
              <th class="c-money">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      <div class="totals-wrap">
        <div class="totals">
          <div class="row"><span>Subtotal</span><span>KES ${money(subtotal)}</span></div>
          ${vatRate > 0 ? `<div class="row"><span>VAT (${escapeHtml(vatRate)}%)</span><span>KES ${money(tax)}</span></div>` : `<div class="row"><span>VAT</span><span>Not applied</span></div>`}
          <div class="row grand"><span>Total</span><span>KES ${money(total)}</span></div>
        </div>
      </div>
      <div class="currency-note">All amounts in Kenya Shillings (KES)${validUntil ? ` · Valid until ${validUntil}` : ""}</div>

      ${notesSection}

      <section class="accept">
        <div class="sign">Authorised by ${escapeHtml(COMPANY.name)}</div>
        <div class="sign">Customer acceptance (name, signature &amp; date)</div>
      </section>

      <footer class="foot">
        <strong>${escapeHtml(COMPANY.name)}</strong> · ${escapeHtml(COMPANY.phone)} · ${escapeHtml(COMPANY.email)} · ${escapeHtml(COMPANY.emailAlt)}
      </footer>
    </div>
  </div>
</body>
</html>`;
};
