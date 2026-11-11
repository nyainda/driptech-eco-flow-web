import React from "react";
import {
  FileEdit,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (value: string) => {
    switch (value) {
      case "draft":
        return {
          color:
            "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
          icon: FileEdit,
          label: "Draft",
        };
      case "sent":
        return {
          color:
            "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
          icon: Send,
          label: "Issued / Sent",
        };
      case "paid":
        return {
          color:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          icon: CheckCircle2,
          label: "Paid • Receipted",
        };
      case "overdue":
        return {
          color:
            "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          icon: AlertTriangle,
          label: "Overdue",
        };
      case "cancelled":
        return {
          color:
            "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color:
            "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
          icon: Clock,
          label: value || "Pending",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.color}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
