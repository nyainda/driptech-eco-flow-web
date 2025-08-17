import React, { useState, useEffect } from 'react';
import { X, Edit, Loader2 } from 'lucide-react';
import InvoiceItemsTable from './InvoiceItems/InvoiceItemsTable';
import { 
  PAYMENT_TERMS, 
  DEFAULT_TAX_RATE 
} from '../utils/constants';
import { 
  calculateItemTotal, 
  calculateInvoiceTotals 
} from '../utils/invoiceCalculations';
import { formatCurrency } from '../utils/invoiceHelpers';

const EditInvoiceModal = ({ 
  invoice,
  isOpen, 
  onClose, 
  onSubmit, 
  customers, 
  quotes,
  loading 
}) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    quote_id: '',
    issue_date: '',
    due_date: '',
    payment_terms: '30 days',
    tax_rate: DEFAULT_TAX_RATE,
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
    if (invoice && isOpen) {
      setFormData({
        customer_id: invoice.customer_id || '',
        quote_id: invoice.quote_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms || '30 days',
        tax_rate: invoice.tax_rate || DEFAULT_TAX_RATE,
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
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  // Calculate form totals
  const totals = calculateInvoiceTotals(
    formData.items, 
    formData.tax_rate, 
    formData.discount_amount
  );

  // Update item in form
  const updateFormItem = (index, field, value) => {
    const updatedItems = [...formData.items];
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

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Add new item to form
  const addFormItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
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

  // Remove item from form
  const removeFormItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        items: updatedItems
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (formData.items.some(item => !item.name.trim())) {
      alert('Please fill in all item names');
      return;
    }

    if (!formData.issue_date || !formData.due_date) {
      alert('Please set issue and due dates');
      return;
    }

    onSubmit(invoice.id, formData, totals);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
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
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
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
                  value={formData.quote_id}
                  onChange={(e) => setFormData({ ...formData, quote_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
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
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
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
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <select 
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                >
                  {PAYMENT_TERMS.map(term => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
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
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Invoice Items Section */}
            <InvoiceItemsTable
              items={formData.items}
              onUpdateItem={updateFormItem}
              onAddItem={addFormItem}
              onRemoveItem={removeFormItem}
              disabled={loading}
            />

            {/* Totals Section */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax ({formData.tax_rate}%):</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(totals.total)}</span>
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                {loading ? 'Updating...' : 'Update Invoice'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
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