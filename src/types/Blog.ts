export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published: boolean;
  author_id?: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  category?: string;
  read_time?: number;
  views?: number;
}

export interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published: boolean;
  tags: string[];
  category: string;
}

export interface BlogCategory {
  value: string;
  label: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { value: "irrigation-tips", label: "Irrigation Tips" },
  { value: "technology", label: "Technology" },
  { value: "case-studies", label: "Case Studies" },
  { value: "sustainability", label: "Sustainability" },
  { value: "farming", label: "Smart Farming" },
  { value: "maintenance", label: "Maintenance" },
];
