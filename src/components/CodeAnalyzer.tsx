import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeEditor } from './CodeEditor';
import { AnalysisPanel } from './AnalysisPanel';
import { FlowchartViewer } from './FlowchartViewer';
import { GeminiService, CodeAnalysisResult } from '../services/gemini';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const CodeAnalyzer: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [analysis, setAnalysis] = useState<CodeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'flowchart'>('analysis');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Test API connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await GeminiService.testConnection();
        setApiStatus(isConnected ? 'connected' : 'error');
      } catch (error) {
        console.error('API test failed:', error);
        setApiStatus('error');
      }
    };

    testConnection();
  }, []);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      console.log('Starting code analysis...');
      const result = await GeminiService.analyzeCode(code, language);
      console.log('Analysis result:', result);
      setAnalysis(result);
      
      // If we got a successful analysis, update API status
      if (result.score > 0) {
        setApiStatus('connected');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setApiStatus('error');
      
      // Show error analysis
      setAnalysis({
        summary: "Analysis failed due to API error",
        bugs: ["Unable to connect to AI analysis service"],
        optimizations: ["Please check your internet connection and try again"],
        complexity: { time: "Unknown", space: "Unknown" },
        score: 0,
        flowchart: "graph TD\n    A[Error] --> B[Check Connection]",
        explanation: "The AI analysis service is currently unavailable. Please try again later."
      });
    } finally {
      setIsAnalyzing(false);
    }
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
      className="h-full space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          AI Code Analyzer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste your code and get instant AI-powered insights, bug detection, and optimization suggestions
        </p>
        
        {/* API Status Indicator */}
        <div className="flex items-center justify-center mt-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            apiStatus === 'connected' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : apiStatus === 'error'
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          }`}>
            {apiStatus === 'connected' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Gemini AI Connected</span>
              </>
            ) : apiStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>AI Disconnected</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"
                />
                <span>Checking AI Connection...</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
        {/* Left Column - Code Editor */}
        <motion.div variants={itemVariants} className="space-y-6">
          <CodeEditor
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </motion.div>

        {/* Right Column - Analysis Results */}
        <motion.div variants={itemVariants} className="space-y-6">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-xl">
                  {[
                    { id: 'analysis', label: 'Analysis' },
                    { id: 'flowchart', label: 'Flowchart' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-dark-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'analysis' ? (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <AnalysisPanel analysis={analysis} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="flowchart"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <FlowchartViewer flowchart={analysis.flowchart} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-12 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: isAnalyzing ? 360 : 0 }}
                    transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
                  >
                    <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {isAnalyzing ? 'Gemini AI is Analyzing Your Code...' : 'Ready to Analyze'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isAnalyzing 
                    ? 'Our Gemini AI is examining your code for bugs, optimizations, and insights...'
                    : 'Paste your code in the editor and click "Analyze Code" to get started'
                  }
                </p>
                {isAnalyzing && (
                  <div className="mt-4 w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};