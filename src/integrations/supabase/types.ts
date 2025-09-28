
import { DatabaseWithoutInternals } from './shared';
import type { Json, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants } from './shared';
import { NewsArticles } from './tables/news_articles';
import { AdminUsers } from './tables/admin_users';
import { AnalyticsSummary } from './tables/analytics_summary';
import { BlogCategories } from './tables/blog_categories';
import { BlogPosts } from './tables/blog_posts';
import { ContactSubmissions } from './tables/contact_submissions';
import { Customers } from './tables/customers';
import { Documents } from './tables/documents';
import { HealthChecks } from './tables/health_checks';
import { IrrigationKits } from './tables/irrigation_kits';
import { KitDocuments } from './tables/kit_documents';
import { CustomerKitInstallations } from './tables/customer_kit_installations';
import { KitMaintenanceLogs } from './tables/kit_maintenance_logs';
import { ImageUploads } from './tables/image_uploads';
import { InvoiceItems } from './tables/invoice_items';
import { Invoices } from './tables/invoices';
import { MpesaTransactions } from './tables/mpesa_transactions';
import { Notifications } from './tables/notifications';
import { PageViews } from './tables/page_views';
import { ProductInteractions } from './tables/product_interactions';
import { Products } from './tables/products';
import { Projects } from './tables/projects';
import { QuoteItems } from './tables/quote_items';
import { Quotes } from './tables/quotes';
import { SuccessStories } from './tables/success_stories';
import { SystemSettings } from './tables/system_settings';
import { Team } from './tables/team';
import { Variants } from './tables/variants';
import { Videos } from './tables/videos';
import { VisitorSessions } from './tables/visitor_sessions';
import { AnalyticsPopularPages } from './views/analytics_popular_pages';
import { AnalyticsProductSummary } from './views/analytics_product_summary';
import { AnalyticsSessionSummary } from './views/analytics_session_summary';

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      news_articles: NewsArticles;
      admin_users: AdminUsers;
      analytics_summary: AnalyticsSummary;
      blog_categories: BlogCategories;
      blog_posts: BlogPosts;
      contact_submissions: ContactSubmissions;
      customers: Customers;
      documents: Documents;
      health_checks: HealthChecks;
      irrigation_kits: IrrigationKits;
      kit_documents: KitDocuments;
      customer_kit_installations: CustomerKitInstallations;
      kit_maintenance_logs: KitMaintenanceLogs;
      image_uploads: ImageUploads;
      invoice_items: InvoiceItems;
      invoices: Invoices;
      mpesa_transactions: MpesaTransactions;
      notifications: Notifications;
      page_views: PageViews;
      product_interactions: ProductInteractions;
      products: Products;
      projects: Projects;
      quote_items: QuoteItems;
      quotes: Quotes;
      success_stories: SuccessStories;
      system_settings: SystemSettings;
      team: Team;
      variants: Variants;
      videos: Videos;
      visitor_sessions: VisitorSessions;
    };
    Views: {
      analytics_popular_pages: AnalyticsPopularPages;
      analytics_product_summary: AnalyticsProductSummary;
      analytics_session_summary: AnalyticsSessionSummary;
    };
    Functions: {
      calculate_bounce_rate: {
        Args: { end_date?: string; start_date?: string };
        Returns: number;
      };
      clean_old_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      generate_invoice_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_top_pages: {
        Args: { end_date?: string; limit_count?: number; start_date?: string };
        Returns: {
          avg_time_spent: number;
          page_path: string;
          page_title: string;
          total_views: number;
          unique_visitors: number;
        }[];
      };
      increment_page_views: {
        Args: { visitor_id_param: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      keep_database_active: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: DatabaseWithoutInternals["public"]["Enums"];
    CompositeTypes: DatabaseWithoutInternals["public"]["CompositeTypes"];
  };
};

export type { Json, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes };
export { Constants };
