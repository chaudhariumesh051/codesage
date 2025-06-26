import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Star, Clock, Target, TrendingUp, Award } from 'lucide-react';

export const LearningPath: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState('algorithms');

  const learningPaths = {
    algorithms: {
      title: "Algorithm Mastery",
      description: "Master fundamental algorithms and data structures",
      color: "from-blue-500 to-cyan-500",
      progress: 65,
      modules: [
        { id: 1, title: "Arrays & Strings", completed: true, locked: false, duration: "2 weeks" },
        { id: 2, title: "Linked Lists", completed: true, locked: false, duration: "1 week" },
        { id: 3, title: "Stacks & Queues", completed: false, locked: false, duration: "1 week" },
        { id: 4, title: "Trees & Graphs", completed: false, locked: true, duration: "3 weeks" },
        { id: 5, title: "Dynamic Programming", completed: false, locked: true, duration: "2 weeks" },
      ]
    },
    webdev: {
      title: "Web Development",
      description: "Build modern web applications with React and Node.js",
      color: "from-green-500 to-emerald-500",
      progress: 40,
      modules: [
        { id: 1, title: "HTML & CSS Fundamentals", completed: true, locked: false, duration: "1 week" },
        { id: 2, title: "JavaScript Essentials", completed: true, locked: false, duration: "2 weeks" },
        { id: 3, title: "React Basics", completed: false, locked: false, duration: "2 weeks" },
        { id: 4, title: "Node.js & APIs", completed: false, locked: true, duration: "2 weeks" },
        { id: 5, title: "Full-Stack Projects", completed: false, locked: true, duration: "3 weeks" },
      ]
    },
    python: {
      title: "Python Programming",
      description: "Learn Python from basics to advanced concepts",
      color: "from-purple-500 to-pink-500",
      progress: 80,
      modules: [
        { id: 1, title: "Python Basics", completed: true, locked: false, duration: "1 week" },
        { id: 2, title: "Object-Oriented Programming", completed: true, locked: false, duration: "1 week" },
        { id: 3, title: "Data Structures", completed: true, locked: false, duration: "2 weeks" },
        { id: 4, title: "Web Scraping", completed: true, locked: false, duration: "1 week" },
        { id: 5, title: "Machine Learning Basics", completed: false, locked: false, duration: "3 weeks" },
      ]
    }
  };

  const currentPath = learningPaths[selectedPath as keyof typeof learningPaths];

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
          Learning Paths
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Structured learning journeys tailored to your goals and skill level
        </p>
      </motion.div>

      {/* Path Selection */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Choose Your Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(learningPaths).map(([key, path]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPath(key)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedPath === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${path.color} rounded-xl flex items-center justify-center mb-4`}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{path.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{path.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-500">{path.progress}% Complete</span>
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${path.color} rounded-full transition-all duration-500`}
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Current Path Details */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg">
        {/* Path Header */}
        <div className={`bg-gradient-to-r ${currentPath.color} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{currentPath.title}</h2>
              <p className="text-white/90">{currentPath.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentPath.progress}%</div>
              <div className="text-white/90">Complete</div>
            </div>
          </div>
          <div className="mt-4 w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentPath.progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        {/* Modules */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Learning Modules</h3>
          <div className="space-y-4">
            {currentPath.modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-xl border transition-all ${
                  module.completed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : module.locked
                    ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 opacity-60'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  module.completed
                    ? 'bg-green-500'
                    : module.locked
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-blue-500'
                }`}>
                  {module.completed ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : module.locked ? (
                    <Lock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    module.completed
                      ? 'text-green-900 dark:text-green-300'
                      : module.locked
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-blue-900 dark:text-blue-300'
                  }`}>
                    {module.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>
                    </div>
                    {module.completed && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {!module.locked && !module.completed && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievements & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Stats */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Learning Stats</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Modules Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">45h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Invested</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">89%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
            </div>
          </div>
        </motion.div>

        {/* Learning Achievements */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Achievements</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { title: "Algorithm Explorer", description: "Completed 5 algorithm modules", earned: true },
              { title: "Consistent Learner", description: "7-day learning streak", earned: true },
              { title: "Problem Solver", description: "Solved 25 coding challenges", earned: false },
              { title: "Code Master", description: "Perfect score on 10 modules", earned: false },
            ].map((achievement, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  achievement.earned
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-gray-900/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  achievement.earned ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <Award className={`w-4 h-4 ${
                    achievement.earned ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    achievement.earned
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </p>
                  <p className={`text-xs ${
                    achievement.earned
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};