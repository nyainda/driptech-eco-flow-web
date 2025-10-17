export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  quote_id: string | null;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  payment_terms: string | null;
  notes: string | null;
  payment_details?: string;
  created_at: string | null;
  updated_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  customer?: Customer;
  invoice_items?: InvoiceItem[];
}

export interface Customer {
  id: string;
  company_name: string | null;
  contact_person: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string | null;
}

export interface Quote {
  id: string;
  quote_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface CreateInvoiceForm {
  customer_id: string;
  quote_id: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  tax_rate: number;
  discount_amount: number;
  notes: string;
  payment_details: string;
  items: CreateInvoiceItem[];
}

export interface CreateInvoiceItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface EditInvoiceForm {
  customer_id: string;
  quote_id: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  tax_rate: number;
  discount_amount: number;
  notes: string;
  payment_details: string;
  items: EditInvoiceItem[];
}

export interface EditInvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
  overdueCount: number;
}
