import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { 
  Brain, 
  Code2, 
  Zap, 
  Target, 
  Play, 
  ArrowRight, 
  Star, 
  Users, 
  Trophy,
  Sparkles,
  GitBranch,
  MessageSquare,
  BarChart3,
  Crown,
  Video,
  Shield,
  CheckCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  const handleGetStarted = () => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI understands your code and provides intelligent insights with detailed explanations",
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: Video,
      title: "AI Video Explanations",
      description: "Get personalized video explanations with AI avatars that break down complex concepts",
      color: "from-purple-500 to-pink-500",
      delay: 0.2
    },
    {
      icon: GitBranch,
      title: "Visual Flowcharts",
      description: "Auto-generated interactive flowcharts that visualize your code logic and algorithm flow",
      color: "from-green-500 to-emerald-500",
      delay: 0.3
    },
    {
      icon: Target,
      title: "Smart Challenges",
      description: "Personalized coding challenges based on your weak areas with real-time feedback",
      color: "from-orange-500 to-red-500",
      delay: 0.4
    },
    {
      icon: MessageSquare,
      title: "AI Code Assistant",
      description: "24/7 AI assistant powered by Gemini 2.0 Flash for instant coding help and guidance",
      color: "from-indigo-500 to-purple-500",
      delay: 0.5
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Comprehensive analytics dashboard to track your coding journey and skill development",
      color: "from-teal-500 to-cyan-500",
      delay: 0.6
    }
  ];

  const stats = [
    { number: "50K+", label: "Developers", icon: Users },
    { number: "1M+", label: "Code Analyses", icon: Code2 },
    { number: "95%", label: "Accuracy Rate", icon: Target },
    { number: "24/7", label: "AI Support", icon: Sparkles }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "CodeSage transformed how I understand complex algorithms. The AI video explanations are incredibly helpful!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Marcus Rodriguez",
      role: "CS Student at MIT",
      content: "The personalized challenges helped me ace my coding interviews. Best investment I've made for my career!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Emily Johnson",
      role: "Full Stack Developer",
      content: "The AI assistant is like having a senior developer mentor available 24/7. Absolutely game-changing!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
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

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 flex items-center justify-between p-6"
      >
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CodeSage
          </span>
        </motion.div>
        
        <div className="flex items-center space-x-6">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
          <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => isAuthenticated ? navigate('/dashboard') : openAuthModal('signin')}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : isAuthenticated ? 'Dashboard' : 'Sign In'}
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div 
          style={{ y: y1, opacity }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-blue-300">Powered by Gemini 2.0 Flash & Tavus AI</span>
              </div>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Master Code
              </span>
              <br />
              <span className="text-white">Like Never Before</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              AI-powered code analysis with personalized video explanations, interactive flowcharts, 
              and intelligent challenges. Transform how you learn, debug, and master programming.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              <span>{isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Start Learning Free'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-gray-600 rounded-xl font-semibold text-lg flex items-center space-x-2 hover:border-gray-500 hover:bg-gray-800/50 transition-all backdrop-blur-sm"
            >
              <Video className="w-5 h-5" />
              <span>Watch Demo</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-gradient-to-b from-transparent to-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to master code understanding, debugging, and skill development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Loved by Developers
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of developers who've transformed their coding journey with CodeSage
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Coding Journey?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of developers who are already using CodeSage to understand, 
              debug, and master their code with AI-powered insights.
            </p>
            
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)" 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold text-xl flex items-center space-x-3 mx-auto hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl disabled:opacity-50"
            >
              <Sparkles className="w-6 h-6" />
              <span>{isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Start Your Free Journey'}</span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            <p className="text-sm text-gray-400 mt-6">
              No credit card required • Start coding smarter today
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CodeSage
              </span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 CodeSage. All rights reserved. Powered by AI innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};