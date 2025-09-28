
import { Json } from '../shared';

export type KitMaintenanceLogs = {
  Row: {
    cost: number | null;
    created_at: string | null;
    description: string | null;
    id: string;
    installation_id: string | null;
    maintenance_date: string;
    maintenance_type: string;
    next_maintenance_date: string | null;
    notes: string | null;
    parts_replaced: Json | null;
    technician_name: string | null;
  };
  Insert: {
    cost?: number | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    installation_id?: string | null;
    maintenance_date: string;
    maintenance_type: string;
    next_maintenance_date?: string | null;
    notes?: string | null;
    parts_replaced?: Json | null;
    technician_name?: string | null;
  };
  Update: {
    cost?: number | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    installation_id?: string | null;
    maintenance_date?: string;
    maintenance_type?: string;
    next_maintenance_date?: string | null;
    notes?: string | null;
    parts_replaced?: Json | null;
    technician_name?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "kit_maintenance_logs_installation_id_fkey";
      columns: ["installation_id"];
      isOneToOne: false;
      referencedRelation: "customer_kit_installations";
      referencedColumns: ["id"];
    },
  ];
};
