// Calculate item total
export const calculateItemTotal = (quantity, unitPrice) => {
  return quantity * unitPrice;
};

// Calculate invoice totals
export const calculateInvoiceTotals = (items, taxRate = 0, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = discountAmount || 0;
  const taxableAmount = subtotal - discount;
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount: discount,
    taxAmount,
    total
  };
};

// Calculate statistics from invoices array
export const calculateInvoiceStats = (invoices) => {
  const totalInvoices = invoices.length;
  
  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.total_amount, 0);
  
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);
  
  const overdueCount = invoices.filter(i => {
    if (i.status === 'paid') return false;
    const due = new Date(i.due_date);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0;
  }).length;

  return {
    totalInvoices,
    totalOutstanding,
    totalPaid,
    overdueCount
  };
};