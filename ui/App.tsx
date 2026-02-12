import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { ChatInterface } from './components/ChatInterface';
import { PostFeed } from './components/PostFeed';
import { AuthScreen } from './components/AuthScreen';
import { AppMode, User } from './types';
import { Menu, X } from 'lucide-react';

import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.CONVERSATION);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
    <div className="flex h-[100dvh] w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Desktop Navigation */}
      <Navigation
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">

        {/* Mobile Header */}
        <div className="md:hidden flex-none z-50 bg-[#0b0e14] border-b border-slate-800 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-white">PostChat</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 p-2 hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-40 bg-slate-950 pt-20 px-6">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setCurrentMode(AppMode.CONVERSATION); setMobileMenuOpen(false); }}
                className={`p-4 rounded-xl text-left font-medium border ${currentMode === AppMode.CONVERSATION ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
              >
                Conversation Mode
              </button>
              <button
                onClick={() => { setCurrentMode(AppMode.POSTS); setMobileMenuOpen(false); }}
                className={`p-4 rounded-xl text-left font-medium border ${currentMode === AppMode.POSTS ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
              >
                Feed Analyzer
              </button>
              <button
                onClick={handleLogout}
                className="p-4 rounded-xl text-left font-medium border border-red-500/20 bg-red-500/10 text-red-400 mt-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative w-full overflow-hidden min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />

          {currentMode === AppMode.CONVERSATION ? (
            <ChatInterface />
          ) : (
            <PostFeed />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;