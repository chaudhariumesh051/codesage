import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Maximize2, Copy, Share } from 'lucide-react';

interface FlowchartViewerProps {
  flowchart: string;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ flowchart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && flowchart) {
      // In a real implementation, you would use Mermaid.js to render the flowchart
      containerRef.current.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-6">
            <div class="relative">
              <!-- Simulated flowchart nodes -->
              <div class="space-y-4">
                <div class="w-32 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium mx-auto">
                  Start
                </div>
                <div class="w-1 h-8 bg-gray-300 mx-auto"></div>
                <div class="w-40 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-medium mx-auto">
                  Initialize Variables
                </div>
                <div class="w-1 h-8 bg-gray-300 mx-auto"></div>
                <div class="w-36 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-medium mx-auto">
                  Condition Check
                </div>
                <div class="w-1 h-8 bg-gray-300 mx-auto"></div>
                <div class="w-32 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-medium mx-auto">
                  End
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Interactive flowchart visualization</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">Powered by Mermaid.js</p>
          </div>
        </div>
      `;
    }
  }, [flowchart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg h-full"
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Logic Flowchart</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {[
              { icon: Copy, tooltip: 'Copy flowchart' },
              { icon: Share, tooltip: 'Share flowchart' },
              { icon: Maximize2, tooltip: 'Fullscreen' },
              { icon: Download, tooltip: 'Download' }
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
      </div>
      
      {/* Flowchart Content */}
      <div 
        ref={containerRef}
        className="p-6 h-96 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-900 dark:to-dark-800"
      />
      
      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-dark-700 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Interactive flowchart • Click nodes to explore</span>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Export PNG
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Export SVG
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};