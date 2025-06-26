import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Zap, Clock, HardDrive, Download, Share, Star, TrendingUp, BookOpen } from 'lucide-react';
import { CodeAnalysisResult } from '../services/gemini';

interface AnalysisPanelProps {
  analysis: CodeAnalysisResult;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="border-b border-gray-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gemini AI Analysis</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {[
              { icon: Share, tooltip: 'Share analysis' },
              { icon: Download, tooltip: 'Download report' }
            ].map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-all"
                title={action.tooltip}
              >
                <action.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
      
      <div className="p-6 space-y-6">
        {/* Score */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={`bg-gradient-to-r ${getScoreColor(analysis.score)}`}
                style={{
                  strokeDasharray: `${2 * Math.PI * 50}`,
                  strokeDashoffset: `${2 * Math.PI * 50 * (1 - analysis.score / 100)}`,
                }}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                stroke="url(#scoreGradient)"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analysis.score}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(analysis.score / 20)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div variants={itemVariants}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Code Summary</span>
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            {analysis.summary}
          </p>
        </motion.div>

        {/* Detailed Explanation */}
        {analysis.explanation && (
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Detailed Explanation</span>
            </h3>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800 whitespace-pre-wrap">
              {analysis.explanation}
            </div>
          </motion.div>
        )}

        {/* Complexity */}
        <motion.div variants={itemVariants}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Complexity Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Time Complexity</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{analysis.complexity.time}</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-300">Space Complexity</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{analysis.complexity.space}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Issues */}
        {analysis.bugs.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Issues Found</h3>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded-full">
                {analysis.bugs.length}
              </span>
            </div>
            <div className="space-y-3">
              {analysis.bugs.map((bug, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{bug}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Optimizations */}
        {analysis.optimizations.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Optimization Suggestions</h3>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                {analysis.optimizations.length}
              </span>
            </div>
            <div className="space-y-3">
              {analysis.optimizations.map((optimization, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                >
                  <CheckCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">{optimization}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};