import React from 'react';
import { 
  Eye, 
  Edit, 
  Download, 
  Printer, 
  Send, 
  CheckCircle, 
  Trash2 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate, getDaysOverdue } from '../utils/invoiceHelpers';

const InvoiceRow = ({ 
  invoice, 
  onView, 
  onEdit, 
  onDownloadPDF, 
  onPrint, 
  onUpdateStatus, 
  onDelete 
}) => {
  const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status || 'draft');

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
            onClick={() => onView(invoice)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(invoice)}
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
            onClick={() => onPrint(invoice)}
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
            onClick={() => onDelete(invoice.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default InvoiceRow;