import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  ChevronDown,
  History,
  Search,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  BookOpen,
  Code2,
  Cpu,
  Layers
} from 'lucide-react';

// --- Types ---
interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  skills: string[];
  projects: string[];
  posts: Array<any>;
  courses: Array<{
    id: string;
    title: string;
    url: string;
    reason: string;
  }>;
}

interface RoadmapData {
  goal: string;
  timeline_style: string;
  nodes: RoadmapNode[];
}

interface SavedPath {
  id: string;
  goal: string;
  roadmap_data: RoadmapData;
  created_at: string;
}

interface RoadmapViewProps {
  theme?: 'dark' | 'light';
}

// --- Constants: Vibrant Palettes ---
// Màu sắc đậm đà hơn, độ tương phản cao hơn
const NODE_PALETTES = [
  { name: 'Cyan', main: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9' },
  { name: 'Violet', main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd' },
  { name: 'Emerald', main: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },
  { name: 'Amber', main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },
  { name: 'Rose', main: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', text: '#fda4af' },
  { name: 'Blue', main: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd' },
];

const MOCK_ROADMAP: RoadmapData = {
  goal: 'Python Backend Developer',
  timeline_style: 'progressive',
  nodes: [
    {
      id: 'n1',
      title: 'Python Fundamentals',
      description: 'Master the core language: syntax, data structures, OOP, and the standard library.',
      skills: ['Variables & Types', 'Functions', 'Classes & OOP', 'List Comprehensions', 'Error Handling'],
      projects: ['CLI Todo App', 'File Organizer Script', 'Text Adventure Game'],
      posts: [],
      courses: [
        { id: 'c1', title: 'Python for Everybody', url: 'https://coursera.org', reason: 'Best structured intro' },
        { id: 'c2', title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com', reason: 'Practical projects' },
      ],
    },
    {
      id: 'n2',
      title: 'Web Frameworks',
      description: 'Learn FastAPI for modern async APIs and Django for full-stack power.',
      skills: ['FastAPI', 'Django', 'REST principles', 'Pydantic', 'Django ORM'],
      projects: ['REST API for a blog', 'Auth service with JWT', 'Django admin portal'],
      posts: [],
      courses: [
        { id: 'c3', title: 'FastAPI – Full Course', url: 'https://fastapi.tiangolo.com', reason: 'Official + modern' },
      ],
    },
    {
      id: 'n3',
      title: 'Databases & SQL',
      description: 'PostgreSQL mastery, indexing strategies, and the SQLAlchemy ORM.',
      skills: ['PostgreSQL', 'SQLAlchemy', 'Migrations', 'Indexing', 'Redis'],
      projects: ['E-commerce DB schema', 'Caching layer', 'Full-text search service'],
      posts: [],
      courses: [
        { id: 'c5', title: 'PostgreSQL Tutorial', url: 'https://postgresqltutorial.com', reason: 'Reference' },
      ],
    },
    {
      id: 'n4',
      title: 'DevOps & Deployment',
      description: 'Containerise with Docker, orchestrate with Kubernetes, set up CI/CD pipelines.',
      skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'Nginx', 'Prometheus'],
      projects: ['Dockerise a FastAPI app', 'CI/CD pipeline', 'K8s cluster deployment'],
      posts: [],
      courses: [],
    },
    {
      id: 'n5',
      title: 'System Design',
      description: 'Think at scale: distributed systems, message queues, microservices.',
      skills: ['Microservices', 'RabbitMQ', 'Load Balancing', 'CAP Theorem'],
      projects: ['Event-driven order system', 'API Gateway pattern'],
      posts: [],
      courses: [],
    },
  ],
};

export const RoadmapView: React.FC<RoadmapViewProps> = () => {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(MOCK_ROADMAP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [showPathsDropdown, setShowPathsDropdown] = useState(false);
  const [userGoal, setUserGoal] = useState('');
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [activeNodeId, setActiveNodeId] = useState<string | null>('n1');

  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
    const fetchSavedPaths = async () => {
      try {
        const { data } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false });
        if (data) setSavedPaths(data);
      } catch (err) { console.error(err); }
    };
    fetchSavedPaths();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPathsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Actions ---

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 420;
    scrollRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  const generateRoadmap = async () => {
    if (!userGoal.trim()) return;
    setLoading(true);
    setRoadmap(null);
    setActiveNodeId(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: userGoal }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      const newRoadmap = data.data || data;
      setRoadmap(newRoadmap);
      if (newRoadmap.nodes.length > 0) setActiveNodeId(newRoadmap.nodes[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (id: string, index: number) => {
    setCompletedNodes(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
        if (roadmap && index < roadmap.nodes.length - 1) {
          const nextId = roadmap.nodes[index + 1].id;
          setActiveNodeId(nextId);
          setTimeout(() => {
            const el = document.getElementById(`node-${nextId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 100);
        }
      }
      return s;
    });
  };

  const calculateProgress = () => {
    if (!roadmap) return 0;
    return Math.round((completedNodes.size / roadmap.nodes.length) * 100);
  };

  return (
    <div className="rm-container">
      <style>{`
        :root {
          --bg-main: #0c0e12;      /* Nền chính rất tối */
          --bg-card: #16181d;      /* Nền card sáng hơn xíu */
          --border-color: #2d3039; /* Màu viền rõ ràng */
          --text-primary: #ffffff;
          --text-secondary: #9ca3af;
          --accent-global: #3b82f6;
          --success: #10b981;
        }

        .rm-container {
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-primary);
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Pattern Background nền lưới nhẹ */
        .rm-grid-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#2d3039 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.15;
          pointer-events: none;
        }

        /* --- Header --- */
        .rm-header {
          position: relative;
          z-index: 20;
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
        .rm-logo-box {
          width: 36px;
          height: 36px;
          background: var(--text-primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
        }
        .rm-brand-text {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.03em;
        }

        /* Search Input - High Contrast */
        .rm-search-bar {
          display: flex;
          align-items: center;
          background: #000;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          width: 480px;
          transition: border-color 0.2s;
        }
        .rm-search-bar:focus-within {
          border-color: var(--accent-global);
        }
        .rm-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }
        .rm-btn-action {
          background: var(--accent-global);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .rm-btn-action:hover { opacity: 0.9; }
        .rm-btn-action:disabled { background: #333; color: #666; cursor: not-allowed; }

        /* --- Progress Bar --- */
        .rm-progress-strip {
          background: #111318;
          padding: 16px 32px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .rm-goal-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        .rm-progress-track {
          width: 200px;
          height: 8px;
          background: #27272a;
          border-radius: 100px;
          overflow: hidden;
        }
        .rm-progress-fill {
          height: 100%;
          background: var(--success);
          transition: width 0.4s ease;
        }

        /* --- Timeline Scroll Area --- */
        .rm-timeline-zone {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: 20px;
        }
        
        .rm-scroll-track {
          display: flex;
          gap: 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 40px 40px 60px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          align-items: flex-start;
          height: 100%;
        }
        
        /* Connector Line - Solid */
        .rm-connector-bg {
          position: absolute;
          top: 98px; /* Alignment fix */
          left: 0;
          right: 0;
          height: 3px;
          background: #27272a;
          z-index: 0;
        }

        /* --- Node Styling --- */
        .rm-node-wrapper {
          scroll-snap-align: center;
          flex-shrink: 0;
          width: 380px;
          margin-right: 32px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          opacity: 0.5;
          transform: scale(0.98);
          transition: all 0.3s ease;
        }
        
        .rm-node-wrapper.is-active {
          opacity: 1;
          transform: scale(1);
        }

        /* Connecting line per node */
        .rm-node-line {
          position: absolute;
          top: 28px;
          right: -32px;
          width: 32px;
          height: 3px;
          background: #27272a;
        }
        .rm-node-line.filled { background: var(--success); }

        /* Header: Icon + Title */
        .rm-node-head {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
        
        .rm-icon-box {
          width: 56px;
          height: 56px;
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--text-secondary);
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        
        .rm-node-wrapper.is-active .rm-icon-box {
          border-color: currentColor; /* Inherits from inline style color */
          box-shadow: 0 0 0 4px rgba(255,255,255,0.05);
        }

        .rm-icon-box.completed {
          background: var(--success);
          border-color: var(--success);
          color: white !important;
        }

        .rm-node-info h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .rm-node-info span {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          opacity: 0.8;
        }

        /* --- CARD STYLING (Sharp & Solid) --- */
        .rm-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-top: 4px solid transparent; /* Placeholder for color */
          border-radius: 12px;
          padding: 24px;
          height: 480px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); /* Deep shadow */
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .rm-node-wrapper.is-active .rm-card {
          border-color: #3f424e;
          /* Top border color comes from inline style */
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }

        .rm-card-content {
          overflow-y: auto;
          flex: 1;
          padding-right: 8px;
        }
        
        /* Custom Scrollbar for card */
        .rm-card-content::-webkit-scrollbar { width: 6px; }
        .rm-card-content::-webkit-scrollbar-track { background: #27272a; border-radius: 4px; }
        .rm-card-content::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }

        .rm-desc {
          color: #d1d5db;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #27272a;
        }

        .rm-section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Tags with COLOR */
        .rm-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 6px;
          margin: 0 8px 8px 0;
          border: 1px solid transparent;
        }

        /* Project List */
        .rm-proj-item {
          background: #1f2229;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          border-left: 3px solid transparent;
          color: #e5e7eb;
        }

        /* Course Link */
        .rm-course-link {
          display: block;
          background: #000;
          border: 1px solid #27272a;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          text-decoration: none;
          color: white;
          transition: 0.2s;
        }
        .rm-course-link:hover {
          border-color: white;
        }

        /* Navigation Buttons */
        .rm-nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #27272a;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: background 0.2s;
        }
        .rm-nav-arrow:hover { background: #3f3f46; }
        .rm-nav-arrow:disabled { opacity: 0.3; cursor: default; }
        .rm-nav-left { left: 24px; }
        .rm-nav-right { right: 24px; }
        
      `}</style>

      {/* --- Ambient Background --- */}
      <div className="rm-grid-bg" />

      {/* --- Header --- */}
      <header className="rm-header">
        <div className="rm-brand">
          <div className="rm-logo-box">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <span className="rm-brand-text">Road Map Generation</span>
        </div>

        <div className="rm-search-bar">
          <Search size={16} className="text-gray-500 ml-2" />
          <input
            className="rm-input"
            placeholder="Goal (e.g. React Native, Data Science...)"
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateRoadmap()}
          />
          <button
            className="rm-btn-action"
            onClick={generateRoadmap}
            disabled={loading || !userGoal.trim()}
          >
            {loading ? '...' : 'Generate'}
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded hover:bg-[#27272a]"
            onClick={() => setShowPathsDropdown(!showPathsDropdown)}
          >
            <History size={16} />
            <span className="hidden sm:inline">Saved Paths</span>
            <ChevronDown size={14} />
          </button>

          {showPathsDropdown && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="p-3 bg-[#1f2229] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a]">Recent History</div>
              <div className="max-h-64 overflow-y-auto">
                {savedPaths.length === 0 ? (
                  <div className="p-4 text-xs text-center text-gray-500">No saved history</div>
                ) : (
                  savedPaths.map(p => (
                    <div key={p.id} className="p-3 hover:bg-[#27272a] cursor-pointer border-b border-[#27272a] last:border-0"
                      onClick={() => { setRoadmap(p.roadmap_data); setShowPathsDropdown(false); }}>
                      <div className="text-sm font-semibold text-white">{p.goal}</div>
                      <div className="text-[11px] text-gray-500 mt-1">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Area --- */}
      <div className="rm-timeline-zone">

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0e12] z-50">
            <div className="w-10 h-10 border-4 border-[#27272a] border-t-blue-500 rounded-full animate-spin mb-4" />
            <div className="text-sm font-mono text-gray-400">BUILDING YOUR ROADMAP...</div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/30 border border-red-500 text-red-400 px-6 py-3 rounded-lg text-sm font-bold shadow-lg z-50">
            Error: {error}
          </div>
        )}

        {!roadmap && !loading && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Layers size={64} className="mb-4" />
            <h2 className="text-2xl font-bold">Start Learning</h2>
            <p className="mt-2">Enter a topic above to begin</p>
          </div>
        )}

        {roadmap && !loading && (
          <>
            {/* Top Info Strip */}
            <div className="rm-progress-strip">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target Goal</div>
                <div className="rm-goal-title">{roadmap.goal}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-400 mb-2">
                  <span className="text-white text-base">{completedNodes.size}</span> / {roadmap.nodes.length} Stages
                </div>
                <div className="rm-progress-track">
                  <div className="rm-progress-fill" style={{ width: `${calculateProgress()}%` }} />
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button className="rm-nav-arrow rm-nav-left" onClick={() => scroll('left')}>←</button>
            <button className="rm-nav-arrow rm-nav-right" onClick={() => scroll('right')}>→</button>

            {/* Horizontal Scroll Track */}
            <div className="rm-scroll-track" ref={scrollRef}>

              {/* Connector Background Line */}
              <div className="rm-connector-bg" />

              {roadmap.nodes.map((node, index) => {
                const isCompleted = completedNodes.has(node.id);
                const isActive = activeNodeId === node.id;
                // Get color palette for this specific node
                const palette = NODE_PALETTES[index % NODE_PALETTES.length];
                const isLast = index === roadmap.nodes.length - 1;

                return (
                  <div
                    key={node.id}
                    id={`node-${node.id}`}
                    className={`rm-node-wrapper ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveNodeId(node.id)}
                  >
                    {/* Line connecting to next node */}
                    {!isLast && (
                      <div className={`rm-node-line ${isCompleted ? 'filled' : ''}`} />
                    )}

                    {/* Node Header */}
                    <div className="rm-node-head">
                      <div
                        className={`rm-icon-box ${isCompleted ? 'completed' : ''}`}
                        style={{ color: isCompleted ? '#fff' : palette.main }}
                        onClick={(e) => { e.stopPropagation(); toggleComplete(node.id, index); }}
                      >
                        {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-mono font-bold">{index + 1}</span>}
                      </div>
                      <div className="rm-node-info">
                        <span style={{ color: palette.main }}>Stage {index + 1}</span>
                        <h3>{node.title}</h3>
                      </div>
                    </div>

                    {/* Node Card */}
                    <div
                      className="rm-card"
                      style={{ borderTopColor: palette.main }}
                    >
                      <div className="rm-card-content">
                        <p className="rm-desc">{node.description}</p>

                        {/* Skills Section */}
                        {node.skills.length > 0 && (
                          <div className="mb-6">
                            <div className="rm-section-label"><Cpu size={12} /> Key Skills</div>
                            <div>
                              {node.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="rm-tag"
                                  style={{ background: palette.bg, color: palette.text, borderColor: palette.bg }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Projects Section */}
                        {node.projects.length > 0 && (
                          <div className="mb-6">
                            <div className="rm-section-label"><Code2 size={12} /> Build These</div>
                            <div>
                              {node.projects.map((proj, i) => (
                                <div
                                  key={i}
                                  className="rm-proj-item"
                                  style={{ borderLeftColor: palette.main }}
                                >
                                  {proj}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Courses Section */}
                        {node.courses.length > 0 && (
                          <div className="mb-2">
                            <div className="rm-section-label"><BookOpen size={12} /> Learn Here</div>
                            {node.courses.map((course, i) => (
                              <a
                                key={i}
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rm-course-link"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-sm">{course.title}</span>
                                  <ArrowRight size={14} style={{ color: palette.main }} />
                                </div>
                                <div className="text-xs text-gray-500">{course.reason}</div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoadmapView;