import React from 'react';
import { Droplets } from "lucide-react";
import { Quote } from './types';

interface CompanyHeaderProps {
  quote: Quote;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ quote }) => (
  <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-500 rounded-xl flex items-center justify-center">
        <Droplets className="h-8 w-8 text-white" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-400">DripTech Solutions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Smart Irrigation Systems</p>
      </div>
    </div>
    <div className="text-left md:text-right">
      <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-400">QUOTATION</h2>
      <div className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Quote #: {quote.quote_number}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Date: {new Date(quote.created_at).toLocaleDateString()}</p>
        {quote.valid_until && (
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  </div>
);