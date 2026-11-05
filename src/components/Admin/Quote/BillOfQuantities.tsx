import React from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { QuoteItem } from "./types";

interface BOQTableProps {
  items: QuoteItem[];
  onEdit?: () => void;
}

const money = (value: number) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const BOQTable: React.FC<BOQTableProps> = ({ items, onEdit }) => {
  const groups = new Map<string, { sectionName: string; items: QuoteItem[] }>();
  items.forEach((item) => {
    const sectionName = item.section_name?.trim() || "General";
    const groupKey = item.section_id || `legacy:${sectionName}`;
    const group = groups.get(groupKey) || { sectionName, items: [] };
    group.items.push(item);
    groups.set(groupKey, group);
  });

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400">
          Bill of Quantities (BOQ)
        </h3>
        {onEdit && (
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="print:hidden no-print border-blue-200 text-blue-900 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit BOQ
          </Button>
        )}
      </div>

      {groups.size === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No BOQ items have been added to this quotation.
        </p>
      ) : (
        <div className="space-y-5">
          {Array.from(groups.values()).map(({ sectionName, items: sectionItems }, groupIndex) => {
            const sectionTotal = sectionItems.reduce(
              (sum, item) => sum + Number(item.total || 0),
              0,
            );

            return (
              <section key={sectionItems[0]?.section_id || `legacy:${sectionName}:${groupIndex}`} className="break-inside-avoid">
                <div className="mb-0 flex items-center justify-between rounded-t-md border border-gray-200 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {sectionName}
                  </h4>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Section total: KES {money(sectionTotal)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse border border-gray-200 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        {["Item", "Description / Specification", "Qty", "Unit", "Unit Price (KES)", "Total (KES)"].map((heading) => (
                          <th
                            key={heading}
                            className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                        >
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-600 dark:text-gray-100">
                            {item.name}
                          </td>
                          <td className="whitespace-pre-wrap border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
                            {item.description}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                            {item.quantity}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                            {item.unit}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                            {money(item.unit_price)}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm font-medium text-gray-900 dark:border-gray-600 dark:text-gray-100">
                            {money(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
