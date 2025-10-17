import { Json } from "../shared";

export type Invoices = {
  Row: {
    created_at: string | null;
    customer_id: string | null;
    discount_amount: number | null;
    due_date: string;
    id: string;
    invoice_number: string;
    issue_date: string;
    notes: string | null;
    paid_at: string | null;
    payment_details: string | null;
    payment_terms: string | null;
    quote_id: string | null;
    sent_at: string | null;
    status: string | null;
    subtotal: number;
    tax_amount: number | null;
    tax_rate: number | null;
    total_amount: number;
    updated_at: string | null;
  };
  Insert: {
    created_at?: string | null;
    customer_id?: string | null;
    discount_amount?: number | null;
    due_date: string;
    id?: string;
    invoice_number: string;
    issue_date?: string;
    notes?: string | null;
    paid_at?: string | null;
    payment_details?: string | null;
    payment_terms?: string | null;
    quote_id?: string | null;
    sent_at?: string | null;
    status?: string | null;
    subtotal?: number;
    tax_amount?: number | null;
    tax_rate?: number | null;
    total_amount?: number;
    updated_at?: string | null;
  };
  Update: {
    created_at?: string | null;
    customer_id?: string | null;
    discount_amount?: number | null;
    due_date?: string;
    id?: string;
    invoice_number?: string;
    issue_date?: string;
    notes?: string | null;
    paid_at?: string | null;
    payment_details?: string | null;
    payment_terms?: string | null;
    quote_id?: string | null;
    sent_at?: string | null;
    status?: string | null;
    subtotal?: number;
    tax_amount?: number | null;
    tax_rate?: number | null;
    total_amount?: number;
    updated_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "invoices_customer_id_fkey";
      columns: ["customer_id"];
      isOneToOne: false;
      referencedRelation: "customers";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "invoices_quote_id_fkey";
      columns: ["quote_id"];
      isOneToOne: false;
      referencedRelation: "quotes";
      referencedColumns: ["id"];
    },
  ];
};
