/**
 * Background service worker for Facebook Post Fetcher Chrome Extension
 * Handles extension lifecycle and messaging between components
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Facebook Post Fetcher extension installed');
    } else if (details.reason === 'update') {
        console.log('Facebook Post Fetcher extension updated');
    }
});

// Keep service worker alive (if needed for long-running tasks)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle any background tasks here if needed
    console.log('Background received message:', message);
    return true; // Will respond asynchronously
});

console.log('Facebook Post Fetcher background service worker loaded');
