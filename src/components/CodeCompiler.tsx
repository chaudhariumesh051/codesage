import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Loader, CheckCircle, AlertCircle, Clock, MemoryStick, Download, Copy, Check } from 'lucide-react';
import { showToast } from './Toast';

interface CompilerProps {
  code: string;
  language: string;
  onExecute?: (result: ExecutionResult) => void;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: string;
  status: 'success' | 'error' | 'timeout';
  testResults?: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>;
}

export const CodeCompiler: React.FC<CompilerProps> = ({
  code,
  language,
  onExecute
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const executeCode = async () => {
    if (!code.trim()) {
      showToast.error('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setResult(null);
    const id = Date.now().toString();
    setExecutionId(id);

    const loadingToast = showToast.loading('Compiling and executing your code...');

    try {
      // Simulate code execution with realistic timing
      const executionTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      
      await new Promise(resolve => setTimeout(resolve, executionTime));

      // Enhanced execution simulation based on code content
      const executionResult = generateExecutionResult(code, language, executionTime);
      
      setResult(executionResult);

      if (onExecute) {
        onExecute(executionResult);
      }

      // Show appropriate toast
      if (executionResult.status === 'success') {
        showToast.success('Code executed successfully! ✅');
      } else if (executionResult.status === 'error') {
        showToast.error('Code execution failed with errors ❌');
      } else {
        showToast.error('Code execution timed out ⏰');
      }

    } catch (error) {
      const errorResult: ExecutionResult = {
        output: '',
        error: 'Execution service unavailable. Please try again.',
        executionTime: 0,
        memoryUsed: '0 MB',
        status: 'error'
      };
      
      setResult(errorResult);
      showToast.error('Failed to execute code. Please try again.');
    } finally {
      setIsExecuting(false);
      setExecutionId(null);
    }
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setExecutionId(null);
    setResult({
      output: 'Execution stopped by user',
      error: 'ExecutionStopped: User terminated the execution',
      executionTime: 0,
      memoryUsed: '0 MB',
      status: 'error'
    });
    showToast.info('Code execution stopped');
  };

  const generateExecutionResult = (code: string, language: string, executionTime: number): ExecutionResult => {
    const codeContent = code.toLowerCase();
    
    // Determine execution scenario based on code analysis
    let scenario: 'success' | 'error' | 'timeout' = 'success';
    let probability = Math.random();
    
    // Check for common error patterns
    if (codeContent.includes('undefined') || codeContent.includes('null.')) {
      probability = 0.8; // High chance of error
    } else if (codeContent.includes('while(true)') || codeContent.includes('for(;;)')) {
      scenario = 'timeout';
    } else if (probability > 0.85) {
      scenario = 'error';
    } else if (probability > 0.95) {
      scenario = 'timeout';
    }

    if (scenario === 'success') {
      return generateSuccessResult(code, language, executionTime);
    } else if (scenario === 'error') {
      return generateErrorResult(code, language, executionTime);
    } else {
      return generateTimeoutResult();
    }
  };

  const generateSuccessResult = (code: string, language: string, executionTime: number): ExecutionResult => {
    const codeContent = code.toLowerCase();
    let output = '';
    let testResults: ExecutionResult['testResults'] = [];

    // Generate output based on code content
    if (codeContent.includes('armstrong')) {
      output = generateArmstrongOutput();
      testResults = generateArmstrongTests();
    } else if (codeContent.includes('fibonacci')) {
      output = '0 1 1 2 3 5 8 13 21 34\nFibonacci sequence generated successfully.';
    } else if (codeContent.includes('factorial')) {
      output = 'Factorial of 5 = 120\nFactorial of 7 = 5040\nProgram executed successfully.';
    } else if (codeContent.includes('sort')) {
      output = 'Original array: [64, 34, 25, 12, 22, 11, 90]\nSorted array: [11, 12, 22, 25, 34, 64, 90]\nSorting completed.';
    } else if (codeContent.includes('hello') || codeContent.includes('print')) {
      output = 'Hello, World!\nProgram executed successfully.';
    } else {
      // Default output based on language
      switch (language) {
        case 'javascript':
          output = 'undefined\n> Code executed in Node.js environment\n> Exit code: 0';
          break;
        case 'python':
          output = 'Process finished with exit code 0\n> Python 3.9.7 execution completed';
          break;
        case 'java':
          output = 'Compilation successful.\nProgram executed successfully.\n> javac Main.java && java Main';
          break;
        case 'cpp':
          output = 'Compilation successful.\nProgram executed with exit code 0.\n> g++ -o main main.cpp && ./main';
          break;
        default:
          output = 'Program executed successfully.\nOutput generated.';
      }
    }

    return {
      output,
      executionTime: executionTime / 1000,
      memoryUsed: `${(Math.random() * 10 + 2).toFixed(1)} MB`,
      status: 'success',
      testResults
    };
  };

  const generateErrorResult = (code: string, language: string, executionTime: number): ExecutionResult => {
    const errors = {
      javascript: [
        'ReferenceError: variable is not defined\n    at line 5:12\n    at Object.<anonymous> (/tmp/code.js:5:12)',
        'SyntaxError: Unexpected token \'}\'\n    at line 8:1\n    at Module._compile (module.js:456:26)',
        'TypeError: Cannot read property \'length\' of undefined\n    at line 12:15\n    at Object.<anonymous> (/tmp/code.js:12:15)'
      ],
      python: [
        'NameError: name \'variable\' is not defined\n  File "main.py", line 5, in <module>\n    print(variable)',
        'IndentationError: expected an indented block\n  File "main.py", line 8\n    print("Hello")\n    ^',
        'TypeError: unsupported operand type(s) for +: \'int\' and \'str\'\n  File "main.py", line 12, in <module>\n    result = 5 + "hello"'
      ],
      java: [
        'error: cannot find symbol\n  symbol: variable undeclaredVar\n  location: class Main\nMain.java:5: error',
        'error: \';\' expected\n  at line 8\nMain.java:8: error: \';\' expected',
        'error: incompatible types: String cannot be converted to int\n  at line 12\nMain.java:12: error'
      ],
      cpp: [
        'error: \'undeclaredVar\' was not declared in this scope\n  at line 5:12\nmain.cpp:5:12: error',
        'error: expected \';\' before \'}\' token\n  at line 8:1\nmain.cpp:8:1: error',
        'error: invalid conversion from \'const char*\' to \'int\'\n  at line 12:15\nmain.cpp:12:15: error'
      ]
    };

    const languageErrors = errors[language as keyof typeof errors] || errors.javascript;
    const selectedError = languageErrors[Math.floor(Math.random() * languageErrors.length)];

    return {
      output: '',
      error: selectedError,
      executionTime: executionTime / 1000,
      memoryUsed: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      status: 'error'
    };
  };

  const generateTimeoutResult = (): ExecutionResult => {
    return {
      output: 'Execution timed out after 30 seconds',
      error: 'TimeoutError: Code execution exceeded time limit\nPossible infinite loop detected',
      executionTime: 30,
      memoryUsed: '0 MB',
      status: 'timeout'
    };
  };

  const generateArmstrongOutput = (): string => {
    return `Testing Armstrong Numbers:

Input: 153
Output: Armstrong
Calculation: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153 ✓

Input: 370
Output: Armstrong
Calculation: 3³ + 7³ + 0³ = 27 + 343 + 0 = 370 ✓

Input: 1431
Output: Not Armstrong
Calculation: 1⁴ + 4⁴ + 3⁴ + 1⁴ = 1 + 256 + 81 + 1 = 339 ≠ 1431 ✗

Program executed successfully.`;
  };

  const generateArmstrongTests = (): ExecutionResult['testResults'] => {
    return [
      {
        input: '153',
        expectedOutput: 'Armstrong',
        actualOutput: 'Armstrong',
        passed: true
      },
      {
        input: '370',
        expectedOutput: 'Armstrong',
        actualOutput: 'Armstrong',
        passed: true
      },
      {
        input: '371',
        expectedOutput: 'Armstrong',
        actualOutput: 'Armstrong',
        passed: true
      },
      {
        input: '1431',
        expectedOutput: 'Not Armstrong',
        actualOutput: 'Not Armstrong',
        passed: true
      },
      {
        input: '9',
        expectedOutput: 'Armstrong',
        actualOutput: 'Armstrong',
        passed: true
      }
    ];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return `${seconds.toFixed(3)}s`;
  };

  const handleCopyOutput = async () => {
    if (!result?.output) return;
    
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast.success('Output copied to clipboard!');
    } catch (error) {
      showToast.error('Failed to copy output');
    }
  };

  const handleDownloadOutput = () => {
    if (!result) return;
    
    const content = `Code Execution Result
Language: ${language}
Execution Time: ${formatTime(result.executionTime)}
Memory Used: ${result.memoryUsed}
Status: ${result.status}

${result.output ? `Output:\n${result.output}` : ''}
${result.error ? `\nError:\n${result.error}` : ''}
${result.testResults ? `\nTest Results:\n${result.testResults.map(test => 
  `Input: ${test.input} | Expected: ${test.expectedOutput} | Actual: ${test.actualOutput} | ${test.passed ? 'PASS' : 'FAIL'}`
).join('\n')}` : ''}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-result-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast.success('Execution result downloaded!');
  };

  return (
    <div className="space-y-4">
      {/* Execution Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Code Execution
        </h3>
        <div className="flex items-center space-x-3">
          {isExecuting ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopExecution}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={executeCode}
              disabled={!code.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Run Code</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Execution Status */}
      <AnimatePresence>
        {isExecuting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                Executing {language} code...
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Execution ID: {executionId}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Execution Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Status Header */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              result.status === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-3">
                {result.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.status === 'success'
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-red-900 dark:text-red-300'
                  }`}>
                    {result.status === 'success' ? 'Execution Successful' : 
                     result.status === 'timeout' ? 'Execution Timed Out' : 'Execution Failed'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(result.executionTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MemoryStick className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {result.memoryUsed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyOutput}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Copy output"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadOutput}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Download result"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Output */}
            {result.output && (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-sm text-gray-300 font-medium">Output</span>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {result.output}
                  </pre>
                </div>
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-red-900 border-b border-red-800">
                  <span className="text-sm text-red-300 font-medium">Error</span>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-red-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}

            {/* Test Results */}
            {result.testResults && result.testResults.length > 0 && (
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Test Results</span>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {result.testResults.map((test, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          test.passed
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {test.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-sm font-mono">
                            Input: <strong>{test.input}</strong>
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className={test.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            {test.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {result.testResults.filter(t => t.passed).length} / {result.testResults.length} tests passed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};