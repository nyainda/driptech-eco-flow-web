// components/InvoicesTable.tsx
import React from 'react';
import { FileText, Eye, Edit, Download, Printer, Send, CheckCircle, Trash2 } from 'lucide-react';
import { Invoice } from '../types/InvoiceTypes';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from './StatusBadge';

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  getDaysOverdue: (dueDate: string, status: string) => number;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onDownloadPDF,
  onUpdateStatus,
  onDeleteInvoice,
  getDaysOverdue
}) => {
  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Issue Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status || 'draft');
              return (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 sm:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </div>
                      {invoice.quote_id && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Quote: {invoice.quote_id}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.customer?.company_name || 'Unknown Company'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.customer?.contact_person}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.tax_amount && invoice.tax_amount > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{formatCurrency(invoice.tax_amount)} tax
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <StatusBadge status={invoice.status || 'draft'} />
                    {daysOverdue > 0 && invoice.status !== 'paid' && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {daysOverdue} days overdue
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(invoice.due_date)}
                    </div>
                    {daysOverdue > 0 && invoice.status !== 'paid' && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Overdue
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => onViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditInvoice(invoice)}
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 p-1 transition-colors"
                        title="Edit Invoice"
                        disabled={invoice.status === 'paid'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadPDF(invoice)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => console.log('Print invoice:', invoice.id)}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-1 transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'sent')}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
                          title="Send Invoice"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'paid')}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 transition-colors"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteInvoice(invoice.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesTable;