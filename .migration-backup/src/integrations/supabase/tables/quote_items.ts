import { Json } from "../shared";

export type QuoteItems = {
  Row: {
    created_at: string | null;
    description: string;
    id: string;
    name: string;
    quantity: number;
    quote_id: string | null;
    total: number;
    unit: string;
    unitprice: number;
  };
  Insert: {
    created_at?: string | null;
    description: string;
    id?: string;
    name: string;
    quantity: number;
    quote_id?: string | null;
    total: number;
    unit: string;
    unitprice: number;
  };
  Update: {
    created_at?: string | null;
    description?: string;
    id?: string;
    name?: string;
    quantity?: number;
    quote_id?: string | null;
    total?: number;
    unit?: string;
    unitprice?: number;
  };
  Relationships: [
    {
      foreignKeyName: "quote_items_quote_id_fkey";
      columns: ["quote_id"];
      isOneToOne: false;
      referencedRelation: "quotes";
      referencedColumns: ["id"];
    },
  ];
};
