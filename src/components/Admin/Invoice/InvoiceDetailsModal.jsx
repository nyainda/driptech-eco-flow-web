import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Send, 
  CheckCircle, 
  Copy 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import InvoiceItemsDisplay from './InvoiceItems/InvoiceItemsDisplay';
import { formatCurrency, formatDate } from '../utils/invoiceHelpers';

const InvoiceDetailsModal = ({ 
  invoice, 
  isOpen, 
  onClose, 
  onDownloadPDF, 
  onPrint, 
  onUpdateStatus 
}) => {
  if (!isOpen || !invoice) return null;

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoice.invoice_number);
    alert('Invoice number copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Invoice {invoice.invoice_number}
          </h2>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill To:</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {invoice.customer?.company_name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{invoice.customer?.contact_person}</p>
                {invoice.customer?.address && (
                  <p className="text-gray-600 dark:text-gray-400">{invoice.customer.address}</p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  {invoice.customer?.city}, {invoice.customer?.country}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{invoice.customer?.email}</p>
                {invoice.customer?.phone && (
                  <p className="text-gray-600 dark:text-gray-400">{invoice.customer.phone}</p>
                )}
              </div>
            </div>
            
            <div className="lg:text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status: </span>
                  <StatusBadge status={invoice.status || 'draft'} />
                </div>
                <p><span className="text-gray-600 dark:text-gray-400">Issue Date:</span> <span className="text-gray-900 dark:text-white">{formatDate(invoice.issue_date)}</span></p>
                <p><span className="text-gray-600 dark:text-gray-400">Due Date:</span> <span className="text-gray-900 dark:text-white">{formatDate(invoice.due_date)}</span></p>
                <p><span className="text-gray-600 dark:text-gray-400">Payment Terms:</span> <span className="text-gray-900 dark:text-white">{invoice.payment_terms}</span></p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
            <InvoiceItemsDisplay items={invoice.invoice_items} />
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount && invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-white">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                {invoice.tax_amount && invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax ({invoice.tax_rate}%):</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onDownloadPDF(invoice)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => onPrint(invoice)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {invoice.status === 'draft' && (
              <button
                onClick={() => {
                  onUpdateStatus(invoice.id, 'sent');
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => {
                  onUpdateStatus(invoice.id, 'paid');
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
            <button
              onClick={handleCopyInvoiceNumber}
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

export default InvoiceDetailsModal;