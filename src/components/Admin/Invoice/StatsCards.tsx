// components/StatsCards.tsx
import React from "react";
import { FileText, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { InvoiceStats } from "../types/InvoiceTypes";
import { formatCurrency } from "../utils/formatters";

interface StatsCardsProps {
  stats: InvoiceStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
      {/* Total Invoices Card */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border dark:border-gray-700 transition-colors hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Total Invoices
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalInvoices}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Outstanding Card */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border dark:border-gray-700 transition-colors hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Outstanding
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 break-all">
              {formatCurrency(stats.totalOutstanding)}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Total Paid Card */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border dark:border-gray-700 transition-colors hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Total Paid
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 break-all">
              {formatCurrency(stats.totalPaid)}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Overdue Card */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border dark:border-gray-700 transition-colors hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Overdue
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.overdueCount}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
