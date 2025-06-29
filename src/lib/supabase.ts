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

// Clear corrupted auth data on initialization
const clearCorruptedAuthData = () => {
  try {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
    
    supabaseKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data);
        }
      } catch (e) {
        console.warn(`Clearing corrupted auth data for key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error checking auth data:', error);
  }
};

// Clear corrupted data before creating client
clearCorruptedAuthData();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
})

// Handle auth errors globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.warn('Token refresh failed, clearing auth data');
    clearCorruptedAuthData();
  }
});

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url?: string
          username?: string
          bio?: string
          website?: string
          location?: string
          timezone: string
          role: 'user' | 'admin'
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}