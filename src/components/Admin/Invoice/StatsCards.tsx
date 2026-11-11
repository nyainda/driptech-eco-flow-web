import React from "react";
import {
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { InvoiceStats } from "../types/InvoiceTypes";
import { formatCurrency } from "../utils/formatters";

interface StatsCardsProps {
  stats: InvoiceStats & {
    paidCount?: number;
    totalBilled?: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: "Total Billed Volume",
      value:
        stats.totalBilled !== undefined
          ? formatCurrency(stats.totalBilled)
          : String(stats.totalInvoices),
      subtext: `${stats.totalInvoices} commercial invoice${stats.totalInvoices === 1 ? "" : "s"} issued`,
      icon: FileText,
      iconBg: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "Outstanding Receivables",
      value: formatCurrency(stats.totalOutstanding),
      subtext: "Awaiting client settlement",
      icon: DollarSign,
      iconBg:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      label: "Official Receipts (Paid)",
      value: formatCurrency(stats.totalPaid),
      subtext:
        stats.paidCount !== undefined
          ? `${stats.paidCount} verified payment receipt${stats.paidCount === 1 ? "" : "s"}`
          : "Settled & receipted in full",
      icon: Receipt,
      iconBg:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      label: "Overdue Accounts",
      value: String(stats.overdueCount),
      subtext:
        stats.overdueCount > 0
          ? "Past payment due date"
          : "All accounts within credit terms",
      icon: stats.overdueCount > 0 ? AlertTriangle : CheckCircle2,
      iconBg:
        stats.overdueCount > 0
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:shadow-md flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                {card.label}
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {card.subtext}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
