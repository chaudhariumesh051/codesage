import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash
        const hash = window.location.hash;
        const query = new URLSearchParams(window.location.search);
        
        // Check for error in query params
        if (query.get('error')) {
          setStatus('error');
          setMessage(query.get('error_description') || 'Authentication failed');
          return;
        }
        
        // Handle OAuth callback
        if (hash && hash.includes('access_token')) {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            throw new Error('No session found');
          }
        } 
        // Handle email confirmation
        else if (query.get('type') === 'recovery' || query.get('type') === 'signup') {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            setStatus('success');
            setMessage(query.get('type') === 'recovery' 
              ? 'Password reset successful! Redirecting...' 
              : 'Email confirmed! Redirecting...');
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            throw new Error('No session found');
          }
        } else {
          throw new Error('Invalid callback URL');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-8 shadow-2xl max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          )}
          
          <h2 className={`text-2xl font-bold mb-2 ${
            status === 'loading' ? 'text-gray-900 dark:text-gray-100' :
            status === 'success' ? 'text-green-600 dark:text-green-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {status === 'loading' ? 'Authenticating...' :
             status === 'success' ? 'Success!' :
             'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};