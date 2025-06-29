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

  useEffect(() => {
    // Check for active session on mount
    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' && !session) {
        // Handle failed token refresh
        console.warn('Token refresh failed, signing out user');
        setUser(null);
        setProfile(null);
        // Clear any corrupted auth data
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.warn('Error during cleanup signout:', error);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      
      // First try to get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError);
        // Clear any corrupted session data
        await supabase.auth.signOut();
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        setProfile(profile);
      } else {
        // Try to get user if session is null but there might be a valid token
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.warn('User error:', userError);
          // Clear any corrupted auth data
          await supabase.auth.signOut();
          return;
        }
        
        if (user) {
          setUser(user);
          const profile = await fetchUserProfile(user.id);
          setProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // Clear any corrupted auth data on error
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('Error during cleanup signout:', signOutError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.warn('Error fetching user profile:', error);
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
      showToast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear local state even if signout fails
      setUser(null);
      setProfile(null);
      showToast.error('Signed out (with errors)');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    checkUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
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