import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin && email === 'admin@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate, email]);

  // Countdown timer for rate limit
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rateLimitCooldown > 0) {
      interval = setInterval(() => {
        setRateLimitCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [rateLimitCooldown]);

  const parseRateLimitError = (errorMessage: string): number => {
    // Try multiple patterns to extract wait time
    const patterns = [
      /after (\d+) seconds?/,
      /(\d+) seconds?/,
      /wait (\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return 60; // Default to 60 seconds if can't parse
  };

  const validateForm = () => {
    setError('');
    
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (mode !== 'forgot-password') {
      if (!password) {
        setError('Password is required');
        return false;
      }
      
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        
        if (!fullName) {
          setError('Full name is required');
          return false;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (rateLimitCooldown > 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
        throw new Error('Supabase URL is not configured. Please check your .env file and ensure VITE_SUPABASE_URL is set to your actual Supabase project URL.');
      }
      
      if (!supabaseKey || supabaseKey === 'your-anon-key-here') {
        throw new Error('Supabase anon key is not configured. Please check your .env file and ensure VITE_SUPABASE_ANON_KEY is set to your actual Supabase anon key.');
      }

      switch (mode) {
        case 'signin':
          console.log('Attempting sign in...');
          
          // Special case for admin login
          if (email === 'admin@gmail.com' && password === 'admin@23') {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              // If admin credentials don't exist yet, create them
              if (signInError.message.includes('Invalid login credentials')) {
                // Create admin account
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: 'Admin User',
                      is_admin: true
                    }
                  }
                });
                
                if (signUpError) {
                  throw signUpError;
                }
                
                // If account was created, sign in
                const { error: secondSignInError } = await supabase.auth.signInWithPassword({
                  email,
                  password
                });
                
                if (secondSignInError) {
                  throw secondSignInError;
                }
              } else {
                throw signInError;
              }
            }
            
            showToast.success('Admin login successful!');
            navigate('/admin');
            return;
          }
          
          // Regular user login
          const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (userError) {
            if (userError.message.includes('rate limit') || 
                userError.message.includes('For security purposes')) {
              const waitTime = parseRateLimitError(userError.message);
              setRateLimitCooldown(waitTime);
              throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
            }
            throw userError;
          }
          
          if (userData.user) {
            showToast.success('Signed in successfully!');
            navigate('/dashboard');
          }
          break;
          
        case 'signup':
          console.log('Attempting sign up...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName
              }
            }
          });
          
          if (signUpError) {
            if (signUpError.message.includes('rate limit') || 
                signUpError.message.includes('For security purposes')) {
              const waitTime = parseRateLimitError(signUpError.message);
              setRateLimitCooldown(waitTime);
              throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
            }
            throw signUpError;
          }
          
          if (signUpData.user) {
            if (!signUpData.session) {
              setSuccess('Account created successfully! Please check your email to verify your account.');
              setMode('signin');
            } else {
              showToast.success('Signed up successfully!');
              navigate('/dashboard');
            }
          }
          break;
          
        case 'forgot-password':
          console.log('Attempting password reset...');
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
          });
          
          if (resetError) {
            if (resetError.message.includes('rate limit') || 
                resetError.message.includes('For security purposes')) {
              const waitTime = parseRateLimitError(resetError.message);
              setRateLimitCooldown(waitTime);
              throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
            }
            throw resetError;
          }
          
          setSuccess('Password reset email sent! Please check your inbox.');
          break;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle configuration errors
      if (err.message.includes('Supabase') && err.message.includes('configured')) {
        setError(err.message);
        return;
      }
      
      // Handle rate limit errors specifically
      if (err.message.includes('For security purposes') || 
          err.message.includes('rate limit') || 
          (err.message.includes('wait') && err.message.includes('seconds'))) {
        
        const waitTime = parseRateLimitError(err.message);
        setRateLimitCooldown(waitTime);
        setError(`Please wait ${waitTime} seconds before trying again.`);
      } else if (err.message === 'Failed to fetch') {
        setError('Connection failed. Please check your internet connection and Supabase configuration.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>

            {/* Rate limit warning for signin */}
            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm">
                  Please wait {rateLimitCooldown} seconds before trying again
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : rateLimitCooldown > 0 ? (
                <>
                  <span>Wait {rateLimitCooldown}s</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </>
        );

      case 'signup':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rate limit warning for signup */}
            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm">
                  Please wait {rateLimitCooldown} seconds before trying again
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : rateLimitCooldown > 0 ? (
                <>
                  <span>Wait {rateLimitCooldown}s</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5 mr-2" />
                  <span>Create Account</span>
                </>
              )}
            </motion.button>
          </>
        );

      case 'forgot-password':
        return (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-white">Reset your password</h3>
              <p className="mt-1 text-sm text-gray-300">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rate limit warning for password reset */}
            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm">
                  Please wait {rateLimitCooldown} seconds before trying again
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all mt-6"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : rateLimitCooldown > 0 ? (
                <>
                  <span>Wait {rateLimitCooldown}s</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  <span>Send Reset Link</span>
                </>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Back to sign in
              </button>
            </div>
          </>
        );
    }
  };

  // If still loading, show nothing to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back' : 
               mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-blue-300">
              {mode === 'signin' ? 'Sign in to your CodeOrbit account' :
               mode === 'signup' ? 'Join CodeOrbit and start learning' :
               'We\'ll send you a reset link to your email'}
            </p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderForm()}
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">Or</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};