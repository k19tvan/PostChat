<div align="center">

# 🌌 PostChat
### AI-Powered Social Media Extraction & Analysis

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

</div>

---

## 📖 Overview

**Nebula Connect** is a sophisticated platform designed to bridge the gap between raw social media data and actionable insights. By leveraging the power of **Google Gemini AI**, **LangChain**, and **Supabase**, it transforms chaotic Facebook post data into structured, searchable, and meaningful information.

Whether you're tracking brand sentiment, analyzing market trends, or archiving important social discussions, Nebula Connect provides the tools to do it with precision.

## ✨ Key Features

-   **🤖 AI-Powered Extraction**: Automatically processes raw Facebook data to generate:
    -   Concise 1-2 sentence summaries.
    -   Sentiment analysis (Positive, Neutral, Negative, Mixed).
    -   Automated categorization (News, Tech, Personal, Meme, etc.).
    -   Key topic and tag identification.
-   **🔍 Advanced Hybrid Search**: 
    -   **Semantic Search**: Find posts based on meaning and context using vector embeddings (`pgvector`).
    -   **Keyword Search**: Traditional lightning-fast full-text search.
-   **📊 Engagement Analytics**: Tracks likes, comments, shares, and detailed reaction breakdowns.
-   **📑 Media & Link Extraction**: Reliably extracts high-res images, video URLs, and external links, including OCR text from images.
-   **🔌 Browser Extension**: Integrated Facebook Apify extension for seamless data ingestion.
-   **💬 Interactive Feed**: A modern, responsive React-based dashboard for viewing and interacting with your saved data.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)

### Backend
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
-   **AI Orchestration**: [LangChain](https://www.langchain.com/)
-   **LLM**: [Google Gemini 2.5 Flash / Pro](https://deepmind.google/technologies/gemini/)
-   **Scraping**: [Apify Client](https://apify.com/apify/facebook-posts-scraper)

### Database & Infrastructure
-   **Primary Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Vector Search**: [pgvector](https://github.com/pgvector/pgvector) for embedding storage and similarity search.

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18+)
-   [Python 3.10+](https://www.python.org/)
-   [Supabase Account](https://supabase.com/)
-   [Google AI Studio API Key](https://aistudio.google.com/)
-   [Apify API Key](https://apify.com/)

### 1. Database Setup

1.  Create a new project in **Supabase**.
2.  Run the contents of [`Supabase_Schema.sql`](./Supabase_Schema.sql) in the SQL Editor to set up the necessary tables and vector extensions.

### 2. Backend Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```

Create a `.env` file in the root directory (one level above `backend/`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GOOGLE_API_KEY=your_gemini_api_key
APIFY_API_KEY=your_apify_api_key
```

Run the backend:
```bash
python main.py
```

### 3. Frontend Installation

```bash
cd ui
npm install
```

Create a `ui/.env` (or update existing):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the frontend:
```bash
npm run dev
```

---

## 📁 Project Structure

```text
PostExtraction/
├── backend/                # FastAPI Application logic
│   ├── main.py             # Core API and AI extraction logic
│   └── requirements.txt    # Python dependencies
├── ui/                     # React + Vite Frontend
│   ├── src/                # Frontend source code
│   └── package.json        # Node.js dependencies
├── facebook-apify-extension/# Browser extension for scraping
├── Supabase_Schema.sql     # Database initialization script
└── .env                    # Shared environment variables
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

