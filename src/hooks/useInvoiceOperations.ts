import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/Admin/types/InvoiceTypes";
import { COMPANY, getLogoUrl } from "@/components/Admin/shared/companyBrand";
import { formatCurrency, formatDate } from "@/components/Admin/utils/formatters";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
      const name = item.project_name || "Project items";
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

export const useInvoiceOperations = (onSuccess?: () => void) => {
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
      onSuccess?.();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
      if (error) throw error;
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const generateInvoiceContent = (invoice: Invoice) => {
    const projects = groupItemsByProject(invoice);
    const customer = invoice.customer;
    const projectMarkup = projects.length
      ? projects
          .map((project, projectIndex) => {
            const projectSubtotal = project.items.reduce(
              (sum, item) => sum + Number(item.total || 0),
              0,
            );
            const rows = project.items
              .map(
                (item) => `
                  <tr>
                    <td><strong>${escapeHtml(item.name)}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ""}</td>
                    <td class="center">${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "")}</td>
                    <td class="amount">${escapeHtml(formatCurrency(item.unit_price))}</td>
                    <td class="amount strong">${escapeHtml(formatCurrency(item.total))}</td>
                  </tr>`,
              )
              .join("");
            return `
              <section class="project">
                <div class="project-head">
                  <div>
                    <div class="eyebrow">Project ${projectIndex + 1}</div>
                    <h3>${escapeHtml(project.name)}</h3>
                    ${project.subtitle ? `<p>${escapeHtml(project.subtitle)}</p>` : ""}
                    ${project.link ? `<a href="${escapeHtml(project.link)}">${escapeHtml(project.link)}</a>` : ""}
                  </div>
                  <div class="project-subtotal">Subtotal<br><strong>${escapeHtml(formatCurrency(projectSubtotal))}</strong></div>
                </div>
                <table class="items">
                  <thead><tr><th>Description</th><th class="center">Qty</th><th class="amount">Unit price</th><th class="amount">Amount</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </section>`;
          })
          .join("")
      : `<div class="empty">No invoice items recorded.</div>`;

    const block = (title: string, content: string) =>
      content
        ? `<section class="info-block"><div class="eyebrow">${title}</div><div>${content}</div></section>`
        : "";

    return `<!doctype html>
      <html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoice.invoice_number)} - ${escapeHtml(COMPANY.name)}</title>
      <style>
        @page { size: A4 portrait; margin: 13mm; }
        :root { color-scheme: light; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; color: #20312a; background: #fff; font: 12px/1.45 Arial, Helvetica, sans-serif; }
        .sheet { max-width: 190mm; margin: 0 auto; }
        .topbar { padding: 23px 26px; color: white; background: #123b2c; border-bottom: 5px solid #d8a62a; }
        .topbar-inner { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
        .brand { display: flex; gap: 13px; align-items: center; }
        .logo { width: 51px; height: 51px; padding: 8px; background: white; border-radius: 10px; }
        .brand h1 { margin: 0 0 3px; font: 700 21px Georgia, serif; }
        .tagline { color: #d7e9dc; font-size: 11px; }
        .contact { margin-top: 8px; color: #c5dbcd; font-size: 10px; }
        .invoice-label { text-align: right; }
        .invoice-label h2 { margin: 0 0 8px; letter-spacing: .13em; font-size: 21px; }
        .meta { min-width: 155px; padding: 9px 11px; border: 1px solid rgba(255,255,255,.28); border-radius: 8px; font-size: 10px; }
        .meta-row { display: flex; justify-content: space-between; gap: 15px; padding: 2px 0; }
        .meta-row span:first-child { color: #c5dbcd; }
        .content { padding: 24px 26px 30px; }
        .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
        .address-card { padding: 13px; border: 1px solid #dbe5df; border-radius: 8px; background: #f7faf8; min-height: 105px; }
        .eyebrow { color: #a77708; font-size: 9px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
        .address-card h3 { margin: 5px 0 7px; font-size: 13px; }
        .address-card p { margin: 3px 0; color: #64736b; }
        .section-title { margin: 0 0 4px; font-size: 12px; }
        .section-copy { margin: 0 0 12px; color: #64736b; }
        .project { margin: 0 0 17px; overflow: hidden; border: 1px solid #dbe5df; border-radius: 8px; page-break-inside: avoid; }
        .project-head { display: flex; justify-content: space-between; gap: 18px; padding: 12px 13px; background: #f1f6f2; border-bottom: 1px solid #dbe5df; }
        .project-head h3 { margin: 4px 0 2px; font-size: 14px; }
        .project-head p { margin: 0; color: #64736b; }
        .project-head a { display: inline-block; margin-top: 3px; color: #2d6a4f; font-size: 10px; word-break: break-all; }
        .project-subtotal { min-width: 95px; text-align: right; color: #64736b; font-size: 10px; }
        .project-subtotal strong { color: #20312a; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 8px 10px; color: white; background: #1b503b; font-size: 9px; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
        td { padding: 8px 10px; border-bottom: 1px solid #edf1ee; vertical-align: top; }
        td small { display: block; margin-top: 2px; color: #718078; }
        .center { text-align: center; white-space: nowrap; }
        .amount { text-align: right; white-space: nowrap; }
        .strong { font-weight: 700; }
        .empty { padding: 18px; border: 1px solid #dbe5df; color: #64736b; text-align: center; }
        .summary-wrap { display: flex; justify-content: flex-end; margin: 4px 0 20px; }
        .summary { width: 240px; border: 1px solid #dbe5df; border-radius: 8px; overflow: hidden; }
        .summary-row { display: flex; justify-content: space-between; gap: 14px; padding: 8px 11px; border-bottom: 1px solid #e5ece7; }
        .summary-row span:first-child { color: #64736b; }
        .grand-total { display: flex; justify-content: space-between; padding: 12px 11px; color: white; background: #123b2c; font-size: 14px; font-weight: 700; }
        .info-block { margin-top: 13px; padding: 12px 13px; border: 1px solid #dbe5df; border-radius: 8px; page-break-inside: avoid; }
        .info-content { margin-top: 5px; white-space: pre-wrap; color: #53635b; }
        .footer { margin-top: 26px; padding-top: 13px; border-top: 1px solid #dbe5df; color: #718078; text-align: center; font-size: 10px; }
        @media print { .no-print { display: none !important; } }
        @media (max-width: 650px) { .topbar-inner, .project-head { flex-direction: column; } .invoice-label { text-align: left; } .addresses { grid-template-columns: 1fr; } .summary-wrap { justify-content: stretch; } .summary { width: 100%; } }
      </style></head>
      <body><main class="sheet">
        <header class="topbar"><div class="topbar-inner"><div class="brand"><img class="logo" src="${getLogoUrl()}" alt="${escapeHtml(COMPANY.name)}"><div><h1>${escapeHtml(COMPANY.name)}</h1><div class="tagline">${escapeHtml(COMPANY.tagline)}</div><div class="contact">${escapeHtml(COMPANY.address)} · ${escapeHtml(COMPANY.phone)} · ${escapeHtml(COMPANY.email)}</div></div></div><div class="invoice-label"><h2>INVOICE</h2><div class="meta"><div class="meta-row"><span>Invoice no.</span><strong>${escapeHtml(invoice.invoice_number)}</strong></div><div class="meta-row"><span>Issue date</span><strong>${escapeHtml(formatDate(invoice.issue_date))}</strong></div><div class="meta-row"><span>Due date</span><strong>${escapeHtml(formatDate(invoice.due_date))}</strong></div><div class="meta-row"><span>Status</span><strong>${escapeHtml((invoice.status || "draft").toUpperCase())}</strong></div></div></div></div></header>
        <div class="content">
          <div class="addresses"><div class="address-card"><div class="eyebrow">From</div><h3>${escapeHtml(COMPANY.name)}</h3><p>${escapeHtml(COMPANY.address)}</p><p>${escapeHtml(COMPANY.phone)}</p><p>${escapeHtml(COMPANY.email)}</p></div><div class="address-card"><div class="eyebrow">Bill to</div><h3>${escapeHtml(customer?.company_name || customer?.contact_person || "Customer")}</h3><p>${escapeHtml(customer?.contact_person || "")}</p><p>${escapeHtml(customer?.address || "")}</p><p>${escapeHtml([customer?.city, customer?.country].filter(Boolean).join(", "))}</p><p>${escapeHtml(customer?.email || "")}</p></div></div>
          <h3 class="section-title">Project breakdown</h3><p class="section-copy">Services and materials are grouped by project for easier review.</p>
          ${projectMarkup}
          <div class="summary-wrap"><div class="summary"><div class="summary-row"><span>Subtotal</span><strong>${escapeHtml(formatCurrency(invoice.subtotal))}</strong></div>${invoice.discount_amount && invoice.discount_amount > 0 ? `<div class="summary-row"><span>Discount</span><strong>− ${escapeHtml(formatCurrency(invoice.discount_amount))}</strong></div>` : ""}<div class="summary-row"><span>${invoice.tax_amount && invoice.tax_amount > 0 ? `VAT (${escapeHtml(invoice.tax_rate || 0)}%)` : "VAT"}</span><strong>${invoice.tax_amount && invoice.tax_amount > 0 ? escapeHtml(formatCurrency(invoice.tax_amount)) : "Not applied"}</strong></div><div class="grand-total"><span>Total due</span><span>${escapeHtml(formatCurrency(invoice.total_amount))}</span></div></div></div>
          ${invoice.payment_details ? block("Payment details", `<div class="info-content">${escapeHtml(invoice.payment_details)}</div>`) : ""}
          ${invoice.notes ? block("Additional notes", `<div class="info-content">${escapeHtml(invoice.notes)}</div>`) : ""}
          ${invoice.terms_and_conditions ? block("Terms and conditions", `<div class="info-content">${escapeHtml(invoice.terms_and_conditions)}</div>`) : ""}
          <div class="footer">Thank you for your business · ${escapeHtml(COMPANY.name)} · ${escapeHtml(COMPANY.email)}</div>
        </div>
      </main></body></html>`;
  };

  const openPrintWindow = async (invoice: Invoice, closeAfterPrint = false) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) throw new Error("Please allow pop-ups to print or download the invoice.");
    printWindow.document.write(generateInvoiceContent(invoice));
    printWindow.document.close();
    await new Promise((resolve) => setTimeout(resolve, 650));
    printWindow.focus();
    printWindow.print();
    if (closeAfterPrint) setTimeout(() => printWindow.close(), 500);
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(error instanceof Error ? error.message : "Could not open the PDF print view.");
    }
  };

  const printInvoice = async (invoice: Invoice) => {
    try {
      await openPrintWindow(invoice, true);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  return { updateInvoiceStatus, deleteInvoice, downloadInvoicePDF, printInvoice };
};