import React from 'react';
import { MessageSquare, LayoutList, Settings, Activity, LogIn, Sun, Moon } from 'lucide-react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  user: { name: string; avatar: string };
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentMode, onModeChange, onLogout, user, theme, toggleTheme }) => {
  return (
    <nav className="hidden md:flex flex-col w-20 lg:w-72 bg-white dark:bg-[#0b0e14] h-screen sticky top-0 z-40 border-r border-slate-200 dark:border-slate-900 transition-colors duration-300">
      <div className="pt-12 pb-8 px-8 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold text-slate-800 dark:text-white hidden lg:block tracking-tight">
          PostChat
        </span>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-1 px-4">
        <NavButton
          active={currentMode === AppMode.CONVERSATION}
          onClick={() => onModeChange(AppMode.CONVERSATION)}
          icon={<MessageSquare size={22} />}
          label="Conversation"
        />
        <NavButton
          active={currentMode === AppMode.POSTS}
          onClick={() => onModeChange(AppMode.POSTS)}
          icon={<LayoutList size={22} />}
          label="Feed Analyzer"
        />
      </div>

      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <div className="text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </div>
          <span className="font-semibold hidden lg:block text-[15px]">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 mt-auto border-t border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
        <div className="group relative flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-all duration-300">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
          />
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">Free Member</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="hidden lg:flex p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogIn size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative
      ${active
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
      }
    `}
  >
    <div className={`${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
      {icon}
    </div>
    <span className="font-semibold hidden lg:block text-[15px]">{label}</span>
    {active && (
      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] hidden lg:block" />
    )}
  </button>
);