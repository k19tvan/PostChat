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
      // Fetch from 'posts' table (not 'documents' - that's for search chunks only)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false }); // Latest posts first

      if (error) throw error;

      if (data) {
        // Map posts from database to FacebookPost type
        // Map posts from database to FacebookPost type
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
      // Find the post to get its postid
      const postToDelete = posts.find(p => p.id === id);

      // Get the actual post from posts table to find its postid
      const { data: currentPost } = await supabase
        .from('posts')
        .select('postid, id')
        .eq('id', id)
        .single();

      const postId = currentPost?.postid;

      // Delete from posts table
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (postsError) throw postsError;

      // Also delete associated chunks from documents table
      if (postId) {
        await supabase
          .from('documents')
          .delete()
          .filter('metadata->>post_id', 'eq', postId);
      }

      setPosts(prev => prev.filter(post => post.id !== id));
      loadPosts(); // Refresh to ensure state consistency
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

  // Use search results if available, otherwise filter local posts
  const getDisplayResults = () => {
    if (searchResults) {
      const postMap = new Map<string, any>();

      searchResults.forEach((res, index) => {
        const postId = res.metadata.post_id || `search-${index}`;

        if (postMap.has(postId)) {
          // If we see another chunk of the same post, we can choose to append it 
          // or just keep the most relevant one. Concatenation is better for context.
          const existing = postMap.get(postId);
          // Only append if it's not already there (sometimes search returns overlapping parts)
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative transition-colors duration-300">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-600/6 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-600/6 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-600/4 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex-none relative z-10 transition-colors duration-300">
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Title bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-600/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/10">
                  <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Social Feed</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Database Connected</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Mode toggle */}
                <div className="hidden sm:inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm dark:shadow-lg">
                  <button
                    onClick={() => {
                      setAdvancedMode(false);
                      setSearchResults(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!advancedMode
                      ? 'bg-white dark:bg-slate-700/80 text-indigo-600 dark:text-white shadow-sm dark:shadow-md ring-1 ring-black/5 dark:ring-white/5'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/30'
                      }`}
                  >
                    <Filter size={13} />
                    <span className="hidden md:inline">Keyword</span>
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700/50 mx-1" />
                  <button
                    onClick={() => setAdvancedMode(true)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${advancedMode
                      ? 'bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/30'
                      }`}
                  >
                    <Sparkles size={13} />
                    <span className="hidden md:inline">AI</span>
                  </button>
                </div>

                <button
                  onClick={loadPosts}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600/50 transition-all shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Mode toggle mobile - below title */}
            <div className="flex justify-center sm:hidden">
              <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm dark:shadow-lg">
                <button
                  onClick={() => {
                    setAdvancedMode(false);
                    setSearchResults(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${!advancedMode
                    ? 'bg-white dark:bg-slate-700/80 text-indigo-600 dark:text-white shadow-sm dark:shadow-md ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/30'
                    }`}
                >
                  <Filter size={14} />
                  <span>Keyword Filter</span>
                </button>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700/50 mx-1" />
                <button
                  onClick={() => setAdvancedMode(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${advancedMode
                    ? 'bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/30'
                    }`}
                >
                  <Sparkles size={14} />
                  <span>AI Search</span>
                </button>
              </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:border-indigo-500/50 dark:focus-within:ring-2 dark:focus-within:ring-indigo-500/20 transition-all">
                <div className="pl-4 pr-3 flex items-center">
                  <Search className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder={advancedMode ? "Ask anything about your saved posts..." : "Search posts by keywords..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none py-3.5 px-1 text-[15px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <div className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={16} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isSearching ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Search results banner */}
        {advancedMode && searchResults && (
          <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-b border-indigo-500/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-5 md:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span className="text-xs text-indigo-300 font-semibold">
                    Showing {searchResults.length} AI-powered result{searchResults.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition-colors"
                >
                  Clear results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {loading || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                  <RefreshCw className="relative w-10 h-10 text-indigo-500 animate-spin" />
                </div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">
                  {isSearching ? "Searching vector database..." : "Loading posts..."}
                </p>
              </div>
            ) : displayResults.length > 0 ? (
              <div className="space-y-5">
                {displayResults.map(post => (
                  <PostCard key={post.id} post={post as FacebookPost} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-3">
                <div className="p-4 bg-white dark:bg-slate-800/40 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {searchQuery ? `No posts found matching "${searchQuery}"` : 'No posts yet'}
                </p>
                {advancedMode && !searchResults && searchQuery && (
                  <p className="text-xs text-slate-400 dark:text-slate-600">
                    Press Enter or click Search for AI-powered results
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};