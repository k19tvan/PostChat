import React, { useEffect, useState } from 'react';
import { FacebookPost } from '../types';
import { PostCard } from './PostCard';
import { RefreshCw, Database, Search } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const PostFeed: React.FC = () => {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map Supabase snake_case to UI CamelCase
      const formattedPosts: FacebookPost[] = (data || []).map(p => ({
        id: p.id,
        authorName: p.author_name || 'Anonymous',
        authorAvatar: p.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_name || p.id}`,
        content: p.content || '',
        timestamp: p.timestamp || p.created_at,
        likes: Number(p.likes) || 0,
        comments: Number(p.comments) || 0,
        shares: Number(p.shares) || 0,
        url: p.url,
        imageUrl: p.image_url,
        ocrText: p.ocr_text,

        reactions: {
          haha: Number(p.reactions_haha || 0),
          love: Number(p.reactions_love || 0),
          care: Number(p.reactions_care || 0),
          wow: Number(p.reactions_wow || 0),
          sad: Number(p.reactions_sad || 0),
          angry: Number(p.reactions_angry || 0)
        }
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error("Failed to delete post", error);
      alert("Failed to delete post from database");
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-900/50 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex-none p-4 md:p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Social Feed</h2>
              <p className="text-xs text-slate-400 hidden md:block">Database Connection: Active</p>
            </div>
          </div>
          <button
            onClick={loadPosts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 animate-pulse">Fetching records from database...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))
          ) : (
            <div className="text-center py-20 text-slate-500">
              <p>No posts found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};