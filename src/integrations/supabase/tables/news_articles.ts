
import { Json } from '../shared';

export type NewsArticles = {
  Row: {
    id: number;
    title: string;
    content: string;
    excerpt: string | null;
    author: string;
    slug: string;
    published: boolean | null;
    featured_image_url: string | null;
    tags: string[] | null;
    views: number | null;
    likes: number | null;
    comments_count: number | null;
    reading_time: number | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    title: string;
    content: string;
    excerpt?: string | null;
    author: string;
    slug: string;
    published?: boolean | null;
    featured_image_url?: string | null;
    tags?: string[] | null;
    views?: number | null;
    likes?: number | null;
    comments_count?: number | null;
    reading_time?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    title?: string;
    content?: string;
    excerpt?: string | null;
    author?: string;
    slug?: string;
    published?: boolean | null;
    featured_image_url?: string | null;
    tags?: string[] | null;
    views?: number | null;
    likes?: number | null;
    comments_count?: number | null;
    reading_time?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};
