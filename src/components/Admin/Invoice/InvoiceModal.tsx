import React from "react";
import { CheckCircle, Copy, Download, Link2, Printer, Send, X } from "lucide-react";
import { Invoice, InvoiceItem } from "../types/InvoiceTypes";
import { formatCurrency, formatDate } from "../utils/formatters";
import StatusBadge from "./StatusBadge";
import { COMPANY, getLogoUrl } from "../shared/companyBrand";

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPrintInvoice?: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: string) => void;
}

type ProjectGroup = {
  name: string;
  subtitle: string;
  link: string;
  items: InvoiceItem[];
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onDownloadPDF,
  onPrintInvoice,
  onUpdateStatus,
}) => {
  const projects = (invoice.invoice_items || []).reduce<ProjectGroup[]>(
    (groups, item) => {
      const name = item.project_name || "Project items";
      const subtitle = item.project_subtitle || "";
      const link = item.project_link || "";
      const group = groups.find(
        (candidate) =>
          candidate.name === name &&
          candidate.subtitle === subtitle &&
          candidate.link === link,
      );
      if (group) group.items.push(item);
      else groups.push({ name, subtitle, link, items: [item] });
      return groups;
    },
    [],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
              <img src={getLogoUrl({ forPrint: true })} alt={COMPANY.name} className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{COMPANY.name}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Invoice {invoice.invoice_number}</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-4 sm:p-7">
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Bill to</p>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-foreground">{invoice.customer?.company_name || invoice.customer?.contact_person}</p>
                <p className="text-muted-foreground">{invoice.customer?.contact_person}</p>
                {invoice.customer?.address && <p className="text-muted-foreground">{invoice.customer.address}</p>}
                <p className="text-muted-foreground">{invoice.customer?.city}, {invoice.customer?.country}</p>
                <p className="text-muted-foreground">{invoice.customer?.email}</p>
                {invoice.customer?.phone && <p className="text-muted-foreground">{invoice.customer.phone}</p>}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 lg:text-right">
              <div className="mb-3 lg:flex lg:justify-end"><StatusBadge status={invoice.status || "draft"} /></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:ml-auto lg:max-w-xs">
                <span className="text-muted-foreground">Issue date</span><span className="font-semibold text-foreground">{formatDate(invoice.issue_date)}</span>
                <span className="text-muted-foreground">Due date</span><span className="font-semibold text-foreground">{formatDate(invoice.due_date)}</span>
                <span className="text-muted-foreground">Payment terms</span><span className="font-semibold text-foreground">{invoice.payment_terms || "—"}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Project breakdown</p>
              <p className="mt-1 text-sm text-muted-foreground">Project subtotals roll up into the invoice total.</p>
            </div>
            {projects.map((project, projectIndex) => {
              const projectSubtotal = project.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
              return (
                <section key={`${project.name}-${projectIndex}`} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex flex-col gap-2 bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Project {projectIndex + 1}</p>
                      <h3 className="font-bold text-foreground">{project.name}</h3>
                      {project.subtitle && <p className="text-sm text-muted-foreground">{project.subtitle}</p>}
                      {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Link2 className="h-3 w-3" /> {project.link}</a>}
                    </div>
                    <p className="font-mono text-sm font-bold text-foreground">Subtotal {formatCurrency(projectSubtotal)}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px]">
                      <thead className="bg-[hsl(var(--dt-green-900))] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Description</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Unit price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {project.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3"><p className="text-sm font-semibold text-foreground">{item.name}</p>{item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}</td>
                            <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-3 text-right text-sm text-foreground">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mb-8 flex justify-end">
            <div className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-muted/50 p-4">
              <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              {!!invoice.discount_amount && invoice.discount_amount > 0 && <SummaryRow label="Discount" value={`− ${formatCurrency(invoice.discount_amount)}`} negative />}
              <SummaryRow label={invoice.tax_amount && invoice.tax_amount > 0 ? `VAT (${invoice.tax_rate || 0}%)` : "VAT"} value={invoice.tax_amount && invoice.tax_amount > 0 ? formatCurrency(invoice.tax_amount) : "Not applied"} />
              <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--dt-green-900))] p-3 text-white"><span className="font-bold">Total</span><span className="font-mono text-lg font-bold">{formatCurrency(invoice.total_amount)}</span></div>
            </div>
          </div>

          {invoice.payment_details && <InfoBlock title="Payment details"><pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">{invoice.payment_details}</pre></InfoBlock>}
          {invoice.notes && <InfoBlock title="Additional notes"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{invoice.notes}</p></InfoBlock>}
          {invoice.terms_and_conditions && <InfoBlock title="Terms and conditions"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{invoice.terms_and_conditions}</p></InfoBlock>}

          <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
            <button onClick={() => onDownloadPDF(invoice)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4" /> Download PDF</button>
            <button onClick={() => onPrintInvoice?.(invoice)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"><Printer className="h-4 w-4" /> Print invoice</button>
            {invoice.status === "draft" && <button onClick={() => { onUpdateStatus(invoice.id, "sent"); onClose(); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /> Send invoice</button>}
            {invoice.status === "sent" && <button onClick={() => { onUpdateStatus(invoice.id, "paid"); onClose(); }} className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--dt-green-700))] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(var(--dt-green-600))]"><CheckCircle className="h-4 w-4" /> Mark as paid</button>}
            <button onClick={() => { void navigator.clipboard.writeText(invoice.invoice_number); alert("Invoice number copied."); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"><Copy className="h-4 w-4" /> Copy number</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) => (
  <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className={`font-mono font-semibold ${negative ? "text-destructive" : "text-foreground"}`}>{value}</span></div>
);

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5 rounded-xl border border-border bg-card p-4"><h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">{title}</h3>{children}</div>
);

export default InvoiceModal;