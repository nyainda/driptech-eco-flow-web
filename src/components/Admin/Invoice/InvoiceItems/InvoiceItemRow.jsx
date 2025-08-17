import React from 'react';
import { Trash2 } from 'lucide-react';
import { UNIT_OPTIONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/invoiceHelpers';

const InvoiceItemRow = ({ 
  item, 
  index, 
  onUpdateItem, 
  onRemoveItem, 
  disabled = false,
  canRemove = true 
}) => {
  const handleFieldChange = (field, value) => {
    onUpdateItem(index, field, value);
  };

  return (
    <tr className="border-t border-gray-200 dark:border-gray-700">
      <td className="px-3 sm:px-4 py-3">
        <input
          type="text"
          placeholder="Item name"
          value={item.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-1 transition-colors"
          required
          disabled={disabled}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={item.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={disabled}
        />
      </td>
      <td className="px-3 sm:px-4 py-3">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 1)}
          className="w-16 sm:w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={disabled}
        />
      </td>
      <td className="px-3 sm:px-4 py-3">
        <select 
          value={item.unit}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
          className="w-16 sm:w-20 px-1 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={disabled}
        >
          {UNIT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 sm:px-4 py-3">
        <input
          type="number"
          step="0.01"
          min="0"
          value={item.unit_price}
          onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
          className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={disabled}
        />
      </td>
      <td className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
        {formatCurrency(item.total)}
      </td>
      <td className="px-3 sm:px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onRemoveItem(index)}
          disabled={!canRemove || disabled}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default InvoiceItemRow;