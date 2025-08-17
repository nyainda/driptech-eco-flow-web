import { supabase } from "@/integrations/supabase/client";
//import { generateInvoiceNumber } from './invoiceHelpers';
import generateInvoiceNumber from './invoiceHelpers';
// Load invoices from database
export const loadInvoices = async () => {
  try {
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
      throw error;
    }
    
    return invoiceData || [];
  } catch (error) {
    console.error('Error loading invoices:', error);
    throw error;
  }
};

// Load customers from database
export const loadCustomers = async () => {
  try {
    const { data: customerData, error } = await supabase
      .from('customers')
      .select('*')
      .order('company_name');
    
    if (error) {
      console.error('Error loading customers:', error);
      throw error;
    }
    
    return customerData || [];
  } catch (error) {
    console.error('Error loading customers:', error);
    throw error;
  }
};

// Load quotes from database
export const loadQuotes = async () => {
  try {
    const { data: quoteData, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading quotes:', error);
      throw error;
    }
    
    return quoteData || [];
  } catch (error) {
    console.error('Error loading quotes:', error);
    throw error;
  }
};

// Create new invoice
export const createInvoice = async (invoiceData) => {
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

// Update existing invoice
export const updateInvoice = async (invoiceId, invoiceData) => {
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

// Create invoice items
export const createInvoiceItems = async (invoiceId, items) => {
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

// Update invoice items
export const updateInvoiceItems = async (invoiceId, items) => {
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

// Update invoice status
export const updateInvoiceStatus = async (invoiceId, newStatus) => {
  try {
    const updateData: Record<string, any> = { 
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add specific timestamps based on status
    if (newStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    } else if (newStatus === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

// Delete invoice
export const deleteInvoice = async (invoiceId) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};