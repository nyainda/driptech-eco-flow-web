// components/CreateInvoiceModal.tsx
import React, { useMemo, useState } from "react";
import { X, FileText, Send, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Customer, Quote, CreateInvoiceForm } from "../types/InvoiceTypes";
import {
  formatCurrency,
  generateInvoiceNumber,
  calculateItemTotal,
} from "../utils/formatters";
import {
  encodeProjectDescription,
  encodeNotesWithDownPayment,
  DEFAULT_INVOICE_TERMS,
} from "../utils/invoiceProjects";

interface CreateInvoiceModalProps {
  customers: Customer[];
  quotes: Quote[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  customers,
  quotes,
  onClose,
  onSuccess,
}) => {
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateInvoiceForm>({
    customer_id: "",
    quote_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    payment_terms: "30 days",
    tax_rate: 16,
    discount_amount: 0,
    notes: "",
    payment_details:
      "Bank: Equity Bank\nAccount Name: DripTech Eco Flow\nAccount Number: 1234567890\nBranch: Nairobi\nSwift Code: EQBLKENA\n\nM-Pesa Paybill: 123456\nAccount Number: [Invoice Number]",
    down_payment_amount: 0,
    terms_conditions: DEFAULT_INVOICE_TERMS,
    items: [
      {
        name: "",
        description: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        total: 0,
        project_title: "Project 1",
      },
    ],
  });
  const [loadingQuoteItems, setLoadingQuoteItems] = useState(false);

  // Quotes shown in dropdown: all, or filtered by selected customer
  const availableQuotes = useMemo(() => {
    if (!createForm.customer_id) return quotes;
    return quotes.filter(
      (q) => !q.customer_id || q.customer_id === createForm.customer_id,
    );
  }, [quotes, createForm.customer_id]);

  const handleQuoteSelect = async (quoteId: string) => {
    if (!quoteId) {
      setCreateForm((prev) => ({ ...prev, quote_id: "" }));
      return;
    }

    const quote = quotes.find((q) => q.id === quoteId);
    setLoadingQuoteItems(true);
    try {
      const { data: items, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading quote items:", error);
        alert("Could not load items from that quote. You can still add lines manually.");
        setCreateForm((prev) => ({
          ...prev,
          quote_id: quoteId,
          customer_id: quote?.customer_id || prev.customer_id,
        }));
        return;
      }

      const mapped =
        (items || []).map((item: any) => ({
          name: item.name || "",
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "pcs",
          unit_price: Number(item.unitprice ?? item.unit_price) || 0,
          total: Number(item.total) || 0,
        })) || [];

      setCreateForm((prev) => ({
        ...prev,
        quote_id: quoteId,
        customer_id: quote?.customer_id || prev.customer_id,
        tax_rate:
          quote?.include_vat === false
            ? 0
            : quote?.vat_rate != null
              ? Number(quote.vat_rate)
              : prev.tax_rate,
        notes: quote?.notes
          ? `From quote ${quote.quote_number}${quote.notes ? ` — ${quote.notes}` : ""}`
          : prev.notes || (quote ? `From quote ${quote.quote_number}` : prev.notes),
        items:
          mapped.length > 0
            ? mapped
            : [
                {
                  name: "",
                  description: "",
                  quantity: 1,
                  unit: "pcs",
                  unit_price: 0,
                  total: 0,
                },
              ],
      }));
    } finally {
      setLoadingQuoteItems(false);
    }
  };

  // Calculate form totals
  const calculateFormTotals = () => {
    const subtotal = createForm.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const discountAmount = createForm.discount_amount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (createForm.tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  // Update item in create form
  const updateCreateFormItem = (index: number, field: string, value: any) => {
    const updatedItems = [...createForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate total for this item
    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total = calculateItemTotal(
        updatedItems[index].quantity,
        updatedItems[index].unit_price,
      );
    }

    setCreateForm({
      ...createForm,
      items: updatedItems,
    });
  };

  // Add new item to create form
  const addCreateFormItem = (projectTitle?: string) => {
    const lastTitle =
      projectTitle ||
      createForm.items[createForm.items.length - 1]?.project_title ||
      `Project ${createForm.items.length + 1}`;
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          unit_price: 0,
          total: 0,
          project_title: lastTitle,
        },
      ],
    });
  };

  const addProjectSection = () => {
    const existingTitles = new Set(
      createForm.items.map((i) => (i.project_title || "").trim()).filter(Boolean),
    );
    let n = existingTitles.size + 1;
    let title = `Project ${n}`;
    while (existingTitles.has(title)) {
      n += 1;
      title = `Project ${n}`;
    }
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          unit_price: 0,
          total: 0,
          project_title: title,
        },
      ],
    });
  };

  // Remove item from create form
  const removeCreateFormItem = (index: number) => {
    if (createForm.items.length > 1) {
      const updatedItems = createForm.items.filter((_, i) => i !== index);
      setCreateForm({
        ...createForm,
        items: updatedItems,
      });
    }
  };

  // Create new invoice
  const createInvoice = async (invoiceData: any) => {
    try {
      const invoiceNumber = generateInvoiceNumber();
      const dataWithNumber = {
        ...invoiceData,
        invoice_number: invoiceNumber,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([dataWithNumber])
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw invoiceError;
      }

      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  };

  // Create invoice items
  const createInvoiceItems = async (invoiceId: string, items: any[]) => {
    try {
      const itemsWithInvoiceId = items.map((item) => ({
        name: item.name,
        description: encodeProjectDescription(item.project_title, item.description),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        unit: item.unit || "pcs",
        invoice_id: invoiceId,
      }));

      const { error } = await supabase
        .from("invoice_items")
        .insert(itemsWithInvoiceId);

      if (error) {
        console.error("Error creating invoice items:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error creating invoice items:", error);
      throw error;
    }
  };

  // Handle create invoice form submission
  const handleCreateInvoice = async (sendImmediately: boolean = false) => {
    if (creating) return;

    // Validate form
    if (!createForm.customer_id) {
      alert("Please select a customer");
      return;
    }

    if (createForm.items.some((item) => !item.name.trim())) {
      alert("Please fill in all item names");
      return;
    }

    if (!createForm.issue_date || !createForm.due_date) {
      alert("Please set issue and due dates");
      return;
    }

    try {
      setCreating(true);
      const totals = calculateFormTotals();

      const termsBlock = (createForm.terms_conditions || "").trim();
      const userNotes = (createForm.notes || "").trim();
      const combinedNotes = [userNotes, termsBlock ? `---TERMS---\n${termsBlock}` : ""]
        .filter(Boolean)
        .join("\n\n");

      const invoiceData = {
        customer_id: createForm.customer_id,
        quote_id: createForm.quote_id || null,
        issue_date: createForm.issue_date,
        due_date: createForm.due_date,
        payment_terms: createForm.payment_terms,
        tax_rate: createForm.tax_rate,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        notes: encodeNotesWithDownPayment(combinedNotes, createForm.down_payment_amount),
        payment_details: createForm.payment_details || null,
        status: sendImmediately ? "sent" : "draft",
        ...(sendImmediately && { sent_at: new Date().toISOString() }),
      };

      const newInvoice = await createInvoice(invoiceData);

      if (newInvoice) {
        await createInvoiceItems(newInvoice.id, createForm.items);

        // Success feedback
        alert(
          sendImmediately
            ? "Invoice created and sent successfully!"
            : "Invoice created as draft successfully!",
        );

        // Close modal and reload
        onClose();
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.message || "Unknown error";
      alert(`Error creating invoice: ${message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Create New Invoice
          </h2>
          <button
            onClick={() => {
              if (!creating) {
                onClose();
              }
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={creating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateInvoice(false);
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  required
                  value={createForm.customer_id}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    const keepQuote =
                      createForm.quote_id &&
                      quotes.find(
                        (q) =>
                          q.id === createForm.quote_id &&
                          (!q.customer_id || q.customer_id === customerId),
                      );
                    setCreateForm({
                      ...createForm,
                      customer_id: customerId,
                      quote_id: keepQuote ? createForm.quote_id : "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.contact_person}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quote → invoice link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From quote {loadingQuoteItems && (
                    <span className="text-xs text-muted-foreground">(loading items…)</span>
                  )}
                </label>
                <select
                  value={createForm.quote_id}
                  onChange={(e) => handleQuoteSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  disabled={creating || loadingQuoteItems}
                >
                  <option value="">No quote — enter items manually</option>
                  {availableQuotes.map((quote) => {
                    const who =
                      quote.customer?.company_name ||
                      quote.customer?.contact_person ||
                      "";
                    const status = quote.status ? ` · ${quote.status}` : "";
                    return (
                      <option key={quote.id} value={quote.id}>
                        {quote.quote_number}
                        {who ? ` — ${who}` : ""}
                        {" · "}
                        {formatCurrency(quote.total_amount || 0)}
                        {status}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choosing a quote fills the customer and line items automatically.
                </p>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  required
                  value={createForm.issue_date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, issue_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={createForm.due_date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, due_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Payment Terms (short schedule) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment schedule
                </label>
                <input
                  type="text"
                  value={createForm.payment_terms}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      payment_terms: e.target.value,
                    })
                  }
                  placeholder="e.g. 50% deposit, 50% on completion"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={createForm.tax_rate}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      tax_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Invoice Items — multi-project */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Invoice Items by Project
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Group lines under Project 1, Project 2, … Each project gets its own heading and subtotal on the invoice.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addCreateFormItem()}
                    disabled={creating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={addProjectSection}
                    disabled={creating}
                    className="flex items-center gap-2 px-3 py-1.5 border border-blue-600 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Project Section
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {createForm.items.map((item, index) => {
                  const prevTitle =
                    index > 0
                      ? (createForm.items[index - 1].project_title || "").trim()
                      : null;
                  const title = (item.project_title || "").trim() || "General";
                  const showHeader = index === 0 || title !== prevTitle;
                  const projectSubtotal = createForm.items
                    .filter((i) => (i.project_title || "").trim() === (item.project_title || "").trim())
                    .reduce((s, i) => s + (Number(i.total) || 0), 0);

                  return (
                    <div key={index}>
                      {showHeader && (
                        <div className="flex flex-wrap items-center gap-2 mb-2 mt-2 px-1">
                          <input
                            type="text"
                            value={item.project_title || ""}
                            onChange={(e) => {
                              const newTitle = e.target.value;
                              const oldTitle = item.project_title || "";
                              setCreateForm({
                                ...createForm,
                                items: createForm.items.map((it) =>
                                  (it.project_title || "") === oldTitle
                                    ? { ...it, project_title: newTitle }
                                    : it,
                                ),
                              });
                            }}
                            placeholder="Project name e.g. Greenhouse – Kiambu"
                            className="flex-1 min-w-[200px] px-3 py-2 border-2 border-blue-200 dark:border-blue-800 rounded-lg font-semibold text-sm bg-blue-50 dark:bg-gray-700 dark:text-white"
                            disabled={creating}
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Subtotal: {formatCurrency(projectSubtotal)}
                          </span>
                        </div>
                      )}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white dark:bg-gray-800">
                        <div className="sm:col-span-3">
                          <label className="text-xs text-gray-500">Item / Service</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateCreateFormItem(index, "name", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={creating}
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-xs text-gray-500">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateCreateFormItem(index, "description", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={creating}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-xs text-gray-500">Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCreateFormItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={creating}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-xs text-gray-500">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              updateCreateFormItem(index, "unit", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={creating}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-gray-500">Unit price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateCreateFormItem(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={creating}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-xs text-gray-500">Total</label>
                          <div className="px-2 py-1.5 text-sm font-semibold">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeCreateFormItem(index)}
                            disabled={creating || createForm.items.length === 1}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deposit, terms, notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Down payment / deposit (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.down_payment_amount}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      down_payment_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  disabled={creating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shown on the invoice with balance due. Leave 0 if none.
                </p>
              </div>

            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Terms &amp; conditions
              </label>
              <textarea
                rows={5}
                value={createForm.terms_conditions}
                onChange={(e) =>
                  setCreateForm({ ...createForm, terms_conditions: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y text-sm"
                disabled={creating}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional notes
              </label>
              <textarea
                rows={2}
                placeholder="Internal or client notes (optional)"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-none"
                disabled={creating}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {creating ? "Creating..." : "Create Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleCreateInvoice(true)}
                disabled={creating}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {creating ? "Creating..." : "Create & Send"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!creating) {
                    onClose();
                  }
                }}
                disabled={creating}
                className="px-4 sm:px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
