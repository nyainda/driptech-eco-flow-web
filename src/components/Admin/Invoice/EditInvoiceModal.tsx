// components/EditInvoiceModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Invoice, Customer, Quote, EditInvoiceForm } from '../types/InvoiceTypes';
import { formatCurrency, calculateItemTotal } from '../utils/formatters';

interface EditInvoiceModalProps {
  invoice: Invoice;
  customers: Customer[];
  quotes: Quote[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  invoice,
  customers,
  quotes,
  onClose,
  onSuccess
}) => {
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditInvoiceForm>({
    customer_id: '',
    quote_id: '',
    issue_date: '',
    due_date: '',
    payment_terms: '30 days',
    tax_rate: 16,
    discount_amount: 0,
    notes: '',
    items: [
      {
        id: '',
        name: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        unit_price: 0,
        total: 0
      }
    ]
  });

  // Initialize form with invoice data
  useEffect(() => {
    if (invoice) {
      setEditForm({
        customer_id: invoice.customer_id || '',
        quote_id: invoice.quote_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms || '30 days',
        tax_rate: invoice.tax_rate || 16,
        discount_amount: invoice.discount_amount || 0,
        notes: invoice.notes || '',
        items: invoice.invoice_items?.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          unit_price: item.unit_price,
          total: item.total
        })) || [
          {
            id: '',
            name: '',
            description: '',
            quantity: 1,
            unit: 'pcs',
            unit_price: 0,
            total: 0
          }
        ]
      });
    }
  }, [invoice]);

  // Calculate form totals
  const calculateEditFormTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = editForm.discount_amount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (editForm.tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  // Update item in edit form
  const updateEditFormItem = (index: number, field: string, value: any) => {
    const updatedItems = [...editForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = calculateItemTotal(
        updatedItems[index].quantity,
        updatedItems[index].unit_price
      );
    }

    setEditForm({
      ...editForm,
      items: updatedItems
    });
  };

  // Add new item to edit form
  const addEditFormItem = () => {
    setEditForm({
      ...editForm,
      items: [
        ...editForm.items,
        {
          id: '',
          name: '',
          description: '',
          quantity: 1,
          unit: 'pcs',
          unit_price: 0,
          total: 0
        }
      ]
    });
  };

  // Remove item from edit form
  const removeEditFormItem = (index: number) => {
    if (editForm.items.length > 1) {
      const updatedItems = editForm.items.filter((_, i) => i !== index);
      setEditForm({
        ...editForm,
        items: updatedItems
      });
    }
  };

  // Update existing invoice
  const updateInvoice = async (invoiceId: string, invoiceData: any) => {
    try {
      const { data: updatedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .update({
          ...invoiceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error updating invoice:', invoiceError);
        throw invoiceError;
      }

      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  // Update invoice items
  const updateInvoiceItems = async (invoiceId: string, items: any[]) => {
    try {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (deleteError) {
        console.error('Error deleting existing items:', deleteError);
        throw deleteError;
      }

      // Insert new/updated items
      const itemsWithInvoiceId = items.map(item => ({
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        unit: item.unit || 'pcs',
        invoice_id: invoiceId
      }));

      const { error: insertError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (insertError) {
        console.error('Error inserting updated items:', insertError);
        throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error updating invoice items:', error);
      throw error;
    }
  };

  // Handle edit invoice form submission
  const handleUpdateInvoice = async () => {
    if (updating) return;

    // Validate form
    if (!editForm.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (editForm.items.some(item => !item.name.trim())) {
      alert('Please fill in all item names');
      return;
    }

    if (!editForm.issue_date || !editForm.due_date) {
      alert('Please set issue and due dates');
      return;
    }

    try {
      setUpdating(true);
      const totals = calculateEditFormTotals();
      
      const invoiceData = {
        customer_id: editForm.customer_id,
        quote_id: editForm.quote_id || null,
        issue_date: editForm.issue_date,
        due_date: editForm.due_date,
        payment_terms: editForm.payment_terms,
        tax_rate: editForm.tax_rate,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        notes: editForm.notes || null
      };

      const updatedInvoice = await updateInvoice(invoice.id, invoiceData);
      
      if (updatedInvoice) {
        await updateInvoiceItems(invoice.id, editForm.items);
        
        // Success feedback
        alert('Invoice updated successfully!');
        
        // Close modal and reload
        onClose();
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Edit Invoice {invoice.invoice_number}
          </h2>
          <button
            onClick={() => {
              if (!updating) {
                onClose();
              }
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={updating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateInvoice();
          }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  required
                  value={editForm.customer_id}
                  onChange={(e) => setEditForm({ ...editForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
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
                  value={editForm.quote_id}
                  onChange={(e) => setEditForm({ ...editForm, quote_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
                >
                  <option value="">Select Quote</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quote_number} - {formatCurrency(quote.total_amount || 0)}
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
                  value={editForm.issue_date}
                  onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
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
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <select 
                  value={editForm.payment_terms}
                  onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
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
                  value={editForm.tax_rate}
                  onChange={(e) => setEditForm({ ...editForm, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={updating}
                />
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addEditFormItem}
                  disabled={updating}
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
                        <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Unit</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
                        <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editForm.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3 sm:px-4 py-3">
                            <input
                              type="text"
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateEditFormItem(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-1 transition-colors"
                              required
                              disabled={updating}
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              value={item.description}
                              onChange={(e) => updateEditFormItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={updating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateEditFormItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 sm:w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={updating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <select 
                              value={item.unit}
                              onChange={(e) => updateEditFormItem(index, 'unit', e.target.value)}
                              className="w-16 sm:w-20 px-1 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={updating}
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
                              onChange={(e) => updateEditFormItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              disabled={updating}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeEditFormItem(index)}
                              disabled={editForm.items.length === 1 || updating}
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
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(calculateEditFormTotals().subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.discount_amount}
                      onChange={(e) => setEditForm({ ...editForm, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right transition-colors"
                      disabled={updating}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax ({editForm.tax_rate}%):</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(calculateEditFormTotals().taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(calculateEditFormTotals().total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Additional notes or terms..."
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                disabled={updating}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                {updating ? 'Updating...' : 'Update Invoice'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!updating) {
                    onClose();
                  }
                }}
                disabled={updating}
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

export default EditInvoiceModal;