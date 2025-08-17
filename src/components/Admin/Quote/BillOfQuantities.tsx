import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { QuoteItem } from './types';

interface BOQTableProps {
  items: QuoteItem[];
  onEdit?: () => void;
}

export const BOQTable: React.FC<BOQTableProps> = ({ items, onEdit }) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
      <h3 className="font-semibold text-blue-900 dark:text-blue-400 text-lg">Bill of Quantities (BOQ)</h3>
      {onEdit && (
        <Button 
          onClick={onEdit} 
          size="sm" 
          variant="outline" 
          className="print:hidden no-print border-blue-200 dark:border-blue-600 text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit BOQ
        </Button>
      )}
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-600 rounded-lg min-w-[700px]">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Item</th>
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Description</th>
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Qty</th>
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Unit</th>
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">Unit Price (KES)</th>
            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">Total (KES)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-sm text-gray-900 dark:text-gray-200">{item.name}</td>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.description}</td>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{item.quantity}</td>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{item.unit}</td>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                {item.unit_price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-right font-medium text-sm text-gray-900 dark:text-gray-200">
                {item.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);