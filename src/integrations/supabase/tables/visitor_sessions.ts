import { Json } from "../shared";

export type VisitorSessions = {
  Row: {
    browser: string | null;
    created_at: string | null;
    device_type: string | null;
    id: string;
    ip_address: unknown | null;
    location: string | null;
    page_views: number | null;
    referrer: string | null;
    session_end: string | null;
    session_start: string;
    total_duration: number | null;
    updated_at: string | null;
    user_agent: string | null;
    visitor_id: string;
  };
  Insert: {
    browser?: string | null;
    created_at?: string | null;
    device_type?: string | null;
    id?: string;
    ip_address?: unknown | null;
    location?: string | null;
    page_views?: number | null;
    referrer?: string | null;
    session_end?: string | null;
    session_start?: string;
    total_duration?: number | null;
    updated_at?: string | null;
    user_agent?: string | null;
    visitor_id: string;
  };
  Update: {
    browser?: string | null;
    created_at?: string | null;
    device_type?: string | null;
    id?: string;
    ip_address?: unknown | null;
    location?: string | null;
    page_views?: number | null;
    referrer?: string | null;
    session_end?: string | null;
    session_start?: string;
    total_duration?: number | null;
    updated_at?: string | null;
    user_agent?: string | null;
    visitor_id?: string;
  };
  Relationships: [];
};
