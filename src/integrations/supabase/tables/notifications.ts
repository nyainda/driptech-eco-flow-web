import { Json } from "../shared";

export type Notifications = {
  Row: {
    created_at: string | null;
    data: Json | null;
    id: string;
    message: string;
    read: boolean | null;
    title: string;
    type: string;
    updated_at: string | null;
    user_id: string | null;
  };
  Insert: {
    created_at?: string | null;
    data?: Json | null;
    id?: string;
    message: string;
    read?: boolean | null;
    title: string;
    type: string;
    updated_at?: string | null;
    user_id?: string | null;
  };
  Update: {
    created_at?: string | null;
    data?: Json | null;
    id?: string;
    message?: string;
    read?: boolean | null;
    title?: string;
    type?: string;
    updated_at?: string | null;
    user_id?: string | null;
  };
  Relationships: [];
};
