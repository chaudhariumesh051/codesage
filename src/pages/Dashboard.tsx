import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { ProfileSettings } from '../components/ProfileSettings';

export const Dashboard: React.FC = () => {
  const { isAuthenticated, isLoading, user, profile, signOut } = useAuth();

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Account Settings</h1>
        
        <ProfileSettings onLogout={signOut} />
      </motion.div>
    </div>
  );
};