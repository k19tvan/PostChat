import React, { useEffect, useState } from 'react';
import { FacebookPost } from '../types';
import { PostCard } from './PostCard';
import { RefreshCw, Database, Search, Sparkles, Filter, X, Zap, Layers } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { searchPosts, SearchResult } from '../services/backendService';

interface PostFeedProps {
  theme?: 'dark' | 'light';
}

export const PostFeed: React.FC<PostFeedProps> = ({ theme }) => {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  // --- Logic Functions (Giữ nguyên) ---
  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedPosts: FacebookPost[] = data.map(p => ({
          id: p.id,
          authorName: p.authorname || 'Anonymous',
          authorAvatar: p.authoravatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.authorname || p.id}`,
          content: p.raw_text || p.text || '',
          summary: p.summary,
          sentiment: p.sentiment,
          topics: p.topics,
          category: p.category,
          timestamp: p.published_at || p.time || p.created_at || new Date().toISOString(),
          likes: p.engagement_metrics?.likes || p.likes || 0,
          comments: p.engagement_metrics?.comments || p.comments || 0,
          shares: p.engagement_metrics?.shares || p.shares || 0,
          reactions: p.engagement_metrics?.reactions || p.reactions,
          media: p.media || (p.imageUrl ? [{ type: 'photo', url: p.imageUrl }] : []),
          url: p.url,
        }));

        setPosts(mappedPosts);
      }
      setSearchResults(null);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchPosts(searchQuery, advancedMode);
      if (response.success && response.results) {
        setSearchResults(response.results);
      } else {
        console.error("Search failed:", response.error);
        alert(`Search failed: ${response.error}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const postToDelete = posts.find(p => p.id === id);
      const { data: currentPost } = await supabase
        .from('posts')
        .select('postid, id')
        .eq('id', id)
        .single();
      const postId = currentPost?.postid;

      const { error: postsError } = await supabase.from('posts').delete().eq('id', id);
      if (postsError) throw postsError;

      if (postId) {
        await supabase.from('documents').delete().filter('metadata->>post_id', 'eq', postId);
      }

      setPosts(prev => prev.filter(post => post.id !== id));
      loadPosts(); // Refresh to be safe
    } catch (error) {
      console.error("Failed to delete post", error);
      alert("Failed to delete post from database");
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const getDisplayResults = () => {
    if (searchResults) {
      const postMap = new Map<string, any>();
      searchResults.forEach((res, index) => {
        const postId = res.metadata.post_id || `search-${index}`;
        if (postMap.has(postId)) {
          const existing = postMap.get(postId);
          if (!existing.content.includes(res.content)) {
            existing.content += " ... " + res.content;
          }
        } else {
          postMap.set(postId, {
            id: `search-${index}`, // Temporary ID for display
            authorName: res.metadata.author || 'AI Result',
            authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.metadata.author || index}`,
            content: res.content,
            timestamp: res.metadata.time || new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0,
            url: res.metadata.url || '',
            type: res.metadata.type,
            similarity: res.similarity_score,
            isAiResult: true // Flag for UI styling
          });
        }
      });
      return Array.from(postMap.values());
    }

    return posts.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const displayResults = getDisplayResults();

  // --- Render ---
  return (
    <div className="rm-container">
      <style>{`
        :root {
          --bg-main: #0c0e12;
          --bg-card: #16181d;
          --border-color: #2d3039;
          --text-primary: #ffffff;
          --text-secondary: #9ca3af;
          --accent-blue: #3b82f6;
          --accent-purple: #8b5cf6;
          --success: #10b981;
        }

        .rm-container {
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-primary);
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .rm-grid-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#2d3039 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }

        /* HEADER */
        .rm-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #111318;
          border-bottom: 1px solid var(--border-color);
        }

        .rm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rm-icon-box {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent-blue), #2563eb);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }
        .rm-brand-title {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: white;
        }
        .rm-status-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success);
        }

        /* CONTROLS */
        .rm-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rm-toggle-group {
          display: flex;
          background: #000;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2px;
        }
        .rm-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
          background: transparent;
        }
        .rm-toggle-btn.active {
          color: white;
        }
        .rm-toggle-btn.active.mode-ai {
          background: var(--accent-purple);
        }
        .rm-toggle-btn.active.mode-keyword {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .rm-refresh-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rm-refresh-btn:hover { border-color: var(--text-secondary); }
        .rm-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* SEARCH AREA */
        .rm-search-zone {
          position: relative;
          z-index: 10;
          padding: 24px 32px 0;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .rm-search-input-wrapper {
          position: relative;
          width: 100%;
        }
        .rm-search-input {
          width: 100%;
          background: #000;
          border: 1px solid var(--border-color);
          padding: 14px 16px 14px 48px;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rm-search-input:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .rm-search-input.ai-mode:focus {
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
        }
        
        .rm-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .rm-search-action {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rm-btn-search {
          background: var(--text-primary);
          color: black;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .rm-btn-search.ai {
          background: var(--accent-purple);
          color: white;
        }

        /* RESULTS AREA */
        .rm-feed-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          z-index: 10;
        }

        .rm-feed-area::-webkit-scrollbar { width: 6px; }
        .rm-feed-area::-webkit-scrollbar-track { background: transparent; }
        .rm-feed-area::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

        .rm-ai-banner {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #d8b4fe;
        }

        /* Loading / Empty States */
        .rm-state-box {
          display: flex;
          flex-col;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          color: var(--text-secondary);
          text-align: center;
        }
        .rm-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Helpers */
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-xs { font-size: 12px; }
        .uppercase { text-transform: uppercase; }
        .tracking-wide { letter-spacing: 0.05em; }

      `}</style>

      {/* Ambient Grid */}
      <div className="rm-grid-bg" />

      {/* Header */}
      <header className="rm-header">
        <div className="rm-brand">
          <div className="rm-icon-box">
            <Database size={20} />
          </div>
          <div>
            <div className="rm-brand-title">Social Feed</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="rm-status-dot" />
              <span className="text-xs text-gray-500 font-mono tracking-wide uppercase">Connected</span>
            </div>
          </div>
        </div>

        <div className="rm-controls">
          <div className="rm-toggle-group">
            <button
              onClick={() => { setAdvancedMode(false); setSearchResults(null); }}
              className={`rm-toggle-btn ${!advancedMode ? 'active mode-keyword' : ''}`}
            >
              <Filter size={14} />
              <span>Keyword</span>
            </button>
            <button
              onClick={() => setAdvancedMode(true)}
              className={`rm-toggle-btn ${advancedMode ? 'active mode-ai' : ''}`}
            >
              <Sparkles size={14} />
              <span>AI Analysis</span>
            </button>
          </div>

          <button onClick={loadPosts} disabled={loading} className="rm-refresh-btn" title="Refresh Feed">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Search Section */}
      <div className="rm-search-zone">
        <form onSubmit={handleSearch} className="rm-search-input-wrapper">
          <div className="rm-search-icon">
            {advancedMode ? <Sparkles size={18} className="text-purple-400" /> : <Search size={18} />}
          </div>

          <input
            type="text"
            className={`rm-search-input ${advancedMode ? 'ai-mode' : ''}`}
            placeholder={advancedMode ? "Ask AI about your data (e.g., 'Positive feedback about pricing')..." : "Filter by keywords..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <div className="rm-search-action">
              <button
                type="button"
                onClick={clearSearch}
                className="p-1.5 rounded-md hover:bg-[#333] text-gray-400"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                className={`rm-btn-search ${advancedMode ? 'ai' : ''}`}
                disabled={isSearching}
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Main Feed */}
      <div className="rm-feed-area">
        {advancedMode && searchResults && (
          <div className="rm-ai-banner">
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span className="font-mono font-bold">AI FOUND {searchResults.length} RELEVANT POSTS</span>
            </div>
            <button onClick={clearSearch} className="underline opacity-70 hover:opacity-100">Clear</button>
          </div>
        )}

        {loading || isSearching ? (
          <div className="rm-state-box">
            <div className={`rm-spinner`} style={{ borderTopColor: advancedMode ? '#8b5cf6' : '#3b82f6' }} />
            <div className="font-mono text-xs uppercase tracking-wide">
              {isSearching ? (advancedMode ? "Vector Search Running..." : "Filtering...") : "Syncing Database..."}
            </div>
          </div>
        ) : displayResults.length > 0 ? (
          <div className="space-y-6">
            {displayResults.map(post => (
              // Note: PostCard should ideally handle its own dark mode styling
              // based on the context, or you can wrap it in a styled div here.
              <div key={post.id} className="relative">
                {/* Visual connector for list items if needed */}
                <PostCard post={post as FacebookPost} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rm-state-box">
            <Layers size={48} className="mb-4 opacity-20" />
            <div className="text-lg font-bold text-gray-500">No Data Found</div>
            <p className="text-sm mt-2 opacity-50">Try adjusting your search query</p>
          </div>
        )}
      </div>
    </div>
  );
};