import React from 'react';
import { FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceHelpers';

const InvoiceStatsCards = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats.totalOutstanding),
      icon: DollarSign,
      color: 'text-orange-600'
    },
    {
      title: 'Total Paid',
      value: formatCurrency(stats.totalPaid),
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: stats.overdueCount,
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceStatsCards;