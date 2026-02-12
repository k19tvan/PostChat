import React from 'react';
import { MessageSquare, LayoutList, Settings, Activity, LogIn } from 'lucide-react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  user: { name: string; avatar: string };
}

export const Navigation: React.FC<NavigationProps> = ({ currentMode, onModeChange, onLogout, user }) => {
  return (
    <nav className="hidden md:flex flex-col w-20 lg:w-72 bg-[#0b0e14] h-screen sticky top-0 z-40 border-r border-slate-900">
      <div className="pt-12 pb-8 px-8 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold text-white hidden lg:block tracking-tight">
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

      <div className="p-4 bg-slate-900/40 mt-auto border-t border-slate-800/50">
        <div className="group relative flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-800/40 transition-all duration-300">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
          />
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">Free Member</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="hidden lg:flex p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
        ? 'bg-indigo-900/20 text-indigo-400'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }
    `}
  >
    <div className={`${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
      {icon}
    </div>
    <span className="font-semibold hidden lg:block text-[15px]">{label}</span>
    {active && (
      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] hidden lg:block" />
    )}
  </button>
);