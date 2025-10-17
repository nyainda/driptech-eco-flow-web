// components/InvoiceModal.tsx
import React from "react";
import { X, Printer, Send, CheckCircle, Copy } from "lucide-react";
import { Invoice } from "../types/InvoiceTypes";
import { formatCurrency, formatDate } from "../utils/formatters";
import StatusBadge from "./StatusBadge";

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPrintInvoice?: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: string) => void;
}

// Water Droplet Logo Component
const WaterDropletIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 15.5c-3.86 0-7-3.14-7-7 0-1.85.72-3.53 1.89-4.78L12 2.5l5.11 3.72c1.17 1.25 1.89 2.93 1.89 4.78 0 3.86-3.14 7-7 7z" />
    <path
      d="M12 6.5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"
      opacity="0.7"
    />
  </svg>
);

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onDownloadPDF,
  onPrintInvoice,
  onUpdateStatus,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <WaterDropletIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Invoice {invoice.invoice_number}
              </h2>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                DripTech Solutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bill To:
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {invoice.customer?.company_name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {invoice.customer?.contact_person}
                </p>
                {invoice.customer?.address && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {invoice.customer.address}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  {invoice.customer?.city}, {invoice.customer?.country}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {invoice.customer?.email}
                </p>
                {invoice.customer?.phone && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {invoice.customer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="lg:text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:{" "}
                  </span>
                  <StatusBadge status={invoice.status || "draft"} />
                </div>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Issue Date:
                  </span>{" "}
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(invoice.issue_date)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Due Date:
                  </span>{" "}
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(invoice.due_date)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Payment Terms:
                  </span>{" "}
                  <span className="text-gray-900 dark:text-white">
                    {invoice.payment_terms}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold tracking-wide">
                      Description
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold tracking-wide">
                      Qty
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-semibold tracking-wide">
                      Unit Price
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-semibold tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.invoice_items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No items found for this invoice
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                {invoice.discount_amount && invoice.discount_amount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Discount:
                    </span>
                    <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(invoice.discount_amount)}
                    </span>
                  </div>
                )}
                {invoice.tax_amount && invoice.tax_amount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Tax ({invoice.tax_rate}%):
                    </span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.tax_amount)}
                    </span>
                  </div>
                )}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 rounded-lg mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="font-mono">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {invoice.payment_details && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Details
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {invoice.payment_details}
                </pre>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Notes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Enhanced Download Button with DripTech Branding */}
            <button
              onClick={() => onDownloadPDF(invoice)}
              className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 group overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 ease-out"></div>

              {/* Water droplet logo */}
              <WaterDropletIcon className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-200" />

              {/* Button text */}
              <span className="relative z-10 text-sm font-semibold tracking-wide">
                Download PDF
              </span>

              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur transition-opacity duration-200"></div>
            </button>

            <button
              onClick={() => onPrintInvoice?.(invoice)}
              className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 via-gray-700 to-slate-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-gray-700 hover:via-gray-800 hover:to-slate-700 transform hover:scale-105 transition-all duration-200 group overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 ease-out"></div>

              {/* Printer icon */}
              <Printer className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-200" />

              {/* Button text */}
              <span className="relative z-10 text-sm font-semibold tracking-wide">
                Print Invoice
              </span>

              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gray-400 to-slate-400 opacity-0 group-hover:opacity-30 blur transition-opacity duration-200"></div>
            </button>
            {invoice.status === "draft" && (
              <button
                onClick={() => {
                  onUpdateStatus(invoice.id, "sent");
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </button>
            )}
            {invoice.status === "sent" && (
              <button
                onClick={() => {
                  onUpdateStatus(invoice.id, "paid");
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(invoice.invoice_number);
                alert("Invoice number copied to clipboard!");
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
