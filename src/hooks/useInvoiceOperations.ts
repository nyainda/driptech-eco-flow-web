
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from '@/components/Admin/types/InvoiceTypes';
import { formatCurrency, formatDate } from '@/components/Admin/utils/formatters';
import html2pdf from 'html2pdf.js';

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
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Create enhanced invoice content with modern design
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0; padding: 20px; background: white;
              font-size: 14px; line-height: 1.4; color: #1f2937;
            }
            .header { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
              color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;
              position: relative; overflow: hidden;
            }
            .header::before {
              content: ''; position: absolute; top: -50%; right: -50%;
              width: 200%; height: 200%; opacity: 0.1;
              background: radial-gradient(circle, white 0%, transparent 70%);
            }
            .header-content { position: relative; z-index: 1; }
            .company-info { display: flex; align-items: center; gap: 15px; }
            .logo { 
              width: 60px; height: 60px; background: rgba(255,255,255,0.2);
              border: 2px solid rgba(255,255,255,0.3); border-radius: 12px;
              display: flex; align-items: center; justify-content: center;
              font-weight: 900; font-size: 20px;
            }
            .company-details h1 { margin: 0 0 5px 0; font-size: 24px; font-weight: 800; }
            .company-details p { margin: 2px 0; opacity: 0.9; font-size: 12px; }
            .invoice-info { 
              text-align: right; background: rgba(255,255,255,0.15);
              padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
            }
            .invoice-info h2 { margin: 0 0 15px 0; font-size: 28px; font-weight: 900; }
            .invoice-info div { margin: 8px 0; font-weight: 500; }
            .billing-section { 
              display: grid; grid-template-columns: 1fr 1fr; gap: 30px;
              margin-bottom: 30px;
            }
            .billing-box { 
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;
            }
            .billing-box h3 { 
              color: #1e40af; margin: 0 0 15px 0; font-weight: 700;
              border-bottom: 2px solid #3b82f6; padding-bottom: 8px; display: inline-block;
            }
            .items-table { 
              width: 100%; border-collapse: collapse; margin-bottom: 30px;
              border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .items-table thead { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
            .items-table th { 
              padding: 15px 12px; color: white; font-weight: 700; text-align: left;
              font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .items-table td { 
              padding: 12px; border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            .items-table tbody tr:nth-child(even) { background: #f8fafc; }
            .items-table tbody tr:hover { background: #e0f2fe; }
            .totals-section { 
              float: right; width: 350px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;
            }
            .totals-row { 
              display: flex; justify-content: space-between; padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .total-final { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white; padding: 15px; border-radius: 8px; margin-top: 10px;
              font-weight: 800; font-size: 16px;
            }
            .notes-section { 
              clear: both; margin-top: 40px; padding: 20px;
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 1px solid #f59e0b; border-radius: 10px;
            }
            .footer { 
              text-align: center; margin-top: 40px; padding-top: 20px;
              border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="company-info">
                  <div class="logo">DT</div>
                  <div class="company-details">
                    <h1>DripTech Solutions</h1>
                    <p>Smart Irrigation Systems</p>
                    <p>📍 P.O. Box 12345, Nairobi, Kenya</p>
                    <p>📞 0111409454 / 0114575401</p>
                    <p>✉️ driptech2025@gmail.com</p>
                  </div>
                </div>
                <div class="invoice-info">
                  <h2>INVOICE</h2>
                  <div><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
                  <div><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</div>
                  <div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>
                  <div><strong>Status:</strong> ${(invoice.status || 'draft').toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="billing-section">
            <div class="billing-box">
              <h3>From:</h3>
              <div><strong>DripTech Solutions</strong></div>
              <div>P.O. Box 12345, Nairobi, Kenya</div>
              <div>📞 0111409454 / 0114575401</div>
              <div>✉️ driptech2025@gmail.com</div>
            </div>
            <div class="billing-box">
              <h3>Bill To:</h3>
              <div><strong>${invoice.customer?.company_name || 'N/A'}</strong></div>
              <div>${invoice.customer?.contact_person || 'N/A'}</div>
              <div>${invoice.customer?.address || 'N/A'}</div>
              <div>${invoice.customer?.city || 'N/A'}, ${invoice.customer?.country || 'N/A'}</div>
              <div>✉️ ${invoice.customer?.email || 'N/A'}</div>
              <div>📞 ${invoice.customer?.phone || 'N/A'}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.invoice_items?.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(item.unit_price)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(item.total)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-row">
              <span><strong>Subtotal:</strong></span>
              <span style="font-family: monospace;">${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount_amount && invoice.discount_amount > 0 ? `
            <div class="totals-row">
              <span><strong>Discount:</strong></span>
              <span style="font-family: monospace; color: #dc2626;">-${formatCurrency(invoice.discount_amount)}</span>
            </div>
            ` : ''}
            ${invoice.tax_amount && invoice.tax_amount > 0 ? `
            <div class="totals-row">
              <span><strong>Tax (${invoice.tax_rate}%):</strong></span>
              <span style="font-family: monospace;">${formatCurrency(invoice.tax_amount)}</span>
            </div>
            ` : ''}
            <div class="total-final">
              <div style="display: flex; justify-content: space-between;">
                <span>TOTAL:</span>
                <span style="font-family: monospace;">${formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
          <div class="notes-section">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">📝 Notes:</h4>
            <p style="margin: 0; color: #92400e; line-height: 1.5;">${invoice.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>Payment Terms: ${invoice.payment_terms || 'Net 30'}</p>
          </div>
        </body>
        </html>
      `;

      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.innerHTML = content;
      document.body.appendChild(tempContainer);

      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice-${invoice.invoice_number}-DripTech.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(tempContainer).save();
      
      // Clean up
      document.body.removeChild(tempContainer);

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    }
  };

  return {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF
  };
};