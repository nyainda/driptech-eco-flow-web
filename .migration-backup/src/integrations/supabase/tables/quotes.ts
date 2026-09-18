import { Json, DatabaseWithoutInternals } from "../shared";

export type Quotes = {
  Row: {
    area_size: number | null;
    created_at: string | null;
    crop_type: string | null;
    customer_id: string | null;
    id: string;
    include_vat: boolean | null;
    notes: string | null;
    project_type: string | null;
    quote_number: string;
    site_plan_url: string | null;
    status: DatabaseWithoutInternals["public"]["Enums"]["quote_status"] | null;
    terrain_info: string | null;
    total_amount: number | null;
    updated_at: string | null;
    valid_until: string | null;
    vat_rate: number | null;
    water_source: string | null;
  };
  Insert: {
    area_size?: number | null;
    created_at?: string | null;
    crop_type?: string | null;
    customer_id?: string | null;
    id?: string;
    include_vat?: boolean | null;
    notes?: string | null;
    project_type?: string | null;
    quote_number: string;
    site_plan_url?: string | null;
    status?: DatabaseWithoutInternals["public"]["Enums"]["quote_status"] | null;
    terrain_info?: string | null;
    total_amount?: number | null;
    updated_at?: string | null;
    valid_until?: string | null;
    vat_rate?: number | null;
    water_source?: string | null;
  };
  Update: {
    area_size?: number | null;
    created_at?: string | null;
    crop_type?: string | null;
    customer_id?: string | null;
    id?: string;
    include_vat?: boolean | null;
    notes?: string | null;
    project_type?: string | null;
    quote_number?: string;
    site_plan_url?: string | null;
    status?: DatabaseWithoutInternals["public"]["Enums"]["quote_status"] | null;
    terrain_info?: string | null;
    total_amount?: number | null;
    updated_at?: string | null;
    valid_until?: string | null;
    vat_rate?: number | null;
    water_source?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "quotes_customer_id_fkey";
      columns: ["customer_id"];
      isOneToOne: false;
      referencedRelation: "customers";
      referencedColumns: ["id"];
    },
  ];
};
