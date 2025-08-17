// components/InvoicesTable.tsx
import React from 'react';
import { FileText, Eye, Edit, Download, Printer, Send, CheckCircle, Trash2, Clock } from 'lucide-react';
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
  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (invoices.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
        <div className="relative text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No invoices found</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/50 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/2 to-purple-500/2 dark:from-blue-400/2 dark:to-purple-400/2 pointer-events-none"></div>
      
      {/* Scrollable container with fixed height */}
      <div className="relative overflow-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table className="w-full">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-600/40">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Invoice
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Customer
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Status
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Due Date
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          
          {/* Compact Body */}
          <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/20">
            {invoices.map((invoice, index) => {
              const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status || 'draft');
              const isOverdue = daysOverdue > 0 && invoice.status !== 'paid';
              
              return (
                <tr 
                  key={invoice.id}
                  className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 dark:hover:from-gray-800/40 dark:hover:to-gray-700/30 transition-colors duration-200"
                >
                  {/* Compact Invoice Details */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCompactDate(invoice.created_at || new Date().toISOString())} • {new Date(invoice.created_at || new Date().toISOString()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Compact Customer Info */}
                  <td className="px-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {invoice.customer?.company_name || 'Unknown Company'}
                      </div>
                      {invoice.customer?.contact_person && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {invoice.customer.contact_person}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Compact Amount */}
                  <td className="px-3 py-3 text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.tax_amount && invoice.tax_amount > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{formatCurrency(invoice.tax_amount)}
                      </div>
                    )}
                  </td>

                  {/* Compact Status */}
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={invoice.status || 'draft'} />
                    {isOverdue && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                        {daysOverdue}d overdue
                      </div>
                    )}
                  </td>

                  {/* Compact Due Date */}
                  <td className="px-3 py-3 text-center">
                    <div className={`text-sm font-medium ${
                      isOverdue 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {formatCompactDate(invoice.due_date)}
                    </div>
                    {isOverdue && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1 animate-pulse"></div>
                    )}
                  </td>

                  {/* Compact Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => onEditInvoice(invoice)}
                        className="p-1.5 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                        disabled={invoice.status === 'paid'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => onDownloadPDF(invoice)}
                        className="p-1.5 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors duration-200"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Status-specific actions */}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'sent')}
                          className="p-1.5 text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors duration-200"
                          title="Send"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'paid')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors duration-200"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Action dropdown for mobile/overflow */}
                      <div className="relative group">
                        <button
                          className="p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                          title="More actions"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                          <button
                            onClick={() => console.log('Print invoice:', invoice.id)}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                          >
                            <Printer className="w-3 h-3" />
                            Print
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(invoice.id)}
                            className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Row count indicator with totals */}
      <div className="bg-gray-50/80 dark:bg-gray-800/80 px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Total: {formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0))}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scroll for more
            </span>
          </div>
        </div>
      </div>

      <style>{`
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: rgb(75 85 99);
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        
        /* Hover effects for rows */
        .group:hover .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default InvoicesTable;