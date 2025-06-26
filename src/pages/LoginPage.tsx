import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Shield, Zap, CheckCircle, Code, Video, Github, ToggleLeft as Google } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { openAuthModal, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              animate={{
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Column - Hero Content */}
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0 lg:pr-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    CodeSage
                  </h1>
                </div>

                <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Master Code
                  </span>
                  <br />
                  <span className="text-white">Like Never Before</span>
                </h2>

                <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                  AI-powered code analysis with personalized video explanations, interactive flowcharts, 
                  and intelligent challenges. Transform how you learn, debug, and master programming.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openAuthModal('signup')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Create Free Account</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openAuthModal('signin')}
                    className="px-8 py-4 border border-gray-600 rounded-xl font-semibold text-lg flex items-center space-x-2 hover:border-gray-500 hover:bg-gray-800/50 transition-all backdrop-blur-sm"
                  >
                    <span>Sign In</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Shield, text: "Secure Authentication" },
                    { icon: Zap, text: "AI-Powered Analysis" },
                    { icon: Video, text: "Video Explanations" },
                    { icon: CheckCircle, text: "Personalized Learning" }
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-300">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to CodeSage</h2>
                  <p className="text-blue-300">Sign in or create an account to get started</p>
                </div>

                <div className="space-y-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAuthModal('signin')}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Continue with Email</span>
                  </motion.button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all"
                    >
                      <Google className="w-5 h-5 text-white" />
                      <span>Google</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all"
                    >
                      <Github className="w-5 h-5 text-white" />
                      <span>GitHub</span>
                    </motion.button>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-gray-400">
                      Don't have an account?{' '}
                      <button
                        onClick={() => openAuthModal('signup')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-4">Why Choose CodeSage?</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Code, text: "AI Code Analysis" },
                        { icon: Video, text: "Video Explanations" },
                        { icon: Zap, text: "Performance Insights" },
                        { icon: Shield, text: "Secure & Private" }
                      ].map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={index} className="flex flex-col items-center p-3 bg-white/5 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-400 mb-2" />
                            <span className="text-sm text-gray-300">{feature.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};