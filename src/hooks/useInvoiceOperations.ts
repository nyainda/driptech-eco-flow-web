
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from '@/components/Admin/types/InvoiceTypes';
import { formatCurrency, formatDate } from '@/components/Admin/utils/formatters';

export const useInvoiceOperations = (onSuccess?: () => void) => {
  
  // Handle status update
  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add specific timestamps based on status
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (newStatus === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) {
        console.error('Error updating invoice status:', error);
        return;
      }

      // Reload invoices to reflect changes
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  // Handle delete invoice
  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        console.error('Error deleting invoice:', error);
        return;
      }

      // Reload invoices to reflect changes
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  // Download invoice as PDF
  const downloadInvoicePDF = (invoice: Invoice) => {
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">INVOICE</h1>
          <h2 style="color: #6b7280; font-weight: normal;">${invoice.invoice_number}</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h3 style="color: #1f2937; margin-bottom: 15px;">Bill To:</h3>
            <p style="margin: 5px 0; font-weight: bold;">${invoice.customer?.company_name || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.contact_person || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.address || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.city || 'N/A'}, ${invoice.customer?.country || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.email || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.phone || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
            <p style="margin: 5px 0;"><strong>Payment Terms:</strong> ${invoice.payment_terms || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${(invoice.status || 'draft').toUpperCase()}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Description</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_items?.map(item => `
              <tr>
                <td style="padding: 12px; border: 1px solid #d1d5db;">
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">${item.quantity} ${item.unit || ''}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">No items</td></tr>'}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 30px;">
          <table style="margin-left: auto;">
            <tr><td style="padding: 5px 15px 5px 0;"><strong>Subtotal:</strong></td><td style="text-align: right;">${formatCurrency(invoice.subtotal)}</td></tr>
            ${invoice.discount_amount && invoice.discount_amount > 0 ? `<tr><td style="padding: 5px 15px 5px 0;"><strong>Discount:</strong></td><td style="text-align: right;">-${formatCurrency(invoice.discount_amount)}</td></tr>` : ''}
            ${invoice.tax_amount && invoice.tax_amount > 0 ? `<tr><td style="padding: 5px 15px 5px 0;"><strong>Tax (${invoice.tax_rate}%):</strong></td><td style="text-align: right;">${formatCurrency(invoice.tax_amount)}</td></tr>` : ''}
            <tr style="border-top: 2px solid #1f2937;"><td style="padding: 15px 15px 5px 0; font-size: 18px;"><strong>Total:</strong></td><td style="text-align: right; font-size: 18px;"><strong>${formatCurrency(invoice.total_amount)}</strong></td></tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Notes:</h4>
            <p style="color: #6b7280; line-height: 1.5;">${invoice.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                window.print();
              };
              window.addEventListener('afterprint', function() {
                window.close();
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF
  };
};