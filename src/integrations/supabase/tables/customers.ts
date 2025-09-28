
import { Json, DatabaseWithoutInternals } from '../shared';

export type Customers = {
  Row: {
    address: string | null;
    city: string | null;
    company_name: string | null;
    contact_person: string;
    country: string | null;
    created_at: string | null;
    email: string;
    id: string;
    phone: string | null;
    updated_at: string | null;
    user_role: DatabaseWithoutInternals["public"]["Enums"]["user_role"] | null;
  };
  Insert: {
    address?: string | null;
    city?: string | null;
    company_name?: string | null;
    contact_person: string;
    country?: string | null;
    created_at?: string | null;
    email: string;
    id?: string;
    phone?: string | null;
    updated_at?: string | null;
    user_role?: DatabaseWithoutInternals["public"]["Enums"]["user_role"] | null;
  };
  Update: {
    address?: string | null;
    city?: string | null;
    company_name?: string | null;
    contact_person?: string;
    country?: string | null;
    created_at?: string | null;
    email?: string;
    id?: string;
    phone?: string | null;
    updated_at?: string | null;
    user_role?: DatabaseWithoutInternals["public"]["Enums"]["user_role"] | null;
  };
  Relationships: [];
};
