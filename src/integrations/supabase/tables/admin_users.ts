import { Json } from "../shared";

export type admin_users = {
  Row: {
    active: boolean | null;
    created_at: string;
    email: string;
    id: string;
    name: string;
    password_hash: string;
    role: string | null;
    updated_at: string;
  };
  Insert: {
    active?: boolean | null;
    created_at?: string;
    email: string;
    id?: string;
    name: string;
    password_hash: string;
    role?: string | null;
    updated_at?: string;
  };
  Update: {
    active?: boolean | null;
    created_at?: string;
    email?: string;
    id?: string;
    name?: string;
    password_hash?: string;
    role?: string | null;
    updated_at?: string;
  };
  Relationships: [];
};
