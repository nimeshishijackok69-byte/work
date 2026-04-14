export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_profile: {
        Row: {
          id: string
          auth_user_id: string
          name: string
          email: string
          avatar_url: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          name: string
          email: string
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_master: {
        Row: {
          id: string
          title: string
          description: string | null
          form_schema: Json
          review_layers: number
          scoring_type: string
          grade_config: Json | null
          max_score: number
          status: string
          share_slug: string
          max_file_size: number
          allowed_file_types: string[]
          expiration_date: string | null
          teacher_fields: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          form_schema?: Json
          review_layers?: number
          scoring_type?: string
          grade_config?: Json | null
          max_score?: number
          status?: string
          share_slug: string
          max_file_size?: number
          allowed_file_types?: string[]
          expiration_date?: string | null
          teacher_fields?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          form_schema?: Json
          review_layers?: number
          scoring_type?: string
          grade_config?: Json | null
          max_score?: number
          status?: string
          share_slug?: string
          max_file_size?: number
          allowed_file_types?: string[]
          expiration_date?: string | null
          teacher_fields?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_master: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string
          phone: string | null
          school_name: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email: string
          phone?: string | null
          school_name?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string
          phone?: string | null
          school_name?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      submission: {
        Row: {
          id: string
          event_id: string
          user_id: string
          form_data: Json
          file_attachments: Json
          status: string
          submission_number: number
          current_layer: number
          review_status: string
          eliminated_at_layer: number | null
          draft_token: string | null
          draft_token_expires: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          form_data?: Json
          file_attachments?: Json
          status?: string
          submission_number?: number
          current_layer?: number
          review_status?: string
          eliminated_at_layer?: number | null
          draft_token?: string | null
          draft_token_expires?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          form_data?: Json
          file_attachments?: Json
          status?: string
          submission_number?: number
          current_layer?: number
          review_status?: string
          eliminated_at_layer?: number | null
          draft_token?: string | null
          draft_token_expires?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviewer_master: {
        Row: {
          id: string
          auth_user_id: string
          name: string
          email: string
          phone: string | null
          department: string | null
          specialization: string | null
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          name: string
          email: string
          phone?: string | null
          department?: string | null
          specialization?: string | null
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          name?: string
          email?: string
          phone?: string | null
          department?: string | null
          specialization?: string | null
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      review_assignment: {
        Row: {
          id: string
          event_id: string
          submission_id: string
          reviewer_id: string
          layer: number
          status: string
          is_override: boolean
          assigned_by: string
          assigned_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          submission_id: string
          reviewer_id: string
          layer: number
          status?: string
          is_override?: boolean
          assigned_by: string
          assigned_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          submission_id?: string
          reviewer_id?: string
          layer?: number
          status?: string
          is_override?: boolean
          assigned_by?: string
          assigned_at?: string
          completed_at?: string | null
        }
      }
      review: {
        Row: {
          id: string
          assignment_id: string
          event_id: string
          submission_id: string
          reviewer_id: string
          layer: number
          score: number | null
          grade: string | null
          notes: string | null
          reviewed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          event_id: string
          submission_id: string
          reviewer_id: string
          layer: number
          score?: number | null
          grade?: string | null
          notes?: string | null
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          event_id?: string
          submission_id?: string
          reviewer_id?: string
          layer?: number
          score?: number | null
          grade?: string | null
          notes?: string | null
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      transaction_master: {
        Row: {
          id: string
          event_id: string
          submission_id: string | null
          user_id: string | null
          action: string
          actor_id: string | null
          actor_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          submission_id?: string | null
          user_id?: string | null
          action: string
          actor_id?: string | null
          actor_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          submission_id?: string | null
          user_id?: string | null
          action?: string
          actor_id?: string | null
          actor_type?: string
          metadata?: Json
          created_at?: string
        }
      }
      notification: {
        Row: {
          id: string
          recipient_id: string
          recipient_type: string
          title: string
          message: string
          type: string
          action_url: string | null
          is_read: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          recipient_type: string
          title: string
          message: string
          type: string
          action_url?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          recipient_type?: string
          title?: string
          message?: string
          type?: string
          action_url?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}
