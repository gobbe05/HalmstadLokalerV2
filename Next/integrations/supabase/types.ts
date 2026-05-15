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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          lead_id: string | null
          listing_id: string | null
          meta: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          meta?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          meta?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_page_views: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_page_views_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_slugs: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_active: boolean
          profile_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_slugs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_slugs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_seo: {
        Row: {
          category_slug: string
          city_id: string
          created_at: string
          description: string | null
          id: string
          seo_title: string | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          category_slug: string
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          seo_title?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          category_slug?: string
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          seo_title?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_seo_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          domain: string | null
          hero_blur_placeholder: string | null
          hero_image_url: string | null
          id: string
          intro_text: string | null
          is_published: boolean
          name: string
          og_image_url: string | null
          seo_description: string | null
          seo_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          hero_blur_placeholder?: string | null
          hero_image_url?: string | null
          id: string
          intro_text?: string | null
          is_published?: boolean
          name: string
          og_image_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          hero_blur_placeholder?: string | null
          hero_image_url?: string | null
          id?: string
          intro_text?: string | null
          is_published?: boolean
          name?: string
          og_image_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      customer_billing: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_email: string | null
          billing_zip: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          email_general: string | null
          id: string
          org_number: string | null
          phone: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_zip?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email_general?: string | null
          id?: string
          org_number?: string | null
          phone?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_zip?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email_general?: string | null
          id?: string
          org_number?: string | null
          phone?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_billing_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          area: string | null
          categories: string[]
          category: string | null
          city: string
          content: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          image: string | null
          published: boolean
          reading_time: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          categories?: string[]
          category?: string | null
          city?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image?: string | null
          published?: boolean
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          categories?: string[]
          category?: string | null
          city?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image?: string | null
          published?: boolean
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          advertiser_id: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string | null
          id: string
          lead_type: string | null
          lease_status: string | null
          listing_id: string | null
          max_area_sqm: number | null
          message: string | null
          min_area_sqm: number | null
          move_within_months: number | null
          notes: string | null
          org_number: string | null
          phone: string | null
          preferred_area_range: string | null
          preferred_property_types: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          advertiser_id?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          lead_type?: string | null
          lease_status?: string | null
          listing_id?: string | null
          max_area_sqm?: number | null
          message?: string | null
          min_area_sqm?: number | null
          move_within_months?: number | null
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          preferred_area_range?: string | null
          preferred_property_types?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          advertiser_id?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          lead_type?: string | null
          lease_status?: string | null
          listing_id?: string | null
          max_area_sqm?: number | null
          message?: string | null
          min_area_sqm?: number | null
          move_within_months?: number | null
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          preferred_area_range?: string | null
          preferred_property_types?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          listing_id: string
          session_id: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          listing_id: string
          session_id?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          listing_id?: string
          session_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          adress: string | null
          area_sqm: number | null
          beskrivning_kort: string | null
          beskrivning_lang: string | null
          bilder: string[] | null
          city_id: string | null
          created_at: string
          deleted_at: string | null
          dokument: string[] | null
          featured_order: number | null
          hyra_per_m2_ar: number | null
          id: string
          is_address_validated: boolean
          is_featured: boolean | null
          is_prelisting: boolean
          kommun: string | null
          koordinater_lat: number | null
          koordinater_lng: number | null
          market: string | null
          owner_id: string | null
          postnummer: string | null
          stad: string | null
          status: Database["public"]["Enums"]["listing_status"]
          titel: string
          typ: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adress?: string | null
          area_sqm?: number | null
          beskrivning_kort?: string | null
          beskrivning_lang?: string | null
          bilder?: string[] | null
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dokument?: string[] | null
          featured_order?: number | null
          hyra_per_m2_ar?: number | null
          id?: string
          is_address_validated?: boolean
          is_featured?: boolean | null
          is_prelisting?: boolean
          kommun?: string | null
          koordinater_lat?: number | null
          koordinater_lng?: number | null
          market?: string | null
          owner_id?: string | null
          postnummer?: string | null
          stad?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          titel: string
          typ?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adress?: string | null
          area_sqm?: number | null
          beskrivning_kort?: string | null
          beskrivning_lang?: string | null
          bilder?: string[] | null
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dokument?: string[] | null
          featured_order?: number | null
          hyra_per_m2_ar?: number | null
          id?: string
          is_address_validated?: boolean
          is_featured?: boolean | null
          is_prelisting?: boolean
          kommun?: string | null
          koordinater_lat?: number | null
          koordinater_lng?: number | null
          market?: string | null
          owner_id?: string | null
          postnummer?: string | null
          stad?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          titel?: string
          typ?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          allowed_cities: string[] | null
          bio: string | null
          city: string | null
          company_logo: string | null
          company_name: string | null
          contact_title: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          org_number: string | null
          phone: string | null
          postal_code: string | null
          prelisting_default: boolean
          primary_city_id: string | null
          slug: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          allowed_cities?: string[] | null
          bio?: string | null
          city?: string | null
          company_logo?: string | null
          company_name?: string | null
          contact_title?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          prelisting_default?: boolean
          primary_city_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          allowed_cities?: string[] | null
          bio?: string | null
          city?: string | null
          company_logo?: string | null
          company_name?: string | null
          contact_title?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          prelisting_default?: boolean
          primary_city_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      site_schema_config: {
        Row: {
          article_publisher: string | null
          city_id: string
          created_at: string
          email: string | null
          geo_radius_km: number | null
          id: string
          local_business_enabled: boolean
          local_business_type: string | null
          opening_hours: string | null
          phone: string | null
          price_range: string | null
          same_as: string[] | null
          updated_at: string
        }
        Insert: {
          article_publisher?: string | null
          city_id: string
          created_at?: string
          email?: string | null
          geo_radius_km?: number | null
          id?: string
          local_business_enabled?: boolean
          local_business_type?: string | null
          opening_hours?: string | null
          phone?: string | null
          price_range?: string | null
          same_as?: string[] | null
          updated_at?: string
        }
        Update: {
          article_publisher?: string | null
          city_id?: string
          created_at?: string
          email?: string | null
          geo_radius_km?: number | null
          id?: string
          local_business_enabled?: boolean
          local_business_type?: string | null
          opening_hours?: string | null
          phone?: string | null
          price_range?: string | null
          same_as?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_schema_config_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_unique_advertiser_slug: {
        Args: {
          p_city_id: string
          p_company_name: string
          p_profile_id: string
        }
        Returns: string
      }
      get_user_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      profile_has_published_listings: {
        Args: { _profile_id: string }
        Returns: boolean
      }
      slugify: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "advertiser"
      lead_status:
        | "new"
        | "contacted"
        | "viewing"
        | "negotiating"
        | "won"
        | "lost"
      listing_status:
        | "draft"
        | "internal"
        | "pending_approval"
        | "published"
        | "rented"
      profile_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "advertiser"],
      lead_status: [
        "new",
        "contacted",
        "viewing",
        "negotiating",
        "won",
        "lost",
      ],
      listing_status: [
        "draft",
        "internal",
        "pending_approval",
        "published",
        "rented",
      ],
      profile_status: ["pending", "approved", "rejected"],
    },
  },
} as const
