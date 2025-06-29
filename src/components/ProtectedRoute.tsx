import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout - redirecting to auth page');
        navigate('/auth', { replace: true });
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, navigate]);

  // Check if user is admin and redirect to admin panel
  useEffect(() => {
    if (isAuthenticated && isAdmin && user?.email === 'admin@gmail.com') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, user, navigate]);

  // Show loading only for a reasonable amount of time
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            If this takes too long, please refresh the page
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};