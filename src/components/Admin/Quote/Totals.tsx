import React from 'react';
import { Quote, QuoteItem } from './types';

interface TotalsSectionProps {
  quote: Quote;
  items: QuoteItem[];
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({ quote, items }) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalVat = items.reduce((sum, item) => {
    const hasItemVat = item.include_vat !== undefined && item.include_vat && item.vat_rate !== undefined && item.vat_rate > 0;
    const vatRate = hasItemVat ? item.vat_rate / 100 : (quote.include_vat && quote.vat_rate > 0 ? quote.vat_rate / 100 : 0);
    return sum + (hasItemVat || (quote.include_vat && quote.vat_rate > 0) ? item.quantity * item.unit_price * vatRate : 0);
  }, 0);
  const total = subtotal + totalVat;

  const displayVatRate = (() => {
    const itemWithVat = items.find(item => item.include_vat && item.vat_rate !== undefined && item.vat_rate > 0);
    const vatRate = itemWithVat ? itemWithVat.vat_rate : (quote.include_vat && quote.vat_rate > 0 ? quote.vat_rate : 0);
    return vatRate.toFixed(0);
  })();

  return (
    <>
      {/* Mobile and Tablet Layout */}
      <div className="block lg:hidden mb-8">
        <div className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-3 text-center">Summary</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono">KES {subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalVat > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="font-medium">VAT ({displayVatRate}%):</span>
                <span className="font-mono">KES {totalVat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-lg">
              <span>Total:</span>
              <span className="font-mono">KES {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex justify-end mb-8">
        <div className="w-full md:w-96 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono">KES {subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalVat > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="font-medium">VAT ({displayVatRate}%):</span>
                <span className="font-mono">KES {totalVat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-lg">
              <span>Total:</span>
              <span className="font-mono">KES {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only version */}
      <div className="hidden print:block">
        <div className="float-right w-80 mt-6 mb-6">
          <table className="w-full border-collapse bg-gray-50 rounded-lg overflow-hidden">
            <tbody>
              <tr>
                <td className="px-4 py-3 font-medium">Subtotal:</td>
                <td className="px-4 py-3 text-right font-mono">KES {subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
              </tr>
              {totalVat > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium">VAT ({displayVatRate}%):</td>
                  <td className="px-4 py-3 text-right font-mono">KES {totalVat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              <tr className="bg-blue-600 text-white font-bold">
                <td className="px-4 py-3">Total:</td>
                <td className="px-4 py-3 text-right font-mono">KES {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="clear-both"></div>
      </div>
    </>
  );
};