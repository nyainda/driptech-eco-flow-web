// Invoice status options
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Payment terms options
export const PAYMENT_TERMS = [
  { value: '30 days', label: 'Net 30' },
  { value: '15 days', label: 'Net 15' },
  { value: '7 days', label: 'Net 7' },
  { value: 'Due on receipt', label: 'Due on Receipt' }
];

// Unit options for invoice items
export const UNIT_OPTIONS = [
  { value: 'pcs', label: 'pcs' },
  { value: 'set', label: 'set' },
  { value: 'm', label: 'm' },
  { value: 'm²', label: 'm²' },
  { value: 'hrs', label: 'hrs' }
];

// Default tax rate
export const DEFAULT_TAX_RATE = 16;

// Default payment terms
export const DEFAULT_PAYMENT_TERMS = '30 days';

// Currency settings
export const CURRENCY_CONFIG = {
  locale: 'en-KE',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
};