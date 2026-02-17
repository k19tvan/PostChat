import React, { useEffect, useState } from 'react';
import { FacebookPost } from '../types';
import { PostCard } from './PostCard';
import { RefreshCw, Database, Search, Sparkles, Filter, X } from 'lucide-react';
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

      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (postsError) throw postsError;

      if (postId) {
        await supabase
          .from('documents')
          .delete()
          .filter('metadata->>post_id', 'eq', postId);
      }

      setPosts(prev => prev.filter(post => post.id !== id));
      loadPosts();
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
            id: `search-${index}`,
            authorName: res.metadata.author || 'Post Data',
            authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.metadata.author || index}`,
            content: res.content,
            timestamp: res.metadata.time || new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0,
            url: res.metadata.url || '',
            type: res.metadata.type,
            similarity: res.similarity_score
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

  return (
    <div className="rm-root">
      <div className="rm-ambient" />
      <div className="rm-scanlines" />

      {/* Header */}
      <div className="rm-header">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/30">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Social Feed</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_10px_var(--success)]" />
              <p className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[var(--muted)]">Database Connected</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Buttons */}
          <div className="flex items-center p-1 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
            <button
              onClick={() => { setAdvancedMode(false); setSearchResults(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${!advancedMode ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Keyword</span>
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button
              onClick={() => setAdvancedMode(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${advancedMode ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI Analysis</span>
            </button>
          </div>

          <button
            onClick={loadPosts}
            disabled={loading}
            className="rm-btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar Area */}
      <div className="px-8 py-4 z-10">
        <form onSubmit={handleSearch} className="relative group max-w-4xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={advancedMode ? "Ask AI about your posts..." : "Search keywords..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rm-input pl-12 pr-4 transition-all focus:border-[var(--accent)]"
            />
            <Search className="absolute left-4 w-5 h-5 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" />

            {searchQuery && (
              <div className="absolute right-3 flex items-center gap-2">
                <button type="button" onClick={clearSearch} className="p-1 hover:text-white text-[var(--muted)]"><X size={16} /></button>
                <button type="submit" className="px-4 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-lg hover:opacity-90">
                  {isSearching ? <RefreshCw size={12} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Search results banner */}
        {advancedMode && searchResults && (
          <div className="max-w-4xl mx-auto mt-4 px-4 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles size={12} className="text-[var(--accent)]" />
              <span className="text-[var(--accent2)] font-mono">AI FOUND {searchResults.length} RESULTS</span>
            </div>
            <button onClick={clearSearch} className="text-[10px] text-[var(--muted)] hover:text-white uppercase tracking-wider font-mono underline">Clear</button>
          </div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto relative z-0 custom-scrollbar px-6 pb-20">
        <div className="max-w-4xl mx-auto mt-6">
          {loading || isSearching ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--accent)] opacity-20 blur-xl rounded-full" />
                <RefreshCw className="relative w-12 h-12 text-[var(--accent)] animate-spin" />
              </div>
              <p className="text-[var(--muted)] font-mono text-xs uppercase tracking-widest animate-pulse">
                {isSearching ? "Querying Vector DB..." : "Syncing Feed..."}
              </p>
            </div>
          ) : displayResults.length > 0 ? (
            <div className="space-y-6">
              {displayResults.map(post => (
                <PostCard key={post.id} post={post as FacebookPost} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
              <Database size={48} className="text-[var(--muted)] mb-4" />
              <p className="text-[var(--muted)] font-mono text-sm">NO DATA FOUND</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};