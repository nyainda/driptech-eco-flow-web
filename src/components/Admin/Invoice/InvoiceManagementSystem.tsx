import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Send, 
  Download,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  Printer,
  X,
  Trash2,
  Copy,
  RefreshCw,
  TrendingUp,
  Users,
  CreditCard,
  Archive,
  ExternalLink,
  Loader2
} from 'lucide-react';

// Types based on your database schema
interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  quote_id: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  payment_terms: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  customer?: Customer;
  invoice_items?: InvoiceItem[];
}

interface Customer {
  id: string;
  company_name: string | null;
  contact_person: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

interface InvoiceItem {
  id: string;
  invoice_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string | null;
}

const InvoiceManagementSystem = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create invoice form state
  const [createForm, setCreateForm] = useState({
    customer_id: '',
    quote_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: '30 days',
    tax_rate: 16,
    discount_amount: 0,
    notes: '',
    items: [
      {
        name: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        unit_price: 0,
        total: 0
      }
    ]
  });

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999) + 1;
    return `INV-${year}${month}-${String(random).padStart(4, '0')}`;
  };

  // Load quotes for dropdown
  const loadQuotes = async () => {
    try {
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading quotes:', error);
        return;
      }
      
      setQuotes(quoteData || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  // Load invoices from database
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          invoice_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading invoices:', error);
        return;
      }
      
      setInvoices(invoiceData || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
const [updating, setUpdating] = useState(false);
const [editForm, setEditForm] = useState({
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


const initializeEditForm = (invoice: Invoice) => {
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
};


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
    const { data: invoice, error: invoiceError } = await supabase
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

    return invoice;
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
  if (updating || !editingInvoice) return;

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

    const updatedInvoice = await updateInvoice(editingInvoice.id, invoiceData);
    
    if (updatedInvoice) {
      await updateInvoiceItems(editingInvoice.id, editForm.items);
      
      // Success feedback
      alert('Invoice updated successfully!');
      
      // Close modal and reset form
      setShowEditModal(false);
      setEditingInvoice(null);
      
      // Reload invoices list
      await loadInvoices();
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    alert('Error updating invoice. Please try again.');
  } finally {
    setUpdating(false);
  }
};

// Open edit modal
const openEditModal = (invoice: Invoice) => {
  setEditingInvoice(invoice);
  initializeEditForm(invoice);
  setShowEditModal(true);
};

  // Load customers for dropdown
  const loadCustomers = async () => {
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name');
      
      if (error) {
        console.error('Error loading customers:', error);
        return;
      }
      
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadQuotes();
  }, []);

  // Calculate item total
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Calculate form totals
  const calculateFormTotals = () => {
    const subtotal = createForm.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = createForm.discount_amount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (createForm.tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  // Update item in create form
  const updateCreateFormItem = (index: number, field: string, value: any) => {
    const updatedItems = [...createForm.items];
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

    setCreateForm({
      ...createForm,
      items: updatedItems
    });
  };

  // Add new item to create form
  const addCreateFormItem = () => {
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        {
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

  // Remove item from create form
  const removeCreateFormItem = (index: number) => {
    if (createForm.items.length > 1) {
      const updatedItems = createForm.items.filter((_, i) => i !== index);
      setCreateForm({
        ...createForm,
        items: updatedItems
      });
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      customer_id: '',
      quote_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_terms: '30 days',
      tax_rate: 16,
      discount_amount: 0,
      notes: '',
      items: [
        {
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

  // Create new invoice
  const createInvoice = async (invoiceData: any) => {
    try {
      const invoiceNumber = generateInvoiceNumber();
      const dataWithNumber = {
        ...invoiceData,
        invoice_number: invoiceNumber
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([dataWithNumber])
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw invoiceError;
      }

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };

  // Create invoice items
  const createInvoiceItems = async (invoiceId: string, items: any[]) => {
    try {
      const itemsWithInvoiceId = items.map(item => ({
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        unit: item.unit || 'pcs',
        invoice_id: invoiceId
      }));

      const { error } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (error) {
        console.error('Error creating invoice items:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error creating invoice items:', error);
      throw error;
    }
  };

  // Handle create invoice form submission
  const handleCreateInvoice = async (sendImmediately: boolean = false) => {
    if (creating) return;

    // Validate form
    if (!createForm.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (createForm.items.some(item => !item.name.trim())) {
      alert('Please fill in all item names');
      return;
    }

    if (!createForm.issue_date || !createForm.due_date) {
      alert('Please set issue and due dates');
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
        status: sendImmediately ? 'sent' : 'draft',
        ...(sendImmediately && { sent_at: new Date().toISOString() })
      };

      const newInvoice = await createInvoice(invoiceData);
      
      if (newInvoice) {
        await createInvoiceItems(newInvoice.id, createForm.items);
        
        // Success feedback
        alert(sendImmediately ? 'Invoice created and sent successfully!' : 'Invoice created as draft successfully!');
        
        // Reset form and close modal
        resetCreateForm();
        setShowCreateModal(false);
        
        // Reload invoices list
        await loadInvoices();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Download invoice as PDF
  const downloadInvoicePDF = (invoice: Invoice) => {
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">INVOICE</h1>
          <h2 style="color: #6b7280; font-weight: normal;">${invoice.invoice_number}</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h3 style="color: #1f2937; margin-bottom: 15px;">Bill To:</h3>
            <p style="margin: 5px 0; font-weight: bold;">${invoice.customer?.company_name || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.contact_person || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.address || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.city || 'N/A'}, ${invoice.customer?.country || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.email || 'N/A'}</p>
            <p style="margin: 5px 0;">${invoice.customer?.phone || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
            <p style="margin: 5px 0;"><strong>Payment Terms:</strong> ${invoice.payment_terms || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${(invoice.status || 'draft').toUpperCase()}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Description</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_items?.map(item => `
              <tr>
                <td style="padding: 12px; border: 1px solid #d1d5db;">
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">${item.quantity} ${item.unit || ''}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">No items</td></tr>'}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 30px;">
          <table style="margin-left: auto;">
            <tr><td style="padding: 5px 15px 5px 0;"><strong>Subtotal:</strong></td><td style="text-align: right;">${formatCurrency(invoice.subtotal)}</td></tr>
            ${invoice.discount_amount && invoice.discount_amount > 0 ? `<tr><td style="padding: 5px 15px 5px 0;"><strong>Discount:</strong></td><td style="text-align: right;">-${formatCurrency(invoice.discount_amount)}</td></tr>` : ''}
            ${invoice.tax_amount && invoice.tax_amount > 0 ? `<tr><td style="padding: 5px 15px 5px 0;"><strong>Tax (${invoice.tax_rate}%):</strong></td><td style="text-align: right;">${formatCurrency(invoice.tax_amount)}</td></tr>` : ''}
            <tr style="border-top: 2px solid #1f2937;"><td style="padding: 15px 15px 5px 0; font-size: 18px;"><strong>Total:</strong></td><td style="text-align: right; font-size: 18px;"><strong>${formatCurrency(invoice.total_amount)}</strong></td></tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Notes:</h4>
            <p style="color: #6b7280; line-height: 1.5;">${invoice.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                window.print();
              };
              window.addEventListener('afterprint', function() {
                window.close();
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'draft':
          return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Edit, label: 'Draft' };
        case 'sent':
          return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Send, label: 'Sent' };
        case 'paid':
          return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Paid' };
        case 'overdue':
          return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertCircle, label: 'Overdue' };
        case 'cancelled':
          return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle, label: 'Cancelled' };
        default:
          return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Clock, label: 'Unknown' };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle status update
  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add specific timestamps based on status
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (newStatus === 'sent') {
        const invoice = invoices.find(i => i.id === invoiceId);
        if (invoice && !invoice.sent_at) {
          updateData.sent_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) {
        console.error('Error updating invoice status:', error);
        return;
      }

      // Reload invoices to reflect changes
      await loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  // Handle delete invoice
  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        console.error('Error deleting invoice:', error);
        return;
      }

      // Reload invoices to reflect changes
      await loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  // Calculate stats
  const stats = {
    totalInvoices: invoices.length,
    totalOutstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.total_amount, 0),
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
    overdueCount: invoices.filter(i => {
      const daysOverdue = getDaysOverdue(i.due_date, i.status || 'draft');
      return daysOverdue > 0 && i.status !== 'paid';
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Invoice Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your customer invoices and payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInvoices}</p>
                </div>
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalOutstanding)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalPaid)}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueCount}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border dark:border-gray-700 mb-6 transition-colors">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={loadInvoices}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {invoices.length === 0 
                  ? "Get started by creating your first invoice" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {invoices.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create First Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status || 'draft');
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-3 sm:px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.invoice_number}
                            </div>
                            {invoice.quote_id && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Quote: {invoice.quote_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.customer?.company_name || 'Unknown Company'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {invoice.customer?.contact_person}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                          {invoice.tax_amount && invoice.tax_amount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{formatCurrency(invoice.tax_amount)} tax
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <StatusBadge status={invoice.status || 'draft'} />
                          {daysOverdue > 0 && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {daysOverdue} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(invoice.issue_date)}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(invoice.due_date)}
                          </div>
                          {daysOverdue > 0 && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Overdue
                            </div>
                          )}
                        </td>
                       <td className="px-3 sm:px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-1 sm:gap-2">
    <button
      onClick={() => {
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
      }}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
      title="View Invoice"
    >
      <Eye className="w-4 h-4" />
    </button>
    {/* ADD THIS EDIT BUTTON */}
    <button
      onClick={() => openEditModal(invoice)}
      className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 p-1 transition-colors"
      title="Edit Invoice"
      disabled={invoice.status === 'paid'}
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={() => downloadInvoicePDF(invoice)}
      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 transition-colors"
      title="Download PDF"
    >
      <Download className="w-4 h-4" />
    </button>
    <button
      onClick={() => console.log('Print invoice:', invoice.id)}
      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-1 transition-colors"
      title="Print Invoice"
    >
      <Printer className="w-4 h-4" />
    </button>
    {invoice.status === 'draft' && (
      <button
        onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
        title="Send Invoice"
      >
        <Send className="w-4 h-4" />
      </button>
    )}
    {invoice.status === 'sent' && (
      <button
        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 transition-colors"
        title="Mark as Paid"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    )}
    <button
      onClick={() => deleteInvoice(invoice.id)}
      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
      title="Delete Invoice"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Details Modal */}
        {showInvoiceModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Invoice {selectedInvoice.invoice_number}
                </h2>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill To:</h3>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedInvoice.customer?.company_name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.customer?.contact_person}</p>
                      {selectedInvoice.customer?.address && (
                        <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.customer.address}</p>
                      )}
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedInvoice.customer?.city}, {selectedInvoice.customer?.country}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.customer?.email}</p>
                      {selectedInvoice.customer?.phone && (
                        <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.customer.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="lg:text-right">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status: </span>
                        <StatusBadge status={selectedInvoice.status || 'draft'} />
                      </div>
                      <p><span className="text-gray-600 dark:text-gray-400">Issue Date:</span> <span className="text-gray-900 dark:text-white">{formatDate(selectedInvoice.issue_date)}</span></p>
                      <p><span className="text-gray-600 dark:text-gray-400">Due Date:</span> <span className="text-gray-900 dark:text-white">{formatDate(selectedInvoice.due_date)}</span></p>
                      <p><span className="text-gray-600 dark:text-gray-400">Payment Terms:</span> <span className="text-gray-900 dark:text-white">{selectedInvoice.payment_terms}</span></p>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedInvoice.invoice_items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No items found for this invoice
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-full sm:w-80">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      {selectedInvoice.discount_amount && selectedInvoice.discount_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                          <span className="text-gray-900 dark:text-white">-{formatCurrency(selectedInvoice.discount_amount)}</span>
                        </div>
                      )}
                      {selectedInvoice.tax_amount && selectedInvoice.tax_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tax ({selectedInvoice.tax_rate}%):</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(selectedInvoice.tax_amount)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(selectedInvoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => downloadInvoicePDF(selectedInvoice)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => console.log('Print invoice:', selectedInvoice.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  {selectedInvoice.status === 'draft' && (
                    <button
                      onClick={() => {
                        updateInvoiceStatus(selectedInvoice.id, 'sent');
                        setShowInvoiceModal(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send Invoice
                    </button>
                  )}
                  {selectedInvoice.status === 'sent' && (
                    <button
                      onClick={() => {
                        updateInvoiceStatus(selectedInvoice.id, 'paid');
                        setShowInvoiceModal(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedInvoice.invoice_number);
                      alert('Invoice number copied to clipboard!');
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Number
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Create New Invoice</h2>
                <button
                  onClick={() => {
                    if (!creating) {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={creating}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateInvoice(false);
                }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Customer *
                      </label>
                      <select
                        required
                        value={createForm.customer_id}
                        onChange={(e) => setCreateForm({ ...createForm, customer_id: e.target.value })}
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
                        onChange={(e) => setCreateForm({ ...createForm, quote_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        disabled={creating}
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
                        value={createForm.issue_date}
                        onChange={(e) => setCreateForm({ ...createForm, issue_date: e.target.value })}
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
                        onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
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
                        onChange={(e) => setCreateForm({ ...createForm, payment_terms: e.target.value })}
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
                        onChange={(e) => setCreateForm({ ...createForm, tax_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        disabled={creating}
                      />
                    </div>
                  </div>

                  {/* Invoice Items Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Items</h3>
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
                              <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                              <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Qty</th>
                              <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Unit</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Unit Price</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Total</th>
                              <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {createForm.items.map((item, index) => (
                              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-3 sm:px-4 py-3">
                                  <input
                                    type="text"
                                    placeholder="Item name"
                                    value={item.name}
                                    onChange={(e) => updateCreateFormItem(index, 'name', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-1 transition-colors"
                                    required
                                    disabled={creating}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={item.description}
                                    onChange={(e) => updateCreateFormItem(index, 'description', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    disabled={creating}
                                  />
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateCreateFormItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 sm:w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    disabled={creating}
                                  />
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <select 
                                    value={item.unit}
                                    onChange={(e) => updateCreateFormItem(index, 'unit', e.target.value)}
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
                                    onChange={(e) => updateCreateFormItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
                                    disabled={createForm.items.length === 1 || creating}
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
                        <span className="text-gray-900 dark:text-white">{formatCurrency(calculateFormTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createForm.discount_amount}
                            onChange={(e) => setCreateForm({ ...createForm, discount_amount: parseFloat(e.target.value) || 0 })}
                            className="w-20 sm:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm text-right transition-colors"
                            disabled={creating}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tax ({createForm.tax_rate}%):</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(calculateFormTotals().taxAmount)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(calculateFormTotals().total)}</span>
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
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
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
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {creating ? 'Creating...' : 'Create Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateInvoice(true)}
                      disabled={creating}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {creating ? 'Creating...' : 'Create & Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!creating) {
                          setShowCreateModal(false);
                          resetCreateForm();
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
        )}

        {/* Edit Invoice Modal */}
{showEditModal && editingInvoice && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Edit Invoice {editingInvoice.invoice_number}
        </h2>
        <button
          onClick={() => {
            if (!updating) {
              setShowEditModal(false);
              setEditingInvoice(null);
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
                  setShowEditModal(false);
                  setEditingInvoice(null);
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
)}
      </div>
    </div>
  );
};

export default InvoiceManagementSystem;