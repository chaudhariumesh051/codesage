import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'user' | 'admin'
}

export interface SignUpData {
  email: string
  password: string
  full_name?: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  /**
   * Parse rate limit error and return wait time in seconds
   */
  private static parseRateLimitError(errorMessage: string): number | null {
    const match = errorMessage.match(/after (\d+) seconds?/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Handle rate limit errors with user-friendly messages
   */
  private static handleRateLimitError(error: any): never {
    if (error.message?.includes('over_email_send_rate_limit')) {
      const waitTime = this.parseRateLimitError(error.message);
      if (waitTime) {
        throw new Error(`Too many email requests. Please wait ${waitTime} seconds before trying again.`);
      } else {
        throw new Error('Too many email requests. Please wait a moment before trying again.');
      }
    }
    throw error;
  }

  /**
   * Sign up with email and password
   */
  static async signUp(data: SignUpData) {
    try {
      console.log('Starting sign up process...');
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name || data.email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error);
        this.handleRateLimitError(error);
      }

      console.log('Sign up response:', { user: authData.user?.id, session: !!authData.session });

      if (authData.user && !authData.session) {
        return { user: null, needsVerification: true }
      }

      return { user: authData.user, needsVerification: false }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData) {
    try {
      console.log('Starting sign in process...');
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        console.error('Sign in error:', error);
        throw error
      }

      console.log('Sign in successful:', authData.user?.id);

      // Log successful login
      await this.logSecurityEvent('login_success', 'User signed in successfully')

      return authData.user
    } catch (error) {
      console.error('Sign in error:', error)
      
      // Log failed login attempt
      await this.logSecurityEvent('login_failed', `Failed login attempt: ${error.message}`)
      
      throw error
    }
  }

  /**
   * Sign out
   */
  static async signOut() {
    try {
      console.log('Starting sign out process...');
      
      // Log logout event
      await this.logSecurityEvent('logout', 'User signed out')

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error);
        throw error
      }

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      console.log('Starting password reset...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error);
        this.handleRateLimitError(error);
      }

      // Log password reset request
      await this.logSecurityEvent('password_reset_requested', 'Password reset requested')

      console.log('Password reset email sent');
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      // Log password reset completion
      await this.logSecurityEvent('password_reset_completed', 'Password successfully updated')

      showToast.success('Password updated successfully!')
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        id: user.id,
        email: user.email!,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: profile.is_admin ? 'admin' : 'user'
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: Partial<AuthUser>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      showToast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  /**
   * Get user sessions
   */
  static async getUserSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_accessed_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }
  }

  /**
   * Revoke a session
   */
  static async revokeSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      showToast.success('Session revoked successfully!')
    } catch (error) {
      console.error('Error revoking session:', error)
      throw error
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(eventType: string, description: string) {
    try {
      const { error } = await supabase
        .from('user_security_logs')
        .insert({
          event_type: eventType,
          event_description: description,
          ip_address: '0.0.0.0', // Would get real IP in production
          user_agent: navigator.userAgent
        })

      if (error) {
        console.error('Error logging security event:', error)
      }
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Get security logs for current user
   */
  static async getSecurityLogs() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('user_security_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching security logs:', error)
      return []
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile.is_admin) {
        throw new Error('Unauthorized: Admin access required')
      }

      // Get all users
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile.is_admin) {
        throw new Error('Unauthorized: Admin access required')
      }

      // Delete user using admin API
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}