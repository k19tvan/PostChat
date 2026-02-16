import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Sparkles, Image as ImageIcon, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { FacebookPost, MediaItem } from '../types';
import { analyzePostSentiment } from '../services/geminiService';

interface PostCardProps {
  post: FacebookPost;
  onDelete?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const [sentiment, setSentiment] = useState<string | null>(post.sentiment || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOcr, setShowOcr] = useState<Record<number, boolean>>({}); // Track OCR visibility per image index

  const MAX_CHAR_LIMIT = 280;
  const shouldTruncate = post.content.length > MAX_CHAR_LIMIT;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const toggleOcr = (index: number) => {
    setShowOcr(prev => ({ ...prev, [index]: !prev[index] }));
  };

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
              {post.category && (
                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-500/20">
                  {post.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span title={post.timestamp}>{new Date(post.timestamp).toLocaleDateString()}</span>
              <span>•</span>
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 flex items-center gap-1">
                <Globe size={12} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sentiment Badge (if pre-calculated) */}
          {sentiment && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sentiment.toLowerCase().includes('positive') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                sentiment.toLowerCase().includes('negative') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
              {sentiment}
            </span>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
            title="Delete from saved"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* AI Summary Section (Highlighted) */}
      {post.summary && (
        <div className="mx-4 mb-3 p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">AI Summary</span>
          </div>
          <p className="text-sm text-indigo-100/90 leading-relaxed font-medium">
            {post.summary}
          </p>
          {post.topics && post.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {post.topics.map((topic, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] rounded-md font-medium">
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Original Content */}
      <div className="px-4 pb-3">
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {shouldTruncate && !isExpanded
            ? `${post.content.substring(0, MAX_CHAR_LIMIT)}...`
            : post.content}

          {shouldTruncate && (
            <button
              onClick={toggleExpand}
              className="ml-1 text-indigo-400 hover:text-indigo-300 font-medium text-xs hover:underline focus:outline-none"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Media Gallery with OCR */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-4">
          <div className={`grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.media.map((media: MediaItem, index: number) => (
              <div key={index} className="relative group">
                <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50">
                  {media.type === 'video' ? (
                    <div className="relative aspect-video bg-black flex items-center justify-center">
                      <span className="text-xs text-slate-500">Video Preview Placeholder</span>
                      {/* Use thumbnail if available, otherwise just placeholder */}
                      {media.thumbnail && <img src={media.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full h-auto object-cover max-h-[400px]"
                      loading="lazy"
                    />
                  )}

                  {/* OCR Toggle */}
                  {media.ocr_text && (
                    <button
                      onClick={() => toggleOcr(index)}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10"
                      title="Toggle extracted text"
                    >
                      <FileText size={14} className={showOcr[index] ? "text-indigo-400" : "text-white"} />
                    </button>
                  )}
                </div>

                {/* OCR Text Display */}
                {showOcr[index] && media.ocr_text && (
                  <div className="mt-2 p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 text-xs text-slate-300 font-mono overflow-x-auto">
                    <div className="flex items-center justify-between mb-1 opacity-60">
                      <span className="text-[10px] uppercase font-bold">Extracted Text</span>
                    </div>
                    {media.ocr_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Analysis Fallback (only if not pre-calculated) */}
      {!post.sentiment && (
        <div className="px-4 py-2 border-t border-slate-700/30">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-1.5 text-xs text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={12} />
            {analyzing ? 'Analyzing sentiment...' : 'Analyze Sentiment'}
          </button>
        </div>
      )}

      {/* Footer Stats & Actions */}
      <div className="border-t border-slate-700/50">
        <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <ThumbsUp size={12} />
              <span>{post.likes}</span>
            </div>
            <div>{post.comments} comments</div>
            <div>{post.shares} shares</div>
          </div>

          {post.reactions && Object.keys(post.reactions).length > 0 && (
            <div className="flex -space-x-1">
              {/* Simple visual representation of reactions if needed */}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 px-2 pb-2">
          <ActionButton icon={<ThumbsUp size={16} />} label="Like" />
          <ActionButton icon={<MessageCircle size={16} />} label="Comment" />
          <ActionButton icon={<Share2 size={16} />} label="Share" />
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-2 py-2 text-slate-400 hover:bg-slate-700/30 hover:text-indigo-400 rounded-lg transition-all group">
    <div className="group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);