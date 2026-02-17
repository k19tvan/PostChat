import React from 'react';
import { MessageSquare, LayoutList, Settings, Activity, LogIn, Sun, Moon, Target } from 'lucide-react';
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
    <nav className="hidden md:flex flex-col w-20 lg:w-72 bg-[var(--surface)] h-screen sticky top-0 z-40 border-r border-[var(--border)] transition-colors duration-300 font-['Syne'] shadow-lg">
      <div className="pt-10 pb-8 px-6 flex items-center justify-center lg:justify-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30 group hover:scale-110 transition-transform duration-300">
          <Activity className="text-white w-6 h-6 animate-pulse" />
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="text-2xl font-bold text-[var(--text)] tracking-tight leading-none">
            PostChat
          </span>
          <span className="text-[10px] text-[var(--muted)] font-['JetBrains_Mono'] tracking-widest uppercase mt-1">
            v2.0 Beta
          </span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-3 px-4">
        <div className="px-2 mb-2 hidden lg:block">
          <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest opacity-60">Modules</span>
        </div>
        <NavButton
          active={currentMode === AppMode.CONVERSATION}
          onClick={() => onModeChange(AppMode.CONVERSATION)}
          icon={<MessageSquare size={20} />}
          label="Conversation"
        />
        <NavButton
          active={currentMode === AppMode.POSTS}
          onClick={() => onModeChange(AppMode.POSTS)}
          icon={<LayoutList size={20} />}
          label="Feed Analyzer"
        />
        <NavButton
          active={currentMode === AppMode.ROADMAP}
          onClick={() => onModeChange(AppMode.ROADMAP)}
          icon={<Target size={20} />}
          label="Learning Roadmap"
        />
      </div>

      <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
        <div className="p-3 bg-[var(--surface2)] rounded-2xl border border-[var(--border)] hover:border-[var(--muted)] transition-colors group relative overflow-hidden">
          {/* Ambient glow behind profile */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-xl border border-[var(--border)] shadow-md"
            />
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text)] truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                <p className="text-[10px] text-[var(--muted)] font-mono font-medium">ONLINE</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="hidden lg:flex p-2 text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogIn size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full mt-3 flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
        >
          <div className="text-[var(--accent)] group-hover:rotate-45 transition-transform duration-300">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="font-semibold hidden lg:block text-xs font-mono uppercase tracking-wider">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
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
      flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
      ${active
        ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_20px_rgba(124,109,250,0.15)] border border-[var(--accent)]/20'
        : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] border border-transparent hover:border-[var(--border)]'
      }
    `}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="font-semibold hidden lg:block text-[15px]">{label}</span>

    {active && (
      <div className="hidden lg:block absolute right-0 inset-y-0 w-1 bg-[var(--accent)] rounded-l-full shadow-[0_0_10px_var(--accent)]" />
    )}
  </button>
);