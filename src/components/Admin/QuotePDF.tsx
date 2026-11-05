import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Layers3,
  Pencil,
  Printer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrintHandlers } from "@/hooks/usePrintHandlers";
import { COMPANY, getLogoUrl } from "./shared/companyBrand";
import { calculateQuoteTotals } from "./Quote/quoteCalculations";
import type { QuotePDFProps, QuoteItem } from "./Quote/types";

const formatKES = (value: number) =>
  (Number.isFinite(value) ? value : 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not specified"
    : date.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusStyles: Record<string, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  sent: "border-sky-200 bg-sky-50 text-sky-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  expired: "border-amber-200 bg-amber-50 text-amber-800",
};

const groupItems = (items: QuoteItem[]) => {
  const groups = new Map<string, { name: string; items: QuoteItem[] }>();
  items.forEach((item) => {
    const name = item.section_name?.trim() || "General";
    const key = item.section_id || `legacy:${name}`;
    const group = groups.get(key) || { name, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });
  return Array.from(groups.values());
};

export const QuotePDF: React.FC<QuotePDFProps> = ({
  quote,
  items,
  customer,
  onEdit,
}) => {
  const { handlePrint, handleDownloadPDF, isPrinting, isDownloading } =
    usePrintHandlers();
  const totals = calculateQuoteTotals(quote, items);
  const groups = groupItems(items);
  const status = quote.status?.toLowerCase() || "draft";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const projectFacts = [
    { label: "Project type", value: quote.project_type },
    { label: "Crop", value: quote.crop_type },
    {
      label: "Area",
      value: quote.area_size ? `${quote.area_size} acres` : undefined,
    },
    { label: "Water source", value: quote.water_source },
    { label: "Terrain", value: quote.terrain_info },
  ].filter((fact) => Boolean(fact.value));

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Document preview
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.draft}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {quote.quote_number}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A4 quotation · Kenya Shillings (KES)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="border-border bg-background text-foreground hover:bg-muted"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit quote
            </Button>
          )}
          <Button
            type="button"
            onClick={() => handlePrint(quote, items, customer)}
            disabled={isPrinting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Preparing…" : "Print"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDownloadPDF(quote, items, customer)}
            disabled={isDownloading}
            className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Preparing…" : "Save as PDF"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <article className="mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
            <div className="h-2 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#52a477]" />
            <div className="px-5 py-6 sm:px-9 sm:py-9">
              <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                    <img
                      src={getLogoUrl({ forPrint: true })}
                      alt={COMPANY.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-extrabold tracking-tight text-[#1b4332] sm:text-2xl">
                      {COMPANY.name}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {COMPANY.tagline}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {COMPANY.address}
                      <br />
                      {COMPANY.phone} · {COMPANY.email}
                    </p>
                  </div>
                </div>

                <div className="sm:min-w-[190px] sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2d6a4f]">
                    Commercial document
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-[0.08em] text-[#1b4332]">
                    QUOTATION
                  </h2>
                  <div className="mt-3 inline-flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs sm:items-end">
                    <span className="font-bold text-slate-900">
                      {quote.quote_number}
                    </span>
                    <span className="mt-1 text-slate-500">
                      Issued {formatDate(quote.created_at)}
                    </span>
                    <span className="text-slate-500">
                      Valid until {formatDate(quote.valid_until)}
                    </span>
                  </div>
                </div>
              </header>

              <section className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d6a4f]">
                    Prepared by
                  </p>
                  <p className="mt-2 font-bold text-slate-900">{COMPANY.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {COMPANY.address}
                    <br />
                    Tel: {COMPANY.phone}
                    <br />
                    Email: {COMPANY.email}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#f5f8f6] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d6a4f]">
                    Quoted to
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {customer?.company_name || customer?.contact_person || "Customer details not available"}
                  </p>
                  {customer?.company_name && customer?.contact_person && (
                    <p className="text-xs text-slate-600">
                      Attn: {customer.contact_person}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {customer?.address}
                    {customer?.city ? <><br />{customer.city}{customer.country ? `, ${customer.country}` : ""}</> : customer?.country ? <><br />{customer.country}</> : null}
                    {customer?.phone ? <><br />Tel: {customer.phone}</> : null}
                    {customer?.email ? <><br />{customer.email}</> : null}
                    {!customer && "Customer information has not been linked to this quotation."}
                  </p>
                </div>
              </section>

              {projectFacts.length > 0 && (
                <section className="mt-7">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-[#2d6a4f]" />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1b4332]">
                      Project overview
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {projectFacts.map((fact) => (
                      <div key={fact.label} className="rounded-lg bg-[#f5f8f6] px-3 py-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          {fact.label}
                        </p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-800">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-7">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-[#2d6a4f]" />
                      <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1b4332]">
                        Bill of quantities
                      </h3>
                    </div>
                    <p className="ml-3 mt-1 text-[11px] text-slate-500">
                      Itemised materials, equipment and project works
                    </p>
                  </div>
                  <span className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-[10px] font-bold text-[#1b4332]">
                    {items.length} {items.length === 1 ? "line item" : "line items"}
                  </span>
                </div>

                {groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    No BOQ items have been added to this quotation.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group, groupIndex) => {
                      const sectionTotal = group.items.reduce(
                        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
                        0,
                      );
                      return (
                        <div key={group.name + groupIndex} className="overflow-hidden rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between gap-3 bg-[#edf4ef] px-3 py-2.5">
                            <span className="text-xs font-bold text-[#1b4332]">
                              {groupIndex + 1}. {group.name}
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#1b4332]">
                              KES {formatKES(sectionTotal)}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] border-collapse text-left text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                                  <th className="w-8 px-2 py-2 text-center">#</th>
                                  <th className="px-2 py-2">Item / specification</th>
                                  <th className="w-14 px-2 py-2 text-center">Qty</th>
                                  <th className="w-14 px-2 py-2 text-center">Unit</th>
                                  <th className="w-24 px-2 py-2 text-right">Unit price</th>
                                  <th className="w-24 px-2 py-2 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items.map((item, index) => (
                                  <tr key={item.id} className="border-t border-slate-100 align-top">
                                    <td className="px-2 py-2.5 text-center text-slate-400">
                                      {index + 1}
                                    </td>
                                    <td className="max-w-[240px] px-2 py-2.5">
                                      <p className="break-words font-semibold text-slate-800">
                                        {item.name}
                                      </p>
                                      {item.description?.trim() && (
                                        <p className="mt-1 whitespace-pre-wrap break-words leading-4 text-slate-500">
                                          {item.description}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-2 py-2.5 text-center tabular-nums text-slate-700">
                                      {item.quantity}
                                    </td>
                                    <td className="px-2 py-2.5 text-center text-slate-600">
                                      {item.unit}
                                    </td>
                                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">
                                      {formatKES(Number(item.unit_price || 0))}
                                    </td>
                                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                                      {formatKES(Number(item.quantity || 0) * Number(item.unit_price || 0))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="mt-6 flex justify-end">
                <div className="w-full max-w-[290px] overflow-hidden rounded-xl border border-slate-200">
                  <div className="space-y-2 px-4 py-3 text-xs">
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        KES {formatKES(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>
                        VAT {totals.vatRate > 0 ? `(${totals.vatRate}%)` : "(not applied)"}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        KES {formatKES(totals.vat)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-[#1b4332] px-4 py-3 text-white">
                    <span className="text-xs font-bold uppercase tracking-[0.12em]">
                      Total payable
                    </span>
                    <span className="text-base font-extrabold tabular-nums">
                      KES {formatKES(totals.total)}
                    </span>
                  </div>
                </div>
              </section>

              {quote.notes?.trim() && (
                <section className="mt-7 rounded-lg border border-[#d7e5dc] bg-[#f5f8f6] p-4">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1b4332]">
                    Technical notes & commercial terms
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">
                    {quote.notes}
                  </p>
                </section>
              )}

              <section className="mt-10 grid grid-cols-2 gap-8">
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-[10px] font-semibold text-slate-600">
                    Authorised representative
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400">
                    {COMPANY.name}
                  </p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-[10px] font-semibold text-slate-600">
                    Customer acceptance
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Name, signature & date
                  </p>
                </div>
              </section>

              <footer className="mt-9 border-t border-slate-200 pt-4 text-center">
                <p className="text-xs font-bold text-[#1b4332]">
                  {COMPANY.name}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {COMPANY.tagline} · {COMPANY.phone} · {COMPANY.email}
                </p>
                <p className="mt-2 text-[9px] text-slate-400">
                  Thank you for considering DripTech Eco Flow for your irrigation project.
                </p>
              </footer>
            </div>
          </article>
        </div>

        <aside className="no-print space-y-3 xl:sticky xl:top-5">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Quotation summary
              </h3>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Total quotation value</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              KES {formatKES(totals.total)}
            </p>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">BOQ line items</span>
                <span className="font-semibold tabular-nums text-foreground">{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">BOQ sections</span>
                <span className="font-semibold tabular-nums text-foreground">{groups.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums text-foreground">KES {formatKES(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-semibold tabular-nums text-foreground">KES {formatKES(totals.vat)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Document details</h3>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Quote number</p>
                <p className="mt-0.5 font-semibold text-foreground">{quote.quote_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="mt-0.5 font-semibold text-foreground">{formatDate(quote.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valid until</p>
                <p className="mt-0.5 font-semibold text-foreground">{formatDate(quote.valid_until)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {customer?.company_name || customer?.contact_person || "Not linked"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Ready for review
            </div>
            <p className="mt-1 text-emerald-800">
              Review the BOQ, quotation validity and totals before printing or saving the PDF.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Paper layout is formatted for A4. Long descriptions remain wrapped within their BOQ rows.</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default QuotePDF;
