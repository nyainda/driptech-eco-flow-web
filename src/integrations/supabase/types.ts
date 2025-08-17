export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
          role: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          featured_image_url: string | null
          id: string
          likes: number
          published: boolean | null
          published_at: string | null
          reading_time: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          featured_image_url?: string | null
          id?: string
          likes?: number
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          featured_image_url?: string | null
          id?: string
          likes?: number
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          area_size: string | null
          budget_range: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          project_type: string | null
          read: boolean | null
          status: string | null
          updated_at: string
        }
        Insert: {
          area_size?: string | null
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          project_type?: string | null
          read?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          area_size?: string | null
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          project_type?: string | null
          read?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_person: string
          country: string | null
          created_at: string | null
          email: string
          id: string
          phone: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person: string
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          requires_login: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          requires_login?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          requires_login?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          id: string
          last_check: string
          status: string
        }
        Insert: {
          id?: string
          last_check?: string
          status?: string
        }
        Update: {
          id?: string
          last_check?: string
          status?: string
        }
        Relationships: []
      }
      image_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          name: string
          quantity: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          name: string
          quantity?: number
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          name?: string
          quantity?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          quote_id: string | null
          sent_at: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          phone_number: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          phone_number: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          phone_number?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          applications: string[] | null
          brochure_url: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          description: string | null
          featured: boolean | null
          features: string[] | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          installation_guide_url: string | null
          maintenance_manual_url: string | null
          model_number: string | null
          name: string
          price: number | null
          specifications: Json | null
          subcategory: string | null
          technical_specs: Json | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          applications?: string[] | null
          brochure_url?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          installation_guide_url?: string | null
          maintenance_manual_url?: string | null
          model_number?: string | null
          name: string
          price?: number | null
          specifications?: Json | null
          subcategory?: string | null
          technical_specs?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          applications?: string[] | null
          brochure_url?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          installation_guide_url?: string | null
          maintenance_manual_url?: string | null
          model_number?: string | null
          name?: string
          price?: number | null
          specifications?: Json | null
          subcategory?: string | null
          technical_specs?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          after_images: string[] | null
          area_covered: number | null
          before_images: string[] | null
          completion_date: string | null
          created_at: string | null
          customer_id: string | null
          featured: boolean | null
          id: string
          location: string | null
          name: string
          project_images: string[] | null
          project_type: string | null
          quote_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          testimonial: string | null
          updated_at: string | null
          water_saved: number | null
          yield_improvement: number | null
        }
        Insert: {
          after_images?: string[] | null
          area_covered?: number | null
          before_images?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          name: string
          project_images?: string[] | null
          project_type?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          testimonial?: string | null
          updated_at?: string | null
          water_saved?: number | null
          yield_improvement?: number | null
        }
        Update: {
          after_images?: string[] | null
          area_covered?: number | null
          before_images?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          name?: string
          project_images?: string[] | null
          project_type?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          testimonial?: string | null
          updated_at?: string | null
          water_saved?: number | null
          yield_improvement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }

      
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          quantity: number
          quote_id: string | null
          total: number
          unit: string
          unitprice: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          quantity: number
          quote_id?: string | null
          total: number
          unit: string
          unitprice: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          quantity?: number
          quote_id?: string | null
          total?: number
          unit?: string
          unitprice?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          area_size: number | null
          created_at: string | null
          crop_type: string | null
          customer_id: string | null
          id: string
          include_vat: boolean | null
          notes: string | null
          project_type: string | null
          quote_number: string
          site_plan_url: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          terrain_info: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          vat_rate: number | null
          water_source: string | null
        }
        Insert: {
          area_size?: number | null
          created_at?: string | null
          crop_type?: string | null
          customer_id?: string | null
          id?: string
          include_vat?: boolean | null
          notes?: string | null
          project_type?: string | null
          quote_number: string
          site_plan_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          terrain_info?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          vat_rate?: number | null
          water_source?: string | null
        }
        Update: {
          area_size?: number | null
          created_at?: string | null
          crop_type?: string | null
          customer_id?: string | null
          id?: string
          include_vat?: boolean | null
          notes?: string | null
          project_type?: string | null
          quote_number?: string
          site_plan_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          terrain_info?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          vat_rate?: number | null
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      success_stories: {
        Row: {
          after_image: string | null
          before_image: string | null
          client_company: string | null
          client_name: string
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          results: string | null
          title: string
          updated_at: string
        }
        Insert: {
          after_image?: string | null
          before_image?: string | null
          client_company?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          results?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          after_image?: string | null
          before_image?: string | null
          client_company?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          results?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          linkedin_url: string | null
          name: string
          phone: string | null
          position: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name: string
          phone?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: number | null
          featured: boolean | null
          file_size: number | null
          id: string
          published: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          featured?: boolean | null
          file_size?: number | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          featured?: boolean | null
          file_size?: number | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      keep_database_active: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      product_category:
        | "drip_irrigation"
        | "sprinkler_systems"
        | "filtration_systems"
        | "control_systems"
        | "accessories"
      project_status: "planning" | "in_progress" | "completed" | "on_hold"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "invoiced"
      user_role: "admin" | "manager" | "sales" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      product_category: [
        "drip_irrigation",
        "sprinkler_systems",
        "filtration_systems",
        "control_systems",
        "accessories",
      ],
      project_status: ["planning", "in_progress", "completed", "on_hold"],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "invoiced",
      ],
      user_role: ["admin", "manager", "sales", "customer"],
    },
  },
} as const
