import { Json } from "../shared";

export type ImageUploads = {
  Row: {
    created_at: string;
    file_name: string;
    file_size: number | null;
    file_type: string | null;
    file_url: string;
    id: string;
    uploaded_by: string | null;
  };
  Insert: {
    created_at?: string;
    file_name: string;
    file_size?: number | null;
    file_type?: string | null;
    file_url: string;
    id?: string;
    uploaded_by?: string | null;
  };
  Update: {
    created_at?: string;
    file_name?: string;
    file_size?: number | null;
    file_type?: string | null;
    file_url?: string;
    id?: string;
    uploaded_by?: string | null;
  };
  Relationships: [];
};
