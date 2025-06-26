import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Video, 
  Download, 
  Users, 
  Shield,
  Sparkles,
  CreditCard,
  Gift
} from 'lucide-react';
import { useSubscriptionStore, SubscriptionPlan } from '../stores/subscriptionStore';
import { showToast } from './Toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightFeature?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  highlightFeature
}) => {
  const { plans, subscribeToPlan, subscription } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    setSelectedPlan(plan);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      subscribeToPlan(plan);
      showToast.success(`Successfully subscribed to ${plan.name}! Welcome to CodeSage Pro! 🎉`);
      onClose();
    } catch (error) {
      showToast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro-monthly':
        return <Zap className="w-6 h-6" />;
      case 'pro-yearly':
        return <Crown className="w-6 h-6" />;
      case 'student':
        return <Gift className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'pro-monthly':
        return 'from-blue-500 to-cyan-500';
      case 'pro-yearly':
        return 'from-purple-500 to-pink-500';
      case 'student':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.billingCycle === 'yearly') {
      return `$${plan.price}/year`;
    } else if (plan.billingCycle === 'semester') {
      return `$${plan.price}/6 months`;
    }
    return `$${plan.price}/month`;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (plan.billingCycle === 'yearly') {
      return `$${(plan.price / 12).toFixed(2)}/month`;
    } else if (plan.billingCycle === 'semester') {
      return `$${(plan.price / 6).toFixed(2)}/month`;
    }
    return null;
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
          className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Upgrade to CodeSage Pro
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Unlock the full power of AI-driven code learning
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* Current Plan Status */}
          {subscription.isActive && subscription.plan && (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-300">
                    You're currently subscribed to {subscription.plan.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Expires on {subscription.expiresAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature Highlight */}
          {highlightFeature && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    Premium Feature Required
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {highlightFeature} is available with CodeSage Pro
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl border-2 transition-all duration-300 ${
                    plan.popular
                      ? 'border-purple-500 shadow-lg shadow-purple-500/25 scale-105'
                      : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                  } ${
                    selectedPlan?.id === plan.id && isProcessing
                      ? 'opacity-75 pointer-events-none'
                      : ''
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {plan.savings && (
                    <div className="absolute -top-3 right-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {plan.savings}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(plan.id)} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <div className="text-white">
                          {getPlanIcon(plan.id)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(plan)}
                      </div>
                      {getMonthlyEquivalent(plan) && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getMonthlyEquivalent(plan)}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-6">
                      {plan.features.slice(0, 8).map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {plan.features.length > 8 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          +{plan.features.length - 8} more features...
                        </div>
                      )}
                    </div>

                    {/* Subscribe Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubscribe(plan)}
                      disabled={isProcessing || (subscription.isActive && subscription.plan?.id === plan.id)}
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                        subscription.isActive && subscription.plan?.id === plan.id
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                      }`}
                    >
                      {isProcessing && selectedPlan?.id === plan.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <CreditCard className="w-5 h-5" />
                          </motion.div>
                          <span>Processing...</span>
                        </div>
                      ) : subscription.isActive && subscription.plan?.id === plan.id ? (
                        'Current Plan'
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Comparison */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                What You Get with Pro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Video,
                    title: 'AI Video Explanations',
                    description: 'Get personalized video explanations with AI avatars',
                    color: 'from-blue-500 to-cyan-500'
                  },
                  {
                    icon: Download,
                    title: 'Export Everything',
                    description: 'Download videos, flowcharts, and analysis reports',
                    color: 'from-green-500 to-emerald-500'
                  },
                  {
                    icon: Zap,
                    title: '10x Faster Processing',
                    description: 'Priority queue for lightning-fast AI responses',
                    color: 'from-yellow-500 to-orange-500'
                  },
                  {
                    icon: Users,
                    title: 'Multiple AI Presenters',
                    description: 'Choose from various AI avatars for your videos',
                    color: 'from-purple-500 to-pink-500'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  30-day money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};