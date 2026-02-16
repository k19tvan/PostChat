import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { sendChatMessage } from '../services/backendService';

const STORAGE_KEY = 'chatMessages';

interface ChatInterfaceProps {
  theme?: 'dark' | 'light';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ theme }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore messages from localStorage on initial load
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to restore messages:', error);
    }
    // Default welcome message
    return [
      {
        id: 'welcome',
        role: 'model',
        text: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send message with conversation history for context
      const historyForBackend = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await sendChatMessage(inputText, historyForBackend);

      if (response.success && response.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.response,
          timestamp: new Date(),
          sources: response.sources  // Attach sources if available
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I apologize, but I encountered an error. Please ensure the backend server is running and try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Enhanced decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/40 dark:bg-purple-600/8 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/40 dark:bg-indigo-600/8 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-violet-200/30 dark:bg-violet-600/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-8 pb-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
            >
              {/* Avatar */}
              <div className={`
                flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105
                ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 shadow-indigo-500/30'
                  : 'bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 shadow-violet-500/30'
                }
              `}>
                {msg.role === 'user'
                  ? <User size={20} className="text-white" />
                  : <Bot size={20} className="text-white" />
                }
              </div>

              {/* Message bubble */}
              <div className={`
                flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]
                ${msg.role === 'user' ? 'items-end' : 'items-start'}
              `}>
                <div className={`
                  px-4 py-3 sm:px-5 sm:py-4 rounded-2xl text-[15px] sm:text-[15.5px] leading-relaxed shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white shadow-indigo-900/20 dark:shadow-indigo-900/40 rounded-tr-md'
                    : msg.isError
                      ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200 backdrop-blur-md'
                      : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-black/30 backdrop-blur-md rounded-tl-md'
                  }
                `}>
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Timestamp */}
                <div className={`
                  text-[11px] font-medium px-2
                  ${msg.role === 'user' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-600'}
                `}>
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>

                {/* Sources - only for model messages */}
                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 px-2">
                      <FileText size={12} className="text-violet-500 dark:text-violet-400" />
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Sources ({msg.sources.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {msg.sources.slice(0, 3).map((source, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] px-3 py-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 rounded-lg hover:border-violet-400/50 dark:hover:border-violet-500/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
                              {source.content}
                            </p>
                            <span className="text-[9px] text-violet-500 dark:text-violet-400 font-mono shrink-0">
                              {Math.round(source.similarity_score * 100)}%
                            </span>
                          </div>
                          {source.metadata.author && (
                            <div className="mt-1 text-[10px] text-slate-600">
                              by {source.metadata.author}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md px-5 py-4 rounded-2xl rounded-tl-md border border-slate-200 dark:border-slate-700/50 shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500 dark:text-violet-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed to bottom */}
      <div className="flex-none p-4 sm:p-6 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent relative z-20 border-t border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto relative"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-white dark:bg-slate-800/60 backdrop-blur-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-5 sm:pl-6 pr-14 sm:pr-16 py-4 sm:py-5 border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xl shadow-indigo-100/50 dark:shadow-black/30 hover:border-slate-300 dark:hover:border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-[15px] sm:text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 sm:right-2.5 p-3 sm:p-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-105 active:scale-95"
              aria-label="Send message"
            >
              <Send size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};