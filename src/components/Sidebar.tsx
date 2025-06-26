import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Trophy, 
  BarChart3, 
  Settings, 
  Menu,
  Sparkles,
  Brain,
  Target,
  BookOpen,
  Home,
  MessageCircle,
  Lightbulb,
  Crown,
  Zap
} from 'lucide-react';
import type { ViewType } from '../App';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onUpgrade: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  collapsed,
  setCollapsed,
  onUpgrade
}) => {
  const { subscription } = useSubscriptionStore();

  const menuItems = [
    { id: 'analyzer' as ViewType, label: 'Code Analyzer', icon: Code2, color: 'text-blue-500' },
    { id: 'solver' as ViewType, label: 'Problem Solver', icon: Lightbulb, color: 'text-green-500' },
    { id: 'assistant' as ViewType, label: 'AI Assistant', icon: MessageCircle, color: 'text-purple-500' },
    { id: 'challenges' as ViewType, label: 'Challenges', icon: Target, color: 'text-orange-500' },
    { id: 'learning' as ViewType, label: 'Learning Path', icon: BookOpen, color: 'text-pink-500' },
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: BarChart3, color: 'text-indigo-500' },
    { id: 'settings' as ViewType, label: 'Settings', icon: Settings, color: 'text-gray-500' },
  ];

  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 64 }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.div 
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-r border-gray-200 dark:border-dark-700 z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      CodeSage
                    </h1>
                    {subscription.isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold"
                      >
                        <Crown className="w-3 h-3" />
                        <span>PRO</span>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Code Platform</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Menu className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Pro Status */}
      {!collapsed && subscription.isActive && subscription.plan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                {subscription.plan.name}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Active until {subscription.expiresAt?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
              }`}
            >
              <div className={`relative ${collapsed ? 'mx-auto' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : item.color} transition-colors`} />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -inset-1 bg-blue-500/20 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    variants={itemVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Pro Plan CTA */}
      <AnimatePresence>
        {!collapsed && !subscription.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4"
          >
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-2 right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-3">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Upgrade to Pro</span>
                </div>
                <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                  Unlock AI video explanations, unlimited analysis & premium features
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onUpgrade}
                  className="w-full bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Upgrade Now</span>
                </motion.button>
                <p className="text-xs text-blue-200 text-center mt-2">
                  Starting at $9.99/month
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Pro CTA */}
      <AnimatePresence>
        {collapsed && !subscription.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onUpgrade}
              className="w-full h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
              title="Upgrade to Pro"
            >
              <Crown className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};