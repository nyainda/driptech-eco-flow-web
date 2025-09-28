
import { Json } from '../shared';

export type Videos = {
  Row: {
    category: string | null;
    created_at: string;
    description: string | null;
    duration: number | null;
    featured: boolean | null;
    file_size: number | null;
    id: string;
    published: boolean | null;
    tags: string[] | null;
    thumbnail_url: string | null;
    title: string;
    updated_at: string;
    video_url: string;
    views: number | null;
  };
  Insert: {
    category?: string | null;
    created_at?: string;
    description?: string | null;
    duration?: number | null;
    featured?: boolean | null;
    file_size?: number | null;
    id?: string;
    published?: boolean | null;
    tags?: string[] | null;
    thumbnail_url?: string | null;
    title: string;
    updated_at?: string;
    video_url: string;
    views?: number | null;
  };
  Update: {
    category?: string | null;
    created_at?: string;
    description?: string | null;
    duration?: number | null;
    featured?: boolean | null;
    file_size?: number | null;
    id?: string;
    published?: boolean | null;
    tags?: string[] | null;
    thumbnail_url?: string | null;
    title?: string;
    updated_at?: string;
    video_url?: string;
    views?: number | null;
  };
  Relationships: [];
};