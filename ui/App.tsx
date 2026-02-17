import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { ChatInterface } from './components/ChatInterface';
import { PostFeed } from './components/PostFeed';
import { RoadmapView } from './components/RoadmapView';
import { AuthScreen } from './components/AuthScreen';
import { AppMode, User } from './types';
import { Menu, X } from 'lucide-react';
import { ThemeStyles } from './components/ThemeStyles';

import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    // Restore mode from localStorage on initial load
    const savedMode = localStorage.getItem('appMode');
    return (savedMode as AppMode) || AppMode.CONVERSATION;
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Persist mode changes to localStorage
  useEffect(() => {
    localStorage.setItem('appMode', currentMode);
  }, [currentMode]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserFromSession(session);
      setIsInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserFromSession = (session: any) => {
    if (session?.user) {
      setUser({
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
        avatar: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
      });
    } else {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isInitializing) return null;

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--bg)] text-[var(--text)] overflow-hidden font-sans selection:bg-[var(--accent)]/30 transition-colors duration-300">
      <ThemeStyles />

      {/* Desktop Navigation */}
      <Navigation
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onLogout={handleLogout}
        user={user}
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">

        {/* Mobile Header */}
        <div className="md:hidden flex-none z-50 bg-[var(--surface)] border-b border-[var(--border)] p-4 flex justify-between items-center shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-[var(--text)] tracking-tight">PostChat</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[var(--text)] p-2 hover:bg-[var(--surface2)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-40 bg-[var(--bg)] pt-20 px-6 backdrop-blur-xl">
            <div className="flex flex-col gap-3 font-['Syne']">
              <button
                onClick={() => { setCurrentMode(AppMode.CONVERSATION); setMobileMenuOpen(false); }}
                className={`p-4 rounded-xl text-left font-bold border transition-all ${currentMode === AppMode.CONVERSATION ? 'bg-[var(--surface2)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(124,109,250,0.15)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                Conversation Mode
              </button>
              <button
                onClick={() => { setCurrentMode(AppMode.POSTS); setMobileMenuOpen(false); }}
                className={`p-4 rounded-xl text-left font-bold border transition-all ${currentMode === AppMode.POSTS ? 'bg-[var(--surface2)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(124,109,250,0.15)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                Feed Analyzer
              </button>
              <button
                onClick={() => { setCurrentMode(AppMode.ROADMAP); setMobileMenuOpen(false); }}
                className={`p-4 rounded-xl text-left font-bold border transition-all ${currentMode === AppMode.ROADMAP ? 'bg-[var(--surface2)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(124,109,250,0.15)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                Learning Roadmap
              </button>
              <button
                onClick={handleLogout}
                className="p-4 rounded-xl text-left font-bold border border-red-500/20 bg-red-500/10 text-red-400 mt-4 hover:bg-red-500/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative w-full overflow-hidden min-h-0 bg-[var(--bg)] transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[var(--surface)] to-[var(--bg)] opacity-50 -z-10" />

          {currentMode === AppMode.CONVERSATION ? (
            <ChatInterface theme={theme} />
          ) : currentMode === AppMode.POSTS ? (
            <PostFeed theme={theme} />
          ) : (
            <RoadmapView theme={theme} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;