import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RoadmapNode {
    id: string;
    title: string;
    description: string;
    skills: string[];
    projects: string[];
    posts: Array<{
        id: string;
        url: string;
        author: string;
        summary: string;
        topics: string[];
        reason: string;
    }>;
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

interface RoadmapViewProps {
    theme?: 'dark' | 'light';
}

const NODE_GLYPHS = ['◈', '◎', '⬡', '◇', '⊕', '★'];

const NODE_PALETTES = [
    { bg: '#0ea5e9', glow: 'rgba(14,165,233,0.4)', label: 'sky', bar: '#38bdf8' },
    { bg: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'violet', bar: '#c084fc' },
    { bg: '#22c55e', glow: 'rgba(34,197,94,0.4)', label: 'emerald', bar: '#4ade80' },
    { bg: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'amber', bar: '#fbbf24' },
    { bg: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'rose', bar: '#f87171' },
    { bg: '#06b6d4', glow: 'rgba(6,182,212,0.4)', label: 'cyan', bar: '#22d3ee' },
];

// --- MOCK DATA for demonstration (remove when wiring to real API) ---
const MOCK_ROADMAP: RoadmapData = {
    goal: 'Python Backend Developer',
    timeline_style: 'progressive',
    nodes: [
        {
            id: 'n1',
            title: 'Python Fundamentals',
            description: 'Master the core language: syntax, data structures, OOP, and the standard library. This is the bedrock everything else stands on.',
            skills: ['Variables & Types', 'Functions', 'Classes & OOP', 'List Comprehensions', 'Error Handling', 'File I/O'],
            projects: ['CLI Todo App', 'File Organizer Script', 'Text Adventure Game'],
            posts: [],
            courses: [
                { id: 'c1', title: 'Python for Everybody – Coursera', url: 'https://coursera.org', reason: 'Best structured intro' },
                { id: 'c2', title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com', reason: 'Practical projects' },
            ],
        },
        {
            id: 'n2',
            title: 'Web Frameworks',
            description: 'Learn FastAPI for modern async APIs and Django for full-stack power. Build RESTful services that scale.',
            skills: ['FastAPI', 'Django', 'REST principles', 'Pydantic', 'Django ORM', 'Middleware'],
            projects: ['REST API for a blog', 'Auth service with JWT', 'Django admin portal'],
            posts: [],
            courses: [
                { id: 'c3', title: 'FastAPI – Full Course', url: 'https://fastapi.tiangolo.com', reason: 'Official + modern' },
                { id: 'c4', title: 'Django for Beginners', url: 'https://djangoforbeginners.com', reason: 'Project-based' },
            ],
        },
        {
            id: 'n3',
            title: 'Databases & SQL',
            description: 'PostgreSQL mastery, indexing strategies, query optimisation, and the SQLAlchemy ORM for seamless Python integration.',
            skills: ['PostgreSQL', 'SQLAlchemy', 'Migrations', 'Indexing', 'Transactions', 'Redis'],
            projects: ['E-commerce DB schema', 'Caching layer with Redis', 'Full-text search service'],
            posts: [],
            courses: [
                { id: 'c5', title: 'PostgreSQL Tutorial', url: 'https://postgresqltutorial.com', reason: 'Comprehensive reference' },
            ],
        },
        {
            id: 'n4',
            title: 'DevOps & Deployment',
            description: 'Containerise with Docker, orchestrate with Kubernetes, set up CI/CD pipelines, and monitor in production.',
            skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'Nginx', 'Prometheus', 'Grafana'],
            projects: ['Dockerise a FastAPI app', 'CI/CD pipeline on GitHub', 'K8s cluster deployment'],
            posts: [],
            courses: [
                { id: 'c6', title: 'Docker & Kubernetes – Udemy', url: 'https://udemy.com', reason: 'Hands-on labs' },
            ],
        },
        {
            id: 'n5',
            title: 'System Design',
            description: 'Think at scale: distributed systems, message queues, microservices, CAP theorem, and designing for resilience.',
            skills: ['Microservices', 'RabbitMQ / Kafka', 'Load Balancing', 'CAP Theorem', 'Rate Limiting', 'gRPC'],
            projects: ['Event-driven order system', 'API Gateway pattern', 'Rate limiter from scratch'],
            posts: [],
            courses: [
                { id: 'c7', title: 'Designing Data-Intensive Applications', url: 'https://dataintensive.net', reason: 'The bible of system design' },
            ],
        },
    ],
};

export const RoadmapView: React.FC<RoadmapViewProps> = ({ theme = 'dark' }) => {
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(MOCK_ROADMAP);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userGoal, setUserGoal] = useState('');
    const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [inputFocused, setInputFocused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        checkScroll();
        return () => el.removeEventListener('scroll', checkScroll);
    }, [roadmap, checkScroll]);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'right' ? 440 : -440, behavior: 'smooth' });
    };

    const generateRoadmap = async () => {
        if (!userGoal.trim()) return;
        setLoading(true);
        setError(null);
        setRoadmap(null);
        setCompletedNodes(new Set());
        try {
            const res = await fetch('http://localhost:8000/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: userGoal }),
            });
            if (!res.ok) throw new Error('Failed to generate roadmap');
            const data = await res.json();
            setRoadmap(data.data || data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const toggleComplete = (id: string) => {
        setCompletedNodes(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const progress = roadmap ? Math.round((completedNodes.size / roadmap.nodes.length) * 100) : 0;

    return (
        <>
            <style>{`
        /* Global variables from ThemeStyles are used here */

        .rm-root {
          font-family: 'Syne', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* ── Ambient background ── */
        .rm-ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .rm-ambient::before {
          content: '';
          position: absolute;
          top: -30%;
          left: -20%;
          width: 60%;
          height: 80%;
          background: radial-gradient(ellipse, rgba(124,109,250,0.07) 0%, transparent 70%);
          filter: blur(60px);
        }
        .rm-ambient::after {
          content: '';
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 50%;
          height: 60%;
          background: radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%);
          filter: blur(80px);
        }

        /* ── Scanline texture ── */
        .rm-scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
        }

        /* ── Header ── */
        .rm-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 20px 32px;
          border-bottom: 1px solid var(--border);
          background: rgba(5,5,8,0.85);
          backdrop-filter: blur(20px);
        }

        .rm-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .rm-logo-mark {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c6dfa, #a78bfa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 0 20px rgba(124,109,250,0.35);
          flex-shrink: 0;
        }

        .rm-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .rm-logo-title {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .rm-logo-sub {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--muted);
          margin-top: 3px;
          letter-spacing: 0.08em;
        }

        /* ── Search bar ── */
        .rm-search-wrap {
          flex: 1;
          max-width: 600px;
          position: relative;
        }

        .rm-search-inner {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .rm-search-inner.focused {
          border-color: rgba(124,109,250,0.5);
          box-shadow: 0 0 0 3px rgba(124,109,250,0.1), 0 0 30px rgba(124,109,250,0.08);
        }

        .rm-search-icon {
          padding: 0 14px;
          color: var(--muted);
          font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          height: 44px;
          display: flex;
          align-items: center;
        }

        .rm-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          padding: 0 16px;
          height: 44px;
        }

        .rm-search-input::placeholder {
          color: var(--muted);
        }

        .rm-search-btn {
          height: 44px;
          padding: 0 20px;
          background: linear-gradient(135deg, #7c6dfa, #a78bfa);
          border: none;
          color: white;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rm-search-btn:hover:not(:disabled) {
          opacity: 0.88;
        }

        .rm-search-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .rm-search-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ── Progress bar ── */
        .rm-stats {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
        }

        .rm-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .rm-stat-label {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
          color: var(--muted);
          text-transform: uppercase;
        }

        .rm-stat-value {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }

        .rm-progress-bar-wrap {
          width: 120px;
          height: 4px;
          background: var(--surface2);
          border-radius: 4px;
          overflow: hidden;
        }

        .rm-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px rgba(124,109,250,0.6);
        }

        /* ── Goal strip ── */
        .rm-goal-strip {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .rm-goal-label {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.12em;
          color: var(--accent2);
          text-transform: uppercase;
        }

        .rm-goal-divider {
          width: 1px;
          height: 14px;
          background: var(--border);
        }

        .rm-goal-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .rm-badge {
          margin-left: auto;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 10px;
          border-radius: 100px;
          background: rgba(124,109,250,0.12);
          color: var(--accent2);
          border: 1px solid rgba(124,109,250,0.25);
          letter-spacing: 0.06em;
        }

        /* ── Timeline area ── */
        .rm-timeline-area {
          flex: 1;
          position: relative;
          z-index: 5;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        /* ── Scroll track ── */
        .rm-scroll-track {
          display: flex;
          align-items: flex-start;
          gap: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          padding: 48px 80px 56px;
          height: 100%;
          box-sizing: border-box;
          scroll-snap-type: x mandatory;
        }

        .rm-scroll-track::-webkit-scrollbar {
          display: none;
        }

        /* ── Connector line (passes behind nodes) ── */
        .rm-connector-line {
          position: absolute;
          top: 107px;
          left: 80px;
          right: 80px;
          height: 1px;
          z-index: 0;
          overflow: hidden;
        }

        .rm-connector-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.08) 0px,
            rgba(255,255,255,0.08) 8px,
            transparent 8px,
            transparent 20px
          );
        }

        /* ── Stage column ── */
        .rm-stage {
          flex-shrink: 0;
          width: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          scroll-snap-align: start;
          position: relative;
          animation: stageIn 0.5s cubic-bezier(0.4,0,0.2,1) both;
        }

        @keyframes stageIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* connector between stages */
        .rm-stage:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 30px;
          left: calc(50% + 31px);
          width: calc(360px - 64px + 0px);
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04));
          z-index: 0;
        }

        /* ── Node orb ── */
        .rm-orb-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .rm-orb {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
          position: relative;
          z-index: 2;
          border: 1.5px solid rgba(255,255,255,0.12);
        }

        .rm-orb:hover {
          transform: scale(1.12) translateY(-3px);
        }

        .rm-orb.completed {
          border-color: rgba(52,211,153,0.5);
        }

        .rm-orb.completed::after {
          content: '✓';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: rgba(52,211,153,0.18);
          backdrop-filter: blur(4px);
          border-radius: 14px;
          color: var(--success);
          font-family: 'Syne', sans-serif;
          font-weight: 800;
        }

        .rm-orb-num {
          margin-top: 10px;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.12em;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* ── Card ── */
        .rm-card {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          max-height: 520px;
          position: relative;
        }

        .rm-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .rm-card.active {
          border-color: rgba(124,109,250,0.4);
          box-shadow: 0 0 0 1px rgba(124,109,250,0.2), 0 20px 60px rgba(0,0,0,0.5);
        }

        .rm-card.completed-card {
          border-color: rgba(52,211,153,0.3);
        }

        /* card header color bar */
        .rm-card-bar {
          height: 3px;
          width: 100%;
          flex-shrink: 0;
        }

        .rm-card-head {
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .rm-card-stage-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--muted);
          margin-bottom: 10px;
        }

        .rm-card-title {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text);
          line-height: 1.25;
          margin-bottom: 8px;
        }

        .rm-card-desc {
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--muted);
          font-weight: 400;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* card body */
        .rm-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .rm-card-body::-webkit-scrollbar {
          width: 3px;
        }

        .rm-card-body::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }

        /* section */
        .rm-section-label {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rm-section-label::before {
          content: '';
          display: inline-block;
          width: 12px;
          height: 1px;
          background: currentColor;
          opacity: 0.5;
        }

        /* skills */
        .rm-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .rm-skill-tag {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          padding: 4px 10px;
          border-radius: 7px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text);
          letter-spacing: 0.02em;
          transition: border-color 0.15s;
        }

        .rm-skill-tag:hover {
          border-color: var(--border-hover);
        }

        /* projects */
        .rm-project-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          font-size: 12px;
          color: var(--text);
          line-height: 1.45;
          margin-bottom: 6px;
          transition: border-color 0.15s;
        }

        .rm-project-item:last-child {
          margin-bottom: 0;
        }

        .rm-project-item:hover {
          border-color: var(--border-hover);
        }

        .rm-project-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        /* courses */
        .rm-course-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          text-decoration: none;
          color: var(--text);
          font-size: 12px;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 6px;
        }

        .rm-course-link:last-child {
          margin-bottom: 0;
        }

        .rm-course-link:hover {
          border-color: var(--border-hover);
          background: rgba(124,109,250,0.06);
        }

        .rm-course-title {
          font-weight: 600;
          line-height: 1.35;
        }

        .rm-course-arrow {
          flex-shrink: 0;
          font-size: 12px;
          opacity: 0.4;
          transition: opacity 0.15s, transform 0.15s;
        }

        .rm-course-link:hover .rm-course-arrow {
          opacity: 0.9;
          transform: translate(2px, -2px);
        }

        /* ── Scroll controls ── */
        .rm-scroll-btn {
          position: absolute;
          z-index: 20;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, opacity 0.15s, transform 0.15s;
          font-size: 16px;
          font-family: 'JetBrains Mono', monospace;
          backdrop-filter: blur(8px);
        }

        .rm-scroll-btn:hover {
          background: var(--surface2);
          border-color: var(--border-hover);
          transform: translateY(-50%) scale(1.08);
        }

        .rm-scroll-btn:disabled {
          opacity: 0.2;
          cursor: not-allowed;
          transform: translateY(-50%) scale(1);
        }

        .rm-scroll-btn.left { left: 16px; }
        .rm-scroll-btn.right { right: 16px; }

        /* ── Empty state ── */
        .rm-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 5;
        }

        .rm-empty-glyph {
          font-size: 64px;
          opacity: 0.08;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
        }

        .rm-empty-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          opacity: 0.7;
        }

        .rm-empty-sub {
          font-size: 13px;
          color: var(--muted);
          max-width: 300px;
          text-align: center;
          line-height: 1.6;
        }

        /* ── Loading spinner ── */
        .rm-loader {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          z-index: 5;
        }

        .rm-spinner {
          width: 40px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.06);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .rm-loading-label {
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* ── Error pill ── */
        .rm-error {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          padding: 10px 22px;
          border-radius: 100px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          font-size: 12.5px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.04em;
          white-space: nowrap;
          animation: fadeDown 0.3s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }

        /* ── End cap ── */
        .rm-end-cap {
          flex-shrink: 0;
          width: 80px;
          display: flex;
          align-items: flex-start;
          padding-top: 28px;
          justify-content: flex-start;
          opacity: 0.15;
        }

        .rm-end-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--muted);
        }

        /* stage animation delays */
        .rm-stage:nth-child(1) { animation-delay: 0.05s; }
        .rm-stage:nth-child(2) { animation-delay: 0.12s; }
        .rm-stage:nth-child(3) { animation-delay: 0.19s; }
        .rm-stage:nth-child(4) { animation-delay: 0.26s; }
        .rm-stage:nth-child(5) { animation-delay: 0.33s; }
        .rm-stage:nth-child(6) { animation-delay: 0.40s; }

        /* gap between stages */
        .rm-stage + .rm-stage {
          margin-left: 40px;
        }
      `}</style>

            <div className="rm-root">
                <div className="rm-ambient" />
                <div className="rm-scanlines" />

                {/* ── Header ── */}
                <header className="rm-header">
                    <div className="rm-logo">
                        <div className="rm-logo-mark">◈</div>
                        <div className="rm-logo-text">
                            <div className="rm-logo-title">Pathfinder</div>
                            <div className="rm-logo-sub">learning roadmap</div>
                        </div>
                    </div>

                    <div className="rm-search-wrap">
                        <div className={`rm-search-inner${inputFocused ? ' focused' : ''}`}>
                            <div className="rm-search-icon">~/goal</div>
                            <input
                                className="rm-search-input"
                                type="text"
                                value={userGoal}
                                onChange={e => setUserGoal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && generateRoadmap()}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="e.g. Python Backend Developer, iOS Engineer…"
                                disabled={loading}
                            />
                            <button
                                className="rm-search-btn"
                                onClick={generateRoadmap}
                                disabled={loading || !userGoal.trim()}
                            >
                                {loading ? (
                                    <>
                                        <div className="rm-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                        Generating
                                    </>
                                ) : (
                                    <>↗ Generate</>
                                )}
                            </button>
                        </div>
                    </div>

                    {roadmap && (
                        <div className="rm-stats">
                            <div className="rm-stat" style={{ alignItems: 'flex-end' }}>
                                <div className="rm-stat-label">Progress</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="rm-progress-bar-wrap">
                                        <div className="rm-progress-bar-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="rm-stat-value" style={{ minWidth: 34, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: progress === 100 ? 'var(--success)' : 'var(--accent2)' }}>
                                        {progress}%
                                    </div>
                                </div>
                            </div>
                            <div className="rm-stat">
                                <div className="rm-stat-label">Stages</div>
                                <div className="rm-stat-value" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                                    {completedNodes.size} / {roadmap.nodes.length}
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Goal strip ── */}
                {roadmap && (
                    <div className="rm-goal-strip">
                        <div className="rm-goal-label">target</div>
                        <div className="rm-goal-divider" />
                        <div className="rm-goal-text">{roadmap.goal}</div>
                        <div className="rm-badge">{roadmap.timeline_style || 'progressive'}</div>
                    </div>
                )}

                {/* ── Main content ── */}
                <div className="rm-timeline-area">
                    {error && <div className="rm-error">⚠ {error}</div>}

                    {!roadmap && !loading && (
                        <div className="rm-empty">
                            <div className="rm-empty-glyph">◈</div>
                            <div className="rm-empty-title">Chart your course</div>
                            <div className="rm-empty-sub">
                                Enter a learning goal above and get a step-by-step roadmap built for you.
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="rm-loader">
                            <div className="rm-spinner" />
                            <div className="rm-loading-label">Generating roadmap…</div>
                        </div>
                    )}

                    {roadmap && !loading && (
                        <>
                            {/* Connector dashes */}
                            <div className="rm-connector-line" />

                            {/* Scroll arrows */}
                            <button
                                className="rm-scroll-btn left"
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                            >
                                ←
                            </button>
                            <button
                                className="rm-scroll-btn right"
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                            >
                                →
                            </button>

                            <div className="rm-scroll-track" ref={scrollRef}>
                                {roadmap.nodes.map((node, index) => {
                                    const palette = NODE_PALETTES[index % NODE_PALETTES.length];
                                    const glyph = NODE_GLYPHS[index % NODE_GLYPHS.length];
                                    const isCompleted = completedNodes.has(node.id);
                                    const isActive = activeNode === node.id;

                                    return (
                                        <div
                                            key={node.id}
                                            className="rm-stage"
                                            onClick={() => setActiveNode(isActive ? null : node.id)}
                                        >
                                            {/* Orb */}
                                            <div className="rm-orb-wrap">
                                                <button
                                                    className={`rm-orb${isCompleted ? ' completed' : ''}`}
                                                    style={{
                                                        background: isCompleted
                                                            ? `rgba(52,211,153,0.1)`
                                                            : `${palette.bg}18`,
                                                        boxShadow: isCompleted
                                                            ? `0 0 24px rgba(52,211,153,0.3), 0 0 0 1.5px rgba(52,211,153,0.3)`
                                                            : `0 0 24px ${palette.glow}, 0 0 0 1.5px ${palette.bg}40`,
                                                    }}
                                                    onClick={e => { e.stopPropagation(); toggleComplete(node.id); }}
                                                    title="Click to mark complete"
                                                >
                                                    <span style={{ color: palette.bg, fontSize: 20 }}>{glyph}</span>
                                                </button>
                                                <div className="rm-orb-num">
                                                    stage {String(index + 1).padStart(2, '0')}
                                                </div>
                                            </div>

                                            {/* Card */}
                                            <div className={`rm-card${isActive ? ' active' : ''}${isCompleted ? ' completed-card' : ''}`}>
                                                {/* Color bar */}
                                                <div
                                                    className="rm-card-bar"
                                                    style={{
                                                        background: isCompleted
                                                            ? `linear-gradient(90deg, var(--success), #6ee7b7)`
                                                            : `linear-gradient(90deg, ${palette.bg}, ${palette.bar})`,
                                                    }}
                                                />

                                                {/* Head */}
                                                <div className="rm-card-head">
                                                    <div className="rm-card-stage-tag">
                                                        <span style={{ color: palette.bg }}>●</span>
                                                        {palette.label}
                                                    </div>
                                                    <div className="rm-card-title">{node.title}</div>
                                                    <div className="rm-card-desc">{node.description}</div>
                                                </div>

                                                {/* Body */}
                                                <div className="rm-card-body">
                                                    {/* Skills */}
                                                    {node.skills.length > 0 && (
                                                        <div>
                                                            <div className="rm-section-label">skills to master</div>
                                                            <div className="rm-skills">
                                                                {node.skills.map((skill, i) => (
                                                                    <div key={i} className="rm-skill-tag">{skill}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Projects */}
                                                    {node.projects.length > 0 && (
                                                        <div>
                                                            <div className="rm-section-label">projects</div>
                                                            {node.projects.map((p, i) => (
                                                                <div key={i} className="rm-project-item">
                                                                    <div
                                                                        className="rm-project-dot"
                                                                        style={{ background: palette.bg }}
                                                                    />
                                                                    {p}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Courses */}
                                                    {node.courses.length > 0 && (
                                                        <div>
                                                            <div className="rm-section-label">recommended courses</div>
                                                            {node.courses.map((course, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={course.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rm-course-link"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <div className="rm-course-title">{course.title}</div>
                                                                    <div className="rm-course-arrow">↗</div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* End cap */}
                                <div className="rm-end-cap">
                                    <div className="rm-end-dot" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default RoadmapView;