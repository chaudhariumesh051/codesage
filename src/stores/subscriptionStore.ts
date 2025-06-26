import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'semester';
  features: string[];
  popular?: boolean;
  savings?: string;
}

export interface UserSubscription {
  plan: SubscriptionPlan | null;
  isActive: boolean;
  expiresAt: Date | null;
  dailyUsage: {
    codeAnalysis: number;
    videoGeneration: number;
    problemSolving: number;
  };
  totalUsage: {
    videosGenerated: number;
    problemsSolved: number;
    analysisCount: number;
  };
}

interface SubscriptionState {
  subscription: UserSubscription;
  plans: SubscriptionPlan[];
  updateUsage: (type: 'codeAnalysis' | 'videoGeneration' | 'problemSolving') => void;
  resetDailyUsage: () => void;
  subscribeToPlan: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
  canUseFeature: (feature: string) => boolean;
  getRemainingUsage: (type: 'codeAnalysis' | 'videoGeneration' | 'problemSolving') => number;
}

const FREE_LIMITS = {
  codeAnalysis: 3,
  videoGeneration: 0,
  problemSolving: 3,
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    price: 9.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited code analysis',
      'AI video explanations with Tavus',
      'Voice narration with ElevenLabs',
      'Mermaid/D2 flowchart generation',
      'Downloadable MP4 explanations',
      'Multiple AI presenters',
      '10x faster AI processing',
      'Premium challenges & roadmaps',
      'Export flowcharts (SVG, PNG, PDF)',
      'Multi-language narration',
      'Pro badge & leaderboard boost',
      'Priority support'
    ]
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    price: 99.00,
    billingCycle: 'yearly',
    savings: 'Save 17%',
    popular: true,
    features: [
      'Everything in Pro Monthly',
      'Custom AI avatar creation',
      'Advanced analytics dashboard',
      'Team collaboration features',
      'API access for integrations',
      'White-label solutions',
      'Dedicated account manager'
    ]
  },
  {
    id: 'student',
    name: 'Student Plan',
    price: 29.00,
    billingCycle: 'semester',
    features: [
      'All Pro features for 6 months',
      'Student verification required',
      'Educational institution discount',
      'Study group collaboration',
      'Academic project templates',
      'Career guidance resources'
    ]
  }
];

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: {
        plan: null,
        isActive: false,
        expiresAt: null,
        dailyUsage: {
          codeAnalysis: 0,
          videoGeneration: 0,
          problemSolving: 0,
        },
        totalUsage: {
          videosGenerated: 0,
          problemsSolved: 0,
          analysisCount: 0,
        },
      },
      plans: SUBSCRIPTION_PLANS,

      updateUsage: (type) => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            dailyUsage: {
              ...state.subscription.dailyUsage,
              [type]: state.subscription.dailyUsage[type] + 1,
            },
            totalUsage: {
              ...state.subscription.totalUsage,
              [type === 'codeAnalysis' ? 'analysisCount' : 
               type === 'videoGeneration' ? 'videosGenerated' : 'problemsSolved']: 
               state.subscription.totalUsage[
                 type === 'codeAnalysis' ? 'analysisCount' : 
                 type === 'videoGeneration' ? 'videosGenerated' : 'problemsSolved'
               ] + 1,
            },
          },
        }));
      },

      resetDailyUsage: () => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            dailyUsage: {
              codeAnalysis: 0,
              videoGeneration: 0,
              problemSolving: 0,
            },
          },
        }));
      },

      subscribeToPlan: (plan) => {
        const expiresAt = new Date();
        if (plan.billingCycle === 'monthly') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (plan.billingCycle === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else if (plan.billingCycle === 'semester') {
          expiresAt.setMonth(expiresAt.getMonth() + 6);
        }

        set((state) => ({
          subscription: {
            ...state.subscription,
            plan,
            isActive: true,
            expiresAt,
          },
        }));
      },

      cancelSubscription: () => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            plan: null,
            isActive: false,
            expiresAt: null,
          },
        }));
      },

      canUseFeature: (feature) => {
        const { subscription } = get();
        
        if (subscription.isActive && subscription.plan) {
          return true; // Pro users can use all features
        }

        // Free user limitations
        switch (feature) {
          case 'videoGeneration':
          case 'voiceNarration':
          case 'customAvatars':
          case 'flowchartExport':
          case 'premiumChallenges':
            return false;
          case 'codeAnalysis':
            return subscription.dailyUsage.codeAnalysis < FREE_LIMITS.codeAnalysis;
          case 'problemSolving':
            return subscription.dailyUsage.problemSolving < FREE_LIMITS.problemSolving;
          default:
            return true;
        }
      },

      getRemainingUsage: (type) => {
        const { subscription } = get();
        
        if (subscription.isActive && subscription.plan) {
          return Infinity; // Unlimited for pro users
        }

        return Math.max(0, FREE_LIMITS[type] - subscription.dailyUsage[type]);
      },
    }),
    {
      name: 'codesage-subscription',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          const parsed = JSON.parse(str);
          
          // Convert expiresAt string back to Date object
          if (parsed.state?.subscription?.expiresAt) {
            parsed.state.subscription.expiresAt = new Date(parsed.state.subscription.expiresAt);
          }
          
          return parsed;
        },
        setItem: (name, value) => {
          const parsed = JSON.parse(value);
          
          // Convert expiresAt Date object to string for storage
          if (parsed.state?.subscription?.expiresAt instanceof Date) {
            parsed.state.subscription.expiresAt = parsed.state.subscription.expiresAt.toISOString();
          }
          
          localStorage.setItem(name, JSON.stringify(parsed));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);