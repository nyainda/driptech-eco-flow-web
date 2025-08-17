import { TermsSection } from './TermsAndConditions';
import { Quote, QuoteItem, Customer } from './types';

export const generatePrintContent = (quote: Quote, items: QuoteItem[], customer?: Customer): string => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = quote.include_vat ? subtotal * (quote.vat_rate / 100) : 0;
  const total = subtotal + tax;

  const customerSection = customer ? `
    <div class="space-y-1 text-xs">
      <div class="font-bold text-gray-900 break-words">${customer.contact_person}</div>
      ${customer.company_name ? `<div class="text-blue-600 font-semibold break-words">${customer.company_name}</div>` : ''}
      ${customer.address ? `<div class="text-gray-600 break-words">${customer.address}</div>` : ''}
      ${customer.city ? `<div class="text-gray-600 break-words">${customer.city}</div>` : ''}
      ${customer.country ? `<div class="text-gray-600 break-words">${customer.country}</div>` : ''}
      ${customer.phone ? `<div class="flex items-center gap-1 text-gray-600 font-medium break-all"><span class="opacity-70">📞</span> ${customer.phone}</div>` : ''}
      <div class="flex items-center gap-1 text-gray-600 font-medium break-all"><span class="opacity-70">✉️</span> ${customer.email}</div>
    </div>
  ` : '<div class="text-gray-500 text-xs">Customer information not available</div>';

  const projectDetailsSection = (quote.project_type || quote.crop_type || quote.area_size) ? `
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border-l-3 border-blue-600 mb-3">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-500 rounded-md flex items-center justify-center text-sm">🌱</div>
        <h3 class="text-blue-600 text-sm font-bold">Project Overview</h3>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        ${quote.project_type ? `
          <div class="bg-white bg-opacity-70 p-2 rounded border border-blue-100">
            <span class="block text-xs font-medium text-gray-500 uppercase">Project</span>
            <span class="block text-xs font-bold text-gray-900">${quote.project_type}</span>
          </div>
        ` : ''}
        ${quote.crop_type ? `
          <div class="bg-white bg-opacity-70 p-2 rounded border border-blue-100">
            <span class="block text-xs font-medium text-gray-500 uppercase">Crop</span>
            <span class="block text-xs font-bold text-gray-900">${quote.crop_type}</span>
          </div>
        ` : ''}
        ${quote.area_size ? `
          <div class="bg-white bg-opacity-70 p-2 rounded border border-blue-100">
            <span class="block text-xs font-medium text-gray-500 uppercase">Area</span>
            <span class="block text-xs font-bold text-gray-900">${quote.area_size} acres</span>
          </div>
        ` : ''}
        ${quote.water_source ? `
          <div class="bg-white bg-opacity-70 p-2 rounded border border-blue-100">
            <span class="block text-xs font-medium text-gray-500 uppercase">Water</span>
            <span class="block text-xs font-bold text-gray-900">${quote.water_source}</span>
          </div>
        ` : ''}
      </div>
      ${quote.terrain_info ? `
        <div class="bg-white bg-opacity-70 p-2 rounded border border-blue-100 mt-2">
          <span class="block text-xs font-medium text-gray-500 uppercase">Terrain</span>
          <span class="block text-xs font-medium text-gray-900">${quote.terrain_info}</span>
        </div>
      ` : ''}
    </div>
  ` : '';

  const itemsRows = items.map((item, index) => `
    <tr class="hover:bg-blue-50 border-b border-gray-100">
      <td class="p-1.5 font-bold text-gray-500 text-center text-xs">${index + 1}</td>
      <td class="p-1.5 font-bold text-gray-900 text-xs">${item.name}</td>
      <td class="p-1.5 text-gray-600 text-xs">${item.description}</td>
      <td class="p-1.5 text-center font-bold text-green-600 text-xs">${item.quantity}</td>
      <td class="p-1.5 text-center text-gray-600 text-xs">${item.unit}</td>
      <td class="p-1.5 text-right font-mono text-teal-600 text-xs">${item.unit_price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
      <td class="p-1.5 text-right font-mono font-bold text-red-600 text-xs">${item.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  const notesSection = quote.notes ? `
    <div class="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg p-3 border-l-3 border-amber-500 mb-3">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center text-sm">📝</div>
        <h3 class="text-amber-800 text-sm font-bold">Additional Notes</h3>
      </div>
      <div class="bg-white bg-opacity-50 p-2 rounded border border-amber-200">
        <p class="text-amber-900 text-xs font-medium break-words">${quote.notes}</p>
      </div>
    </div>
  ` : '';

  const totalsRows = `
    <tr class="border-b border-gray-200">
      <td class="p-2 font-semibold text-gray-700 text-xs">Subtotal</td>
      <td class="p-2 text-right font-mono font-bold text-green-600 text-xs">
        KES ${subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
      </td>
    </tr>
    ${quote.include_vat ? `
    <tr class="border-b border-gray-200">
      <td class="p-2 font-semibold text-gray-700 text-xs">VAT (${quote.vat_rate}%)</td>
      <td class="p-2 text-right font-mono font-bold text-green-600 text-xs">
        KES ${tax.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
      </td>
    </tr>
    ` : ''}
    <tr class="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
      <td class="p-2 font-extrabold text-sm">Total Amount</td>
      <td class="p-2 text-right font-mono font-extrabold text-sm">
        KES ${total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quote #${quote.quote_number} - DripTech Irrigation</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', sans-serif; 
          background: white !important;
          margin: 0;
          padding: 8px;
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
        
        /* Force print-friendly layout */
        @media print {
          @page { 
            margin: 0.5cm; 
            size: A4 portrait; 
          }
          body { 
            background: white !important; 
            padding: 0 !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
          }
        }
        
        /* Ensure consistent table display across all devices */
        .items-table {
          display: table !important;
          width: 100% !important;
          font-size: 10px !important;
        }
        
        .items-table th,
        .items-table td {
          padding: 4px 2px !important;
          border: 1px solid #e5e7eb !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        /* Mobile specific adjustments for PDF */
        @media screen and (max-width: 768px) {
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          .items-table th,
          .items-table td {
            font-size: 8px !important;
            padding: 2px 1px !important;
          }
          
          .header-section {
            padding: 12px !important;
          }
          
          .content-section {
            padding: 8px !important;
          }
        }
        
        /* Hide description on very small screens but keep for PDF */
        @media screen and (max-width: 480px) {
          .hide-mobile {
            display: none !important;
          }
        }
        
        /* Force show all columns in print/PDF mode */
        @media print {
          .hide-mobile {
            display: table-cell !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        
        <!-- Header Section -->
        <div class="header-section bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-4 relative overflow-hidden">
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
                  <div>✉️ driptech2025@gmail.com</div>
                </div>
              </div>
            </div>
            
            <div class="text-center md:text-right text-white w-full md:w-auto">
              <h2 class="text-2xl font-black mb-2">QUOTATION</h2>
              <div class="bg-white bg-opacity-15 backdrop-blur-md p-3 rounded-lg border border-white border-opacity-20">
                <div class="flex justify-between items-center mb-1 text-xs">
                  <span class="font-medium text-white text-opacity-90">Quote #:</span>
                  <span class="font-bold ml-2">${quote.quote_number}</span>
                </div>
                <div class="flex justify-between items-center mb-1 text-xs">
                  <span class="font-medium text-white text-opacity-90">Date:</span>
                  <span class="font-bold ml-2">${new Date(quote.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                ${quote.valid_until ? `
                <div class="flex justify-between items-center text-xs">
                  <span class="font-medium text-white text-opacity-90">Valid Until:</span>
                  <span class="font-bold ml-2">${new Date(quote.valid_until).toLocaleDateString('en-GB')}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="content-section p-4">
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
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-blue-600 text-sm font-bold mb-2 flex items-center gap-2">
                <div class="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                To
              </h3>
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                ${customerSection}
              </div>
            </div>
          </div>

          <!-- Project Details Section -->
          ${projectDetailsSection}

          <!-- BOQ Table Section -->
          <div class="mb-4">
            <h3 class="text-blue-600 text-sm font-bold mb-2 flex items-center gap-2">
              <div class="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
              Bill of Quantities (BOQ)
            </h3>
            
            <div class="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white">
              <table class="items-table w-full">
                <thead class="bg-gradient-to-r from-blue-600 to-blue-500">
                  <tr>
                    <th class="p-2 text-left font-bold text-white text-xs uppercase">#</th>
                    <th class="p-2 text-left font-bold text-white text-xs uppercase">Item</th>
                    <th class="hide-mobile p-2 text-left font-bold text-white text-xs uppercase">Description</th>
                    <th class="p-2 text-center font-bold text-white text-xs uppercase">Qty</th>
                    <th class="hide-mobile p-2 text-center font-bold text-white text-xs uppercase">Unit</th>
                    <th class="p-2 text-right font-bold text-white text-xs uppercase">Unit Price (KES)</th>
                    <th class="p-2 text-right font-bold text-white text-xs uppercase">Total (KES)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${itemsRows}
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
                    ${totalsRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Notes Section -->
          ${notesSection}
        </div>
      </div>
    </body>
    </html>
  `;
};