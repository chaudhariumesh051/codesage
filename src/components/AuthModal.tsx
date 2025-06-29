import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { AuthService } from '../services/auth';
import { showToast } from './Toast';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot-password';
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset errors when mode changes
    setErrors({});
    // Set mode from props when modal opens
    if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [mode, isOpen, initialMode]);

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

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setErrors({});
    setShowPassword(false);
    setRateLimitCooldown(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' || mode === 'signin' || mode === 'forgot-password') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    if (mode === 'signup' || mode === 'signin') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'signup' && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    if (mode === 'signup') {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseRateLimitError = (errorMessage: string): number => {
    const match = errorMessage.match(/(\d+) seconds?/);
    return match ? parseInt(match[1], 10) : 60; // Default to 60 seconds if can't parse
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (rateLimitCooldown > 0) return;

    setIsLoading(true);
    setErrors({});

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
          await AuthService.signIn({
            email: formData.email,
            password: formData.password
          });
          showToast.success('Welcome back! 🎉');
          onSuccess();
          break;

        case 'signup':
          console.log('Attempting sign up...');
          const result = await AuthService.signUp({
            email: formData.email,
            password: formData.password,
            full_name: formData.fullName
          });
          
          if (result.needsVerification) {
            showToast.info('Please check your email to verify your account');
            setMode('signin'); // Switch to sign in mode
          } else {
            showToast.success('Account created successfully! 🎉');
            onSuccess();
          }
          break;

        case 'forgot-password':
          console.log('Attempting password reset...');
          await AuthService.resetPassword(formData.email);
          showToast.success('Password reset email sent! Please check your inbox.');
          setMode('signin');
          break;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle configuration errors
      if (error.message.includes('Supabase') && error.message.includes('configured')) {
        showToast.error(error.message);
        setErrors(prev => ({ ...prev, general: error.message }));
        return;
      }
      
      // Handle rate limit errors specifically
      if (error.message.includes('wait') && error.message.includes('seconds')) {
        const waitTime = parseRateLimitError(error.message);
        setRateLimitCooldown(waitTime);
        showToast.error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
      } else if (error.message === 'Failed to fetch') {
        showToast.error('Unable to connect to the server. Please check your internet connection and ensure Supabase is properly configured.');
        setErrors(prev => ({ ...prev, general: 'Connection failed. Please check your Supabase configuration.' }));
      } else {
        showToast.error(error.message || 'Authentication failed. Please try again.');
      }
      
      // Set specific error messages
      if (error.message.includes('password')) {
        setErrors(prev => ({ ...prev, password: error.message }));
      } else if (error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              {isLoading ? (
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  Sign up
                </button>
              </p>
            </div>
          </>
        );

      case 'signup':
        return (
          <>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Rate limit warning for signup */}
            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Please wait {rateLimitCooldown} seconds before trying again
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              {isLoading ? (
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  Sign in
                </button>
              </p>
            </div>
          </>
        );

      case 'forgot-password':
        return (
          <>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
              </div>
            )}
            
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">Reset your password</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Rate limit warning for password reset */}
            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Please wait {rateLimitCooldown} seconds before trying again
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || rateLimitCooldown > 0}
              className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all mt-6"
            >
              {isLoading ? (
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
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Back to sign in
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {mode === 'forgot-password' ? (
                    <Lock className="w-6 h-6 text-white" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {mode === 'signin' ? 'Welcome Back' : 
                   mode === 'signup' ? 'Create Account' :
                   'Reset Password'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {renderForm()}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};