
export type AnalyticsPopularPages = {
  Row: {
    page_path: string;
    page_title: string;
    total_views: number;
    unique_visitors: number;
    avg_time_spent_ms: number | null;
    view_date: string;
  };
  Relationships: [];
};
