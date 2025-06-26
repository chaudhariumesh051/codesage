import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Trophy, Calendar, Code, Clock, Award, Star, Zap, Users } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Analyses', value: '47', icon: Code, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    { label: 'Challenges Completed', value: '8', icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
    { label: 'Current Streak', value: '3 days', icon: Target, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    { label: 'Time Saved', value: '12h', icon: Clock, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  ];

  const recentActivity = [
    { action: 'Analyzed Binary Search algorithm', time: '2 hours ago', type: 'analysis', icon: Code },
    { action: 'Completed "Two Sum" challenge', time: '1 day ago', type: 'challenge', icon: Trophy },
    { action: 'Generated flowchart for Merge Sort', time: '2 days ago', type: 'flowchart', icon: TrendingUp },
    { action: 'Earned "Algorithm Master" badge', time: '3 days ago', type: 'achievement', icon: Award },
  ];

  const achievements = [
    { name: 'First Analysis', description: 'Completed your first code analysis', earned: true, icon: Code },
    { name: 'Problem Solver', description: 'Solved 5 coding challenges', earned: true, icon: Trophy },
    { name: 'Speed Demon', description: 'Optimized code performance by 50%', earned: false, icon: Zap },
    { name: 'Debugging Master', description: 'Found and fixed 10 bugs', earned: false, icon: Target },
  ];

  const weeklyData = [40, 65, 35, 80, 55, 90, 70];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress, achievements, and coding journey
        </p>
      </motion.div>

      {/* Level & XP */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Star className="w-6 h-6" />
              <span className="text-2xl font-bold">Level 7</span>
            </div>
            <p className="text-blue-100 mb-4">125 XP • 75 XP to next level</p>
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '62.5%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">125</div>
            <div className="text-blue-100">Total XP</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-white dark:bg-dark-800 rounded-2xl border ${stat.border} p-6 shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center border ${stat.border}`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Progress Chart */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly Progress</h2>
            <p className="text-gray-600 dark:text-gray-400">Your coding activity this week</p>
          </div>
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-semibold">+23% this week</span>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {weeklyData.map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 cursor-pointer"
                whileHover={{ scale: 1.05 }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium">
                {days[index]}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === 'analysis' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    activity.type === 'challenge' ? 'bg-green-100 dark:bg-green-900/20' :
                    activity.type === 'flowchart' ? 'bg-purple-100 dark:bg-purple-900/20' :
                    'bg-yellow-100 dark:bg-yellow-900/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      activity.type === 'analysis' ? 'text-blue-600 dark:text-blue-400' :
                      activity.type === 'challenge' ? 'text-green-600 dark:text-green-400' :
                      activity.type === 'flowchart' ? 'text-purple-600 dark:text-purple-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Achievements</h2>
          </div>
          
          <div className="space-y-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all ${
                    achievement.earned 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    achievement.earned ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      achievement.earned ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      achievement.earned ? 'text-green-900 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {achievement.name}
                    </p>
                    <p className={`text-xs ${
                      achievement.earned ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};