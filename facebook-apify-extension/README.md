# 🔌 Facebook Post Extractor Extension

This browser extension allows you to quickly trigger the extraction and AI processing of Facebook posts directly from your browser.

## 🚀 Installation

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (toggle in the top-right).
3.  Click **Load unpacked**.
4.  Select the `facebook-apify-extension` folder.

## ⚙️ Configuration

The extension requires an environment configuration to communicate with the backend. 

1.  Ensure the `env.js` file in this directory contains the correct backend URL.
2.  You can use `sync_extension_env.py` in the root directory to automatically synchronize environment variables if needed.

## 🛠️ Usage

1.  Navigate to any Facebook post.
2.  Click the extension icon or use the integrated UI (if enabled in `content.js`).
3.  The post data will be scraped via Apify and sent to the Nebula Connect backend for AI processing and storage.
