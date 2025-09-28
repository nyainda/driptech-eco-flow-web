
import { Json, DatabaseWithoutInternals } from '../shared';

export type Projects = {
  Row: {
    after_images: string[] | null;
    area_covered: number | null;
    before_images: string[] | null;
    completion_date: string | null;
    created_at: string | null;
    customer_id: string | null;
    featured: boolean | null;
    id: string;
    location: string | null;
    name: string;
    project_images: string[] | null;
    project_type: string | null;
    quote_id: string | null;
    start_date: string | null;
    status: DatabaseWithoutInternals["public"]["Enums"]["project_status"] | null;
    testimonial: string | null;
    updated_at: string | null;
    water_saved: number | null;
    yield_improvement: number | null;
  };
  Insert: {
    after_images?: string[] | null;
    area_covered?: number | null;
    before_images?: string[] | null;
    completion_date?: string | null;
    created_at?: string | null;
    customer_id?: string | null;
    featured?: boolean | null;
    id?: string;
    location?: string | null;
    name: string;
    project_images?: string[] | null;
    project_type?: string | null;
    quote_id?: string | null;
    start_date?: string | null;
    status?: DatabaseWithoutInternals["public"]["Enums"]["project_status"] | null;
    testimonial?: string | null;
    updated_at?: string | null;
    water_saved?: number | null;
    yield_improvement?: number | null;
  };
  Update: {
    after_images?: string[] | null;
    area_covered?: number | null;
    before_images?: string[] | null;
    completion_date?: string | null;
    created_at?: string | null;
    customer_id?: string | null;
    featured?: boolean | null;
    id?: string;
    location?: string | null;
    name?: string;
    project_images?: string[] | null;
    project_type?: string | null;
    quote_id?: string | null;
    start_date?: string | null;
    status?: DatabaseWithoutInternals["public"]["Enums"]["project_status"] | null;
    testimonial?: string | null;
    updated_at?: string | null;
    water_saved?: number | null;
    yield_improvement?: number | null;
  };
  Relationships: [
    {
      foreignKeyName: "projects_customer_id_fkey";
      columns: ["customer_id"];
      isOneToOne: false;
      referencedRelation: "customers";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "projects_quote_id_fkey";
      columns: ["quote_id"];
      isOneToOne: false;
      referencedRelation: "quotes";
      referencedColumns: ["id"];
    },
  ];
};
