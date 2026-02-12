# Facebook Post Extraction & Management Tool

A comprehensive solution for extracting, storing, and managing Facebook post data. This project combines a Chrome Extension for easy data capture, a Python backend for robust scraping via Apify, and a React frontend for viewing and managing your saved content.

## 🚀 Features

-   **One-Click Extraction**: Capture Facebook posts directly from your browser using the Chrome Extension.
-   **Rich Data Capture**: Extracts post text, images (including high-res & nested albums), reaction counts (Like, Love, Haha, etc.), comments, shares, and timestamps.
-   **OCR Support**: Automatically captures accessibility captions and text from images.
-   **Secure Storage**: vital data is stored securely in Supabase with Row Level Security (RLS).
-   **Authentication**: Integrated Supabase Auth for user management.
-   **Dashboard**: A modern React-based UI to browse, search, and manage your saved posts.

## 🏗️ Architecture

The project consists of three main components:

1.  **Chrome Extension (`facebook-apify-extension`)**:
    *   Injects a floating widget into Facebook pages.
    *   Captures the current post URL.
    *   Sends requests to the local Python backend to trigger the Apify scraper.
    *   Saves the returned data directly to Supabase.
2.  **Backend API (`backend`)**:
    *   A lightweight FastAPI server (`main.py`).
    *   Acts as a bridge between the extension and the Apify API.
    *   Handles the complexity of the Apify Actor execution and response parsing.
3.  **Frontend Dashboard (`ui`)**:
    *   A React + Vite application.
    *   Connects to Supabase to display a feed of saved posts.
    *   Provides filtering and deletion capabilities.

## 🛠️ Prerequisites

-   **Node.js** (v16+)
-   **Python** (v3.9+)
-   **Supabase Account**: For database and authentication.
-   **Apify Account**: You'll need an API Token to use the `apify/facebook-posts-scraper` actor.

## 📦 Installation & Setup

### 1. Database (Supabase)

1.  Create a new Supabase project.
2.  Go to the **SQL Editor** and run the following schema to create the `posts` table:

    ```sql
    create table public.posts (
      id uuid not null default gen_random_uuid (),
      user_id uuid not null default auth.uid (),
      facebook_url text not null,
      content text null,
      images text[] null,
      author_name text not null,
      author_avatar text null,
      timestamp timestamp with time zone not null,
      reactions jsonb null,
      comments_count integer null,
      shares_count integer null,
      raw_json jsonb null,
      created_at timestamp with time zone not null default now(),
      constraint posts_pkey primary key (id)
    );
    
    -- Enable RLS
    alter table public.posts enable row level security;
    
    -- Policies (Adjust as needed)
    create policy "Users can view their own posts" on public.posts for select using (auth.uid() = user_id);
    create policy "Users can insert their own posts" on public.posts for insert with check (auth.uid() = user_id);
    create policy "Users can delete their own posts" on public.posts for delete using (auth.uid() = user_id);
    ```

### 2. Backend (FastAPI)

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install fastapi uvicorn apify-client pydantic
    ```
3.  Start the server:
    ```bash
    python main.py
    ```
    The server will start at `http://localhost:8000`.

### 3. Frontend (React)

1.  Navigate to the `ui` directory:
    ```bash
    cd ui
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    *   Rename `.env.example` to `.env.local` (or create it).
    *   Add your Supabase URL and Anon Key:
        ```env
        VITE_SUPABASE_URL=your_supabase_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### 4. Chrome Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked**.
4.  Select the `facebook-apify-extension` folder.
5.  The extension icon should appear in your toolbar.

## 📖 Usage

1.  **Login**: Open the frontend dashboard (`http://localhost:5173`) or the Extension widget and log in/register with your email.
2.  **Configure API Key**: In the Extension widget, enter your **Apify API Token** (you can get this from your Apify Console).
3.  **Navigate to Facebook**: Go to a specific Facebook post URL (e.g., `https://www.facebook.com/share/p/...`).
4.  **Fetch & Save**:
    *   Click the "Fetch Info" or "Save" button in the extension widget.
    *   The extension will call the backend -> Apify -> generic data -> save to Supabase.
5.  **View Results**: Refresh your Dashboard to see the newly saved post with all its details!

## 🔐 Security & GitHub

To avoid leaking sensitive information (like your Supabase URL or Apify tokens), follow these practices:

### 1. Environment Synchronization
This project uses a central `ui/.env.local` file. Since Chrome Extensions cannot read this file directly, a sync script is provided:
- Run `python sync_env.py` whenever you update your credentials. This generates `facebook-apify-extension/env.js` (which is git-ignored).

### 2. Before You Push
A convenience script `prepare_repo.py` is included to help you push safely:
1. Run `python prepare_repo.py`.
2. This script will:
   - Sync your environment variables to the extension.
   - Scan for hardcoded API keys/secrets in non-ignored files.
   - Advise if it's safe to push.

### 3. File Usage
- `.env.example`: Template for your environment variables.
- `.gitignore`: Configured to exclude `.env`, `env.js`, `test.py`, and `test.json`.

