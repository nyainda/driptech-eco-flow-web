
import { Json } from '../shared';

export type AnalyticsSummary = {
  Row: {
    average_session_duration: number | null;
    bounce_rate: number | null;
    created_at: string | null;
    date_range: string;
    device_breakdown: Json | null;
    hourly_activity: Json | null;
    id: string;
    summary_date: string;
    top_pages: Json | null;
    top_products: Json | null;
    total_page_views: number | null;
    total_sessions: number | null;
    total_visitors: number | null;
    updated_at: string | null;
  };
  Insert: {
    average_session_duration?: number | null;
    bounce_rate?: number | null;
    created_at?: string | null;
    date_range: string;
    device_breakdown?: Json | null;
    hourly_activity?: Json | null;
    id?: string;
    summary_date?: string;
    top_pages?: Json | null;
    top_products?: Json | null;
    total_page_views?: number | null;
    total_sessions?: number | null;
    total_visitors?: number | null;
    updated_at?: string | null;
  };
  Update: {
    average_session_duration?: number | null;
    bounce_rate?: number | null;
    created_at?: string | null;
    date_range?: string;
    device_breakdown?: Json | null;
    hourly_activity?: Json | null;
    id?: string;
    summary_date?: string;
    top_pages?: Json | null;
    top_products?: Json | null;
    total_page_views?: number | null;
    total_sessions?: number | null;
    total_visitors?: number | null;
    updated_at?: string | null;
  };
  Relationships: [];
};
