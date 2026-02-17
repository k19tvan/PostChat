<div align="center">
  <h1>PostChat</h1>
  <p><b>Elite AI Social Media Intelligence & Learning Pathfinder</b></p>
</div>

---

PostChat is a state-of-the-art AI ecosystem designed to capture, synthesize, and transform social media data into actionable intelligence. By integrating high-fidelity browser automation, advanced Large Language Models, and high-dimensional vector search, PostChat empowers users to navigate the noise of social feeds and extract personalized learning trajectories with surgical precision.

## 🚀 Core Pillar Technologies

-   **Intelligent Extraction**: Real-time Facebook post scraping via integrated Chrome Extension and professional-grade Apify infrastructure.
-   **Neural Synthesis (Gemini 2.0 Flash)**: High-performance OCR, automated summarization, and sentiment analysis powered by Google's fastest frontier model.
-   **Semantic Memory**: A sophisticated RAG (Retrieval-Augmented Generation) engine utilizing `pgvector` for conceptual discovery across your entire post library.
-   **The Pathfinder Engine**: A proprietary 6-step AI pipeline that architects professional learning roadmaps by cross-referencing industry trends with community-sourced wisdom.
-   **Visceral Dashboard**: A premium, motion-rich interface engineered for performance and clarity, featuring glassmorphism aesthetics and responsive dynamics.

## 🗺️ The Pathfinder Pipeline

The `CourseRoadmapAgent` orchestrates a multi-agentic workflow:
1.  **Learner Profiling**: Deep analysis of user objectives and constraints.
2.  **Strategic Research**: High-signal search across LinkedIn, Reddit, and specialized forums.
3.  **Corpus Normalization**: Filtering and structuring community intelligence.
4.  **Architectural Blueprinting**: Designing progressive stages based on logical skill dependencies.
5.  **Resource Integration**: Precise matching with saved posts and verified online curriculum.
6.  **Interactive Synthesis**: Rendering a navigable, animated timeline of your career trajectory.

## 🛠️ Infrastructure

### Frontend
-   **React 19 / TypeScript / Vite**
-   **Tailwind CSS & Vanilla CSS Transitions**
-   **Supabase Auth (OAuth Integration)**

### Backend
-   **FastAPI** for high-performance API routing.
-   **LangChain** for complex LLM orchestration.
-   **PostgreSQL / pgvector** for persistent semantic storage.
-   **Tavily AI** for real-time web-scale research.

---

## ⚙️ Deployment Sequence

### 1. Database Provisioning
Run the `Supabase_Schema.sql` in your Supabase SQL Editor. This initializes the `posts`, `documents`, and `learning_paths` infrastructure.

### 2. Backend Initialization
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Frontend Activation
```bash
cd ui
npm install
npm run dev
```

### 4. Extension Integration
Load `facebook-apify-extension` into Chrome (Developer Mode). Use `syncExtension.py` to bridge the extension to your local server.

---

## 🔑 Security & Configuration

Configure your environment variables in the root `.env`:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-key"

# Intelligence Engines
GOOGLE_API_KEY="your-gemini-key"
TAVILY_API_KEY="your-tavily-key"
APIFY_API_KEY="your-apify-key"
```

---

## 📄 License & Credits
Licensed under the MIT License. Developed for elite users demanding superior social media intelligence.
