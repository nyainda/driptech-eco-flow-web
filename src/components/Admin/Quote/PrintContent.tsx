// components/PrintContent.ts
import { Quote, QuoteItem, Customer } from "./types";

export const generatePrintContent = (
  quote: Quote,
  items: QuoteItem[],
  customer?: Customer,
): string => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const customerSection = customer
    ? `
    <p class="font-medium">${customer.contact_person}</p>
    ${customer.company_name ? `<p>${customer.company_name}</p>` : ""}
    ${customer.address ? `<p>${customer.address}</p>` : ""}
    ${customer.city ? `<p>${customer.city}</p>` : ""}
    ${customer.country ? `<p>${customer.country}</p>` : ""}
    ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ""}
    <p>Email: ${customer.email}</p>
  `
    : "<p>Customer information not available</p>";

  const projectDetailsSection =
    quote.project_type || quote.crop_type || quote.area_size
      ? `
    <div class="project-details">
      <h3>Project Details</h3>
      <div class="project-grid">
        ${quote.project_type ? `<div><span class="font-medium">Project Type:</span> ${quote.project_type}</div>` : ""}
        ${quote.crop_type ? `<div><span class="font-medium">Crop Type:</span> ${quote.crop_type}</div>` : ""}
        ${quote.area_size ? `<div><span class="font-medium">Area Size:</span> ${quote.area_size} acres</div>` : ""}
        ${quote.water_source ? `<div><span class="font-medium">Water Source:</span> ${quote.water_source}</div>` : ""}
      </div>
      ${quote.terrain_info ? `<div style="margin-top: 16px;"><span class="font-medium">Terrain Info:</span> ${quote.terrain_info}</div>` : ""}
    </div>
  `
      : "";

  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td class="font-medium">${item.name}</td>
      <td>${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-right">${item.unit_price.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
      <td class="text-right font-medium">${item.total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
    </tr>
  `,
    )
    .join("");

  const notesSection = quote.notes
    ? `
    <div class="section">
      <h3>Notes:</h3>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af;">
        <p style="color: #4b5563;">${quote.notes}</p>
      </div>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quote #${quote.quote_number} - DripTech Irrigation</title>
      <meta charset="utf-8">
      <style>
        @media (prefers-color-scheme: dark) {
          body { background: #1f2937; color: #f1f5f9; }
          .container { background: #2d3748; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
          .address-block, .project-details, .totals table { background: #374151; border-color: #4b5563; }
          th { background: #374151; color: #f1f5f9; border-color: #4b5563; }
          td { background: #2d3748; color: #e5e7eb; border-color: #4b5563; }
          tr:nth-child(even) td { background: #374151; }
          .totals .total-row { background: #2563eb; }
          .terms { background: #374151; }
          .footer { color: #9ca3af; }
          .footer .company-name, h3, .quote-info h2 { color: #60a5fa; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.5; 
          color: #1f2a44; 
          background: #f8fafc;
          padding: 40px;
        }
        
        .container { 
          max-width: 900px; 
          margin: 0 auto; 
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          padding: 32px;
        }
        
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 32px; 
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 24px;
        }
        
        .logo { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
        }
        
        .logo-icon { 
          width: 56px; 
          height: 56px; 
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white;
          font-size: 24px;
          font-weight: 700;
        }
        
        .company-info h1 { 
          color: #1e40af; 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px; 
        }
        
        .company-info p { 
          color: #6b7280; 
          font-size: 14px; 
          line-height: 1.6; 
        }
        
        .quote-info { text-align: right; }
        
        .quote-info h2 { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1e40af; 
          margin-bottom: 12px; 
        }
        
        .quote-info-box { 
          background: #f8fafc; 
          padding: 16px; 
          border-radius: 8px; 
          border: 1px solid #e5e7eb;
        }
        
        .quote-info p { 
          font-size: 14px; 
          color: #4b5563; 
          margin-bottom: 8px; 
          font-weight: 500;
        }
        
        .section { margin-bottom: 32px; }
        
        .section h3 { 
          font-weight: 600; 
          margin-bottom: 16px; 
          color: #1e40af; 
          font-size: 18px; 
          letter-spacing: -0.02em;
        }
        
        .two-columns { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 32px; 
        }
        
        .address-block { 
          font-size: 14px; 
          background: #f8fafc; 
          padding: 20px; 
          border-radius: 8px; 
          border: 1px solid #e5e7eb;
        }
        
        .address-block p { 
          margin-bottom: 6px; 
          color: #4b5563;
        }
        
        .font-medium { font-weight: 500; }
        
        .project-details { 
          background: #eff6ff; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 4px solid #1e40af;
          margin-bottom: 32px; 
        }
        
        .project-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px; 
        }
        
        .project-grid div { 
          margin-bottom: 12px; 
          color: #4b5563;
        }
        
        table { 
          width: 100%; 
          border-collapse: separate; 
          border-spacing: 0;
          margin: 16px 0; 
          font-size: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th, td { 
          padding: 14px 16px; 
          text-align: left; 
        }
        
        th { 
          background: #f1f5f9; 
          font-weight: 600; 
          color: #1f2a44;
          border-bottom: 1px solid #e5e7eb;
        }
        
        td { 
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }
        
        tr:last-child td { border-bottom: none; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        tr:nth-child(even) td { background: #f8fafc; }
        
        .totals { 
          float: right; 
          width: 360px; 
          margin: 24px 0; 
        }
        
        .totals table { 
          margin: 0; 
          border: none; 
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .totals td { 
          border: none; 
          padding: 12px 16px; 
          font-weight: 500;
        }
        
        .totals .total-row { 
          font-weight: 700; 
          font-size: 16px; 
          background: #1e40af;
          color: white;
          border-radius: 6px;
        }
        
        .terms { 
          margin-top: 32px; 
          font-size: 14px; 
          color: #4b5563; 
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        
        .terms h3 { 
          margin-bottom: 16px; 
          color: #1e40af;
        }
        
        .terms li { 
          display: flex; 
          align-items: flex-start; 
          margin-bottom: 12px;
          gap: 12px;
        }
        
        .terms li::before {
          content: "•";
          color: #1e40af;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .footer { 
          margin-top: 40px; 
          padding-top: 24px; 
          border-top: 1px solid #e5e7eb; 
          text-align: center; 
          font-size: 14px; 
          color: #6b7280; 
        }
        
        .footer .company-name { 
          color: #1e40af; 
          font-weight: 600; 
        }
        
        @page { 
          margin: 1.5cm; 
          size: A4;
        }
        
        @media print {
          body { padding: 0; background: white; }
          .container { 
            max-width: none; 
            box-shadow: none;
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header Section -->
        <div class="header">
          <div class="company-info">
            <div class="logo">
              <div class="logo-icon">DT</div>
              <div>
                <h1>DripTech Solutions</h1>
                <p>Smart Irrigation Systems</p>
              </div>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              <p>P.O. Box 12345, Nairobi, Kenya</p>
              <p>Phone: 0111409454 / 0114575401</p>
              <p>Email: driptech2025@gmail.com</p>
              <p>Alt Email: driptechs.info@gmail.com</p>
            </div>
          </div>
          <div class="quote-info">
            <h2>QUOTATION</h2>
            <div class="quote-info-box">
              <p><strong>Quote #:</strong> ${quote.quote_number}</p>
              <p><strong>Date:</strong> ${new Date(quote.created_at).toLocaleDateString()}</p>
              ${quote.valid_until ? `<p><strong>Valid Until:</strong> ${new Date(quote.valid_until).toLocaleDateString()}</p>` : ""}
            </div>
          </div>
        </div>

        <!-- Address Section -->
        <div class="two-columns">
          <div class="section">
            <h3>From:</h3>
            <div class="address-block">
              <p class="font-medium">DripTech Solutions</p>
              <p>P.O. Box 12345, Nairobi, Kenya</p>
              <p>Phone: 0111409454 / 0114575401</p>
              <p>Email: driptech2025@gmail.com</p>
              <p>Alt Email: driptechs.info@gmail.com</p>
            </div>
          </div>
          <div class="section">
            <h3>To:</h3>
            <div class="address-block">
              ${customerSection}
            </div>
          </div>
        </div>

        <!-- Project Details Section -->
        ${projectDetailsSection}

        <!-- BOQ Table Section -->
        <div class="section">
          <h3>Bill of Quantities (BOQ)</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Item</th>
                <th style="width: 35%;">Description</th>
                <th class="text-center" style="width: 10%;">Qty</th>
                <th class="text-center" style="width: 10%;">Unit</th>
                <th class="text-right" style="width: 10%;">Unit Price</th>
                <th class="text-right" style="width: 10%;">Total (KES)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Totals Section -->
        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">KES ${subtotal.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>VAT (16%):</td>
              <td class="text-right">KES ${tax.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td class="text-right">KES ${total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <div style="clear: both;"></div>

        <!-- Notes Section -->
        ${notesSection}

        <!-- Terms & Conditions Section -->
        <div class="terms">
          <h3>Terms & Conditions:</h3>
          <ul>
            <li>Payment terms: 50% deposit, 50% on completion</li>
            <li>Installation timeline: 2-4 weeks from confirmation</li>
            <li>All equipment comes with manufacturer warranty</li>
            <li>Free maintenance for the first 6 months</li>
            <li>Prices are valid for 30 days from quote date</li>
            <li>Delivery included within Nairobi metropolitan area</li>
          </ul>
        </div>

        <!-- Footer Section -->
        <div class="footer">
          <p><span class="company-name">DripTech Solutions</span> - Your Partner in Smart Irrigation</p>
          <p>Phone: 0111409454 / 0114575401 | Email: info@dripstech.co.ke</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
