import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/Admin/types/InvoiceTypes";
import {
  formatCurrency,
  formatDate,
} from "@/components/Admin/utils/formatters";

export const useInvoiceOperations = (onSuccess?: () => void) => {
  // Handle status update
  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add specific timestamps based on status
      if (newStatus === "paid") {
        updateData.paid_at = new Date().toISOString();
      } else if (newStatus === "sent") {
        updateData.sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoiceId);

      if (error) {
        console.error("Error updating invoice status:", error);
        return;
      }

      // Reload invoices to reflect changes
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  // Handle delete invoice
  const deleteInvoice = async (invoiceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) {
        console.error("Error deleting invoice:", error);
        return;
      }

      // Reload invoices to reflect changes
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  // Generate invoice HTML content (same for both print and PDF)
  const generateInvoiceContent = (invoice: Invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number} - DripTech Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: white !important;
            margin: 0;
            padding: 12px;
            font-size: 13px;
            line-height: 1.4;
            color: #1f2937;
          }
          
          @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          
          .shine-effect::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shine 3s infinite;
          }
          
          @media print {
            @page { 
              margin: 0.8cm; 
              size: A4 portrait; 
            }
            body { 
              background: white !important; 
              padding: 0 !important;
              font-size: 12px !important;
            }
            * { 
              -webkit-print-color-adjust: exact !important; 
              color-adjust: exact !important; 
            }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          
          <!-- Header Section -->
          <div class="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-4 relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
              <div class="absolute top-2 left-2 w-1 h-1 bg-white rounded-full"></div>
              <div class="absolute top-6 right-8 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div class="absolute bottom-4 left-6 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div class="absolute bottom-8 right-4 w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
              <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg flex items-center justify-center text-white text-xl font-black shine-effect">
                  DT
                </div>
                <div class="min-w-0 flex-1">
                  <h1 class="text-white text-xl font-black mb-1">DripTech Solutions</h1>
                  <div class="text-white text-opacity-90 text-xs font-medium">Smart Irrigation Systems</div>
                  <div class="mt-1 text-white text-opacity-80 text-xs space-y-0.5">
                    <div>📍 P.O. Box 12345, Nairobi, Kenya</div>
                    <div>📞 0111409454 / 0114575401</div>
                    <div>✉️ info@dripstech.co.ke</div>
                    <div>✉️ driptechs.info@gmail.com</div>
                  </div>
                </div>
              </div>
              
              <div class="text-center md:text-right text-white w-full md:w-auto">
                <h2 class="text-2xl font-black mb-2">INVOICE</h2>
                <div class="bg-white bg-opacity-15 backdrop-blur-md p-3 rounded-lg border border-white border-opacity-20">
                  <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="font-medium text-white text-opacity-90">Invoice #:</span>
                    <span class="font-bold ml-2">${invoice.invoice_number}</span>
                  </div>
                  <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="font-medium text-white text-opacity-90">Issue Date:</span>
                    <span class="font-bold ml-2">${formatDate(invoice.issue_date)}</span>
                  </div>
                  <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="font-medium text-white text-opacity-90">Due Date:</span>
                    <span class="font-bold ml-2">${formatDate(invoice.due_date)}</span>
                  </div>
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-medium text-white text-opacity-90">Status:</span>
                    <span class="font-bold ml-2 uppercase">${invoice.status || "draft"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4">
            <!-- Address Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <h3 class="text-blue-600 text-sm font-bold mb-2 flex items-center gap-2">
                  <div class="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                  From
                </h3>
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <div class="space-y-1 text-xs">
                    <div class="font-bold text-gray-900">DripTech Solutions</div>
                    <div class="text-gray-600">P.O. Box 12345, Nairobi, Kenya</div>
                    <div class="flex items-center gap-1 text-gray-600">
                      <span class="opacity-70">📞</span> 0111409454 / 0114575401
                    </div>
                    <div class="flex items-center gap-1 text-gray-600">
                      <span class="opacity-70">✉️</span> driptech2025@gmail.com
                    </div>
                    <div class="flex items-center gap-1 text-gray-600">
                      <span class="opacity-70">✉️</span> driptechs.info@gmail.com
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-blue-600 text-sm font-bold mb-2 flex items-center gap-2">
                  <div class="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                  Bill To
                </h3>
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <div class="space-y-1 text-xs">
                    <div class="font-bold text-gray-900 break-words">${invoice.customer?.contact_person || "N/A"}</div>
                    ${invoice.customer?.company_name ? `<div class="text-blue-600 font-semibold break-words">${invoice.customer.company_name}</div>` : ""}
                    ${invoice.customer?.address ? `<div class="text-gray-600 break-words">${invoice.customer.address}</div>` : ""}
                    ${invoice.customer?.city ? `<div class="text-gray-600 break-words">${invoice.customer.city}, ${invoice.customer?.country || ""}</div>` : ""}
                    ${invoice.customer?.phone ? `<div class="flex items-center gap-1 text-gray-600 font-medium break-all"><span class="opacity-70">📞</span> ${invoice.customer.phone}</div>` : ""}
                    <div class="flex items-center gap-1 text-gray-600 font-medium break-all"><span class="opacity-70">✉️</span> ${invoice.customer?.email || "N/A"}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Table Section -->
            <div class="mb-4">
              <h3 class="text-blue-600 text-sm font-bold mb-2 flex items-center gap-2">
                <div class="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                Invoice Items
              </h3>
              
              <div class="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white">
                <table class="w-full">
                  <thead class="bg-gradient-to-r from-blue-600 to-blue-500">
                    <tr>
                      <th class="p-2 text-left font-bold text-white text-xs uppercase">#</th>
                      <th class="p-2 text-left font-bold text-white text-xs uppercase">Item/Service</th>
                      <th class="p-2 text-left font-bold text-white text-xs uppercase">Description</th>
                      <th class="p-2 text-center font-bold text-white text-xs uppercase">Qty</th>
                      <th class="p-2 text-right font-bold text-white text-xs uppercase">Unit Price (KES)</th>
                      <th class="p-2 text-right font-bold text-white text-xs uppercase">Total (KES)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${
                      invoice.invoice_items
                        ?.map(
                          (item, index) => `
                      <tr class="hover:bg-blue-50 border-b border-gray-100">
                        <td class="p-1.5 font-bold text-gray-500 text-center text-xs">${index + 1}</td>
                        <td class="p-1.5 font-bold text-gray-900 text-xs">${item.name}</td>
                        <td class="p-1.5 text-gray-600 text-xs">${item.description || "N/A"}</td>
                        <td class="p-1.5 text-center font-bold text-green-600 text-xs">${item.quantity}</td>
                        <td class="p-1.5 text-right font-mono text-teal-600 text-xs">${item.unit_price.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                        <td class="p-1.5 text-right font-mono font-bold text-red-600 text-xs">${item.total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `,
                        )
                        .join("") ||
                      '<tr><td colspan="6" class="p-4 text-center text-gray-500">No items found</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Totals Section -->
            <div class="flex justify-end mb-3">
              <div class="w-full md:w-auto md:min-w-[250px] max-w-sm">
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-lg border border-gray-200">
                  <table class="w-full text-xs">
                    <tbody>
                      <tr class="border-b border-gray-200">
                        <td class="p-2 font-semibold text-gray-700 text-xs">Subtotal</td>
                        <td class="p-2 text-right font-mono font-bold text-green-600 text-xs">
                          KES ${invoice.subtotal.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      ${
                        invoice.discount_amount && invoice.discount_amount > 0
                          ? `
                      <tr class="border-b border-gray-200">
                        <td class="p-2 font-semibold text-gray-700 text-xs">Discount</td>
                        <td class="p-2 text-right font-mono font-bold text-red-600 text-xs">
                          -KES ${invoice.discount_amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        invoice.tax_amount && invoice.tax_amount > 0
                          ? `
                      <tr class="border-b border-gray-200">
                        <td class="p-2 font-semibold text-gray-700 text-xs">Tax (${invoice.tax_rate}%)</td>
                        <td class="p-2 text-right font-mono font-bold text-green-600 text-xs">
                          KES ${invoice.tax_amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      <tr class="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        <td class="p-2 font-extrabold text-sm">Total Amount</td>
                        <td class="p-2 text-right font-mono font-extrabold text-sm">
                          KES ${invoice.total_amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Payment Details Section -->
            ${
              invoice.payment_details
                ? `
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-3 border-l-3 border-blue-500 mb-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md flex items-center justify-center text-sm">💳</div>
                <h3 class="text-blue-800 text-sm font-bold">Payment Details</h3>
              </div>
              <div class="bg-white bg-opacity-50 p-2 rounded border border-blue-200">
                <pre class="text-blue-900 text-xs font-medium break-words whitespace-pre-wrap font-mono">${invoice.payment_details}</pre>
              </div>
            </div>
            `
                : ""
            }

            <!-- Notes Section -->
            ${
              invoice.notes
                ? `
            <div class="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg p-3 border-l-3 border-amber-500 mb-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center text-sm">📝</div>
                <h3 class="text-amber-800 text-sm font-bold">Additional Notes</h3>
              </div>
              <div class="bg-white bg-opacity-50 p-2 rounded border border-amber-200">
                <p class="text-amber-900 text-xs font-medium break-words">${invoice.notes}</p>
              </div>
            </div>
            `
                : ""
            }

            <!-- Payment Terms -->
            ${
              invoice.payment_terms
                ? `
            <div class="text-center text-gray-600 text-xs mt-4 p-3 bg-gray-50 rounded-lg">
              <p><strong>Payment Terms:</strong> ${invoice.payment_terms}</p>
              <p class="mt-1">Thank you for your business!</p>
            </div>
            `
                : ""
            }
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download invoice as PDF - uses browser's native PDF engine (no "scanned photo" look)
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Create a new window with your beautiful HTML content
      const pdfWindow = window.open("", "_blank");
      if (!pdfWindow) throw new Error("Failed to open PDF window");

      const htmlContent = generateInvoiceContent(invoice);
      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if it's mobile
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth <= 768;

      if (isMobile) {
        // Mobile: Add helpful instruction
        const banner = pdfWindow.document.createElement("div");
        banner.innerHTML = `
          <div style="
            position: fixed; 
            top: 10px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: #1e40af; 
            color: white; 
            padding: 12px 20px; 
            border-radius: 8px; 
            font-family: Arial, sans-serif; 
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
          " class="no-print">
            📱 Tap Share → Print → Save as PDF
            <br>
            <button onclick="this.parentElement.parentElement.remove(); window.print();" style="
              background: rgba(255,255,255,0.2); 
              border: none; 
              color: white; 
              margin-top: 8px; 
              padding: 6px 15px; 
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Print Now</button>
          </div>
        `;
        pdfWindow.document.body.appendChild(banner);
      }

      // Always trigger print dialog (works universally)
      setTimeout(() => {
        pdfWindow.print();
      }, 500);

      console.log(`Invoice ${invoice.invoice_number} ready for PDF download.`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  // Print invoice function
  const printInvoice = async (invoice: Invoice) => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Failed to open print window");

      const htmlContent = generateInvoiceContent(invoice);
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      await new Promise((resolve) => setTimeout(resolve, 500));
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error("Error printing invoice:", error);
    }
  };

  return {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF,
    printInvoice,
  };
};
