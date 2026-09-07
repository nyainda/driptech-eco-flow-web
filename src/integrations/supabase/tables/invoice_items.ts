import { Json } from "../shared";

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
    project_name: string | null;
    project_subtitle: string | null;
    project_link: string | null;
    sort_order: number | null;
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
    project_name?: string | null;
    project_subtitle?: string | null;
    project_link?: string | null;
    sort_order?: number | null;
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
    project_name?: string | null;
    project_subtitle?: string | null;
    project_link?: string | null;
    sort_order?: number | null;
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
