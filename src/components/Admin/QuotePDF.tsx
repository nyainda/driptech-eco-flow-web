import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Printer,
  Wallet,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrintHandlers } from "@/hooks/usePrintHandlers";
import { COMPANY, getLogoUrl, numberToWordsKES } from "./shared/companyBrand";
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
  draft: "border-slate-300 bg-slate-100 text-slate-800",
  sent: "border-sky-300 bg-sky-50 text-sky-900",
  accepted: "border-emerald-300 bg-emerald-50 text-emerald-900",
  rejected: "border-rose-300 bg-rose-50 text-rose-900",
  expired: "border-amber-300 bg-amber-50 text-amber-900",
};

const groupItems = (items: QuoteItem[]) => {
  const groups = new Map<string, { name: string; items: QuoteItem[] }>();
  items.forEach((item) => {
    const name = item.section_name?.trim() || "General Irrigation Works";
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
    {
      label: "Project Scope",
      value: quote.project_type || "Commercial Irrigation System",
    },
    {
      label: "Target Crop / Use",
      value: quote.crop_type || "Standard Agronomic Layout",
    },
    {
      label: "Net Irrigated Area",
      value: quote.area_size ? `${quote.area_size} Acres` : "As Specified",
    },
    {
      label: "Water Source",
      value: quote.water_source || "Client Site Supply",
    },
    {
      label: "Terrain / Profile",
      value: quote.terrain_info || "Standard Field Gradient",
    },
    {
      label: "Currency",
      value: "Kenya Shillings (KES)",
    },
  ];

  const termsText = quote.notes?.trim() || COMPANY.defaultQuoteTerms;

  return (
    <div className="space-y-5">
      {/* Action Control Bar */}
      <div className="no-print flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Executive A4 Document Preview
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] || statusStyles.draft}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-base font-bold text-foreground">
            {quote.quote_number} ·{" "}
            {customer?.company_name ||
              customer?.contact_person ||
              "Direct Client Proposal"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vector-crisp A4 Quotation &amp; Bill of Quantities · Ready for
            Client Presentation
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
              Edit Proposal
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePrint(quote, items, customer)}
            disabled={isPrinting}
            className="border-border bg-background text-foreground hover:bg-muted"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Preparing…" : "Print A4"}
          </Button>
          <Button
            type="button"
            onClick={() => handleDownloadPDF(quote, items, customer)}
            disabled={isDownloading}
            className="col-span-2 sm:col-span-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Generating PDF…" : "Download Official PDF"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* A4 Document Sheet */}
        <div className="min-w-0">
          <article className="mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xl print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
            {/* Corporate Masthead */}
            <header className="bg-gradient-to-r from-[#0d281e] via-[#1b4332] to-[#2d6a4f] px-6 py-7 text-white border-b-4 border-[#c59b27] sm:px-9">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2.5 shadow-md">
                    <img
                      src={getLogoUrl({ forPrint: true })}
                      alt={COMPANY.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {COMPANY.name}
                    </h1>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-200">
                      {COMPANY.tagline}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
                      {COMPANY.address}
                      <br />
                      Tel: {COMPANY.phone} · Email: {COMPANY.email} ·{" "}
                      {COMPANY.website}
                    </p>
                  </div>
                </div>

                <div className="sm:min-w-[220px] sm:text-right">
                  <span className="inline-block rounded-full border border-amber-300/40 bg-white/10 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
                    Commercial Proposal &amp; BOQ
                  </span>
                  <h2 className="mt-1.5 text-2xl font-black tracking-[0.08em] text-white sm:text-3xl">
                    QUOTATION
                  </h2>
                  <div className="mt-3 rounded-lg border border-white/20 bg-slate-950/35 px-3.5 py-2.5 text-left text-[11px] space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-300">Quotation Ref:</span>
                      <strong className="font-mono text-white">
                        {quote.quote_number}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-300">Date Issued:</span>
                      <strong className="text-white">
                        {formatDate(quote.created_at)}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-300">Valid Until:</span>
                      <strong className="text-white">
                        {formatDate(quote.valid_until)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="px-6 py-7 sm:px-9 sm:py-8 space-y-6">
              {/* Two-Column Client & Site Specification Matrix */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1b4332]">
                      Client / Prepared For
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-[#2d6a4f]" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {customer?.company_name ||
                      customer?.contact_person ||
                      "Direct Commercial Client"}
                  </p>
                  {customer?.company_name && customer?.contact_person && (
                    <p className="mt-1 text-xs text-slate-700">
                      <span className="font-semibold">Attention:</span>{" "}
                      {customer.contact_person}
                    </p>
                  )}
                  <div className="mt-1.5 space-y-0.5 text-xs text-slate-600">
                    {customer?.address && <p>{customer.address}</p>}
                    {(customer?.city || customer?.country) && (
                      <p>
                        {[customer?.city, customer?.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {customer?.phone && <p>Tel: {customer.phone}</p>}
                    {customer?.email && <p>Email: {customer.email}</p>}
                    {!customer && (
                      <p className="italic text-slate-500">
                        Customer profile not linked to this quotation.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1b4332]">
                      Agronomic &amp; Site Specifications
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Engineering Basis
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {projectFacts.map((fact) => (
                      <div
                        key={fact.label}
                        className="border-l-2 border-[#c59b27] pl-2.5"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          {fact.label}
                        </p>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Executive Section Summary (when > 1 section) */}
              {groups.length > 1 && (
                <section>
                  <div className="mb-2 flex items-end justify-between border-b-2 border-[#12372a] pb-1.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#12372a]">
                      Executive BOQ Section Summary
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {groups.length} Work Packages
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-[#12372a] text-[10px] uppercase tracking-wider text-white">
                          <th className="w-20 px-3 py-2 text-center">Code</th>
                          <th className="px-3 py-2">
                            Work Package / Section Description
                          </th>
                          <th className="w-20 px-3 py-2 text-center">Items</th>
                          <th className="w-36 px-3 py-2 text-right">
                            Subtotal (KES)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {groups.map((grp, idx) => {
                          const secTotal = grp.items.reduce(
                            (s, i) =>
                              s +
                              Number(i.quantity || 0) *
                                Number(i.unit_price || 0),
                            0,
                          );
                          return (
                            <tr
                              key={grp.name + idx}
                              className="even:bg-slate-50"
                            >
                              <td className="px-3 py-2 text-center font-mono text-[11px] font-bold text-slate-500">
                                SEC-{String(idx + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-900">
                                {grp.name}
                              </td>
                              <td className="px-3 py-2 text-center text-slate-600">
                                {grp.items.length}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                {formatKES(secTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Itemized Bill of Quantities Table */}
              <section>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#12372a] pb-1.5">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#12372a]">
                      Itemized Bill of Quantities (BOQ)
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#eef5f0] px-2.5 py-0.5 text-[10px] font-bold text-[#1b4332]">
                    {items.length}{" "}
                    {items.length === 1 ? "Line Item" : "Line Items"} · Values
                    in KES
                  </span>
                </div>

                {groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    No BOQ items have been added to this quotation.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-300">
                    <table className="w-full min-w-[620px] border-collapse text-left text-[11.5px]">
                      <thead>
                        <tr className="bg-[#12372a] text-[10px] uppercase tracking-[0.08em] text-white">
                          <th className="w-12 px-2.5 py-2.5 text-center">
                            Item
                          </th>
                          <th className="px-3 py-2.5">
                            Description &amp; Technical Specification
                          </th>
                          <th className="w-16 px-2 py-2.5 text-center">Unit</th>
                          <th className="w-16 px-2 py-2.5 text-center">Qty</th>
                          <th className="w-28 px-3 py-2.5 text-right">
                            Unit Rate (KES)
                          </th>
                          <th className="w-28 px-3 py-2.5 text-right">
                            Total (KES)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map((group, groupIndex) => {
                          const sectionCode = String(groupIndex + 1).padStart(
                            2,
                            "0",
                          );
                          const sectionTotal = group.items.reduce(
                            (sum, item) =>
                              sum +
                              Number(item.quantity || 0) *
                                Number(item.unit_price || 0),
                            0,
                          );
                          return (
                            <React.Fragment key={group.name + groupIndex}>
                              <tr className="border-y border-emerald-200 bg-[#eef5f0]">
                                <td
                                  colSpan={6}
                                  className="px-3 py-2 text-[11px] font-extrabold tracking-wide text-[#12372a]"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <span>
                                      SECTION {sectionCode}:{" "}
                                      {group.name.toUpperCase()}
                                    </span>
                                    <span className="font-mono">
                                      SUBTOTAL: KES {formatKES(sectionTotal)}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {group.items.map((item, itemIdx) => {
                                const code = `${groupIndex + 1}.${String(itemIdx + 1).padStart(2, "0")}`;
                                const lineTotal =
                                  Number(item.quantity || 0) *
                                  Number(item.unit_price || 0);
                                return (
                                  <tr
                                    key={item.id}
                                    className="border-t border-slate-200 align-top even:bg-slate-50/70"
                                  >
                                    <td className="px-2.5 py-2.5 text-center font-mono text-[11px] font-bold text-slate-500">
                                      {code}
                                    </td>
                                    <td className="max-w-[260px] px-3 py-2.5">
                                      <p className="break-words font-bold text-slate-900">
                                        {item.name}
                                      </p>
                                      {item.description?.trim() && (
                                        <p className="mt-0.5 whitespace-pre-wrap break-words leading-4 text-[11px] text-slate-600">
                                          {item.description}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-2 py-2.5 text-center text-slate-600">
                                      {item.unit || "unit"}
                                    </td>
                                    <td className="px-2 py-2.5 text-center font-bold tabular-nums text-slate-800">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                                      {formatKES(Number(item.unit_price || 0))}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">
                                      {formatKES(lineTotal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Financial Summary & Amount in Words */}
              <section className="grid gap-5 pt-2 sm:grid-cols-[1.15fr_0.85fr] items-start">
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 border-l-4 border-l-[#c59b27] bg-[#fbf7eb] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-900">
                      Total Quotation Amount in Words
                    </p>
                    <p className="mt-1 text-xs font-bold italic text-slate-900">
                      {numberToWordsKES(totals.total)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 whitespace-pre-line">
                    <strong className="block text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-[#1b4332] mb-1">
                      Official Payment &amp; Remittance Instructions
                    </strong>
                    {COMPANY.defaultPaymentDetails}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-[#12372a]">
                  <div className="space-y-2.5 px-4 py-3.5 text-xs">
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span className="font-semibold">
                        BOQ Subtotal (Excl. VAT)
                      </span>
                      <span className="font-bold tabular-nums text-slate-900">
                        KES {formatKES(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-600 border-t border-slate-200 pt-2">
                      <span className="font-semibold">
                        {totals.vatRate > 0
                          ? `VAT (${totals.vatRate}%)`
                          : "VAT (Exempt / Not Applied)"}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900">
                        KES {formatKES(totals.vat)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-[#12372a] px-4 py-3.5 text-white">
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em]">
                      Total Payable
                    </span>
                    <span className="text-base font-black tabular-nums">
                      KES {formatKES(totals.total)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Engineering Notes & Terms */}
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#12372a]">
                  Engineering Notes, Warranty &amp; Commercial Terms
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-600">
                  {termsText}
                </p>
              </section>

              {/* Sign-Off & Stamp */}
              <section className="pt-6 grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr] gap-6 items-end">
                <div className="border-t-2 border-slate-800 pt-2">
                  <p className="text-[11px] font-extrabold text-slate-900">
                    Prepared &amp; Authorized By
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    For: {COMPANY.name} · Engineering Desk
                  </p>
                </div>

                <div className="mx-auto flex h-20 w-36 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#1b4332] bg-emerald-50/70 p-2 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1b4332]">
                    {COMPANY.name}
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold text-emerald-700">
                    VERIFIED BOQ PROPOSAL
                  </span>
                  <span className="mt-0.5 font-mono text-[8px] text-slate-600">
                    {quote.quote_number}
                  </span>
                </div>

                <div className="border-t-2 border-slate-800 pt-2">
                  <p className="text-[11px] font-extrabold text-slate-900">
                    Client Acceptance &amp; Confirmation
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Authorized Name, Signature, Stamp &amp; Date
                  </p>
                </div>
              </section>

              <footer className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="font-bold text-[#12372a]">
                  {COMPANY.name} · {COMPANY.website}
                </span>
                <span>
                  Document Ref: {quote.quote_number} · Generated by DripTech
                  Enterprise BOQ Engine
                </span>
              </footer>
            </div>
          </article>
        </div>

        {/* Sticky Executive Summary Sidebar */}
        <aside className="no-print space-y-4 xl:sticky xl:top-20">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Financial Summary
              </h3>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Total Quotation Value
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              KES {formatKES(totals.total)}
            </p>
            <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Work Packages</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {groups.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">BOQ Line Items</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums text-foreground">
                  KES {formatKES(totals.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-semibold tabular-nums text-foreground">
                  KES {formatKES(totals.vat)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Proposal Metadata
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Reference Number</p>
                <p className="mt-0.5 font-mono font-semibold text-foreground">
                  {quote.quote_number}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Issued</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {formatDate(quote.created_at)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Validity Date</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {formatDate(quote.valid_until)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {customer?.company_name ||
                    customer?.contact_person ||
                    "Not linked"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Enterprise A4 Layout
            </div>
            <p className="mt-1.5 text-muted-foreground">
              Formatted with executive section summaries, amount-in-words, and
              corporate verification stamp for high-value tenders.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default QuotePDF;
