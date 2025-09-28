
import { Json } from '../shared';

export type InvoiceItems = {
  Row: {
    created_at: string | null;
    description: string | null;
    id: string;
    invoice_id: string | null;
    name: string;
    quantity: number;
    total: number;
    unit: string | null;
    unit_price: number;
  };
  Insert: {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    invoice_id?: string | null;
    name: string;
    quantity?: number;
    total: number;
    unit?: string | null;
    unit_price: number;
  };
  Update: {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    invoice_id?: string | null;
    name?: string;
    quantity?: number;
    total?: number;
    unit?: string | null;
    unit_price?: number;
  };
  Relationships: [
    {
      foreignKeyName: "invoice_items_invoice_id_fkey";
      columns: ["invoice_id"];
      isOneToOne: false;
      referencedRelation: "invoices";
      referencedColumns: ["id"];
    },
  ];
};