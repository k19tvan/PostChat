import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      const responseText = await sendMessageToGemini(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I apologize, but I encountered an error connecting to the service. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Messages Area - Larger top padding for design flow */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-24 pb-12 md:pt-32 space-y-10 scroll-smooth z-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
          >
            <div className={`
              flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-lg
              ${msg.role === 'user'
                ? 'bg-indigo-600 shadow-indigo-500/20'
                : 'bg-[#6366f1] shadow-indigo-500/20'
              }
            `}>
              {msg.role === 'user' ? <User size={22} className="text-white" /> : <Bot size={22} className="text-white" />}
            </div>

            <div className={`
              group relative px-7 py-5 rounded-[22px] text-[15.5px] leading-relaxed max-w-[85%] md:max-w-[75%] shadow-xl
              ${msg.role === 'user'
                ? 'bg-indigo-600 text-white shadow-indigo-900/40'
                : msg.isError
                  ? 'bg-red-900/20 border border-red-500/20 text-red-200'
                  : 'bg-[#1e2330] text-slate-200 border border-slate-800/50 shadow-black/20'
              }
            `}>
              {msg.text}
              <div className={`
                text-[11px] mt-2.5 font-medium opacity-40
                ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-500'}
              `}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/50 flex items-center justify-center">
              <Bot size={18} className="text-white/70" />
            </div>
            <div className="bg-[#1e2330] px-5 py-4 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-sm text-slate-400 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Pinned to bottom */}
      <div className="flex-none p-6 md:p-10 md:pb-12 bg-transparent z-10 w-full">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-[#1b1f2b]/95 backdrop-blur-md text-slate-200 placeholder-slate-500 rounded-[22px] pl-8 pr-16 py-6 border border-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-4 p-4 bg-indigo-600 text-white rounded-[16px] hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/30"
          >
            <Send size={26} />
          </button>
        </form>
      </div>
    </div>
  );
};