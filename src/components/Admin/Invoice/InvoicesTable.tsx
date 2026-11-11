import React from "react";
import {
  FileText,
  Eye,
  Edit,
  Download,
  Printer,
  Send,
  CheckCircle2,
  Trash2,
  Receipt,
  Building2,
  Calendar,
} from "lucide-react";
import { Invoice } from "../types/InvoiceTypes";
import { formatCurrency } from "../utils/formatters";
import StatusBadge from "./StatusBadge";
import { getReceiptNumber } from "@/hooks/useInvoiceOperations";
import { Button } from "@/components/ui/button";

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onViewReceipt?: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onDownloadReceiptPDF?: (invoice: Invoice) => void;
  onPrintInvoice?: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  getDaysOverdue: (dueDate: string, status: string) => number;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onViewInvoice,
  onViewReceipt,
  onEditInvoice,
  onDownloadPDF,
  onDownloadReceiptPDF,
  onPrintInvoice,
  onUpdateStatus,
  onDeleteInvoice,
  getDaysOverdue,
}) => {
  const formatCompactDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 py-16 px-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">
          No billing documents match your filter
        </h3>
        <p className="text-muted-foreground text-xs max-w-md mx-auto">
          Create a new commercial invoice or adjust your search query and status filter above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3.5">Document Ref</th>
              <th className="px-4 py-3.5">Client / Account</th>
              <th className="px-4 py-3.5">Issue & Due Schedule</th>
              <th className="px-4 py-3.5 text-center">Settlement Status</th>
              <th className="px-4 py-3.5 text-right">Total Valuation</th>
              <th className="px-4 py-3.5 text-right">Actions & PDFs</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {invoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(
                invoice.due_date,
                invoice.status || "draft",
              );
              const isPaid = invoice.status === "paid";
              const isOverdue = daysOverdue > 0 && !isPaid;
              const receiptNo = getReceiptNumber(invoice.invoice_number);

              return (
                <tr
                  key={invoice.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  {/* Document Ref */}
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {isPaid ? (
                          <Receipt className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewInvoice(invoice)}
                          className="font-mono text-xs font-bold text-primary hover:underline block"
                        >
                          {invoice.invoice_number}
                        </button>
                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() =>
                              onViewReceipt
                                ? onViewReceipt(invoice)
                                : onViewInvoice(invoice)
                            }
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                            title="Open Official Payment Receipt"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {receiptNo}
                          </button>
                        ) : (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {invoice.invoice_items?.length || 0} line item
                            {(invoice.invoice_items?.length || 0) === 1
                              ? ""
                              : "s"}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-4 align-top">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {invoice.customer?.company_name ||
                            invoice.customer?.contact_person ||
                            "Valued Corporate Client"}
                        </span>
                      </div>
                      {invoice.customer?.contact_person && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          Attn: {invoice.customer.contact_person}
                        </div>
                      )}
                      {invoice.customer?.email && (
                        <div className="text-[11px] text-muted-foreground/80 truncate">
                          {invoice.customer.email}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="px-4 py-4 align-top text-xs">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Issued: {formatCompactDate(invoice.issue_date)}</span>
                    </div>
                    <div
                      className={`mt-1 text-[11px] font-medium ${
                        isOverdue
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isPaid && invoice.paid_at
                        ? `Paid: ${formatCompactDate(invoice.paid_at)}`
                        : `Due: ${formatCompactDate(invoice.due_date)}`}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 align-top text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <StatusBadge status={invoice.status || "draft"} />
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          {daysOverdue}d past due
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 align-top text-right">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {invoice.tax_amount && invoice.tax_amount > 0
                        ? `Incl. VAT ${formatCurrency(invoice.tax_amount)}`
                        : "VAT Excl. / Zero"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewInvoice(invoice)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title="Preview Invoice / Receipt"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden xl:inline">Preview</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadPDF(invoice)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title="Download Commercial Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden xl:inline">Invoice PDF</span>
                      </Button>

                      {/* Official Receipt Button */}
                      {onDownloadReceiptPDF && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            isPaid
                              ? onDownloadReceiptPDF(invoice)
                              : onViewReceipt
                                ? onViewReceipt(invoice)
                                : onDownloadReceiptPDF(invoice)
                          }
                          className={`h-8 px-2.5 rounded-lg text-xs gap-1 ${
                            isPaid
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={
                            isPaid
                              ? `Download Official Receipt (${receiptNo})`
                              : "Preview Official Receipt layout"
                          }
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Receipt PDF</span>
                        </Button>
                      )}

                      {onPrintInvoice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPrintInvoice(invoice)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {invoice.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateStatus(invoice.id, "sent")}
                          className="h-8 w-8 rounded-lg text-sky-600 hover:bg-sky-500/10"
                          title="Mark as Sent to Client"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {!isPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdateStatus(invoice.id, "paid")}
                          className="h-8 px-2 rounded-lg text-xs gap-1 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
                          title="Record Payment & Issue Official Receipt"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden 2xl:inline">Mark Paid</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditInvoice(invoice)}
                        disabled={isPaid}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-35"
                        title={
                          isPaid
                            ? "Paid invoices are locked"
                            : "Edit Invoice"
                        }
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteInvoice(invoice.id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="bg-muted/40 px-4 py-3 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{invoices.length}</strong>{" "}
          document{invoices.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-4">
          <span>
            Paid Receipts:{" "}
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                invoices
                  .filter((i) => i.status === "paid")
                  .reduce((sum, i) => sum + i.total_amount, 0),
              )}
            </strong>
          </span>
          <span>
            Register Total:{" "}
            <strong className="font-mono text-foreground">
              {formatCurrency(
                invoices.reduce((sum, i) => sum + i.total_amount, 0),
              )}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;
