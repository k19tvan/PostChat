# 📄 PostChat: AI-Powered Social Media Intelligence & Learning Pathfinder

PostChat is an elite AI dashboard designed to scrape, analyze, and synthesize social media data. It combines high-reliability browser automation, Large Language Models (LLMs), and vector databases to provide deep insights into social feeds and generate personalized learning roadmaps derived from community-sourced intelligence.

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="PostChat Banner" width="100%">
</div>

---

## 🚀 Key Features

-   **One-Click Post Extraction**: Seamlessly scrape Facebook posts using the integrated Chrome Extension + Apify.
-   **AI extraction & OCR**: Automatically generate summaries, detect sentiment, extract topics, and perform OCR on images using **Google Gemini 2.0 Flash**.
-   **Semantic RAG Chat**: Chat with your entire library of saved posts using Retrieval-Augmented Generation to find patterns and insights.
-   **Learning Pathfinder**: A sophisticated **6-step AI pipeline** that builds personalized learning roadmaps based on your goals, community advice (Tavily), and saved resources.
-   **Hybrid Search**: Combine standard keyword search with **Semantic Vector Search** (powered by `pgvector`) to find content conceptually.
-   **Premium Dashboard**: A stunning, responsive UI with elite aesthetics, dark/light modes, and interactive pathfinding visualizations.

---

## 🗺️ The Learning Roadmap Pipeline

The `CourseRoadmapAgent` executes a state-of-the-art 6-step synthesis process:
1.  **Learner Profiling**: Extracts your background, constraints, and specific career goals from natural language.
2.  **Search Strategy**: Generates a multi-perspective search strategy to find the best community advice (LinkedIn, Reddit, etc.).
3.  **Corpus Cleaning**: Uses **Tavily Search** to gather a high-signal advisement corpus and Gemini to clean/normalize it.
4.  **Architectural Design**: Builds a progressive 4-7 stage roadmap based on recurring skill clusters and industry patterns.
5.  **Resource Matching**: Conceptually matches your saved Facebook posts and identifies high-quality online courses for each stage.
6.  **UI Synthesis**: Produces a structured, interactive learning path ready for the frontend.

---

## 🛠️ Tech Stack

### Frontend
-   **React 19** with **TypeScript** & **Vite**
-   **Tailwind CSS** for layout + **Vanilla CSS** for premium micro-animations
-   **Lucide React** for iconography
-   **Supabase Auth** for secure user management

### Backend
-   **FastAPI** (Python) for the core API
-   **LangChain** for complex AI orchestration and RAG pipelines
-   **Google Gemini 2.0 Flash** for extraction, chat, and roadmap synthesis
-   **Tavily AI** for advanced real-time advisement search
-   **Apify** for professional-grade scraping
-   **Supabase** (Postgres + pgvector) for relational data and high-dimensional vector storage

---

## ⚙️ Installation & Setup

### 1. Database Initialization
1.  Create a project on [Supabase](https://supabase.com/).
2.  Run `Supabase_Schema.sql` in the **SQL Editor** to initialize the `posts`, `documents` (vector), and `learning_paths` tables.

### 2. Backend Setup
1.  `cd backend`
2.  `pip install -r requirements.txt`
3.  Configure your `.env` in the root.
4.  `python main.py`

### 3. Frontend Setup
1.  `cd ui`
2.  `npm install`
3.  `npm run dev`

### 4. Chrome Extension
1.  Load the `facebook-apify-extension` folder as an "Unpacked" extension in Chrome.
2.  Use the extension on any Facebook post to send it instantly to your PostChat dashboard.

---

## 🔑 Environment Variables

Required in the root `.env`:

```env
# Supabase
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_service_role_key

# AI Keys
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_key
APIFY_API_KEY=your_apify_key
```

---

## 📖 Using the Dashboard

1.  **Feed Analyzer**: View and search all your saved posts. Use "Advanced Mode" for semantic (vector-based) search.
2.  **Conversation**: Chat with your posts. Ask questions like *"Explain the market trends mentioned in my saved tech posts"* or *"What are people saying about AI agents?"*.
3.  **Roadmap Generator**: Enter a goal (e.g., *"Junior Python Backend Dev in 6 months"*) to trigger the Pathfinder pipeline. Explore the progressive stages and access matched resources.
4.  **Learning History**: Use the "Saved Paths" selector in the Roadmap view to switch between your generated learning trajectories.

---

## 📄 License
MIT License. Created by the PostChat Development Team.
