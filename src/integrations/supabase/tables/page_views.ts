
import { Json } from '../shared';

export type PageViews = {
  Row: {
    created_at: string | null;
    exit_page: boolean | null;
    id: string;
    page_path: string;
    page_title: string;
    query_params: Json | null;
    referrer: string | null;
    scroll_depth: number | null;
    session_id: string | null;
    time_spent: number | null;
    timestamp: string;
    visitor_id: string;
  };
  Insert: {
    created_at?: string | null;
    exit_page?: boolean | null;
    id?: string;
    page_path: string;
    page_title: string;
    query_params?: Json | null;
    referrer?: string | null;
    scroll_depth?: number | null;
    session_id?: string | null;
    time_spent?: number | null;
    timestamp?: string;
    visitor_id: string;
  };
  Update: {
    created_at?: string | null;
    exit_page?: boolean | null;
    id?: string;
    page_path?: string;
    page_title?: string;
    query_params?: Json | null;
    referrer?: string | null;
    scroll_depth?: number | null;
    session_id?: string | null;
    time_spent?: number | null;
    timestamp?: string;
    visitor_id?: string;
  };
  Relationships: [
    {
      foreignKeyName: "page_views_session_id_fkey";
      columns: ["session_id"];
      isOneToOne: false;
      referencedRelation: "visitor_sessions";
      referencedColumns: ["id"];
    },
  ];
};
