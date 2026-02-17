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
  const [showOcr, setShowOcr] = useState<Record<number, boolean>>({});

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
    <div className={`
      relative group overflow-hidden transition-all duration-300
      bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--border-hover)]
      ${deleting ? 'opacity-50 scale-95' : ''}
    `}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--accent)]/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-5 flex items-start justify-between relative z-10 border-b border-[var(--border)]">
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-12 h-12 rounded-xl object-cover border border-[var(--border)] shadow-lg shadow-black/20"
            />
            {/* Status dot */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--surface)]" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-[var(--text)] text-base tracking-tight">{post.authorName}</h3>
              {post.category && (
                <span className="px-2 py-0.5 bg-[var(--surface2)] text-[var(--accent2)] text-[10px] font-bold rounded uppercase tracking-wider border border-[var(--border)] font-['JetBrains_Mono']">
                  {post.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)] font-['JetBrains_Mono']">
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
              <span>•</span>
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1 group/link">
                Source <Globe size={10} className="group-hover/link:animate-spin" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sentiment && (
            <span className={`
              text-[10px] uppercase font-bold px-3 py-1 rounded-full border tracking-widest font-mono
              ${sentiment.toLowerCase().includes('positive')
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : sentiment.toLowerCase().includes('negative')
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)]'
              }
            `}>
              {sentiment}
            </span>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-[var(--muted)] hover:text-red-400 transition-colors rounded-lg hover:bg-[var(--surface2)]"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* AI Analysis Section */}
      {post.summary && (
        <div className="mx-5 mt-4 p-4 bg-[var(--surface2)]/50 border border-[var(--accent)]/20 rounded-xl relative overflow-hidden group/ai shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/ai:bg-[var(--accent)]/20 transition-colors" />
          <div className="absolute -inset-px bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent2)]/10 opacity-50 pointer-events-none" />

          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[10px] font-bold text-[var(--accent2)] uppercase tracking-wider font-mono">AI Summary</span>
          </div>

          <p className="text-sm text-[var(--text)] leading-relaxed opacity-90 relative z-10">
            {post.summary}
          </p>

          {post.topics && post.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.topics.map((topic, i) => (
                <span key={i} className="px-2 py-1 bg-[var(--surface)] text-[var(--accent)] text-[10px] rounded border border-[var(--border)] font-mono">
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Body */}
      <div className="p-5">
        <div className="text-[var(--text)] text-sm leading-7 whitespace-pre-line opacity-80 font-normal">
          {shouldTruncate && !isExpanded
            ? `${post.content.substring(0, MAX_CHAR_LIMIT)}...`
            : post.content}

          {shouldTruncate && (
            <button
              onClick={toggleExpand}
              className="ml-2 text-[var(--accent)] hover:text-[var(--accent2)] text-xs font-bold uppercase tracking-wider hover:underline"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      {post.media && post.media.length > 0 && (
        <div className="px-5 pb-5">
          <div className={`grid gap-3 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.media.map((media: MediaItem, index: number) => (
              <div key={index} className="relative group/media rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface2)]">
                {media.type === 'video' ? (
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    <span className="text-xs text-[var(--muted)] font-mono">VIDEO SOURCE</span>
                    {media.thumbnail && <img src={media.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                  </div>
                ) : (
                  <img
                    src={media.url}
                    alt="Post media"
                    className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}

                {media.ocr_text && (
                  <button
                    onClick={() => toggleOcr(index)}
                    className="absolute bottom-3 right-3 p-2 bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10 hover:bg-[var(--accent)] transition-colors"
                  >
                    <FileText size={14} className={showOcr[index] ? "text-white" : "text-white/70"} />
                  </button>
                )}

                {/* OCR Overlay */}
                {showOcr[index] && media.ocr_text && (
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-black/90 p-4 overflow-auto border-t border-[var(--border)] animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-2 mb-2 text-[var(--accent2)] text-[10px] font-bold uppercase tracking-wider">
                      <FileText size={12} /> Extracted Text
                    </div>
                    <p className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed opacity-80">
                      {media.ocr_text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Fallback */}
      {!post.sentiment && (
        <div className="px-5 pb-4">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:text-white bg-[var(--surface2)] hover:bg-[var(--accent)] rounded-xl transition-all border border-[var(--border)] hover:border-[var(--accent)] flex items-center justify-center gap-2 group/btn"
          >
            <Sparkles size={14} className="group-hover/btn:animate-pulse" />
            {analyzing ? 'Processing...' : 'Analyze Sentiment'}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-[var(--surface2)]/30 border-t border-[var(--border)] p-2 flex justify-between">
        <ActionButton icon={<ThumbsUp size={16} />} label={post.likes ? post.likes.toString() : 'Like'} />
        <ActionButton icon={<MessageCircle size={16} />} label={post.comments ? post.comments.toString() : 'Comment'} />
        <ActionButton icon={<Share2 size={16} />} label={post.shares ? post.shares.toString() : 'Share'} />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] rounded-lg transition-all group">
    <div className="group-hover:scale-110 group-hover:text-[var(--accent)] transition-all duration-200">
      {icon}
    </div>
    <span className="text-xs font-medium font-mono">{label}</span>
  </button>
);