import { Json } from "../shared";

export type Team = {
  Row: {
    bio: string | null;
    created_at: string;
    email: string | null;
    featured: boolean | null;
    id: string;
    image_url: string | null;
    linkedin_url: string | null;
    name: string;
    phone: string | null;
    position: string;
    updated_at: string;
  };
  Insert: {
    bio?: string | null;
    created_at?: string;
    email?: string | null;
    featured?: boolean | null;
    id?: string;
    image_url?: string | null;
    linkedin_url?: string | null;
    name: string;
    phone?: string | null;
    position: string;
    updated_at?: string;
  };
  Update: {
    bio?: string | null;
    created_at?: string;
    email?: string | null;
    featured?: boolean | null;
    id?: string;
    image_url?: string | null;
    linkedin_url?: string | null;
    name?: string;
    phone?: string | null;
    position?: string;
    updated_at?: string;
  };
  Relationships: [];
};
