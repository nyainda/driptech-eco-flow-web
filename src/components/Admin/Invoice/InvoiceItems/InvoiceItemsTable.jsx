import React from 'react';
import { Plus } from 'lucide-react';
import InvoiceItemRow from './InvoiceItemRow';

const InvoiceItemsTable = ({ 
  items, 
  onUpdateItem, 
  onAddItem, 
  onRemoveItem, 
  disabled = false,
  title = "Invoice Items" 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button
          type="button"
          onClick={onAddItem}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
                <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Unit</th>
                <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
                <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
                <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <InvoiceItemRow
                  key={index}
                  item={item}
                  index={index}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                  disabled={disabled}
                  canRemove={items.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;