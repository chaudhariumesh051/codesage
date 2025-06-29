import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  throw new Error(
    'VITE_SUPABASE_URL is not configured. Please update your .env file with your actual Supabase project URL. ' +
    'You can find this in your Supabase dashboard under Project Settings > API. ' +
    'See README_SUPABASE_SETUP.md for detailed instructions.'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not configured. Please update your .env file with your actual Supabase anon key. ' +
    'You can find this in your Supabase dashboard under Project Settings > API. ' +
    'See README_SUPABASE_SETUP.md for detailed instructions.'
  )
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(
    `VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}". ` +
    'Please ensure it follows the format: https://your-project-ref.supabase.co. ' +
    'See README_SUPABASE_SETUP.md for detailed instructions.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'codeorbit-web'
    }
  }
})

// Database types
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  username?: string
  bio?: string
  website?: string
  location?: string
  timezone: string
  role: 'user' | 'admin' | 'super_admin'
  is_admin: boolean
  subscription_status: 'free' | 'pro' | 'enterprise' | 'cancelled'
  subscription_plan?: string
  subscription_expires_at?: string
  daily_code_analysis_count: number
  daily_problem_solving_count: number
  daily_video_generation_count: number
  total_analyses: number
  total_problems_solved: number
  total_videos_generated: number
  theme: 'light' | 'dark' | 'system'
  preferred_language: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  onboarding_completed: boolean
  last_active_at: string
  created_at: string
  updated_at: string
}

export interface CodeSubmission {
  id: string
  user_id: string
  title?: string
  description?: string
  code_content: string
  language: string
  submission_type: 'analysis' | 'problem_solving' | 'challenge' | 'review'
  problem_statement?: string
  file_name?: string
  file_size?: number
  line_count?: number
  character_count?: number
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
  analysis_started_at?: string
  analysis_completed_at?: string
  tags: string[]
  category?: string
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  is_public: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface CodeAnalysis {
  id: string
  submission_id: string
  user_id: string
  summary?: string
  explanation?: string
  score?: number
  time_complexity?: string
  space_complexity?: string
  bugs: any[]
  optimizations: any[]
  best_practices: any[]
  security_issues: any[]
  maintainability_score?: number
  readability_score?: number
  performance_score?: number
  ai_model: string
  ai_model_version?: string
  processing_time_ms?: number
  analysis_metadata: any
  created_at: string
}

export interface ProblemSolution {
  id: string
  user_id: string
  submission_id?: string
  problem_title: string
  problem_statement: string
  problem_category?: string
  difficulty_level?: 'easy' | 'medium' | 'hard'
  language: string
  solution_code: string
  explanation?: string
  approach_description?: string
  time_complexity?: string
  space_complexity?: string
  test_cases: any[]
  optimizations: any[]
  alternative_solutions: any[]
  related_concepts: string[]
  learning_resources: any[]
  video_script?: string
  video_id?: string
  video_url?: string
  video_status: 'not_generated' | 'generating' | 'completed' | 'failed'
  ai_model: string
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      code_submissions: {
        Row: CodeSubmission
        Insert: Omit<CodeSubmission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CodeSubmission, 'id' | 'created_at' | 'updated_at'>>
      }
      code_analyses: {
        Row: CodeAnalysis
        Insert: Omit<CodeAnalysis, 'id' | 'created_at'>
        Update: Partial<Omit<CodeAnalysis, 'id' | 'created_at'>>
      }
      problem_solutions: {
        Row: ProblemSolution
        Insert: Omit<ProblemSolution, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProblemSolution, 'id' | 'created_at' | 'updated_at'>>
      }
      chat_history: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
      }
    }
  }
}