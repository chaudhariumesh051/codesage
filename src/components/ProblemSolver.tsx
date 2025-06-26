import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Play, 
  Code, 
  Zap, 
  Video, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  FileText,
  Settings,
  Crown
} from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { VideoGenerator } from './VideoGenerator';
import { CodeCompiler } from './CodeCompiler';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { showToast } from './Toast';

interface ProblemSolution {
  problem: string;
  language: string;
  solution: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  optimizations: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed?: boolean;
  }>;
  videoScript: string;
  flowchart: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: string;
  status: 'success' | 'error' | 'timeout';
}

export const ProblemSolver: React.FC = () => {
  const { subscription, canUseFeature, updateUsage } = useSubscriptionStore();
  const [problemStatement, setProblemStatement] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'solution' | 'execution' | 'optimization' | 'video'>('solution');
  const [copied, setCopied] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript', color: 'bg-yellow-500' },
    { value: 'python', label: 'Python', color: 'bg-blue-500' },
    { value: 'java', label: 'Java', color: 'bg-red-500' },
    { value: 'cpp', label: 'C++', color: 'bg-purple-500' },
    { value: 'typescript', label: 'TypeScript', color: 'bg-blue-600' },
    { value: 'go', label: 'Go', color: 'bg-cyan-500' },
    { value: 'rust', label: 'Rust', color: 'bg-orange-500' },
    { value: 'csharp', label: 'C#', color: 'bg-green-500' },
  ];

  const exampleProblems = [
    "Write a program to read the input and check if given number is Armstrong. If the number is Armstrong Print \"Armstrong\" Else, print \"Not Armstrong\".",
    "Find the two numbers in an array that add up to a target sum",
    "Reverse a linked list iteratively and recursively",
    "Find the longest palindromic substring in a string",
    "Implement a binary search algorithm",
    "Sort an array using merge sort algorithm",
    "Find the maximum depth of a binary tree",
    "Check if a string has balanced parentheses",
    "Implement a LRU cache with O(1) operations"
  ];

  const handleGenerateSolution = async () => {
    if (!problemStatement.trim()) {
      showToast.error('Please enter a problem statement');
      return;
    }

    // Check if user can use problem solving feature
    if (!canUseFeature('problemSolving')) {
      showToast.upgrade('You\'ve reached your daily problem solving limit. Upgrade to Pro for unlimited access!');
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await GeminiService.solveProblem(problemStatement, selectedLanguage);
      setSolution(result);
      setActiveTab('solution');
      
      // Update usage for free users
      if (!subscription.isActive) {
        updateUsage('problemSolving');
      }
      
      showToast.success('Solution generated successfully! 🎉');
    } catch (error) {
      console.error('Error generating solution:', error);
      showToast.error('Failed to generate solution. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeCode = async () => {
    if (!solution) return;
    
    setIsGenerating(true);
    try {
      const optimizedSolution = await GeminiService.optimizeCode(solution.solution, selectedLanguage);
      setSolution({
        ...solution,
        solution: optimizedSolution.code,
        optimizations: optimizedSolution.improvements,
        timeComplexity: optimizedSolution.timeComplexity,
        spaceComplexity: optimizedSolution.spaceComplexity
      });
      setActiveTab('optimization');
      showToast.success('Code optimized successfully! ⚡');
    } catch (error) {
      console.error('Error optimizing code:', error);
      showToast.error('Failed to optimize code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!solution?.solution) return;
    
    try {
      await navigator.clipboard.writeText(solution.solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast.success('Code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy code:', error);
      showToast.error('Failed to copy code');
    }
  };

  const handleDownloadSolution = () => {
    if (!solution) return;
    
    const content = `Problem: ${solution.problem}
Language: ${solution.language}
Time Complexity: ${solution.timeComplexity}
Space Complexity: ${solution.spaceComplexity}

Solution:
${solution.solution}

Explanation:
${solution.explanation}

Optimizations:
${solution.optimizations.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Test Cases:
${solution.testCases.map(test => `Input: ${test.input} | Expected: ${test.expectedOutput}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast.success('Solution downloaded!');
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          AI Problem Solver
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Describe any programming problem and get complete solutions with code generation, execution, and AI video explanations
        </p>
      </motion.div>

      {/* Usage Indicator for Free Users */}
      {!subscription.isActive && (
        <motion.div variants={itemVariants} className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-orange-800 dark:text-orange-300 font-medium">
                Free Plan: {subscription.dailyUsage.problemSolving}/3 problems solved today
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showToast.upgrade('Upgrade to Pro for unlimited problem solving!')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Problem Input Section */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Problem Statement</h2>
        </div>

        <div className="space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programming Language
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <motion.button
                  key={lang.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLanguage(lang.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                    selectedLanguage === lang.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-50 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${lang.color}`} />
                  <span className="text-sm font-medium">{lang.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Problem Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe Your Problem
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Describe the programming problem you want to solve. Be as detailed as possible about the requirements, constraints, and expected behavior..."
              className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Example Problems */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or try these examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleProblems.slice(0, 4).map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProblemStatement(example)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {example.length > 50 ? `${example.substring(0, 50)}...` : example}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateSolution}
            disabled={isGenerating || !problemStatement.trim() || (!subscription.isActive && !canUseFeature('problemSolving'))}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-5 h-5" />
                </motion.div>
                <span>Generating Solution...</span>
              </>
            ) : !subscription.isActive && !canUseFeature('problemSolving') ? (
              <>
                <Crown className="w-5 h-5" />
                <span>Daily Limit Reached - Upgrade to Continue</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                <span>Generate Complete Solution</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Solution Display */}
      <AnimatePresence>
        {solution && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg"
          >
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-dark-700">
              <div className="flex overflow-x-auto">
                {[
                  { id: 'solution', label: 'Solution', icon: Code },
                  { id: 'execution', label: 'Run Code', icon: Play },
                  { id: 'optimization', label: 'Optimize', icon: Zap },
                  { id: 'video', label: 'AI Video', icon: Video }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.id === 'video' && !subscription.isActive && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'solution' && (
                  <motion.div
                    key="solution"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Solution Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Generated Solution
                      </h3>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyCode}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDownloadSolution}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Code Block */}
                    <div className="bg-gray-900 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <span className="text-sm text-gray-300 font-medium">
                          {languages.find(l => l.value === selectedLanguage)?.label}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{solution.timeComplexity}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{solution.spaceComplexity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto max-h-96">
                        <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                          <code>{solution.solution}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300">Explanation</h4>
                      </div>
                      <div className="text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-wrap">
                        {solution.explanation}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'execution' && (
                  <motion.div
                    key="execution"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <CodeCompiler
                      code={solution.solution}
                      language={selectedLanguage}
                      onExecute={setExecutionResult}
                    />
                  </motion.div>
                )}

                {activeTab === 'optimization' && (
                  <motion.div
                    key="optimization"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Code Optimization
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOptimizeCode}
                        disabled={isGenerating}
                        className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 disabled:opacity-50 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Optimize Code</span>
                      </motion.button>
                    </div>

                    {solution.optimizations.length > 0 && (
                      <div className="space-y-4">
                        {solution.optimizations.map((optimization, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                          >
                            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                              {optimization}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'video' && (
                  <motion.div
                    key="video"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <VideoGenerator
                      problemTitle={solution.problem}
                      script={solution.videoScript || solution.explanation}
                      language={selectedLanguage}
                      onVideoGenerated={(video) => {
                        console.log('Video generated:', video);
                        showToast.success('Video explanation generated! 🎬');
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};