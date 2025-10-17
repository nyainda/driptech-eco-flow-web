import { Json } from "../shared";

export type BlogPosts = {
  Row: {
    author_id: string | null;
    category_id: string | null;
    content: string | null;
    created_at: string | null;
    excerpt: string | null;
    featured_image: string | null;
    featured_image_url: string | null;
    id: string;
    likes: number;
    published: boolean | null;
    published_at: string | null;
    reading_time: number | null;
    seo_description: string | null;
    seo_title: string | null;
    slug: string;
    tags: string[] | null;
    title: string;
    updated_at: string | null;
    views: number | null;
  };
  Insert: {
    author_id?: string | null;
    category_id?: string | null;
    content?: string | null;
    created_at?: string | null;
    excerpt?: string | null;
    featured_image?: string | null;
    featured_image_url?: string | null;
    id?: string;
    likes?: number;
    published?: boolean | null;
    published_at?: string | null;
    reading_time?: number | null;
    seo_description?: string | null;
    seo_title?: string | null;
    slug: string;
    tags?: string[] | null;
    title: string;
    updated_at?: string | null;
    views?: number | null;
  };
  Update: {
    author_id?: string | null;
    category_id?: string | null;
    content?: string | null;
    created_at?: string | null;
    excerpt?: string | null;
    featured_image?: string | null;
    featured_image_url?: string | null;
    id?: string;
    likes?: number;
    published?: boolean | null;
    published_at?: string | null;
    reading_time?: number | null;
    seo_description?: string | null;
    seo_title?: string | null;
    slug?: string;
    tags?: string[] | null;
    title?: string;
    updated_at?: string | null;
    views?: number | null;
  };
  Relationships: [
    {
      foreignKeyName: "blog_posts_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "blog_categories";
      referencedColumns: ["id"];
    },
  ];
};
