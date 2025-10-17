// components/CreateInvoiceModal.tsx
import React, { useState } from "react";
import { X, FileText, Send, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Customer, Quote, CreateInvoiceForm } from "../types/InvoiceTypes";
import {
  formatCurrency,
  generateInvoiceNumber,
  calculateItemTotal,
} from "../utils/formatters";

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
      "Bank: Equity Bank\nAccount Name: DripTech Solutions\nAccount Number: 1234567890\nBranch: Nairobi\nSwift Code: EQBLKENA\n\nM-Pesa Paybill: 123456\nAccount Number: [Invoice Number]",
    items: [
      {
        name: "",
        description: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        total: 0,
      },
    ],
  });

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
  const addCreateFormItem = () => {
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
        description: item.description || null,
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
        notes: createForm.notes || null,
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
      alert("Error creating invoice. Please try again.");
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
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      customer_id: e.target.value,
                    })
                  }
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

              {/* Quote Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quote Reference (Optional)
                </label>
                <select
                  value={createForm.quote_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, quote_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                >
                  <option value="">Select Quote</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quote_number} -{" "}
                      {formatCurrency(quote.total_amount || 0)}
                    </option>
                  ))}
                </select>
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

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <select
                  value={createForm.payment_terms}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      payment_terms: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={creating}
                >
                  <option value="30 days">Net 30</option>
                  <option value="15 days">Net 15</option>
                  <option value="7 days">Net 7</option>
                  <option value="Due on receipt">Due on Receipt</option>
                </select>
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

            {/* Invoice Items Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invoice Items
                </h3>
                <button
                  type="button"
                  onClick={addCreateFormItem}
                  disabled={creating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                          Description
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                          Qty
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                          Unit
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          Unit Price
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          Total
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {createForm.items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <td className="px-3 sm:px-4 py-3">
                            <input
                              type="text"
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) =>
                                updateCreateFormItem(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-1 transition-colors"
                              required
                              disabled={creating}
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              value={item.description}
                              onChange={(e) =>
                                updateCreateFormItem(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={creating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateCreateFormItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 sm:w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={creating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                updateCreateFormItem(
                                  index,
                                  "unit",
                                  e.target.value,
                                )
                              }
                              className="w-16 sm:w-20 px-1 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={creating}
                            >
                              <option value="pcs">pcs</option>
                              <option value="set">set</option>
                              <option value="m">m</option>
                              <option value="m²">m²</option>
                              <option value="hrs">hrs</option>
                            </select>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateCreateFormItem(
                                  index,
                                  "unit_price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={creating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeCreateFormItem(index)}
                              disabled={
                                createForm.items.length === 1 || creating
                              }
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(calculateFormTotals().subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createForm.discount_amount}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          discount_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right transition-colors"
                      disabled={creating}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax ({createForm.tax_rate}%):
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(calculateFormTotals().taxAmount)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">
                      Total:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(calculateFormTotals().total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Details
              </label>
              <textarea
                rows={6}
                placeholder="Enter bank details, M-Pesa paybill, or other payment instructions..."
                value={createForm.payment_details}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    payment_details: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                disabled={creating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Include bank account details, M-Pesa paybill, or other payment
                methods
              </p>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Additional notes or terms..."
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
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
