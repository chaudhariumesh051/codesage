import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthService } from '../services/auth';
import { showToast } from './Toast';
import { AuthModal } from './AuthModal';

interface AuthContextType {
  user: any;
  profile: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot-password') => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Session error:', sessionError);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          setUser(session.user);
          
          // Load user profile
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setProfile(profile);
              // Check if user is admin
              setIsAdmin(profile?.is_admin === true || session.user.email === 'admin@gmail.com');
            }
          } catch (profileError) {
            console.warn('Error loading profile:', profileError);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;
      
      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            const profile = await fetchUserProfile(session.user.id);
            setProfile(profile);
            // Check if user is admin
            setIsAdmin(profile?.is_admin === true || session.user.email === 'admin@gmail.com');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user);
            const profile = await fetchUserProfile(session.user.id);
            setProfile(profile);
            // Check if user is admin
            setIsAdmin(profile?.is_admin === true || session.user.email === 'admin@gmail.com');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
      
      // Always ensure loading is false after auth state changes
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.warn('Error fetching user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  id: userId,
                  full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'User',
                  total_analyses: 0,
                  total_problems_solved: 0
                })
                .select('*')
                .single();
                
              if (insertError) {
                console.error('Error creating user profile:', insertError);
                return null;
              }
              
              return newProfile;
            }
          } catch (createError) {
            console.error('Error creating profile:', createError);
          }
        }
        
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const profile = await fetchUserProfile(user.id);
      setProfile(profile);
      // Check if user is admin
      setIsAdmin(profile?.is_admin === true || user.email === 'admin@gmail.com');
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup' | 'forgot-password' = 'signin') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      showToast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear local state even if signout fails
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      showToast.error('Signed out (with errors)');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Don't manually refresh here - let the auth state listener handle it
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        isAdmin,
        openAuthModal,
        signOut,
        refreshUser
      }}
    >
      {children}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={initialAuthMode}
      />
    </AuthContext.Provider>
  );
};