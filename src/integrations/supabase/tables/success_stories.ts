import { Json } from "../shared";

export type SuccessStories = {
  Row: {
    after_image: string | null;
    before_image: string | null;
    client_company: string | null;
    client_name: string;
    created_at: string;
    description: string | null;
    featured: boolean | null;
    id: string;
    image_url: string | null;
    results: string | null;
    title: string;
    updated_at: string;
  };
  Insert: {
    after_image?: string | null;
    before_image?: string | null;
    client_company?: string | null;
    client_name: string;
    created_at?: string;
    description?: string | null;
    featured?: boolean | null;
    id?: string;
    image_url?: string | null;
    results?: string | null;
    title: string;
    updated_at?: string;
  };
  Update: {
    after_image?: string | null;
    before_image?: string | null;
    client_company?: string | null;
    client_name?: string;
    created_at?: string;
    description?: string | null;
    featured?: boolean | null;
    id?: string;
    image_url?: string | null;
    results?: string | null;
    title?: string;
    updated_at?: string;
  };
  Relationships: [];
};
