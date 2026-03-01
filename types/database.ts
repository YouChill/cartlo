// Supabase Database types — placeholder until `supabase gen types` is run.
// Regenerate: supabase gen types typescript --local > types/database.ts
//
// These manual types match the schema from migration 00001.
// They will be replaced by auto-generated types once Supabase is connected.

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          family_id: string | null;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string | null;
          display_name?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          sort_order: number;
          is_default: boolean;
          family_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          sort_order: number;
          is_default?: boolean;
          family_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          sort_order?: number;
          is_default?: boolean;
          family_id?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          family_id: string | null;
          usage_count: number;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          family_id?: string | null;
          usage_count?: number;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string | null;
          family_id?: string | null;
          usage_count?: number;
        };
      };
      shopping_items: {
        Row: {
          id: string;
          family_id: string;
          product_name: string;
          category_id: string | null;
          is_checked: boolean;
          added_by: string;
          checked_by: string | null;
          created_at: string;
          checked_at: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          product_name: string;
          category_id?: string | null;
          is_checked?: boolean;
          added_by: string;
          checked_by?: string | null;
          created_at?: string;
          checked_at?: string | null;
        };
        Update: {
          id?: string;
          family_id?: string;
          product_name?: string;
          category_id?: string | null;
          is_checked?: boolean;
          added_by?: string;
          checked_by?: string | null;
          created_at?: string;
          checked_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
