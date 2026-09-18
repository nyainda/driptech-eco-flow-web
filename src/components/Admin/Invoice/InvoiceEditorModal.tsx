import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Link2,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Customer,
  Invoice,
  InvoiceProjectDraft,
  Quote,
} from "../types/InvoiceTypes";
import { calculateItemTotal, formatCurrency } from "../utils/formatters";

interface InvoiceEditorModalProps {
  customers: Customer[];
  quotes: Quote[];
  invoice?: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ProjectItem = InvoiceProjectDraft["items"][number];

const emptyItem = (): ProjectItem => ({
  name: "",
  description: "",
  quantity: 1,
  unit: "pcs",
  unit_price: 0,
  total: 0,
});

const emptyProject = (index = 1): InvoiceProjectDraft => ({
  id: `project-${Date.now()}-${index}`,
  name: "",
  subtitle: "",
  link: "",
  items: [emptyItem()],
});

const toDateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  customers,
  quotes,
  invoice,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(invoice);
  const existingProjects = useMemo<InvoiceProjectDraft[]>(() => {
    if (!invoice) return [emptyProject()];

    const grouped = new Map<string, InvoiceProjectDraft>();
    [...(invoice.invoice_items || [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .forEach((item, index) => {
        const name = item.project_name || "General project";
        const key = `${name}|${item.project_link || ""}|${item.project_subtitle || ""}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: `project-existing-${index}`,
            name: item.project_name || "",
            subtitle: item.project_subtitle || "",
            link: item.project_link || "",
            items: [],
          });
        }
        grouped.get(key)!.items.push({
          name: item.name,
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "pcs",
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || 0,
        });
      });

    return grouped.size ? Array.from(grouped.values()) : [emptyProject()];
  }, [invoice]);

  const [saving, setSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    invoice?.customer_id || "",
  );
  const [quoteId, setQuoteId] = useState(invoice?.quote_id || "");
  const [issueDate, setIssueDate] = useState(
    toDateInput(invoice?.issue_date) || new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    toDateInput(invoice?.due_date) ||
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [paymentTerms, setPaymentTerms] = useState(
    invoice?.payment_terms || "30 days",
  );
  const [taxRate, setTaxRate] = useState(Number(invoice?.tax_rate ?? 16));
  const [includeVat, setIncludeVat] = useState(
    invoice ? Number(invoice.tax_rate ?? 0) > 0 : true,
  );
  const [discountAmount, setDiscountAmount] = useState(
    Number(invoice?.discount_amount || 0),
  );
  const [paymentDetails, setPaymentDetails] = useState(
    invoice?.payment_details || "",
  );
  const [notes, setNotes] = useState(invoice?.notes || "");
  const [terms, setTerms] = useState(
    invoice?.terms_and_conditions ||
      "Payment is due according to the payment terms shown above. Work and materials remain the property of DripTech Eco Flow until payment is received in full.",
  );
  const [projects, setProjects] =
    useState<InvoiceProjectDraft[]>(existingProjects);

  const availableQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) =>
          !selectedCustomerId ||
          !quote.customer_id ||
          quote.customer_id === selectedCustomerId,
      ),
    [quotes, selectedCustomerId],
  );

  const updateProject = (
    projectIndex: number,
    field: keyof Pick<InvoiceProjectDraft, "name" | "subtitle" | "link">,
    value: string,
  ) => {
    setProjects((current) =>
      current.map((project, index) =>
        index === projectIndex ? { ...project, [field]: value } : project,
      ),
    );
  };

  const updateItem = (
    projectIndex: number,
    itemIndex: number,
    field: keyof ProjectItem,
    value: string | number,
  ) => {
    setProjects((current) =>
      current.map((project, pIndex) => {
        if (pIndex !== projectIndex) return project;
        const items = project.items.map((item, iIndex) => {
          if (iIndex !== itemIndex) return item;
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updated.total = calculateItemTotal(
              Number(updated.quantity) || 0,
              Number(updated.unit_price) || 0,
            );
          }
          return updated;
        });
        return { ...project, items };
      }),
    );
  };

  const addProject = () =>
    setProjects((current) => [...current, emptyProject(current.length + 1)]);

  const removeProject = (projectIndex: number) => {
    if (projects.length === 1) return;
    setProjects((current) => current.filter((_, index) => index !== projectIndex));
  };

  const addItem = (projectIndex: number) =>
    setProjects((current) =>
      current.map((project, index) =>
        index === projectIndex
          ? { ...project, items: [...project.items, emptyItem()] }
          : project,
      ),
    );

  const removeItem = (projectIndex: number, itemIndex: number) => {
    setProjects((current) =>
      current.map((project, index) => {
        if (index !== projectIndex || project.items.length === 1) return project;
        return {
          ...project,
          items: project.items.filter((_, item) => item !== itemIndex),
        };
      }),
    );
  };

  const handleQuoteSelect = async (value: string) => {
    setQuoteId(value);
    if (!value) return;
    const quote = quotes.find((item) => item.id === value);
    const { data } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", value)
      .order("created_at", { ascending: true });

    if (quote?.customer_id) setSelectedCustomerId(quote.customer_id);
    if (quote?.include_vat === false) setIncludeVat(false);
    if (quote?.vat_rate != null) setTaxRate(Number(quote.vat_rate));
    if (data?.length) {
      setProjects([
        {
          ...emptyProject(),
          name: quote?.quote_number || "Project",
          subtitle: quote?.notes || "",
          items: data.map((item: any) => ({
            name: item.name || "",
            description: item.description || "",
            quantity: Number(item.quantity) || 1,
            unit: item.unit || "pcs",
            unit_price: Number(item.unitprice ?? item.unit_price) || 0,
            total: Number(item.total) || 0,
          })),
        },
      ]);
    }
  };

  const flatItems = projects.flatMap((project, projectIndex) =>
    project.items.map((item, itemIndex) => ({
      ...item,
      project_name: project.name.trim() || null,
      project_subtitle: project.subtitle.trim() || null,
      project_link: project.link.trim() || null,
      sort_order: projectIndex * 10000 + itemIndex,
    })),
  );
  const subtotal = flatItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = includeVat ? (taxableAmount * Math.max(0, taxRate)) / 100 : 0;
  const total = taxableAmount + taxAmount;

  const handleSave = async (sendImmediately = false) => {
    if (saving) return;
    if (!selectedCustomerId) return alert("Please select a customer.");
    if (!issueDate || !dueDate) return alert("Please set the issue and due dates.");
    if (!projects.every((project) => project.items.every((item) => item.name.trim()))) {
      return alert("Please fill in every item name.");
    }

    try {
      setSaving(true);
      const invoicePayload = {
        customer_id: selectedCustomerId,
        quote_id: quoteId || null,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        tax_rate: includeVat ? taxRate : 0,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        subtotal,
        total_amount: total,
        notes: notes.trim() || null,
        terms_and_conditions: terms.trim() || null,
        payment_details: paymentDetails.trim() || null,
        ...(sendImmediately && !invoice ? { status: "sent", sent_at: new Date().toISOString() } : {}),
      };

      let invoiceId = invoice?.id;
      if (invoiceId) {
        const { error } = await supabase
          .from("invoices")
          .update({ ...invoicePayload, updated_at: new Date().toISOString() })
          .eq("id", invoiceId);
        if (error) throw error;
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoiceId);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("invoices")
          .insert({
            ...invoicePayload,
            invoice_number: `INV-${new Date().getFullYear()}${String(
              new Date().getMonth() + 1,
            ).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
            status: sendImmediately ? "sent" : "draft",
          })
          .select()
          .single();
        if (error) throw error;
        invoiceId = data.id;
      }

      const { error: itemsError } = await supabase.from("invoice_items").insert(
        flatItems.map((item) => ({
          invoice_id: invoiceId,
          name: item.name.trim(),
          description: item.description.trim() || null,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || "pcs",
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || 0,
          project_name: item.project_name,
          project_subtitle: item.project_subtitle,
          project_link: item.project_link,
          sort_order: item.sort_order,
        })),
      );
      if (itemsError) throw itemsError;

      alert(isEditing ? "Invoice updated successfully." : "Invoice created successfully.");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      alert(`Could not save invoice: ${error?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">DripTech Eco Flow</p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {isEditing ? `Edit ${invoice?.invoice_number}` : "Create a professional invoice"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add as many projects as needed, with a clear subtotal for each one.
            </p>
          </div>
          <button onClick={onClose} disabled={saving} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Step 01</p>
                    <h3 className="mt-1 text-lg font-bold text-foreground">Invoice details</h3>
                    <p className="text-sm text-muted-foreground">Who is being billed and when payment is due.</p>
                  </div>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Customer *">
                    <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} disabled={saving} className="invoice-input">
                      <option value="">Select customer</option>
                      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name || customer.contact_person}</option>)}
                    </select>
                  </Field>
                  <Field label="Quote reference">
                    <select value={quoteId} onChange={(e) => void handleQuoteSelect(e.target.value)} disabled={saving} className="invoice-input">
                      <option value="">No quote reference</option>
                      {availableQuotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.quote_number} · {formatCurrency(quote.total_amount || 0)}</option>)}
                    </select>
                  </Field>
                  <Field label="Issue date"><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={saving} className="invoice-input" /></Field>
                  <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving} className="invoice-input" /></Field>
                  <Field label="Payment terms">
                    <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} disabled={saving} className="invoice-input">
                      <option value="30 days">Net 30</option><option value="15 days">Net 15</option><option value="7 days">Net 7</option><option value="Due on receipt">Due on receipt</option>
                    </select>
                  </Field>
                  <Field label="Discount (KES)"><input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)} disabled={saving} className="invoice-input" /></Field>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Step 02</p>
                    <h3 className="mt-1 text-lg font-bold text-foreground">Projects and services</h3>
                    <p className="text-sm text-muted-foreground">Create unlimited project sections. Each has its own heading, link, line items, and subtotal.</p>
                  </div>
                  <button type="button" onClick={addProject} disabled={saving} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Add project</button>
                </div>
                <div className="space-y-5">
                  {projects.map((project, projectIndex) => {
                    const projectSubtotal = project.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
                    return (
                      <div key={project.id} className="rounded-xl border border-border bg-background p-4">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{projectIndex + 1}</span><span className="text-sm font-bold text-foreground">Project {projectIndex + 1}</span></div>
                          {projects.length > 1 && <button type="button" onClick={() => removeProject(projectIndex)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Project heading"><input value={project.name} onChange={(e) => updateProject(projectIndex, "name", e.target.value)} placeholder="e.g. Greenhouse irrigation installation" disabled={saving} className="invoice-input" /></Field>
                          <Field label="Project link (optional)"><div className="relative"><Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={project.link} onChange={(e) => updateProject(projectIndex, "link", e.target.value)} placeholder="https://..." disabled={saving} className="invoice-input pl-9" /></div></Field>
                          <div className="sm:col-span-2"><Field label="Subheading / scope"><input value={project.subtitle} onChange={(e) => updateProject(projectIndex, "subtitle", e.target.value)} placeholder="Short description of this project or phase" disabled={saving} className="invoice-input" /></Field></div>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                          <table className="w-full min-w-[680px] text-sm">
                            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Item / service</th><th className="px-3 py-2">Description</th><th className="w-20 px-3 py-2">Qty</th><th className="w-24 px-3 py-2">Unit</th><th className="w-32 px-3 py-2 text-right">Unit price</th><th className="w-32 px-3 py-2 text-right">Amount</th><th className="w-12 px-2" /></tr></thead>
                            <tbody className="divide-y divide-border">
                              {project.items.map((item, itemIndex) => <tr key={itemIndex}>
                                <td className="p-2"><input value={item.name} onChange={(e) => updateItem(projectIndex, itemIndex, "name", e.target.value)} placeholder="Service or material" disabled={saving} className="invoice-table-input w-44" /></td>
                                <td className="p-2"><input value={item.description} onChange={(e) => updateItem(projectIndex, itemIndex, "description", e.target.value)} placeholder="Optional detail" disabled={saving} className="invoice-table-input w-48" /></td>
                                <td className="p-2"><input type="number" min="0" value={item.quantity} onChange={(e) => updateItem(projectIndex, itemIndex, "quantity", Number(e.target.value) || 0)} disabled={saving} className="invoice-table-input w-16" /></td>
                                <td className="p-2"><input value={item.unit} onChange={(e) => updateItem(projectIndex, itemIndex, "unit", e.target.value)} disabled={saving} className="invoice-table-input w-20" /></td>
                                <td className="p-2"><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(projectIndex, itemIndex, "unit_price", Number(e.target.value) || 0)} disabled={saving} className="invoice-table-input w-28 text-right" /></td>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-foreground">{formatCurrency(item.total)}</td>
                                <td className="p-2 text-center"><button type="button" onClick={() => removeItem(projectIndex, itemIndex)} disabled={project.items.length === 1 || saving} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>
                              </tr>)}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between"><button type="button" onClick={() => addItem(projectIndex)} disabled={saving} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><Plus className="h-4 w-4" /> Add line item</button><div className="text-sm font-bold text-foreground">Project subtotal <span className="ml-3 font-mono text-primary">{formatCurrency(projectSubtotal)}</span></div></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Step 03</p><h3 className="mt-1 text-lg font-bold text-foreground">Payment, notes and terms</h3><p className="text-sm text-muted-foreground">These sections appear in the invoice and in the PDF.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="VAT"><div className="rounded-lg border border-border p-3"><label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-foreground"><input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} disabled={saving} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Apply VAT to this invoice</label>{includeVat && <div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} disabled={saving} className="invoice-input w-28" /><span className="text-sm text-muted-foreground">%</span></div>}</div></Field>
                  <Field label="Payment details"><textarea rows={4} value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} placeholder="Bank, M-Pesa or other payment instructions" disabled={saving} className="invoice-input resize-y" /></Field>
                  <Field label="Additional notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional project or customer notes" disabled={saving} className="invoice-input resize-y" /></Field>
                  <Field label="Terms and conditions"><textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment, delivery, warranty and cancellation terms" disabled={saving} className="invoice-input resize-y" /></Field>
                </div>
              </section>
            </div>

            <aside className="h-fit space-y-4 lg:sticky lg:top-0">
              <div className="rounded-2xl bg-[hsl(var(--dt-green-900))] p-5 text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--dt-gold-400))]">Invoice total</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(total)}</p>
                <div className="mt-5 space-y-3 border-t border-white/15 pt-4 text-sm">
                  <SummaryRow label="Projects" value={String(projects.length)} />
                  <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                  <SummaryRow label="Discount" value={`− ${formatCurrency(discountAmount)}`} />
                  <SummaryRow label={includeVat ? `VAT (${taxRate}%)` : "VAT"} value={includeVat ? formatCurrency(taxAmount) : "Not applied"} />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground"><CalendarDays className="h-4 w-4 text-primary" /> Ready to issue</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Review project headings and subtotals before saving. A PDF-ready version uses the same saved data.</p>
              </div>
            </aside>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-border bg-card px-4 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Cancel</button>
          <button type="button" onClick={() => void handleSave(false)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><Save className="h-4 w-4" /> {saving ? "Saving..." : isEditing ? "Save changes" : "Save draft"}</button>
          {!isEditing && <button type="button" onClick={() => void handleSave(true)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /> Create & send</button>}
        </footer>
      </div>
      <style>{`
        .invoice-input { width: 100%; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); color: hsl(var(--foreground)); border-radius: .55rem; padding: .65rem .75rem; font-size: .875rem; outline: none; }
        .invoice-input:focus, .invoice-table-input:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / .12); }
        .invoice-table-input { border: 1px solid hsl(var(--border)); background: hsl(var(--background)); color: hsl(var(--foreground)); border-radius: .45rem; padding: .45rem .55rem; font-size: .8125rem; outline: none; }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5 text-sm font-semibold text-foreground">
    <span>{label}</span>
    {children}
  </label>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3"><span className="text-white/70">{label}</span><span className="font-semibold">{value}</span></div>
);

export default InvoiceEditorModal;