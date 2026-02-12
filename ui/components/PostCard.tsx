import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Sparkles } from 'lucide-react';
import { FacebookPost } from '../types';
import { analyzePostSentiment } from '../services/geminiService';

interface PostCardProps {
  post: FacebookPost;
  onDelete?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const [sentiment, setSentiment] = useState<string | null>(post.sentiment || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(post.id);
    setDeleting(false);
  };

  const handleAnalyze = async () => {
    if (sentiment) return;
    setAnalyzing(true);
    const result = await analyzePostSentiment(post.content);
    setSentiment(result);
    setAnalyzing(false);
  };

  return (
    <div className={`bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden hover:border-slate-600 transition-all ${deleting ? 'opacity-50 scale-95' : ''}`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-3">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">{post.authorName}</h3>
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-500/20">FB</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span title={post.timestamp}>{new Date(post.timestamp).toLocaleDateString()}</span>
              <span>•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
            title="View Original Post"
          >
            <Globe size={18} />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete from saved"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line mb-3">
          {post.content}
        </p>
        {post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/50">
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      <div className="px-4 py-2">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-indigo-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-200">AI Sentiment Analysis</span>
          </div>
          {sentiment ? (
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${sentiment.toLowerCase().includes('positive') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                sentiment.toLowerCase().includes('negative') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
              {sentiment}
            </span>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-700/50 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <ThumbsUp size={10} className="text-white" fill="white" />
          </div>
          <span>{post.likes}</span>
        </div>
        <div className="flex gap-3">
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 border-t border-slate-700/50 grid grid-cols-3">
        <ActionButton icon={<ThumbsUp size={18} />} label="Like" />
        <ActionButton icon={<MessageCircle size={18} />} label="Comment" />
        <ActionButton icon={<Share2 size={18} />} label="Share" />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-2 py-2 text-slate-400 hover:bg-slate-700/30 hover:text-indigo-400 rounded-lg transition-all group">
    <div className="group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);