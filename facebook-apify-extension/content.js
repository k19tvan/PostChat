/**
 * Content script for Facebook Post Fetcher Chrome Extension
 * Injects a floating, draggable widget for fetching post data with Auth simulation
 */

console.log('PostChat: Initializing floating widget...');

if (document.getElementById('fb-apify-widget-root')) {
    console.log('Widget already exists');
} else {
    createFloatingWidget();
}

function createFloatingWidget() {
    const host = document.createElement('div');
    host.id = 'fb-apify-widget-root';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
        :host {
            all: initial;
            z-index: 99999;
            position: fixed;
            top: 20px;
            right: 20px;
        }

        .widget-wrapper {
            position: relative;
        }

        .minimized-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
            user-select: none;
        }

        .minimized-icon:hover {
            transform: scale(1.1);
        }

        .minimized-icon span {
            font-family: sans-serif;
            font-size: 24px;
            font-weight: bold;
            color: white;
        }

        .widget-container {
            width: 320px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: none;
        }

        .widget-container.visible {
            display: block;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            cursor: move;
            user-select: none;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-title-area {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .minimize-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
            line-height: 1;
            border-radius: 4px;
        }

        .minimize-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(to right, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Auth Section */
        .auth-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-badge {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }

        .user-name {
            font-weight: 600;
            color: #667eea;
        }

        .logout-btn {
            background: none;
            border: none;
            color: #ff4d4d;
            cursor: pointer;
            font-size: 11px;
            padding: 0;
            text-decoration: underline;
        }

        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .auth-input {
            width: 100%;
            padding: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.2);
            color: #fff;
            box-sizing: border-box;
        }

        .auth-btn-row {
            display: flex;
            gap: 8px;
        }

        .auth-btn {
            flex: 1;
            padding: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .auth-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        /* Form Content */
        .input-group {
            margin-bottom: 12px;
        }

        label {
            display: block;
            margin-bottom: 4px;
            font-size: 12px;
            color: #aaa;
        }

        input {
            width: 100%;
            padding: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-size: 13px;
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
        }

        input:focus {
            border-color: #667eea;
        }

        .password-container {
            position: relative;
            display: flex;
        }

        .toggle-password {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 11px;
            color: #667eea;
            margin: 0;
            padding: 0;
        }

        button.fetch-btn {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        button.fetch-btn:hover {
            opacity: 0.9;
        }

        button.fetch-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        #status {
            margin-top: 10px;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            text-align: center;
            display: none;
        }

        #status.success {
            background: rgba(72, 187, 120, 0.2);
            color: #68d391;
            border: 1px solid rgba(72, 187, 120, 0.3);
        }

        #status.error {
            background: rgba(245, 101, 101, 0.2);
            color: #fc8181;
            border: 1px solid rgba(245, 101, 101, 0.3);
        }

        #status.loading {
            background: rgba(66, 153, 225, 0.2);
            color: #63b3ed;
        }

        .loading-dots:after {
            content: '.';
            animation: dots 1.5s steps(5, end) infinite;
        }

        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60% { content: '...'; }
        }
    `;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'widget-wrapper';

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'minimized-icon';
    iconDiv.id = 'minimized-icon';
    iconDiv.innerHTML = '<span>P</span>';
    wrapper.appendChild(iconDiv);

    // Container
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.id = 'expanded-widget';
    container.innerHTML = `
        <div class="header" id="drag-handle" title="Drag to move">
            <div class="header-title-area" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 10px;">
                <h1 style="margin: 0;">📘 PostChat</h1>
                <div id="header-user-info" style="display: none; align-items: center; gap: 8px;">
                    <span id="header-username" style="font-size: 11px; color: #667eea; font-weight: bold; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
                    <button id="headerLogoutBtn" style="color: #ff4d4d; background: transparent; border: none; cursor: pointer; text-decoration: underline; font-size: 10px; padding: 0;">Logout</button>
                </div>
            </div>
            <button class="minimize-btn" id="minimizeBtn" title="Minimize">─</button>
        </div>

        <div class="auth-section" id="authSection">
            <!-- Dynamic Content based on login state -->
        </div>
        
        <div class="input-group">
            <label for="url">Post URL</label>
            <input type="text" id="url" placeholder="https://www.facebook.com/..." />
        </div>

        <div class="input-group">
            <label for="apiKey">Apify API Key</label>
            <div class="password-container">
                <input type="password" id="apiKey" placeholder="Key..." />
                <button class="toggle-password" id="togglePassword">Show</button>
            </div>
        </div>

        <button class="fetch-btn" id="fetchBtn">Fetch Post Info</button>
        
        <div id="status"></div>
    `;
    wrapper.appendChild(container);
    shadow.appendChild(wrapper);

    // Initialize Supabase from global config
    const SUPABASE_URL = "https://oafgpbyevsfoajsmzjan.supabase.co";
    const SUPABASE_KEY = "sb_publishable_ATuQQfIv8jtKSuyMMpqBpQ_8newqki5";

    // Simple Supabase Client for Content Script (using fetch)
    // We can't use the full @supabase/supabase-js in a content script easily without bundling.
    // So we'll use a direct fetch approach for Auth API or rely on the UI.
    // WAIT: The user asked to "Change the authetication... To match with the supabase authentication".
    // Since injecting the full library is hard without a bundler, strict API calls are better.

    // helper for Supabase Auth API
    async function supabaseAuthRequest(endpoint, body) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Auth Error');
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function savePostToSupabase(postData) {
        if (!sessionToken) throw new Error("Not logged in");

        // Map Apify data to your Supabase schema
        const payload = {
            url: postData.facebookUrl || postData.url || urlInput.value.trim(),
            content: postData.text || postData.content || "",
            author_name: postData.user?.name || postData.userName || "Unknown",
            author_id: postData.user?.id || postData.userId || "",
            author_avatar: postData.user?.profilePic || "",

            post_id: postData.postId || postData.id || "",
            page_name: postData.pageName || "",
            platform: 'facebook',

            // Stats
            likes: postData.likes || postData.likesCount || 0,
            comments: postData.comments || postData.commentsCount || 0,
            shares: postData.shares || postData.sharesCount || 0,

            // Media (Robust extraction: Check all items in 'media' and 'attachments')
            image_url: (() => {
                const findUri = (obj) => {
                    if (!obj) return null;
                    // Check common locations for image content
                    if (obj.image && obj.image.uri) return obj.image.uri;
                    if (obj.photo_image && obj.photo_image.uri) return obj.photo_image.uri;
                    if (obj.thumbnail) return obj.thumbnail;
                    // Recursive check for 'media' wrapper which is common in subattachments
                    if (obj.media) return findUri(obj.media);
                    return null;
                };

                // 1. Search Media Array (Iterate all items, not just the first)
                if (postData.media && Array.isArray(postData.media)) {
                    for (const item of postData.media) {
                        const uri = findUri(item);
                        if (uri) return uri;
                    }
                }

                // 2. Search Attachments
                if (postData.attachments && Array.isArray(postData.attachments)) {
                    for (const att of postData.attachments) {
                        // Direct check on attachment
                        let uri = findUri(att);
                        if (uri) return uri;

                        // Check nested subattachments (groups, albums, multi-photo)
                        const subKeys = [
                            'subattachments',
                            'two_photos_subattachments',
                            'three_photos_subattachments',
                            'four_photos_subattachments',
                            'five_photos_subattachments',
                            'album_subattachments'
                        ];

                        for (const key of subKeys) {
                            const sub = att[key];
                            if (sub && sub.nodes && Array.isArray(sub.nodes)) {
                                for (const node of sub.nodes) {
                                    uri = findUri(node);
                                    if (uri) return uri;
                                }
                            }
                        }
                    }
                }

                return "";
            })(),

            ocr_text: (() => {
                const findOcr = (obj) => {
                    if (!obj) return null;
                    if (obj.ocrText) return obj.ocrText;
                    if (obj.accessibility_caption) return obj.accessibility_caption;
                    if (obj.media) return findOcr(obj.media);
                    return null;
                };

                // 1. Search Media Array
                if (postData.media && Array.isArray(postData.media)) {
                    for (const item of postData.media) {
                        const text = findOcr(item);
                        if (text) return text;
                    }
                }

                // 2. Search Attachments
                if (postData.attachments && Array.isArray(postData.attachments)) {
                    for (const att of postData.attachments) {
                        let text = findOcr(att);
                        if (text) return text;

                        // Subattachments
                        const subKeys = [
                            'subattachments',
                            'two_photos_subattachments',
                            'three_photos_subattachments',
                            'four_photos_subattachments',
                            'five_photos_subattachments',
                            'album_subattachments'
                        ];

                        for (const key of subKeys) {
                            const sub = att[key];
                            if (sub && sub.nodes && Array.isArray(sub.nodes)) {
                                for (const node of sub.nodes) {
                                    text = findOcr(node);
                                    if (text) return text;
                                }
                            }
                        }
                    }
                }

                return "";
            })(),

            // Reactions Breakdown
            reactions_haha: postData.reactionHahaCount || 0,
            reactions_love: postData.reactionLoveCount || 0,
            reactions_care: postData.reactionCareCount || 0,
            reactions_wow: postData.reactionWowCount || 0,
            reactions_sad: postData.reactionSadCount || 0,
            reactions_angry: postData.reactionAngryCount || 0,

            timestamp: postData.time || (postData.timestamp ? new Date(postData.timestamp * 1000).toISOString() : new Date().toISOString()),

            // Save complete raw data for debug/future use
            raw_json: postData
        };

        console.log("Supabase Payload:", payload);

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${sessionToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Supabase API Error Response:", err);
                throw new Error(err.message || "Failed to save post");
            }
            const result = await response.json();
            console.log("Supabase Insert Result:", result);
            return result;
        } catch (error) {
            console.error("Save Execution Error:", error);
            throw error;
        }
    }

    // Variables
    const authSection = container.querySelector('#authSection');
    const urlInput = container.querySelector('#url');
    const apiKeyInput = container.querySelector('#apiKey');
    const fetchBtn = container.querySelector('#fetchBtn');
    const statusDiv = container.querySelector('#status');
    const togglePasswordBtn = container.querySelector('#togglePassword');
    const dragHandle = container.querySelector('#drag-handle');
    const minimizeBtn = container.querySelector('#minimizeBtn');

    let currentUser = null;
    let sessionToken = null;

    // Load Saved State
    chrome.storage.local.get(['apifyKey', 'widgetPos', 'supabaseSession'], (result) => {
        if (result.apifyKey) apiKeyInput.value = result.apifyKey;

        // Restore session if valid (basic check)
        if (result.supabaseSession && result.supabaseSession.access_token) {
            sessionToken = result.supabaseSession.access_token;
            currentUser = result.supabaseSession.user;
            renderAuth();
        } else {
            renderAuth();
        }

        if (result.widgetPos) {
            host.style.top = result.widgetPos.top;
            host.style.left = result.widgetPos.left;
        }
        ensureInBounds();
    });

    let isRegisterMode = false;

    function renderAuth() {
        const headerInfo = container.querySelector('#header-user-info');
        const headerName = container.querySelector('#header-username');
        const headerLogout = container.querySelector('#headerLogoutBtn');

        if (currentUser) {
            const displayName = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User';

            // Show in header
            headerInfo.style.display = 'flex';
            headerName.textContent = displayName;
            headerLogout.onclick = () => {
                currentUser = null;
                sessionToken = null;
                chrome.storage.local.remove('supabaseSession');
                renderAuth();
            };

            // Hide bottom auth section
            authSection.style.display = 'none';
            fetchBtn.disabled = false;
            fetchBtn.title = "";
        } else {
            // Hide header info
            headerInfo.style.display = 'none';

            // Show bottom auth form
            authSection.style.display = 'block';
            authSection.innerHTML = `
                <div class="auth-form" style="display: flex; flex-direction: column; gap: 8px;">
                    <div id="auth-error" style="color: #ff6b6b; font-size: 11px; display: none; background: rgba(255,107,107,0.1); padding: 5px; border-radius: 4px;"></div>
                    <input type="email" id="emailInput" class="auth-input" placeholder="Email" style="width: 100%; padding: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; border-radius: 4px;" />
                    <input type="password" id="passwordInput" class="auth-input" placeholder="Password" style="width: 100%; padding: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; border-radius: 4px;" />
                    <div class="auth-btn-row" style="display: flex; flex-direction: column; gap: 6px;">
                        <button class="auth-btn" id="submitAuthBtn" style="width: 100%; padding: 8px; cursor: pointer; background: #667eea; border: none; color: white; border-radius: 4px; font-weight: bold;">${isRegisterMode ? 'Create Account' : 'Login'}</button>
                        <button id="toggleModeBtn" style="background: none; border: none; color: #aaa; font-size: 10px; cursor: pointer; text-decoration: underline;">
                            ${isRegisterMode ? 'Already have an account? Login' : 'Need an account? Register'}
                        </button>
                    </div>
                </div>
            `;

            const emailIn = authSection.querySelector('#emailInput');
            const passIn = authSection.querySelector('#passwordInput');
            const errDiv = authSection.querySelector('#auth-error');
            const submitBtn = authSection.querySelector('#submitAuthBtn');
            const toggleBtn = authSection.querySelector('#toggleModeBtn');

            toggleBtn.onclick = () => {
                isRegisterMode = !isRegisterMode;
                renderAuth();
            };

            const performAuth = async () => {
                const email = emailIn.value.trim();
                const password = passIn.value;
                if (!email || !password) {
                    errDiv.textContent = "Required: Email & Password";
                    errDiv.style.display = 'block';
                    return;
                }

                errDiv.style.display = 'none';
                submitBtn.textContent = '...';
                submitBtn.disabled = true;

                try {
                    let data;
                    if (isRegisterMode) {
                        data = await supabaseAuthRequest('signup', { email, password });
                        // Supabase auto-logins after signup if email confirm is off
                        if (!data.access_token) {
                            errDiv.textContent = "Check your email to confirm!";
                            errDiv.style.display = 'block';
                            return;
                        }
                    } else {
                        data = await supabaseAuthRequest('token?grant_type=password', { email, password });
                    }

                    sessionToken = data.access_token;
                    currentUser = data.user;
                    chrome.storage.local.set({ supabaseSession: data });
                    renderAuth();
                } catch (e) {
                    errDiv.textContent = e.message === 'Invalid login credentials' ? "Invalid email or password" : e.message;
                    errDiv.style.display = 'block';
                } finally {
                    submitBtn.textContent = isRegisterMode ? 'Create Account' : 'Login';
                    submitBtn.disabled = false;
                }
            };

            submitBtn.onclick = performAuth;

            // Handle Enter key
            const handleEnter = (e) => { if (e.key === 'Enter') performAuth(); };
            emailIn.onkeydown = handleEnter;
            passIn.onkeydown = handleEnter;

            fetchBtn.disabled = true;
            fetchBtn.title = "Please login to fetch";
        }
    }

    // Toggle logic
    let mouseDownX, mouseDownY;
    iconDiv.onmousedown = (e) => { mouseDownX = e.clientX; mouseDownY = e.clientY; };
    iconDiv.onclick = (e) => {
        if (Math.hypot(e.clientX - mouseDownX, e.clientY - mouseDownY) < 5) {
            iconDiv.style.display = 'none';
            container.classList.add('visible');
            ensureInBounds();
        }
    };
    minimizeBtn.onclick = () => {
        container.classList.remove('visible');
        iconDiv.style.display = 'flex';
        ensureInBounds();
    };

    togglePasswordBtn.onclick = () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
    };

    apiKeyInput.onchange = () => chrome.storage.local.set({ apifyKey: apiKeyInput.value.trim() });

    fetchBtn.onclick = async () => {
        const url = urlInput.value.trim();
        const key = apiKeyInput.value.trim();
        if (!url || !key) return showStatus('Missing URL or Key', 'error');

        fetchBtn.disabled = true;
        showStatus('Fetching...', 'loading', true);

        console.log("Starting fetch process:", { url, sessionToken: sessionToken ? "EXISTS" : "MISSING" });

        try {
            const baseURL = window.BACKEND_URL || 'http://localhost:8000';
            console.log(`Calling backend at ${baseURL}/get_post_info`);
            const res = await fetch(`${baseURL}/get_post_info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, apify_key: key })
            });
            const data = await res.json();
            console.log("Backend response received:", data);

            if (data.success) {
                showStatus('Saving to Database...', 'loading');
                try {
                    const postToSave = data.data[0] || data.data;
                    console.log("Mapping and saving post to Supabase:", postToSave);
                    const savedData = await savePostToSupabase(postToSave);
                    console.log("Supabase save success:", savedData);
                    showStatus('Post Saved Successfully!', 'success');
                } catch (saveErr) {
                    showStatus('Fetched OK, but Save Failed', 'error');
                    console.error("Supabase Save Error Details:", saveErr);
                }
            } else {
                console.error("Backend returned error:", data.error);
                showStatus(data.error || 'Failed', 'error');
            }
        } catch (e) {
            console.error("Backend Connection Error:", e);
            showStatus('Backend Error (Check if local server is running)', 'error');
        } finally {
            fetchBtn.disabled = false;
        }
    };

    function showStatus(msg, type, isHtml = false) {
        statusDiv.style.display = 'block';
        statusDiv.className = type;
        if (isHtml) statusDiv.innerHTML = msg; else statusDiv.textContent = msg;
    }

    // Drag Logic
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function startDrag(e) {
        // Only left click
        if (e.button !== 0) return;

        isDragging = true;

        // Calculate offset from the top-left of the host element
        const rect = host.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        // Prevent selection during drag
        e.preventDefault();

        // Add global listeners
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function onDrag(e) {
        if (!isDragging) return;

        e.preventDefault(); // Stop text selection

        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;

        // Boundaries
        const maxX = window.innerWidth - host.offsetWidth;
        const maxY = window.innerHeight - host.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        host.style.left = newX + 'px';
        host.style.top = newY + 'px';
        host.style.right = 'auto'; // Important to unset right if it was set
    }

    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);

        // Save position
        chrome.storage.local.set({
            widgetPos: {
                top: host.style.top,
                left: host.style.left
            }
        });
    }

    // Attach listeners
    if (dragHandle) dragHandle.addEventListener('mousedown', startDrag);
    iconDiv.addEventListener('mousedown', startDrag);

    // Initial boundary check
    window.addEventListener('resize', ensureInBounds);

    function ensureInBounds() {
        // Small delay to ensure rendering is done if toggling visibility
        setTimeout(() => {
            const rect = host.getBoundingClientRect();
            if (rect.width === 0) return; // Not visible yet

            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            let currentLeft = parseFloat(host.style.left);
            let currentTop = parseFloat(host.style.top);

            // If not set yet (initial load), use getBoundingClientRect
            if (isNaN(currentLeft)) currentLeft = rect.left;
            if (isNaN(currentTop)) currentTop = rect.top;

            const safeX = Math.max(0, Math.min(currentLeft, maxX));
            const safeY = Math.max(0, Math.min(currentTop, maxY));

            host.style.left = safeX + 'px';
            host.style.top = safeY + 'px';
        }, 50);
    }
}
