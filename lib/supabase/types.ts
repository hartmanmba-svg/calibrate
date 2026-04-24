export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ----------------------------------------------------------------
// Enum types — mirror the DB enums exactly
// ----------------------------------------------------------------

export type CareerStage = 'student' | 'candidate' | 'certified' | 'supervisor'
export type Modality = 'ssep' | 'mep' | 'emg_free' | 'emg_triggered' | 'eeg' | 'baep' | 'vep' | 'dwave'
export type CaseType =
  | 'cervical' | 'lumbar' | 'scoliosis' | 'carotid' | 'vascular'
  | 'supratentorial' | 'posterior_fossa' | 'skull_base'
  | 'peripheral_nerve' | 'spinal_tumor' | 'tethered_cord' | 'pediatric'
export type CardType = 'didactic' | 'clinical'
export type FsrsState = 'new' | 'learning' | 'review' | 'relearning'
export type CredentialType = 'trainer' | 'educator' | 'fellow'
export type CredentialStatus = 'active' | 'warning' | 'paused'
export type SubscriptionPlan = 'monthly' | 'annual' | 'team'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
export type ScoreType =
  | 'or_readiness'
  | 'cervical' | 'lumbar' | 'scoliosis' | 'carotid' | 'vascular'
  | 'supratentorial' | 'posterior_fossa' | 'skull_base'
  | 'peripheral_nerve' | 'spinal_tumor' | 'tethered_cord' | 'pediatric'

// ----------------------------------------------------------------
// Database — typed Supabase client
// Requires: Relationships on every table, Views, Functions on schema
// ----------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      employers: {
        Row: {
          id: string
          name: string
          seat_count: number
          admin_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          seat_count?: number
          admin_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          seat_count?: number
          admin_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          career_stage: CareerStage
          employer_id: string | null
          xp: number
          level: number
          streak: number
          streak_shield: boolean
          last_review_date: string | null
          consecutive_got_it: number
          daily_missions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          career_stage?: CareerStage
          employer_id?: string | null
          xp?: number
          level?: number
          streak?: number
          streak_shield?: boolean
          last_review_date?: string | null
          consecutive_got_it?: number
          daily_missions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          career_stage?: CareerStage
          employer_id?: string | null
          xp?: number
          level?: number
          streak?: number
          streak_shield?: boolean
          last_review_date?: string | null
          consecutive_got_it?: number
          daily_missions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      decks: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          front: string
          back: string
          explanation: string | null
          deck_id: string | null
          modality: Modality | null
          case_type: CaseType | null
          card_type: CardType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          front: string
          back: string
          explanation?: string | null
          deck_id?: string | null
          modality?: Modality | null
          case_type?: CaseType | null
          card_type?: CardType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          front?: string
          back?: string
          explanation?: string | null
          deck_id?: string | null
          modality?: Modality | null
          case_type?: CaseType | null
          card_type?: CardType | null
          updated_at?: string
        }
        Relationships: []
      }
      card_reviews: {
        Row: {
          id: string
          user_id: string
          card_id: string
          due: string
          stability: number
          difficulty: number
          elapsed_days: number
          scheduled_days: number
          reps: number
          lapses: number
          state: FsrsState
          last_review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          due?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          state?: FsrsState
          last_review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          due?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          state?: FsrsState
          last_review?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_log: {
        Row: {
          id: string
          user_id: string
          card_id: string
          rating: number
          fsrs_state: FsrsState
          scheduled_days: number
          elapsed_days: number
          reviewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          rating: number
          fsrs_state: FsrsState
          scheduled_days?: number
          elapsed_days?: number
          reviewed_at?: string
        }
        // Append-only table — no columns are updatable.
        // RLS has no UPDATE policy; this type exists only to satisfy
        // the Supabase GenericTable constraint.
        Update: {
          id?: string
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          id: string
          user_id: string
          score_type: ScoreType
          score: number
          percentile: number | null
          reviews_used: number
          computed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score_type: ScoreType
          score: number
          percentile?: number | null
          reviews_used?: number
          computed_at?: string
        }
        Update: {
          score?: number
          percentile?: number | null
          reviews_used?: number
          computed_at?: string
        }
        Relationships: []
      }
      credentials: {
        Row: {
          id: string
          user_id: string
          credential_type: CredentialType
          status: CredentialStatus
          earned_at: string
          expires_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credential_type: CredentialType
          status?: CredentialStatus
          earned_at?: string
          expires_at?: string | null
          updated_at?: string
        }
        Update: {
          status?: CredentialStatus
          expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          user_id: string
          badge_key: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_key: string
          earned_at?: string
        }
        // Badges are permanent — no columns are updatable.
        Update: {
          id?: string
        }
        Relationships: []
      }
      ce_modules: {
        Row: {
          id: string
          title: string
          description: string | null
          credits: number
          content_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          credits?: number
          content_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          credits?: number
          content_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ce_completions: {
        Row: {
          id: string
          user_id: string
          module_id: string
          progress: number
          completed_at: string | null
          certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          progress?: number
          completed_at?: string | null
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          progress?: number
          completed_at?: string | null
          certificate_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: SubscriptionPlan
          status: SubscriptionStatus
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan: SubscriptionPlan
          status?: SubscriptionStatus
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          id: string
          user_id: string
          token: string
          show_name: boolean
          show_scores: boolean
          show_credentials: boolean
          show_badges: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token?: string
          show_name?: boolean
          show_scores?: boolean
          show_credentials?: boolean
          show_badges?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          show_name?: boolean
          show_scores?: boolean
          show_credentials?: boolean
          show_badges?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      career_stage: CareerStage
      modality: Modality
      case_type: CaseType
      card_type: CardType
      fsrs_state: FsrsState
      credential_type: CredentialType
      credential_status: CredentialStatus
      subscription_plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
      score_type: ScoreType
    }
  }
}

// ----------------------------------------------------------------
// Convenience row types — import these throughout the app
// ----------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile        = Tables<'profiles'>
export type Employer       = Tables<'employers'>
export type Card           = Tables<'cards'>
export type CardReview     = Tables<'card_reviews'>
export type ReviewLog      = Tables<'review_log'>
export type ReadinessScore = Tables<'readiness_scores'>
export type Credential     = Tables<'credentials'>
export type Badge          = Tables<'badges'>
export type CeModule       = Tables<'ce_modules'>
export type CeCompletion   = Tables<'ce_completions'>
export type Subscription   = Tables<'subscriptions'>
export type ShareLink      = Tables<'share_links'>
