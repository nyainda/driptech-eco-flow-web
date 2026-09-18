import { Json } from "../shared";

export type ProductInteractions = {
  Row: {
    additional_data: Json | null;
    created_at: string | null;
    element_selector: string | null;
    id: string;
    interaction_type: string;
    page_path: string;
    product_category: string | null;
    product_id: string | null;
    product_name: string;
    product_price: number | null;
    session_id: string | null;
    timestamp: string;
    visitor_id: string;
  };
  Insert: {
    additional_data?: Json | null;
    created_at?: string | null;
    element_selector?: string | null;
    id?: string;
    interaction_type: string;
    page_path: string;
    product_category?: string | null;
    product_id?: string | null;
    product_name: string;
    product_price?: number | null;
    session_id?: string | null;
    timestamp?: string;
    visitor_id: string;
  };
  Update: {
    additional_data?: Json | null;
    created_at?: string | null;
    element_selector?: string | null;
    id?: string;
    interaction_type?: string;
    page_path?: string;
    product_category?: string | null;
    product_id?: string | null;
    product_name?: string;
    product_price?: number | null;
    session_id?: string | null;
    timestamp?: string;
    visitor_id?: string;
  };
  Relationships: [
    {
      foreignKeyName: "product_interactions_session_id_fkey";
      columns: ["session_id"];
      isOneToOne: false;
      referencedRelation: "visitor_sessions";
      referencedColumns: ["id"];
    },
  ];
};
