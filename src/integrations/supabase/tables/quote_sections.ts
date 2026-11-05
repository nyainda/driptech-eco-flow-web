export type QuoteSections = {
  Row: {
    created_at: string;
    description: string | null;
    id: string;
    name: string;
    quote_id: string;
    sort_order: number;
    updated_at: string;
  };
  Insert: {
    created_at?: string;
    description?: string | null;
    id?: string;
    name: string;
    quote_id: string;
    sort_order?: number;
    updated_at?: string;
  };
  Update: {
    created_at?: string;
    description?: string | null;
    id?: string;
    name?: string;
    quote_id?: string;
    sort_order?: number;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "quote_sections_quote_id_fkey";
      columns: ["quote_id"];
      isOneToOne: false;
      referencedRelation: "quotes";
      referencedColumns: ["id"];
    },
  ];
};
