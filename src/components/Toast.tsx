import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, X, Zap, Crown, Star } from 'lucide-react';

// Custom toast types
export const showToast = {
  success: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-dark-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-green-200 dark:border-green-800`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Success!
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  },

  error: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-dark-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-red-200 dark:border-red-800`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Error
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  },

  info: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-dark-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-blue-200 dark:border-blue-800`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Info
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  },

  upgrade: (message: string, onUpgrade?: () => void) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                Upgrade to Pro
              </p>
              <p className="mt-1 text-sm text-purple-100">
                {message}
              </p>
            </div>
          </div>
          {onUpgrade && (
            <div className="mt-3">
              <button
                onClick={() => {
                  onUpgrade();
                  toast.dismiss(t.id);
                }}
                className="bg-white text-purple-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
        <div className="flex border-l border-purple-400">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white hover:text-purple-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  },

  premium: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                Premium Feature
              </p>
              <p className="mt-1 text-sm text-yellow-100">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-yellow-300">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white hover:text-yellow-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  },

  loading: (message: string) => {
    return toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-dark-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-blue-200 dark:border-blue-800`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-blue-500 animate-pulse" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Processing...
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  }
};

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '',
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    />
  );
};