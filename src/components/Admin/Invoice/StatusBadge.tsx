// components/StatusBadge.tsx
import React from 'react';
import { Edit, Send, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Edit, label: 'Draft' };
      case 'sent':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Send, label: 'Sent' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Paid' };
      case 'overdue':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertCircle, label: 'Overdue' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle, label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Clock, label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

export default StatusBadge;