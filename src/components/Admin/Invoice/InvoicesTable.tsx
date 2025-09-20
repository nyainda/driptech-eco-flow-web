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
      <div className="bg-background rounded-xl shadow-lg border border-border">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No invoices found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden">
      <div className="relative overflow-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-muted scrollbar-track-background">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted border-b border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                Invoice
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                Customer
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wide">
                Amount
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                Due Date
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border">
            {invoices.map((invoice, index) => {
              const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status || 'draft');
              const isOverdue = daysOverdue > 0 && invoice.status !== 'paid';
              
              return (
                <tr 
                  key={invoice.id}
                  className="group hover:bg-muted transition-colors duration-200"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCompactDate(invoice.created_at || new Date().toISOString())} • {new Date(invoice.created_at || new Date().toISOString()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {invoice.customer?.company_name || 'Unknown Company'}
                      </div>
                      {invoice.customer?.contact_person && (
                        <div className="text-xs text-muted-foreground truncate">
                          {invoice.customer.contact_person}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <div className="text-sm font-bold text-foreground">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.tax_amount && invoice.tax_amount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{formatCurrency(invoice.tax_amount)}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={invoice.status || 'draft'} />
                    {isOverdue && (
                      <div className="text-xs text-destructive font-medium mt-1">
                        {daysOverdue}d overdue
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <div className={`text-sm font-medium ${
                      isOverdue 
                        ? 'text-destructive' 
                        : 'text-foreground'
                    }`}>
                      {formatCompactDate(invoice.due_date)}
                    </div>
                    {isOverdue && (
                      <div className="w-2 h-2 bg-destructive rounded-full mx-auto mt-1"></div>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => onEditInvoice(invoice)}
                        className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                        disabled={invoice.status === 'paid'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => onDownloadPDF(invoice)}
                        className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'sent')}
                          className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                          title="Send"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'paid')}
                          className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div className="relative group">
                        <button
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors duration-200"
                          title="More actions"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-32 bg-background rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                          <button
                            onClick={() => console.log('Print invoice:', invoice.id)}
                            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 rounded-t-lg"
                          >
                            <Printer className="w-3 h-3" />
                            Print
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(invoice.id)}
                            className="w-full px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-b-lg"
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

      <div className="bg-muted px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-4">
            <span className="font-medium text-foreground">
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
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thumb-muted::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted));
          border-radius: 3px;
        }
        
        .scrollbar-track-background::-webkit-scrollbar-track {
          background: hsl(var(--background));
        }
      `}</style>
    </div>
  );
};

export default InvoicesTable;