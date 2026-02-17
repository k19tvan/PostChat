import React from 'react';

export const COMPONENT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* High-Performance Professional Light Mode */
  --bg: #fdfdfd;
  --surface: #ffffff;
  --surface2: #f4f7fa;
  --border: rgba(30, 41, 59, 0.08);
  --border-hover: rgba(30, 41, 59, 0.15);
  --text: #0f172a;
  --muted: #64748b;
  --accent: #6366f1;
  --accent2: #8b5cf6;
  --success: #10b981;
  --glass: rgba(255, 255, 255, 0.85);
  --card-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.dark {
  /* Elite Professional Dark Mode */
  --bg: #090a11;
  --surface: #11131f;
  --surface2: #191c2e;
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --text: #f8fafc;
  --muted: #94a3b8;
  --accent: #7c3aed;
  --accent2: #06b6d4;
  --success: #22c55e;
  --glass: rgba(13, 15, 26, 0.85);
  --card-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rm-root {
  font-family: 'Outfit', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* ── Refined Ambient Lighting ── */
.rm-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.rm-ambient::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
  filter: blur(140px);
  opacity: 0.04;
  animation: float-slow 20s infinite alternate ease-in-out;
}
.rm-ambient::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, var(--accent2) 0%, transparent 60%);
  filter: blur(140px);
  opacity: 0.04;
  animation: float-slow 25s infinite alternate-reverse ease-in-out;
}

.dark .rm-ambient::before, .dark .rm-ambient::after {
  opacity: 0.12;
}

@keyframes float-slow {
  from { transform: translate(0, 0); }
  to { transform: translate(5%, 5%); }
}

/* ── Micro-Texture ── */
.rm-scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlE6biAAAAB3RSTlMAAAAAAAAAdvv7mgAAAB9JREFUKM9jYEAHzmBAOAgDInAgAgciMCAAh8AQhgMA+6MDR1Y3RVsAAAAASUVORK5CYII=");
  background-repeat: repeat;
  opacity: 0.03;
  mix-blend-mode: overlay;
}

/* ── Modern Navigation Header ── */
.rm-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  background: var(--glass);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

/* ── Elite UI Components ── */
.rm-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: var(--card-shadow);
}
.rm-card:hover {
  transform: translateY(-8px) scale(1.005);
  border-color: var(--accent);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
}

.rm-btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border: none;
  color: white;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 14px;
  padding: 0 28px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 16px -4px rgba(124, 58, 237, 0.4);
}
.rm-btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px -5px rgba(124, 58, 237, 0.5);
  filter: brightness(1.1);
}
.rm-btn-primary:active:not(:disabled) {
  transform: scale(0.96);
}

.rm-btn-secondary {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0 20px;
  height: 48px;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}
.rm-btn-secondary:hover {
  background: var(--surface);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}
.rm-btn-secondary.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  box-shadow: 0 8px 16px -4px rgba(124, 58, 237, 0.3);
}

.rm-input {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 24px;
  height: 52px;
  width: 100%;
  box-sizing: border-box;
  font-size: 15px;
}
.rm-input:focus {
  background: var(--surface);
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
  outline: none;
}

.rm-tag {
  font-family: 'JetBrains Mono', monospace;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Custom Selection */
::selection {
  background: var(--accent);
  color: white;
}

/* Scrollbar Engineering */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 20px;
  border: 2px solid var(--bg);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}
`;

export const ThemeStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{ __html: COMPONENT_STYLES }} />
);
