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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to restore messages:', error);
    }
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
          sources: response.sources
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
    <div className="rm-root">
      <div className="rm-ambient" />
      <div className="rm-scanlines" />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-8 pb-6 relative z-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 border border-[var(--border)]
                ${msg.role === 'user'
                  ? 'bg-[var(--surface2)]'
                  : 'bg-[var(--surface2)]'
                }
              `}>
                {msg.role === 'user'
                  ? <User size={20} className="text-[var(--accent)]" />
                  : <Bot size={20} className="text-[var(--accent2)]" />
                }
              </div>

              {/* Message bubble */}
              <div className={`
                flex flex-col gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]
                ${msg.role === 'user' ? 'items-end' : 'items-start'}
              `}>
                <div className={`
                  px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-xl backdrop-blur-sm border
                  ${msg.role === 'user'
                    ? 'bg-[var(--surface2)] border-[var(--accent)]/30 text-[var(--text)] rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-950/20 border-red-500/30 text-red-200 rounded-tl-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] rounded-tl-sm'
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
                  text-[10px] font-family-mono tracking-wider px-1 uppercase
                  ${msg.role === 'user' ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}
                  font-['JetBrains_Mono']
                `}>
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>

                {/* Sources - only for model messages */}
                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-2 w-full">
                    <div className="flex items-center gap-2 px-1">
                      <FileText size={12} className="text-[var(--accent2)]" />
                      <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest font-['JetBrains_Mono']">
                        Sources ({msg.sources.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {msg.sources.slice(0, 3).map((source, idx) => (
                        <div
                          key={idx}
                          className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--border-hover)] transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs text-[var(--muted)] line-clamp-2 flex-1 group-hover:text-[var(--text)] transition-colors font-['JetBrains_Mono'] leading-relaxed">
                              {source.content}
                            </p>
                            <span className="text-[9px] text-[var(--accent)] font-mono shrink-0 bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                              {Math.round(source.similarity_score * 100)}%
                            </span>
                          </div>
                          {source.metadata.author && (
                            <div className="mt-2 text-[10px] text-[var(--muted)] flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[var(--accent2)]"></span>
                              {source.metadata.author}
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
            <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] flex items-center justify-center border border-[var(--border)]">
                <Bot size={20} className="text-[var(--accent2)]" />
              </div>
              <div className="bg-[var(--surface)] px-6 py-4 rounded-2xl rounded-tl-sm border border-[var(--border)] flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                <span className="text-sm text-[var(--muted)] font-['JetBrains_Mono'] uppercase tracking-wider text-[10px]">Processing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none p-6 relative z-20 border-t border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto relative"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything..."
              className="rm-input pl-6 pr-16 py-4 text-[15px] placeholder-[var(--muted)] w-full"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2 bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};