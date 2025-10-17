import { Json } from "../shared";

export type Variants = {
  Row: {
    attributes: Json | null;
    created_at: string | null;
    id: string;
    images: string[] | null;
    name: string;
    price: number | null;
    product_id: string;
    sku: string;
    stock: number | null;
    stock_quantity: number | null;
    updated_at: string | null;
    value: string | null;
  };
  Insert: {
    attributes?: Json | null;
    created_at?: string | null;
    id?: string;
    images?: string[] | null;
    name: string;
    price?: number | null;
    product_id: string;
    sku?: string;
    stock?: number | null;
    stock_quantity?: number | null;
    updated_at?: string | null;
    value?: string | null;
  };
  Update: {
    attributes?: Json | null;
    created_at?: string | null;
    id?: string;
    images?: string[] | null;
    name?: string;
    price?: number | null;
    product_id?: string;
    sku?: string;
    stock?: number | null;
    stock_quantity?: number | null;
    updated_at?: string | null;
    value?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "fk_product";
      columns: ["product_id"];
      isOneToOne: false;
      referencedRelation: "products";
      referencedColumns: ["id"];
    },
  ];
};
