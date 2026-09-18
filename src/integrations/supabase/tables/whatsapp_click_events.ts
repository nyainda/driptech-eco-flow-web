export type WhatsAppClickEvents = {
  Row: {
    id: string;
    visitor_id: string;
    session_id: string | null;
    page_path: string;
    source: string;
    target_number: string | null;
    has_prefilled_message: boolean;
    clicked_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    visitor_id: string;
    session_id?: string | null;
    page_path: string;
    source?: string;
    target_number?: string | null;
    has_prefilled_message?: boolean;
    clicked_at?: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    visitor_id?: string;
    session_id?: string | null;
    page_path?: string;
    source?: string;
    target_number?: string | null;
    has_prefilled_message?: boolean;
    clicked_at?: string;
    created_at?: string;
  };
  Relationships: [];
};
