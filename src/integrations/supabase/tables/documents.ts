
import { Json } from '../shared';

export type Documents = {
  Row: {
    category: string | null;
    created_at: string | null;
    description: string | null;
    download_count: number | null;
    file_size: number | null;
    file_type: string | null;
    file_url: string;
    id: string;
    requires_login: boolean | null;
    tags: string[] | null;
    title: string;
    updated_at: string | null;
  };
  Insert: {
    category?: string | null;
    created_at?: string | null;
    description?: string | null;
    download_count?: number | null;
    file_size?: number | null;
    file_type?: string | null;
    file_url: string;
    id?: string;
    requires_login?: boolean | null;
    tags?: string[] | null;
    title: string;
    updated_at?: string | null;
  };
  Update: {
    category?: string | null;
    created_at?: string | null;
    description?: string | null;
    download_count?: number | null;
    file_size?: number | null;
    file_type?: string | null;
    file_url?: string;
    id?: string;
    requires_login?: boolean | null;
    tags?: string[] | null;
    title?: string;
    updated_at?: string | null;
  };
  Relationships: [];
};
