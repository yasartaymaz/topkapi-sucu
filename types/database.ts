// Bu dosya Supabase MCP tarafından otomatik üretildi.
// Şemayı değiştirince regenerate etmeyi unutma (mcp__supabase__generate_typescript_types).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      customer_addresses: {
        Row: {
          created_at: string;
          customer_profile_id: string;
          deleted_at: string | null;
          full_address: string;
          id: string;
          is_default: boolean;
          label: string;
          neighborhood_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_profile_id: string;
          deleted_at?: string | null;
          full_address: string;
          id?: string;
          is_default?: boolean;
          label: string;
          neighborhood_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_profile_id?: string;
          deleted_at?: string | null;
          full_address?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          neighborhood_id?: string;
          updated_at?: string;
        };
      };
      districts: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      neighborhoods: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          district_id: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          district_id: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          district_id?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          order_id: string;
          status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
      orders: {
        Row: {
          address_snapshot: Json;
          canceled_reason: string | null;
          created_at: string;
          customer_name_snapshot: string | null;
          customer_note: string | null;
          customer_phone_snapshot: string | null;
          customer_profile_id: string;
          deleted_at: string | null;
          delivery_fee_snapshot: number;
          id: string;
          product_id: string;
          product_name_snapshot: string;
          qty: number;
          status: string;
          subtotal: number;
          total: number;
          unit_price_snapshot: number;
          updated_at: string;
          vendor_id: string;
        };
        Insert: {
          address_snapshot: Json;
          canceled_reason?: string | null;
          created_at?: string;
          customer_name_snapshot?: string | null;
          customer_note?: string | null;
          customer_phone_snapshot?: string | null;
          customer_profile_id: string;
          deleted_at?: string | null;
          delivery_fee_snapshot?: number;
          id?: string;
          product_id: string;
          product_name_snapshot: string;
          qty: number;
          status: string;
          subtotal: number;
          total: number;
          unit_price_snapshot: number;
          updated_at?: string;
          vendor_id: string;
        };
        Update: {
          address_snapshot?: Json;
          canceled_reason?: string | null;
          created_at?: string;
          customer_name_snapshot?: string | null;
          customer_note?: string | null;
          customer_phone_snapshot?: string | null;
          customer_profile_id?: string;
          deleted_at?: string | null;
          delivery_fee_snapshot?: number;
          id?: string;
          product_id?: string;
          product_name_snapshot?: string;
          qty?: number;
          status?: string;
          subtotal?: number;
          total?: number;
          unit_price_snapshot?: number;
          updated_at?: string;
          vendor_id?: string;
        };
      };
      products: {
        Row: {
          brand: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          image_path: string | null;
          name: string;
          price: number;
          stock_status: string;
          updated_at: string;
          vendor_id: string;
          volume_liters: number | null;
        };
        Insert: {
          brand?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_path?: string | null;
          name: string;
          price: number;
          stock_status?: string;
          updated_at?: string;
          vendor_id: string;
          volume_liters?: number | null;
        };
        Update: {
          brand?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_path?: string | null;
          name?: string;
          price?: number;
          stock_status?: string;
          updated_at?: string;
          vendor_id?: string;
          volume_liters?: number | null;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          expo_push_token: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          expo_push_token?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          expo_push_token?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          customer_profile_id: string;
          deleted_at: string | null;
          id: string;
          order_id: string;
          rating: number;
          updated_at: string;
          vendor_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          customer_profile_id: string;
          deleted_at?: string | null;
          id?: string;
          order_id: string;
          rating: number;
          updated_at?: string;
          vendor_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          customer_profile_id?: string;
          deleted_at?: string | null;
          id?: string;
          order_id?: string;
          rating?: number;
          updated_at?: string;
          vendor_id?: string;
        };
      };
      vendor_service_areas: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          neighborhood_id: string;
          updated_at: string;
          vendor_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          neighborhood_id: string;
          updated_at?: string;
          vendor_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          neighborhood_id?: string;
          updated_at?: string;
          vendor_id?: string;
        };
      };
      vendors: {
        Row: {
          closes_at: string;
          created_at: string;
          deleted_at: string | null;
          delivery_fee: number;
          id: string;
          logo_path: string | null;
          opens_at: string;
          phone: string | null;
          profile_id: string;
          shop_name: string;
          tax_no: string | null;
          updated_at: string;
        };
        Insert: {
          closes_at?: string;
          created_at?: string;
          deleted_at?: string | null;
          delivery_fee?: number;
          id?: string;
          logo_path?: string | null;
          opens_at?: string;
          phone?: string | null;
          profile_id: string;
          shop_name: string;
          tax_no?: string | null;
          updated_at?: string;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          deleted_at?: string | null;
          delivery_fee?: number;
          id?: string;
          logo_path?: string | null;
          opens_at?: string;
          phone?: string | null;
          profile_id?: string;
          shop_name?: string;
          tax_no?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Yardımcı tipler
type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row'];

export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update'];

// Uygulama seviyesinde sık kullanılan tipler
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'canceled';

export type StockStatus = 'in_stock' | 'out_of_stock';

export type UserRole = 'customer' | 'vendor';
