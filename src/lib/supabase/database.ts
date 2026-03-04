export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "player" | "parent" | "other";
          handle: string;
          name: string;
          avatar_url: string | null;
          position: "FW" | "MF" | "DF" | "GK" | null;
          birth_year: number | null;
          city: string | null;
          bio: string | null;
          level: number;
          xp: number;
          public_email: string | null;
          public_phone: string | null;
          show_email: boolean;
          show_phone: boolean;
          followers_count: number;
          following_count: number;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "player" | "parent" | "other";
          handle: string;
          name: string;
          avatar_url?: string | null;
          position?: "FW" | "MF" | "DF" | "GK" | null;
          birth_year?: number | null;
          city?: string | null;
          bio?: string | null;
          level?: number;
          xp?: number;
          public_email?: string | null;
          public_phone?: string | null;
          show_email?: boolean;
          show_phone?: boolean;
          followers_count?: number;
          following_count?: number;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "player" | "parent" | "other";
          handle?: string;
          name?: string;
          avatar_url?: string | null;
          position?: "FW" | "MF" | "DF" | "GK" | null;
          birth_year?: number | null;
          city?: string | null;
          bio?: string | null;
          level?: number;
          xp?: number;
          public_email?: string | null;
          public_phone?: string | null;
          show_email?: boolean;
          show_phone?: boolean;
          followers_count?: number;
          following_count?: number;
          views_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      clips: {
        Row: {
          id: string;
          owner_id: string;
          uploaded_by: string | null;
          video_url: string;
          highlight_url: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          memo: string | null;
          highlight_status: "pending" | "processing" | "done" | "failed";
          highlight_start: number | null;
          highlight_end: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          uploaded_by?: string | null;
          video_url: string;
          highlight_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          memo?: string | null;
          highlight_status?: "pending" | "processing" | "done" | "failed";
          highlight_start?: number | null;
          highlight_end?: number | null;
          created_at?: string;
        };
        Update: {
          owner_id?: string;
          uploaded_by?: string | null;
          video_url?: string;
          highlight_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          memo?: string | null;
          highlight_status?: "pending" | "processing" | "done" | "failed";
          highlight_start?: number | null;
          highlight_end?: number | null;
        };
        Relationships: [];
      };
      clip_tags: {
        Row: {
          id: string;
          clip_id: string;
          tag_name: string;
          is_top: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clip_id: string;
          tag_name: string;
          is_top?: boolean;
          created_at?: string;
        };
        Update: {
          clip_id?: string;
          tag_name?: string;
          is_top?: boolean;
        };
        Relationships: [];
      };
      featured_clips: {
        Row: {
          id: string;
          profile_id: string;
          clip_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          clip_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          clip_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      stats: {
        Row: {
          id: string;
          profile_id: string;
          stat_type: string;
          value: number;
          unit: string;
          evidence_clip_id: string | null;
          verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          stat_type: string;
          value: number;
          unit: string;
          evidence_clip_id?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          stat_type?: string;
          value?: number;
          unit?: string;
          evidence_clip_id?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      medals: {
        Row: {
          id: string;
          profile_id: string;
          medal_code: string;
          stat_id: string | null;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          medal_code: string;
          stat_id?: string | null;
          achieved_at?: string;
        };
        Update: {
          medal_code?: string;
          stat_id?: string | null;
        };
        Relationships: [];
      };
      medal_criteria: {
        Row: {
          code: string;
          stat_type: string;
          threshold: number;
          comparison: "lte" | "gte";
          icon: string;
          label: string;
        };
        Insert: {
          code: string;
          stat_type: string;
          threshold: number;
          comparison: "lte" | "gte";
          icon: string;
          label: string;
        };
        Update: {
          stat_type?: string;
          threshold?: number;
          comparison?: "lte" | "gte";
          icon?: string;
          label?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          handle: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          city: string | null;
          founded_year: number | null;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          handle: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          city?: string | null;
          founded_year?: number | null;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          handle?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          city?: string | null;
          founded_year?: number | null;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "admin" | "member";
        };
        Relationships: [];
      };
      team_albums: {
        Row: {
          id: string;
          team_id: string;
          uploaded_by: string | null;
          media_type: "photo" | "video";
          media_url: string;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          uploaded_by?: string | null;
          media_type: "photo" | "video";
          media_url: string;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          media_type?: "photo" | "video";
          media_url?: string;
          thumbnail_url?: string | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      feed_items: {
        Row: {
          id: string;
          profile_id: string;
          type: "highlight" | "featured_change" | "medal" | "stat" | "season" | "top_clip";
          reference_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: "highlight" | "featured_change" | "medal" | "stat" | "season" | "top_clip";
          reference_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          type?: "highlight" | "featured_change" | "medal" | "stat" | "season" | "top_clip";
          reference_id?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      kudos: {
        Row: {
          id: string;
          feed_item_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feed_item_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          feed_item_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          feed_item_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feed_item_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          type?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          profile_id: string;
          year: number;
          team_name: string;
          league: string | null;
          highlight_clip_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          year: number;
          team_name: string;
          league?: string | null;
          highlight_clip_id?: string | null;
          created_at?: string;
        };
        Update: {
          year?: number;
          team_name?: string;
          league?: string | null;
          highlight_clip_id?: string | null;
        };
        Relationships: [];
      };
      parent_links: {
        Row: {
          id: string;
          parent_id: string;
          child_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          child_id: string;
          created_at?: string;
        };
        Update: {
          parent_id?: string;
          child_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
