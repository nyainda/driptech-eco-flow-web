import { Json } from '../shared';

export type PageViews = {
  Row: {
    id: string;
    visitor_id: string;
    session_id: string | null;
    page_path: string;
    page_title: string;
    timestamp: string;
    time_spent: number | null;
    referrer: string | null;
    query_params: Json | null;
    scroll_depth: number | null;
    exit_page: boolean | null;
    created_at: string | null;
  };
  Insert: {
    id?: string;
    visitor_id: string;
    session_id?: string | null;
    page_path: string;
    page_title: string;
    timestamp?: string;
    time_spent?: number | null;
    referrer?: string | null;
    query_params?: Json | null;
    scroll_depth?: number | null;
    exit_page?: boolean | null;
    created_at?: string | null;
  };
  Update: {
    id?: string;
    visitor_id?: string;
    session_id?: string | null;
    page_path?: string;
    page_title?: string;
    timestamp?: string;
    time_spent?: number | null;
    referrer?: string | null;
    query_params?: Json | null;
    scroll_depth?: number | null;
    exit_page?: boolean | null;
    created_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "page_views_session_id_fkey";
      columns: ["session_id"];
      isOneToOne: false;
      referencedRelation: "visitor_sessions";
      referencedColumns: ["id"];
    }
  ];
};