import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/Admin/types/InvoiceTypes";
import {
  COMPANY,
  getLogoUrl,
  numberToWordsKES,
} from "@/components/Admin/shared/companyBrand";
import { formatDate } from "@/components/Admin/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const money = (value: number): string =>
  (Number.isFinite(value) ? value : 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type ProjectGroup = {
  name: string;
  subtitle: string;
  link: string;
  items: NonNullable<Invoice["invoice_items"]>;
};

const groupItemsByProject = (invoice: Invoice): ProjectGroup[] => {
  const groups: ProjectGroup[] = [];
  [...(invoice.invoice_items || [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .forEach((item) => {
      const name = item.project_name || "General Irrigation Supply & Works";
      const subtitle = item.project_subtitle || "";
      const link = item.project_link || "";
      const group = groups.find(
        (candidate) =>
          candidate.name === name &&
          candidate.subtitle === subtitle &&
          candidate.link === link,
      );
      if (group) group.items.push(item);
      else groups.push({ name, subtitle, link, items: [item] });
    });
  return groups;
};

export type DocumentMode = "invoice" | "receipt";

export const getReceiptNumber = (invoiceNumber: string): string => {
  const cleaned = (invoiceNumber || "").replace(/^INV[-_]?/i, "");
  return `RCT-${cleaned || Date.now()}`;
};

export const useInvoiceOperations = (onSuccess?: () => void) => {
  const { toast } = useToast();

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: Record<string, string> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "paid") updateData.paid_at = new Date().toISOString();
      if (newStatus === "sent") updateData.sent_at = new Date().toISOString();

      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoiceId);
      if (error) throw error;
      toast({
        title:
          newStatus === "paid"
            ? "Payment Recorded & Receipt Issued"
            : "Invoice Status Updated",
        description:
          newStatus === "paid"
            ? "Invoice marked as PAID. Official Payment Receipt is now available."
            : `Status changed to ${newStatus.toUpperCase()}.`,
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating invoice status:", error);
      toast({
        title: "Update Failed",
        description: error?.message || "Could not update invoice status.",
        variant: "destructive",
      });
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);
      if (error) throw error;
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been permanently removed.",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Delete Failed",
        description: error?.message || "Could not delete invoice.",
        variant: "destructive",
      });
    }
  };

  /**
   * Generates an Executive A4 Commercial / Tax Invoice OR Official Payment Receipt HTML document.
   */
  const generateDocumentHtml = (
    invoice: Invoice,
    mode: "invoice" | "receipt" = "invoice",
  ) => {
    const isReceipt = mode === "receipt";
    const projects = groupItemsByProject(invoice);
    const customer = invoice.customer;
    const receiptNo = getReceiptNumber(invoice.invoice_number);
    const status = (invoice.status || "draft").toUpperCase();

    const rowsMarkup = projects.length
      ? projects
          .map((project, pIdx) => {
            const pCode = String(pIdx + 1).padStart(2, "0");
            const projectSubtotal = project.items.reduce(
              (sum, item) => sum + Number(item.total || 0),
              0,
            );
            const headerRow = `
              <tr class="section-row">
                <td colspan="6">
                  <div class="section-row-inner">
                    <div>
                      <span>PACKAGE ${pCode}: ${escapeHtml(project.name.toUpperCase())}</span>
                      ${project.subtitle ? `<span class="sec-sub"> — ${escapeHtml(project.subtitle)}</span>` : ""}
                    </div>
                    <span>SUBTOTAL: KES ${money(projectSubtotal)}</span>
                  </div>
                </td>
              </tr>`;

            const itemRows = project.items
              .map((item, iIdx) => {
                const code = `${pIdx + 1}.${String(iIdx + 1).padStart(2, "0")}`;
                return `
                  <tr>
                    <td class="c-num">${code}</td>
                    <td class="c-desc">
                      <div class="item-name">${escapeHtml(item.name)}</div>
                      ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ""}
                    </td>
                    <td class="c-unit">${escapeHtml(item.unit || "pcs")}</td>
                    <td class="c-qty">${escapeHtml(item.quantity)}</td>
                    <td class="c-money">${money(Number(item.unit_price || 0))}</td>
                    <td class="c-money c-total">${money(Number(item.total || 0))}</td>
                  </tr>`;
              })
              .join("");

            return headerRow + itemRows;
          })
          .join("")
      : `<tr><td colspan="6" style="text-align:center;padding:18px;color:#64748b;">No line items recorded.</td></tr>`;

    const paymentDetailsText =
      invoice.payment_details?.trim() || COMPANY.defaultPaymentDetails;
    const termsText =
      invoice.terms_and_conditions?.trim() || COMPANY.defaultInvoiceTerms;
    const paidDate = formatDate(
      invoice.paid_at || invoice.updated_at || invoice.issue_date,
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${isReceipt ? `Receipt ${escapeHtml(receiptNo)}` : `Invoice ${escapeHtml(invoice.invoice_number)}`} - ${escapeHtml(COMPANY.name)}</title>
  <style>
    :root {
      --primary: ${isReceipt ? "#064e3b" : "#12372a"};
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
      background: ${
        isReceipt
          ? "linear-gradient(135deg, #064e3b 0%, #047857 65%, #059669 100%)"
          : "linear-gradient(135deg, #0d281e 0%, #1b4332 65%, #2d6a4f 100%)"
      };
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
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(253, 230, 138, 0.4);
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
      min-width: 220px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 14px; padding: 1.5px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; font-variant-numeric: tabular-nums; }

    .body-wrap { padding: 24px 32px 28px; }

    .receipt-banner {
      margin-bottom: 18px;
      border: 1.5px solid #10b981;
      background: linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .receipt-banner-left h3 { font-size: 13px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.06em; }
    .receipt-banner-left p { font-size: 11px; color: #047857; margin-top: 2px; }
    .receipt-banner-right { text-align: right; }
    .receipt-banner-right span { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #047857; display: block; }
    .receipt-banner-right strong { font-size: 18px; font-weight: 900; color: #064e3b; font-variant-numeric: tabular-nums; }

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
    }
    .client-name { font-size: 13.5px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
    .info-line { font-size: 11px; color: var(--muted); line-height: 1.5; }
    .info-line strong { color: var(--ink); }

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
    .block-heading span { font-size: 10px; font-weight: 600; color: var(--muted); }

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
    .c-num { width: 48px; text-align: center; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
    .c-unit { width: 58px; text-align: center; color: var(--muted); }
    .c-qty { width: 58px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
    .c-money { width: 105px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .c-total { font-weight: 700; color: var(--ink); }
    .boq th.c-num, .boq th.c-qty, .boq th.c-unit { text-align: center; }
    .boq th.c-money { text-align: right; }

    .section-row td {
      background: var(--primary-soft) !important;
      color: var(--primary);
      padding: 8px 10px;
      font-weight: 800;
      font-size: 10.5px;
      border-top: 1.5px solid #a7f3d0;
      border-bottom: 1.5px solid #a7f3d0;
    }
    .section-row-inner { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .sec-sub { font-weight: 500; color: #475569; }
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
      margin-top: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 14px;
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
      margin-bottom: 5px;
    }
    .terms-content { font-size: 10.5px; color: var(--muted); white-space: pre-wrap; line-height: 1.5; }

    .signatures {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 155px 1fr;
      gap: 20px;
      align-items: end;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-block { border-top: 1.5px solid var(--ink); padding-top: 6px; }
    .sig-title { font-size: 10.5px; font-weight: 800; color: var(--ink); }
    .sig-sub { font-size: 9.5px; color: var(--muted); margin-top: 2px; }
    .stamp-ring {
      width: 145px;
      height: 84px;
      margin: 0 auto;
      border: 2px ${isReceipt ? "solid #059669" : "dashed #1b4332"};
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: ${isReceipt ? "#065f46" : "#1b4332"};
      background: #ecfdf5;
      padding: 6px;
    }
    .stamp-ring strong { font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; }
    .stamp-ring span { font-size: 8.5px; font-weight: 700; color: #047857; margin-top: 2px; }

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
        <span class="doc-eyebrow">${isReceipt ? "Official Finance Voucher" : "Commercial Billing Document"}</span>
        <div class="doc-type">${isReceipt ? "OFFICIAL RECEIPT" : "INVOICE"}</div>
        <div class="doc-ref">
          ${
            isReceipt
              ? `
            <div class="doc-ref-row"><span>Receipt No:</span><strong>${escapeHtml(receiptNo)}</strong></div>
            <div class="doc-ref-row"><span>Invoice Ref:</span><strong>${escapeHtml(invoice.invoice_number)}</strong></div>
            <div class="doc-ref-row"><span>Date Paid:</span><strong>${escapeHtml(paidDate)}</strong></div>
            <div class="doc-ref-row"><span>Status:</span><strong>PAID IN FULL</strong></div>
          `
              : `
            <div class="doc-ref-row"><span>Invoice No:</span><strong>${escapeHtml(invoice.invoice_number)}</strong></div>
            <div class="doc-ref-row"><span>Issue Date:</span><strong>${escapeHtml(formatDate(invoice.issue_date))}</strong></div>
            <div class="doc-ref-row"><span>Due Date:</span><strong>${escapeHtml(formatDate(invoice.due_date))}</strong></div>
            <div class="doc-ref-row"><span>Status:</span><strong>${escapeHtml(status)}</strong></div>
          `
          }
        </div>
      </div>
    </header>

    <div class="body-wrap">
      ${
        isReceipt
          ? `
        <div class="receipt-banner">
          <div class="receipt-banner-left">
            <h3>Payment Acknowledged &amp; Verified</h3>
            <p>Received with thanks from <strong>${escapeHtml(customer?.company_name || customer?.contact_person || "Valued Client")}</strong> in settlement of Invoice ${escapeHtml(invoice.invoice_number)}.</p>
          </div>
          <div class="receipt-banner-right">
            <span>Amount Received</span>
            <strong>KES ${money(invoice.total_amount)}</strong>
          </div>
        </div>
      `
          : ""
      }

      <div class="grid-2">
        <div class="panel panel-tinted">
          <div class="panel-head">
            <span>${isReceipt ? "Received From (Client)" : "Billed To (Client)"}</span>
            <span>Client Account</span>
          </div>
          <div class="client-name">${escapeHtml(customer?.company_name || customer?.contact_person || "Valued Commercial Client")}</div>
          ${customer?.company_name && customer?.contact_person ? `<div class="info-line"><strong>Attention:</strong> ${escapeHtml(customer.contact_person)}</div>` : ""}
          ${customer?.address ? `<div class="info-line"><strong>Address:</strong> ${escapeHtml(customer.address)}</div>` : ""}
          ${[customer?.city, customer?.country].filter(Boolean).length ? `<div class="info-line"><strong>Location:</strong> ${escapeHtml([customer?.city, customer?.country].filter(Boolean).join(", "))}</div>` : ""}
          ${customer?.phone ? `<div class="info-line"><strong>Phone:</strong> ${escapeHtml(customer.phone)}</div>` : ""}
          ${customer?.email ? `<div class="info-line"><strong>Email:</strong> ${escapeHtml(customer.email)}</div>` : ""}
        </div>

        <div class="panel">
          <div class="panel-head">
            <span>${isReceipt ? "Settlement Metadata" : "Billing &amp; Terms Summary"}</span>
            <span>${escapeHtml(COMPANY.currency)}</span>
          </div>
          <div class="info-line"><strong>Document Reference:</strong> ${escapeHtml(isReceipt ? receiptNo : invoice.invoice_number)}</div>
          <div class="info-line"><strong>Linked Invoice:</strong> ${escapeHtml(invoice.invoice_number)}</div>
          <div class="info-line"><strong>Payment Terms:</strong> ${escapeHtml(invoice.payment_terms || "30 Days")}</div>
          <div class="info-line"><strong>Issue Date:</strong> ${escapeHtml(formatDate(invoice.issue_date))}</div>
          <div class="info-line"><strong>${isReceipt ? "Settlement Date:" : "Payment Due Date:"}</strong> ${escapeHtml(isReceipt ? paidDate : formatDate(invoice.due_date))}</div>
        </div>
      </div>

      <section class="section-block">
        <div class="block-heading">
          <h2>${isReceipt ? "Itemized Schedule of Settled Supplies &amp; Works" : "Itemized Schedule of Supplies &amp; Engineering Works"}</h2>
          <span>${(invoice.invoice_items || []).length} Line Items · Values in KES</span>
        </div>
        <table class="boq">
          <thead>
            <tr>
              <th class="c-num">Item</th>
              <th>Description &amp; Project Specification</th>
              <th class="c-unit">Unit</th>
              <th class="c-qty">Qty</th>
              <th class="c-money">Unit Price (KES)</th>
              <th class="c-money">Amount (KES)</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </section>

      <div class="financial-footer">
        <div>
          <div class="words-box">
            <div class="words-label">${isReceipt ? "Amount Received in Words" : "Total Invoice Amount in Words"}</div>
            <div class="words-text">${escapeHtml(numberToWordsKES(invoice.total_amount))}</div>
          </div>
          <div class="remittance-box">
            <strong>${isReceipt ? "Payment &amp; Remittance Record" : "Official Payment &amp; Remittance Instructions"}</strong>${escapeHtml(paymentDetailsText)}
          </div>
        </div>

        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal</span>
            <strong>KES ${money(invoice.subtotal)}</strong>
          </div>
          ${
            invoice.discount_amount && invoice.discount_amount > 0
              ? `
            <div class="totals-row">
              <span>Commercial Discount</span>
              <strong>− KES ${money(invoice.discount_amount)}</strong>
            </div>`
              : ""
          }
          <div class="totals-row">
            <span>${invoice.tax_amount && invoice.tax_amount > 0 ? `VAT (${escapeHtml(invoice.tax_rate || 0)}%)` : "VAT"}</span>
            <strong>${invoice.tax_amount && invoice.tax_amount > 0 ? `KES ${money(invoice.tax_amount)}` : "Exempt / Not Applied"}</strong>
          </div>
          <div class="totals-grand">
            <span>${isReceipt ? "TOTAL PAID" : "TOTAL DUE"}</span>
            <span>KES ${money(invoice.total_amount)}</span>
          </div>
          ${
            isReceipt
              ? `
            <div class="totals-row" style="background:#ecfdf5;">
              <span style="color:#065f46;font-weight:800;">Balance Due</span>
              <strong style="color:#065f46;">KES 0.00 (NIL)</strong>
            </div>`
              : ""
          }
        </div>
      </div>

      ${
        invoice.notes
          ? `
        <div class="terms-box">
          <div class="terms-title">Project &amp; Billing Notes</div>
          <div class="terms-content">${escapeHtml(invoice.notes)}</div>
        </div>`
          : ""
      }

      ${
        !isReceipt
          ? `
        <div class="terms-box">
          <div class="terms-title">Commercial Terms &amp; Conditions</div>
          <div class="terms-content">${escapeHtml(termsText)}</div>
        </div>`
          : ""
      }

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-title">${isReceipt ? "Issued By (Finance &amp; Accounts)" : "Authorized Finance Signatory"}</div>
          <div class="sig-sub">For: ${escapeHtml(COMPANY.name)}</div>
        </div>
        <div class="stamp-ring">
          <strong>${escapeHtml(COMPANY.name)}</strong>
          <span>${isReceipt ? "OFFICIAL RECEIPT · PAID" : "VERIFIED INVOICE"}</span>
          <span>${escapeHtml(isReceipt ? receiptNo : invoice.invoice_number)}</span>
        </div>
        <div class="sig-block">
          <div class="sig-title">${isReceipt ? "Client Copy Acknowledgment" : "Client Acknowledgment"}</div>
          <div class="sig-sub">Name, Signature &amp; Date</div>
        </div>
      </div>

      <footer class="doc-footer">
        <span><strong>${escapeHtml(COMPANY.name)}</strong> · ${escapeHtml(COMPANY.website)}</span>
        <span>${isReceipt ? `Official Receipt: ${escapeHtml(receiptNo)} (Ref: ${escapeHtml(invoice.invoice_number)})` : `Invoice Ref: ${escapeHtml(invoice.invoice_number)}`}</span>
      </footer>
    </div>
  </div>
</body>
</html>`;
  };

  const openPrintWindow = async (
    invoice: Invoice,
    mode: "invoice" | "receipt" = "invoice",
    closeAfterPrint = false,
  ) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow)
      throw new Error(
        "Please allow pop-ups to print or download the PDF document.",
      );
    printWindow.document.write(generateDocumentHtml(invoice, mode));
    printWindow.document.close();
    await new Promise((resolve) => setTimeout(resolve, 600));
    printWindow.focus();
    printWindow.print();
    if (closeAfterPrint) setTimeout(() => printWindow.close(), 500);
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice, "invoice", false);
      toast({
        title: "Invoice PDF Ready",
        description: `Invoice ${invoice.invoice_number} is ready to save as PDF.`,
      });
    } catch (error: any) {
      toast({
        title: "PDF Error",
        description: error?.message || "Could not open the PDF print view.",
        variant: "destructive",
      });
    }
  };

  const printInvoice = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice, "invoice", true);
    } catch (error: any) {
      toast({
        title: "Print Error",
        description: error?.message || "Could not initiate printing.",
        variant: "destructive",
      });
    }
  };

  const downloadReceiptPDF = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice, "receipt", false);
      toast({
        title: "Official Receipt PDF Ready",
        description: `Receipt ${getReceiptNumber(invoice.invoice_number)} is ready to save as PDF.`,
      });
    } catch (error: any) {
      toast({
        title: "Receipt PDF Error",
        description:
          error?.message || "Could not open the Receipt PDF print view.",
        variant: "destructive",
      });
    }
  };

  const printReceipt = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice, "receipt", true);
    } catch (error: any) {
      toast({
        title: "Print Error",
        description: error?.message || "Could not initiate receipt printing.",
        variant: "destructive",
      });
    }
  };

  return {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF,
    printInvoice,
    downloadReceiptPDF,
    printReceipt,
  };
};
