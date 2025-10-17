import { Json } from "../shared";

export type ContactSubmissions = {
  Row: {
    area_size: string | null;
    budget_range: string | null;
    company: string | null;
    created_at: string;
    email: string;
    id: string;
    message: string;
    name: string;
    phone: string | null;
    project_type: string | null;
    read: boolean | null;
    status: string | null;
    updated_at: string;
  };
  Insert: {
    area_size?: string | null;
    budget_range?: string | null;
    company?: string | null;
    created_at?: string;
    email: string;
    id?: string;
    message: string;
    name: string;
    phone?: string | null;
    project_type?: string | null;
    read?: boolean | null;
    status?: string | null;
    updated_at?: string;
  };
  Update: {
    area_size?: string | null;
    budget_range?: string | null;
    company?: string | null;
    created_at?: string;
    email?: string;
    id?: string;
    message?: string;
    name?: string;
    phone?: string | null;
    project_type?: string | null;
    read?: boolean | null;
    status?: string | null;
    updated_at?: string;
  };
  Relationships: [];
};
