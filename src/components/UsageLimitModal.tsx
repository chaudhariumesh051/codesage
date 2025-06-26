import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Crown, Zap, Star } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: string;
  remainingUsage: number;
}

export const UsageLimitModal: React.FC<UsageLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  feature,
  remainingUsage
}) => {
  const { subscription } = useSubscriptionStore();

  const getFeatureInfo = (feature: string) => {
    switch (feature) {
      case 'codeAnalysis':
        return {
          title: 'Code Analysis Limit Reached',
          description: 'You\'ve used all your daily code analysis credits.',
          icon: Zap,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'videoGeneration':
        return {
          title: 'Video Generation Unavailable',
          description: 'AI video explanations are a Pro feature.',
          icon: Star,
          color: 'from-purple-500 to-pink-500'
        };
      case 'problemSolving':
        return {
          title: 'Problem Solving Limit Reached',
          description: 'You\'ve used all your daily problem solving credits.',
          icon: Crown,
          color: 'from-green-500 to-emerald-500'
        };
      default:
        return {
          title: 'Feature Unavailable',
          description: 'This feature requires a Pro subscription.',
          icon: Crown,
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);
  const FeatureIcon = featureInfo.icon;

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
                <div className={`w-10 h-10 bg-gradient-to-br ${featureInfo.color} rounded-xl flex items-center justify-center`}>
                  <FeatureIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {featureInfo.title}
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

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {featureInfo.description}
              </p>
              
              {remainingUsage > 0 ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{remainingUsage}</strong> {feature === 'codeAnalysis' ? 'analysis' : 'problem solving'} credits remaining today
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Daily limit reached. Upgrade to Pro for unlimited access!
                  </p>
                </div>
              )}
            </div>

            {/* Pro Benefits */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 mb-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
                With CodeSage Pro, you get:
              </h3>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Unlimited code analysis & problem solving</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>AI video explanations with custom avatars</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>10x faster AI processing queue</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Export videos, flowcharts & reports</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                Maybe Later
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onUpgrade();
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Upgrade to Pro
              </motion.button>
            </div>

            {/* Reset Info */}
            {remainingUsage === 0 && feature !== 'videoGeneration' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Free limits reset daily at midnight UTC
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};