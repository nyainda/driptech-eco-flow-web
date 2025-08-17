import React from 'react';
import { formatCurrency } from '../../utils/invoiceHelpers';

const InvoiceItemsDisplay = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No items found for this invoice
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {item.quantity} {item.unit}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                {formatCurrency(item.unit_price)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceItemsDisplay;