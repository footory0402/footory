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
          role: "player" | "parent" | "scout";
          auth_provider: string | null;
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
          mvp_count: number;
          mvp_tier: "rookie" | "ace" | "allstar" | "legend" | null;
          is_verified: boolean;
          verified_at: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          preferred_foot: string | null;
          profile_views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "player" | "parent" | "scout";
          auth_provider?: string | null;
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
          mvp_count?: number;
          mvp_tier?: "rookie" | "ace" | "allstar" | "legend" | null;
          is_verified?: boolean;
          verified_at?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          preferred_foot?: string | null;
          profile_views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "player" | "parent" | "scout";
          auth_provider?: string | null;
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
          mvp_count?: number;
          mvp_tier?: "rookie" | "ace" | "allstar" | "legend" | null;
          is_verified?: boolean;
          verified_at?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          preferred_foot?: string | null;
          profile_views?: number;
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
          // v1.3 렌더 파이프라인
          raw_key: string | null;
          rendered_url: string | null;
          render_job_id: string | null;
          skill_labels: string[];
          custom_labels: string[];
          trim_start: number | null;
          trim_end: number | null;
          duration_sec: number | null;
          spotlight_x: number | null;
          spotlight_y: number | null;
          slowmo_start: number | null;
          slowmo_end: number | null;
          slowmo_speed: number | null;
          bgm_id: string | null;
          effects: Json;
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
          raw_key?: string | null;
          rendered_url?: string | null;
          render_job_id?: string | null;
          skill_labels?: string[];
          custom_labels?: string[];
          trim_start?: number | null;
          trim_end?: number | null;
          duration_sec?: number | null;
          spotlight_x?: number | null;
          spotlight_y?: number | null;
          slowmo_start?: number | null;
          slowmo_end?: number | null;
          slowmo_speed?: number | null;
          bgm_id?: string | null;
          effects?: Json;
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
          raw_key?: string | null;
          rendered_url?: string | null;
          render_job_id?: string | null;
          skill_labels?: string[];
          custom_labels?: string[];
          trim_start?: number | null;
          trim_end?: number | null;
          duration_sec?: number | null;
          spotlight_x?: number | null;
          spotlight_y?: number | null;
          slowmo_start?: number | null;
          slowmo_end?: number | null;
          slowmo_speed?: number | null;
          bgm_id?: string | null;
          effects?: Json;
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
          role: "admin" | "member" | "alumni";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          role?: "admin" | "member" | "alumni";
          joined_at?: string;
        };
        Update: {
          role?: "admin" | "member" | "alumni";
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
          reaction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feed_item_id: string;
          user_id: string;
          reaction?: string;
          created_at?: string;
        };
        Update: {
          feed_item_id?: string;
          user_id?: string;
          reaction?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          feed_item_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          feed_item_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          parent_id?: string | null;
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
          group_key: string | null;
          action_url: string | null;
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
          group_key?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          type?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
          group_key?: string | null;
          action_url?: string | null;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          profile_id: string;
          push_enabled: boolean;
          kudos: boolean;
          comments: boolean;
          follows: boolean;
          dm: boolean;
          mentions: boolean;
          vote_open: boolean;
          vote_remind: boolean;
          mvp_result: boolean;
          team_invite: boolean;
          weekly_recap: boolean;
          upload_nudge: boolean;
          quiet_start: string;
          quiet_end: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          push_enabled?: boolean;
          kudos?: boolean;
          comments?: boolean;
          follows?: boolean;
          dm?: boolean;
          mentions?: boolean;
          vote_open?: boolean;
          vote_remind?: boolean;
          mvp_result?: boolean;
          team_invite?: boolean;
          weekly_recap?: boolean;
          upload_nudge?: boolean;
          quiet_start?: string;
          quiet_end?: string;
          updated_at?: string;
        };
        Update: {
          push_enabled?: boolean;
          kudos?: boolean;
          comments?: boolean;
          follows?: boolean;
          dm?: boolean;
          mentions?: boolean;
          vote_open?: boolean;
          vote_remind?: boolean;
          mvp_result?: boolean;
          team_invite?: boolean;
          weekly_recap?: boolean;
          upload_nudge?: boolean;
          quiet_start?: string;
          quiet_end?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          profile_id: string;
          token: string;
          platform: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          token: string;
          platform?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          token?: string;
          platform?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          profile_id: string;
          year: number;
          team_name: string;
          team_id: string | null;
          is_current: boolean;
          league: string | null;
          highlight_clip_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          year: number;
          team_name: string;
          team_id?: string | null;
          is_current?: boolean;
          league?: string | null;
          highlight_clip_id?: string | null;
          created_at?: string;
        };
        Update: {
          year?: number;
          team_name?: string;
          team_id?: string | null;
          is_current?: boolean;
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
          consent_given: boolean;
          consent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          child_id: string;
          consent_given?: boolean;
          consent_at?: string | null;
          created_at?: string;
        };
        Update: {
          parent_id?: string;
          child_id?: string;
          consent_given?: boolean;
          consent_at?: string | null;
        };
        Relationships: [];
      };
      coach_verifications: {
        Row: {
          id: string;
          profile_id: string;
          method: string;
          document_url: string | null;
          referrer_id: string | null;
          team_code: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          method: string;
          document_url?: string | null;
          referrer_id?: string | null;
          team_code?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          method?: string;
          document_url?: string | null;
          referrer_id?: string | null;
          team_code?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      weekly_votes: {
        Row: {
          id: string;
          voter_id: string;
          clip_id: string;
          week_start: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          clip_id: string;
          week_start: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          message?: string | null;
        };
        Relationships: [];
      };
      weekly_mvp_results: {
        Row: {
          id: string;
          week_start: string;
          rank: number;
          clip_id: string;
          profile_id: string;
          auto_score: number;
          vote_score: number;
          total_score: number;
          vote_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          rank: number;
          clip_id: string;
          profile_id: string;
          auto_score: number;
          vote_score: number;
          total_score: number;
          vote_count: number;
          created_at?: string;
        };
        Update: {
          rank?: number;
          auto_score?: number;
          vote_score?: number;
          total_score?: number;
          vote_count?: number;
        };
        Relationships: [];
      };
      player_ranking_cache: {
        Row: {
          profile_id: string;
          popularity_score: number;
          weekly_change: number;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          popularity_score?: number;
          weekly_change?: number;
          updated_at?: string;
        };
        Update: {
          popularity_score?: number;
          weekly_change?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_ranking_cache: {
        Row: {
          team_id: string;
          activity_score: number;
          mvp_count: number;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          activity_score?: number;
          mvp_count?: number;
          updated_at?: string;
        };
        Update: {
          activity_score?: number;
          mvp_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_1: string;
          participant_2: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          created_at?: string;
        };
        Update: {
          last_message_at?: string | null;
          last_message_preview?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          shared_clip_id: string | null;
          is_read: boolean;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          shared_clip_id?: string | null;
          is_read?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string | null;
          is_read?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          competition: string | null;
          year: number | null;
          evidence_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          competition?: string | null;
          year?: number | null;
          evidence_url?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          competition?: string | null;
          year?: number | null;
          evidence_url?: string | null;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          id: string;
          profile_id: string;
          event_type: string;
          event_data: Record<string, unknown>;
          clip_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          event_type: string;
          event_data?: Record<string, unknown>;
          clip_id?: string | null;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          event_data?: Record<string, unknown>;
          clip_id?: string | null;
        };
        Relationships: [];
      };
      fcm_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device_info: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device_info?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          token?: string;
          device_info?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          message_id: string | null;
          comment_id: string | null;
          clip_id: string | null;
          stat_id: string | null;
          category: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          message_id?: string | null;
          comment_id?: string | null;
          clip_id?: string | null;
          stat_id?: string | null;
          category: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      stat_audit_log: {
        Row: {
          id: string;
          stat_id: string;
          profile_id: string;
          action: string;
          stat_type: string;
          old_value: number | null;
          new_value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stat_id: string;
          profile_id: string;
          action: string;
          stat_type: string;
          old_value?: number | null;
          new_value?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      dm_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          preview_message: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          preview_message?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          skill_tag: string | null;
          week_start: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          skill_tag?: string | null;
          week_start: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          skill_tag?: string | null;
          week_start?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      quest_progress: {
        Row: {
          id: string;
          profile_id: string;
          quest_type: string;
          quest_key: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          quest_type: string;
          quest_key: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed_at?: string | null;
        };
        Relationships: [];
      };
      coach_reviews: {
        Row: {
          id: string;
          coach_id: string;
          clip_id: string;
          comment: string | null;
          private_note: string | null;
          rating: "good" | "great" | "excellent";
          hidden_by_owner: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          clip_id: string;
          comment?: string | null;
          private_note?: string | null;
          rating: "good" | "great" | "excellent";
          hidden_by_owner?: boolean;
          created_at?: string;
        };
        Update: {
          comment?: string | null;
          private_note?: string | null;
          rating?: "good" | "great" | "excellent";
          hidden_by_owner?: boolean;
        };
        Relationships: [];
      };
      render_jobs: {
        Row: {
          id: string;
          clip_id: string;
          owner_id: string;
          status: "queued" | "processing" | "done" | "failed";
          progress: number;
          error: string | null;
          retry_count: number;
          input_key: string;
          output_key: string | null;
          params: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clip_id: string;
          owner_id: string;
          status?: "queued" | "processing" | "done" | "failed";
          progress?: number;
          error?: string | null;
          retry_count?: number;
          input_key: string;
          output_key?: string | null;
          params?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "queued" | "processing" | "done" | "failed";
          progress?: number;
          error?: string | null;
          retry_count?: number;
          output_key?: string | null;
          params?: Json;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      skill_labels: {
        Row: {
          id: string;
          label_ko: string;
          category: "common" | "attack" | "defense" | "gk";
          sort_order: number;
        };
        Insert: {
          id: string;
          label_ko: string;
          category: "common" | "attack" | "defense" | "gk";
          sort_order?: number;
        };
        Update: {
          label_ko?: string;
          category?: "common" | "attack" | "defense" | "gk";
          sort_order?: number;
        };
        Relationships: [];
      };
      bgm_tracks: {
        Row: {
          id: string;
          title: string;
          artist: string | null;
          category: "epic" | "chill" | "hype" | "cinematic";
          r2_key: string;
          duration_sec: number;
          bpm: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist?: string | null;
          category: "epic" | "chill" | "hype" | "cinematic";
          r2_key: string;
          duration_sec: number;
          bpm?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          artist?: string | null;
          category?: "epic" | "chill" | "hype" | "cinematic";
          r2_key?: string;
          duration_sec?: number;
          bpm?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          id: string;
          owner_id: string;
          title: string | null;
          clip_ids: string[];
          render_job_id: string | null;
          rendered_url: string | null;
          thumbnail_url: string | null;
          duration_sec: number | null;
          status: "draft" | "rendering" | "done" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string | null;
          clip_ids?: string[];
          render_job_id?: string | null;
          rendered_url?: string | null;
          thumbnail_url?: string | null;
          duration_sec?: number | null;
          status?: "draft" | "rendering" | "done" | "failed";
          created_at?: string;
        };
        Update: {
          title?: string | null;
          clip_ids?: string[];
          render_job_id?: string | null;
          rendered_url?: string | null;
          thumbnail_url?: string | null;
          duration_sec?: number | null;
          status?: "draft" | "rendering" | "done" | "failed";
        };
        Relationships: [];
      };
      scout_watchlist: {
        Row: {
          id: string;
          scout_id: string;
          player_id: string;
          note: string | null;
          notify_on_upload: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          scout_id: string;
          player_id: string;
          note?: string | null;
          notify_on_upload?: boolean;
          created_at?: string;
        };
        Update: {
          note?: string | null;
          notify_on_upload?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_xp: {
        Args: { profile_id: string; amount: number };
        Returns: void;
      };
      increment_views: {
        Args: { profile_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
