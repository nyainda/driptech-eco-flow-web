
import { Json } from '../shared';

export type CustomerKitInstallations = {
  Row: {
    created_at: string | null;
    customer_id: string | null;
    customer_feedback: string | null;
    id: string;
    installation_date: string | null;
    installation_status: string | null;
    kit_id: string | null;
    maintenance_schedule: Json | null;
    quote_id: string | null;
    satisfaction_rating: number | null;
    site_area: number | null;
    site_location: string | null;
    soil_type: string | null;
    special_requirements: string | null;
    technician_notes: string | null;
    updated_at: string | null;
    water_source: string | null;
  };
  Insert: {
    created_at?: string | null;
    customer_id?: string | null;
    customer_feedback?: string | null;
    id?: string;
    installation_date?: string | null;
    installation_status?: string | null;
    kit_id?: string | null;
    maintenance_schedule?: Json | null;
    quote_id?: string | null;
    satisfaction_rating?: number | null;
    site_area?: number | null;
    site_location?: string | null;
    soil_type?: string | null;
    special_requirements?: string | null;
    technician_notes?: string | null;
    updated_at?: string | null;
    water_source?: string | null;
  };
  Update: {
    created_at?: string | null;
    customer_id?: string | null;
    customer_feedback?: string | null;
    id?: string;
    installation_date?: string | null;
    installation_status?: string | null;
    kit_id?: string | null;
    maintenance_schedule?: Json | null;
    quote_id?: string | null;
    satisfaction_rating?: number | null;
    site_area?: number | null;
    site_location?: string | null;
    soil_type?: string | null;
    special_requirements?: string | null;
    technician_notes?: string | null;
    updated_at?: string | null;
    water_source?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "customer_kit_installations_customer_id_fkey";
      columns: ["customer_id"];
      isOneToOne: false;
      referencedRelation: "customers";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "customer_kit_installations_kit_id_fkey";
      columns: ["kit_id"];
      isOneToOne: false;
      referencedRelation: "irrigation_kits";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "customer_kit_installations_quote_id_fkey";
      columns: ["quote_id"];
      isOneToOne: false;
      referencedRelation: "quotes";
      referencedColumns: ["id"];
    },
  ];
};
