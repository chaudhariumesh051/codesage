import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Code, Bot, Copy, Check } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parses message content to separate code blocks from regular text
 * Returns an array of content blocks with their types
 */
const parseMessageContent = (content: string) => {
  const blocks: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  
  // Split by code blocks (```language or ```)
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  parts.forEach((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // This is a code block
      const lines = part.split('\n');
      const firstLine = lines[0];
      const language = firstLine.replace('```', '').trim() || 'text';
      const codeContent = lines.slice(1, -1).join('\n');
      
      blocks.push({
        type: 'code',
        content: codeContent,
        language: language
      });
    } else if (part.trim()) {
      // This is regular text
      blocks.push({
        type: 'text',
        content: part.trim()
      });
    }
  });
  
  return blocks;
};

/**
 * Component for rendering code blocks with syntax highlighting and copy functionality
 */
const CodeBlock: React.FC<{ content: string; language: string }> = ({ content, language }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  return (
    <div className="my-4 bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-700">
      {/* Code block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
        <span className="text-sm text-gray-300 font-medium">{language}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </motion.button>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Component for rendering formatted message content
 */
const MessageContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const blocks = parseMessageContent(content);
  
  if (blocks.length === 0) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    );
  }
  
  return (
    <div className="text-sm leading-relaxed">
      {blocks.map((block, index) => (
        <div key={index}>
          {block.type === 'code' ? (
            <CodeBlock content={block.content} language={block.language || 'text'} />
          ) : (
            <div className="whitespace-pre-wrap mb-2">
              {block.content.split('\n').map((line, lineIndex) => {
                // Handle inline code (single backticks)
                const parts = line.split(/(`[^`]+`)/g);
                return (
                  <p key={lineIndex} className="mb-2 last:mb-0">
                    {parts.map((part, partIndex) => {
                      if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                          <code
                            key={partIndex}
                            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                              isUser
                                ? 'bg-blue-500/20 text-blue-100'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {part.slice(1, -1)}
                          </code>
                        );
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AIAssistant: React.FC = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm **CodeOrbit AI**, powered by Google's Gemini 2.0 Flash. I'm your intelligent coding assistant and can help you:\n\n• **Understand code** - Explain how code works\n• **Debug issues** - Find and fix bugs\n• **Optimize performance** - Suggest improvements\n• **Learn concepts** - Explain programming topics\n• **Code review** - Analyze code quality\n\nWhat would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load chat history when component mounts
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      if (!user) return;
      
      await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          created_at: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  /**
   * Handles sending a message to the AI assistant
   * Manages the conversation flow and error handling
   */
  const handleSendMessage = async () => {
    // Validation: Check if message is empty or already loading
    if (!message.trim() || isLoading) return;

    // Create user message object
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Update messages state with user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage(''); // Clear input field
    setIsLoading(true); // Show loading state

    // Save user message to database
    await saveChatMessage(userMessage);

    try {
      // Call Gemini AI service with conversation history
      const response = await GeminiService.chatWithAssistant(newMessages);
      
      // Create assistant response message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response || "I'm sorry, I couldn't process your request. Please try again.",
        timestamp: new Date()
      };

      // Add assistant response to conversation
      setMessages([...newMessages, assistantMessage]);
      
      // Save assistant message to database
      await saveChatMessage(assistantMessage);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Create error message for user
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm experiencing some technical difficulties. Please make sure your Gemini API key is configured correctly and try again.\n\n**Troubleshooting:**\n• Check your internet connection\n• Verify API key in `.env` file\n• Try refreshing the page",
        timestamp: new Date()
      };
      
      // Add error message to conversation
      setMessages([...newMessages, errorMessage]);
      
    } finally {
      setIsLoading(false); // Hide loading state
    }
  };

  /**
   * Handles keyboard events in the message input
   * Sends message on Enter key (without Shift)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-lg">
      {/* ================================================================ */}
      {/* HEADER SECTION */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center space-x-3">
          {/* AI Assistant Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          
          {/* Title and Subtitle */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              CodeOrbit AI
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Powered by Gemini 2.0 Flash • Code formatting enabled
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MESSAGES SECTION */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-md p-4'
                  : 'bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md p-4 border border-gray-200 dark:border-dark-600'
              }`}>
                <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                
                {/* Timestamp */}
                <p className={`text-xs mt-3 ${
                  msg.role === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 p-4 rounded-2xl rounded-bl-md">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                  />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Gemini 2.0 Flash is analyzing...
                    </span>
                    <div className="flex space-x-1 mt-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1 h-1 bg-blue-600 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* ================================================================ */}
      {/* INPUT SECTION */}
      {/* ================================================================ */}
      <div className="p-6 border-t border-gray-200 dark:border-dark-700">
        <div className="flex space-x-3">
          {/* Message Input Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your code... (Use ``` for code blocks)"
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            rows={3}
          />
          
          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 self-end"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        
        {/* Input Helper Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send • Shift+Enter for new line • Use ```language for code blocks
        </p>
      </div>
    </div>
  );
};