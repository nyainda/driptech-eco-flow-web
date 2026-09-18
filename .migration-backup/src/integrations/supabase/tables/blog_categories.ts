import { Json } from "../shared";

export type BlogCategories = {
  Row: {
    created_at: string | null;
    description: string | null;
    id: string;
    name: string;
    slug: string;
  };
  Insert: {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    name: string;
    slug: string;
  };
  Update: {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    name?: string;
    slug?: string;
  };
  Relationships: [];
};
