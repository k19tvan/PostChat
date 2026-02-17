# 📄 PostChat: AI-Powered Social Media Intelligence

PostChat (formerly Nebula Connect) is a powerful tool designed to scrape, analyze, and interact with Facebook posts using advanced AI. It combines browser automation, Large Language Models (LLMs), and vector databases to provide a sophisticated dashboard for monitoring social media content.

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="PostChat Banner" width="100%">
</div>

---

## 🚀 Key Features

-   **One-Click Post Extraction**: Seamlessly scrape Facebook posts using the integrated Chrome Extension.
-   **AI-Powered Analysis**: Automatically generate summaries, detect sentiment, extract topics, and perform OCR on images using **Google Gemini**.
-   **Hybrid Search**: Find posts using standard keyword search or **Semantic Search** (Vector search) powered by embeddings.
-   **Intelligent RAG Chat**: Chat with your saved posts using Retrieval-Augmented Generation to get deep insights across your entire feed.
-   **Elegant Dashboard**: A modern, responsive UI with dark/light mode support for managing and analyzing extracted data.

---

## 🛠️ Tech Stack

### Frontend
-   **React 19** with **TypeScript**
-   **Vite** for lightning-fast development
-   **Tailwind CSS** for styling
-   **Lucide React** for icons
-   **Supabase Auth** for user management

### Backend
-   **FastAPI** (Python)
-   **LangChain** for AI orchestration
-   **Google Gemini 1.5 Flash** for extraction and chat
-   **Apify** for high-reliability Facebook scraping
-   **Supabase** (PostgreSQL + pgvector) for storage and vector search

### Browser Extension
-   **Chrome Extension API**
-   Integrated with the backend for direct post processing

---

## 📁 Project Structure

```text
PostChat/
├── backend/                # FastAPI Python server
│   ├── main.py             # Core logic and API endpoints
│   └── requirements.txt    # Python dependencies
├── ui/                     # React frontend
│   ├── components/         # UI components
│   ├── services/           # API and Supabase services
│   └── package.json        # Frontend dependencies
├── facebook-apify-extension/# Chrome extension for scraping
├── crawl/                  # Independent crawler scripts
├── Supabase_Schema.sql     # Database initialization script
├── .env                    # Root environment variables
└── syncExtension.py        # Utility to sync env to extension
```

---

## ⚙️ Installation & Setup

### 1. Supabase Setup
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Run the contents of `Supabase_Schema.sql` in the **SQL Editor** of your Supabase dashboard to set up the `posts` and `documents` tables and the `match_documents` function.
3.  Ensure the `vector` extension is enabled (handled by the script).

### 2. Backend Setup
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure environment variables in the root `.env` (see below).
4.  Run the server:
    ```bash
    python main.py
    ```

### 3. Frontend Setup
1.  Navigate to the `ui` directory:
    ```bash
    cd ui
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `ui/.env`.
4.  Run the development server:
    ```bash
    npm run dev
    ```

### 4. Browser Extension Setup
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode**.
3.  Click **Load unpacked** and select the `facebook-apify-extension` folder.
4.  Use `python syncExtension.py` from the root to sync your backend URL to the extension.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and `ui/` directory with the following:

### Root `.env` (for Backend)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GOOGLE_API_KEY=your_gemini_api_key
APIFY_API_KEY=your_apify_api_key
```

### `ui/.env` (for Frontend)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:8000
```

---

## 📖 Usage

1.  **Extraction**: Navigate to a Facebook post, click the PostChat extension, and trigger "Extract Post".
2.  **Analysis**: View the processed post in the "Feed Analyzer" tab of the web dashboard.
3.  **Discovery**: Search for posts using specific keywords or conceptual queries (Semantic Search).
4.  **Interaction**: Use "Conversation Mode" to ask the AI questions about your saved posts (e.g., "What were the main tech trends in my saved posts last week?").

---

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.
