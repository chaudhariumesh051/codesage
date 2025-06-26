import React from 'react';
import { motion } from 'framer-motion';
import { Play, Upload, Download, Copy, Sparkles, Zap } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  onAnalyze,
  isAnalyzing
}) => {
  const languages = [
    { value: 'javascript', label: 'JavaScript', color: 'bg-yellow-500' },
    { value: 'python', label: 'Python', color: 'bg-blue-500' },
    { value: 'java', label: 'Java', color: 'bg-red-500' },
    { value: 'cpp', label: 'C++', color: 'bg-purple-500' },
    { value: 'typescript', label: 'TypeScript', color: 'bg-blue-600' },
    { value: 'go', label: 'Go', color: 'bg-cyan-500' },
    { value: 'rust', label: 'Rust', color: 'bg-orange-500' },
    { value: 'php', label: 'PHP', color: 'bg-indigo-500' },
  ];

  const exampleCode = `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

// Example usage
const numbers = [1, 3, 5, 7, 9, 11, 13, 15];
const result = binarySearch(numbers, 7);
console.log(result); // Output: 3`;

  const selectedLanguage = languages.find(lang => lang.value === language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Code Editor</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className={`w-2 h-2 rounded-full ${selectedLanguage?.color || 'bg-gray-400'}`} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Analyze Code</span>
              </>
            )}
          </motion.button>
          
          {[
            { icon: Upload, tooltip: 'Upload file' },
            { icon: Download, tooltip: 'Download code' },
            { icon: Copy, tooltip: 'Copy to clipboard' }
          ].map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-all"
              title={action.tooltip}
            >
              <action.icon className="w-4 h-4" />
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Editor */}
      <div className="p-6">
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste your ${language} code here...`}
            className="w-full h-80 p-4 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl font-code text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            spellCheck={false}
          />
          
          {/* Line numbers overlay */}
          <div className="absolute left-2 top-4 text-xs text-gray-400 dark:text-gray-600 font-code pointer-events-none">
            {code.split('\n').map((_, index) => (
              <div key={index} className="h-5 leading-5">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
        
        {!code && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3 font-medium">
              Try this example to get started:
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCode(exampleCode)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold flex items-center space-x-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Load Binary Search Example</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};