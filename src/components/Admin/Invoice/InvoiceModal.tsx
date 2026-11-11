import React, { useState } from "react";
import {
  CheckCircle,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Link2,
  Printer,
  Send,
  X,
  Building2,
} from "lucide-react";
import { Invoice, InvoiceItem } from "../types/InvoiceTypes";
import { formatCurrency, formatDate } from "../utils/formatters";
import StatusBadge from "./StatusBadge";
import {
  COMPANY,
  getLogoUrl,
  numberToWordsKES,
} from "../shared/companyBrand";
import { getReceiptNumber } from "@/hooks/useInvoiceOperations";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface InvoiceModalProps {
  invoice: Invoice;
  initialMode?: "invoice" | "receipt";
  onClose: () => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPrintInvoice?: (invoice: Invoice) => void;
  onDownloadReceiptPDF?: (invoice: Invoice) => void;
  onPrintReceipt?: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: string) => void;
}

type ProjectGroup = {
  name: string;
  subtitle: string;
  link: string;
  items: InvoiceItem[];
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  initialMode,
  onClose,
  onDownloadPDF,
  onPrintInvoice,
  onDownloadReceiptPDF,
  onPrintReceipt,
  onUpdateStatus,
}) => {
  const { toast } = useToast();
  const [docMode, setDocMode] = useState<"invoice" | "receipt">(
    initialMode || (invoice.status === "paid" ? "receipt" : "invoice"),
  );

  const isReceipt = docMode === "receipt";
  const receiptNo = getReceiptNumber(invoice.invoice_number);
  const paidDate = formatDate(
    invoice.paid_at || invoice.updated_at || invoice.issue_date,
  );

  const projects = (invoice.invoice_items || []).reduce<ProjectGroup[]>(
    (groups, item) => {
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
      return groups;
    },
    [],
  );

  const paymentDetailsText =
    invoice.payment_details?.trim() || COMPANY.defaultPaymentDetails;
  const termsText =
    invoice.terms_and_conditions?.trim() || COMPANY.defaultInvoiceTerms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Top Action & Mode Switcher Bar */}
        <header className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setDocMode("invoice")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  !isReceipt
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Commercial Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocMode("receipt")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isReceipt
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                Official Receipt ({receiptNo})
              </button>
            </div>
            <StatusBadge status={invoice.status || "draft"} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isReceipt ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onPrintReceipt
                      ? onPrintReceipt(invoice)
                      : onPrintInvoice?.(invoice)
                  }
                  className="h-8 text-xs"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print Receipt
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    onDownloadReceiptPDF
                      ? onDownloadReceiptPDF(invoice)
                      : onDownloadPDF(invoice)
                  }
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Receipt PDF
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPrintInvoice?.(invoice)}
                  className="h-8 text-xs"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print Invoice
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDownloadPDF(invoice)}
                  className="h-8 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Invoice PDF
                </Button>
              </>
            )}

            {invoice.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onUpdateStatus(invoice.id, "sent");
                  onClose();
                }}
                className="h-8 text-xs border-primary/40 text-primary"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Mark Sent
              </Button>
            )}

            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Button
                size="sm"
                onClick={() => {
                  onUpdateStatus(invoice.id, "paid");
                  setDocMode("receipt");
                }}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Mark Paid &amp; Issue Receipt
              </Button>
            )}

            <button
              onClick={onClose}
              className="ml-1 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Scrollable A4 Document Sheet */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-3 sm:p-6">
          <article className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-xl">
            {/* Corporate Masthead */}
            <header
              className={`px-6 py-7 text-white border-b-4 border-[#c59b27] sm:px-9 ${
                isReceipt
                  ? "bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669]"
                  : "bg-gradient-to-r from-[#0d281e] via-[#1b4332] to-[#2d6a4f]"
              }`}
            >
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2.5 shadow-md">
                    <img
                      src={getLogoUrl({ forPrint: true })}
                      alt={COMPANY.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {COMPANY.name}
                    </h1>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-200">
                      {COMPANY.tagline}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
                      {COMPANY.address}
                      <br />
                      Tel: {COMPANY.phone} · Email: {COMPANY.email} ·{" "}
                      {COMPANY.website}
                    </p>
                  </div>
                </div>

                <div className="sm:min-w-[225px] sm:text-right">
                  <span className="inline-block rounded-full border border-amber-300/40 bg-white/10 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
                    {isReceipt
                      ? "Official Finance Voucher"
                      : "Commercial Billing Document"}
                  </span>
                  <h2 className="mt-1.5 text-2xl font-black tracking-[0.06em] text-white sm:text-3xl">
                    {isReceipt ? "OFFICIAL RECEIPT" : "INVOICE"}
                  </h2>
                  <div className="mt-3 rounded-lg border border-white/20 bg-slate-950/35 px-3.5 py-2.5 text-left text-[11px] space-y-1">
                    {isReceipt ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Receipt No:</span>
                          <strong className="font-mono text-white">
                            {receiptNo}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Invoice Ref:</span>
                          <strong className="font-mono text-white">
                            {invoice.invoice_number}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Date Paid:</span>
                          <strong className="text-white">{paidDate}</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Invoice No:</span>
                          <strong className="font-mono text-white">
                            {invoice.invoice_number}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Issue Date:</span>
                          <strong className="text-white">
                            {formatDate(invoice.issue_date)}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-300">Due Date:</span>
                          <strong className="text-white">
                            {formatDate(invoice.due_date)}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="px-6 py-7 sm:px-9 sm:py-8 space-y-6">
              {/* Receipt Verified Banner */}
              {isReceipt && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/90 p-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      Payment Acknowledged &amp; Verified
                    </h3>
                    <p className="mt-1 text-xs text-emerald-800">
                      Received with thanks from{" "}
                      <strong>
                        {invoice.customer?.company_name ||
                          invoice.customer?.contact_person ||
                          "Valued Client"}
                      </strong>{" "}
                      in settlement of Invoice{" "}
                      <span className="font-mono font-bold">
                        {invoice.invoice_number}
                      </span>
                      .
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                      Amount Received
                    </span>
                    <strong className="text-xl font-black tabular-nums text-emerald-950">
                      {formatCurrency(invoice.total_amount)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Client & Billing Metadata Grid */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1b4332]">
                      {isReceipt
                        ? "Received From (Client)"
                        : "Billed To (Client)"}
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-[#2d6a4f]" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {invoice.customer?.company_name ||
                      invoice.customer?.contact_person ||
                      "Valued Commercial Client"}
                  </p>
                  {invoice.customer?.company_name &&
                    invoice.customer?.contact_person && (
                      <p className="mt-1 text-xs text-slate-700">
                        <span className="font-semibold">Attention:</span>{" "}
                        {invoice.customer.contact_person}
                      </p>
                    )}
                  <div className="mt-1.5 space-y-0.5 text-xs text-slate-600">
                    {invoice.customer?.address && (
                      <p>{invoice.customer.address}</p>
                    )}
                    {(invoice.customer?.city || invoice.customer?.country) && (
                      <p>
                        {[invoice.customer?.city, invoice.customer?.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {invoice.customer?.phone && (
                      <p>Tel: {invoice.customer.phone}</p>
                    )}
                    {invoice.customer?.email && (
                      <p>Email: {invoice.customer.email}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1b4332]">
                      {isReceipt
                        ? "Settlement Particulars"
                        : "Billing & Terms Summary"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      KES
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Document Reference:</span>
                      <strong className="font-mono text-slate-900">
                        {isReceipt ? receiptNo : invoice.invoice_number}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Linked Invoice:</span>
                      <strong className="font-mono text-slate-900">
                        {invoice.invoice_number}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Terms:</span>
                      <strong className="text-slate-900">
                        {invoice.payment_terms || "30 Days"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <strong className="text-slate-900">
                        {formatDate(invoice.issue_date)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {isReceipt ? "Settlement Date:" : "Due Date:"}
                      </span>
                      <strong className="text-slate-900">
                        {isReceipt ? paidDate : formatDate(invoice.due_date)}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* Itemized Table */}
              <section>
                <div className="mb-2 flex items-end justify-between border-b-2 border-[#12372a] pb-1.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#12372a]">
                    {isReceipt
                      ? "Schedule of Settled Supplies & Engineering Works"
                      : "Itemized Schedule of Supplies & Engineering Works"}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {(invoice.invoice_items || []).length} Line Items
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                    <thead>
                      <tr
                        className={`text-[10px] uppercase tracking-wider text-white ${
                          isReceipt ? "bg-[#064e3b]" : "bg-[#12372a]"
                        }`}
                      >
                        <th className="w-12 px-2.5 py-2.5 text-center">Item</th>
                        <th className="px-3 py-2.5">
                          Description &amp; Project Specification
                        </th>
                        <th className="w-16 px-2 py-2.5 text-center">Unit</th>
                        <th className="w-16 px-2 py-2.5 text-center">Qty</th>
                        <th className="w-28 px-3 py-2.5 text-right">
                          Unit Price (KES)
                        </th>
                        <th className="w-28 px-3 py-2.5 text-right">
                          Amount (KES)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project, projectIndex) => {
                        const pCode = String(projectIndex + 1).padStart(2, "0");
                        const projectSubtotal = project.items.reduce(
                          (sum, item) => sum + Number(item.total || 0),
                          0,
                        );
                        return (
                          <React.Fragment key={`${project.name}-${projectIndex}`}>
                            <tr className="border-y border-emerald-200 bg-[#eef5f0]">
                              <td
                                colSpan={6}
                                className="px-3 py-2 text-[11px] font-extrabold text-[#12372a]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span>
                                      PACKAGE {pCode}:{" "}
                                      {project.name.toUpperCase()}
                                    </span>
                                    {project.subtitle && (
                                      <span className="font-normal text-slate-600">
                                        {" "}
                                        — {project.subtitle}
                                      </span>
                                    )}
                                    {project.link && (
                                      <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-700 underline"
                                      >
                                        <Link2 className="h-2.5 w-2.5" /> Link
                                      </a>
                                    )}
                                  </div>
                                  <span className="font-mono">
                                    SUBTOTAL: {formatCurrency(projectSubtotal)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {project.items.map((item, itemIdx) => {
                              const code = `${projectIndex + 1}.${String(itemIdx + 1).padStart(2, "0")}`;
                              return (
                                <tr
                                  key={item.id || itemIdx}
                                  className="border-t border-slate-200 align-top even:bg-slate-50/70"
                                >
                                  <td className="px-2.5 py-2.5 text-center font-mono text-[11px] font-bold text-slate-500">
                                    {code}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <p className="font-bold text-slate-900">
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p className="mt-0.5 text-[11px] text-slate-600">
                                        {item.description}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-600">
                                    {item.unit || "pcs"}
                                  </td>
                                  <td className="px-2 py-2.5 text-center font-bold tabular-nums text-slate-800">
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                                    {formatCurrency(item.unit_price)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">
                                    {formatCurrency(item.total)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Financial Summary & Words */}
              <section className="grid gap-5 pt-2 sm:grid-cols-[1.15fr_0.85fr] items-start">
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 border-l-4 border-l-[#c59b27] bg-[#fbf7eb] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-900">
                      {isReceipt
                        ? "Amount Received in Words"
                        : "Total Invoice Amount in Words"}
                    </p>
                    <p className="mt-1 text-xs font-bold italic text-slate-900">
                      {numberToWordsKES(invoice.total_amount)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 whitespace-pre-line">
                    <strong className="block text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-[#1b4332] mb-1">
                      {isReceipt
                        ? "Payment & Remittance Record"
                        : "Official Payment & Remittance Instructions"}
                    </strong>
                    {paymentDetailsText}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-[#12372a]">
                  <div className="space-y-2.5 px-4 py-3.5 text-xs">
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span className="font-semibold">Subtotal</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    {!!invoice.discount_amount &&
                      invoice.discount_amount > 0 && (
                        <div className="flex justify-between gap-4 text-rose-700 border-t border-slate-200 pt-2">
                          <span className="font-semibold">Discount</span>
                          <span className="font-bold tabular-nums">
                            − {formatCurrency(invoice.discount_amount)}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between gap-4 text-slate-600 border-t border-slate-200 pt-2">
                      <span className="font-semibold">
                        {invoice.tax_amount && invoice.tax_amount > 0
                          ? `VAT (${invoice.tax_rate || 0}%)`
                          : "VAT"}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {invoice.tax_amount && invoice.tax_amount > 0
                          ? formatCurrency(invoice.tax_amount)
                          : "Exempt / Not Applied"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-between gap-3 px-4 py-3.5 text-white ${
                      isReceipt ? "bg-[#064e3b]" : "bg-[#12372a]"
                    }`}
                  >
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em]">
                      {isReceipt ? "Total Paid" : "Total Due"}
                    </span>
                    <span className="text-base font-black tabular-nums">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                  {isReceipt && (
                    <div className="flex justify-between bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-900">
                      <span>Balance Due</span>
                      <span>KES 0.00 (NIL)</span>
                    </div>
                  )}
                </div>
              </section>

              {invoice.notes && (
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#12372a]">
                    Project &amp; Billing Notes
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-xs text-slate-600">
                    {invoice.notes}
                  </p>
                </section>
              )}

              {!isReceipt && (
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#12372a]">
                    Commercial Terms &amp; Conditions
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-xs text-slate-600">
                    {termsText}
                  </p>
                </section>
              )}

              {/* Sign-Off & Stamp */}
              <section className="pt-6 grid grid-cols-1 sm:grid-cols-[1fr_150px_1fr] gap-6 items-end">
                <div className="border-t-2 border-slate-800 pt-2">
                  <p className="text-[11px] font-extrabold text-slate-900">
                    {isReceipt
                      ? "Issued By (Finance & Accounts)"
                      : "Authorized Finance Signatory"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    For: {COMPANY.name}
                  </p>
                </div>

                <div
                  className={`mx-auto flex h-20 w-36 flex-col items-center justify-center rounded-lg border-2 p-2 text-center ${
                    isReceipt
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-dashed border-[#1b4332] bg-emerald-50/60 text-[#1b4332]"
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {COMPANY.name}
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold text-emerald-700">
                    {isReceipt ? "OFFICIAL RECEIPT · PAID" : "VERIFIED INVOICE"}
                  </span>
                  <span className="mt-0.5 font-mono text-[8px] text-slate-600">
                    {isReceipt ? receiptNo : invoice.invoice_number}
                  </span>
                </div>

                <div className="border-t-2 border-slate-800 pt-2">
                  <p className="text-[11px] font-extrabold text-slate-900">
                    Client Acknowledgment
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Name, Signature &amp; Date
                  </p>
                </div>
              </section>
            </div>
          </article>
        </div>

        {/* Footer Quick Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              const ref = isReceipt ? receiptNo : invoice.invoice_number;
              void navigator.clipboard.writeText(ref);
              toast({
                title: "Reference Copied",
                description: `${ref} copied to clipboard.`,
              });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy {isReceipt ? "Receipt" : "Invoice"} Reference
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Preview
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InvoiceModal;
