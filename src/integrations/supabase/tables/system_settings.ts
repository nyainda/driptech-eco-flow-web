import { Json } from "../shared";

export type SystemSettings = {
  Row: {
    description: string | null;
    id: string;
    setting_key: string;
    setting_value: Json | null;
    updated_at: string | null;
  };
  Insert: {
    description?: string | null;
    id?: string;
    setting_key: string;
    setting_value?: Json | null;
    updated_at?: string | null;
  };
  Update: {
    description?: string | null;
    id?: string;
    setting_key?: string;
    setting_value?: Json | null;
    updated_at?: string | null;
  };
  Relationships: [];
};
