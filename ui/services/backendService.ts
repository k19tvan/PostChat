const BACKEND_URL = 'http://localhost:8000';

export interface SearchResult {
    content: string;
    metadata: {
        url?: string;
        post_id?: string;
        author?: string;
        time?: string;
        type?: string;
        [key: string]: any;
    };
    similarity_score: number;
}

export interface SearchResponse {
    success: boolean;
    results?: SearchResult[];
    error?: string;
}

export interface ChatResponse {
    success: boolean;
    response?: string;
    sources?: SearchResult[];
    error?: string;
}

export const searchPosts = async (query: string, advancedMode: boolean = false, k: number = 4): Promise<SearchResponse> => {
    try {
        // Use the new v2 endpoint which searches the 'posts' table directly
        const response = await fetch(`${BACKEND_URL}/search_posts_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                limit: k * 2, // Fetch a bit more
                advanced_mode: advancedMode
            }),
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            // Map the returned Post objects to SearchResult format
            return {
                success: true,
                results: data.data.map((post: any) => ({
                    content: post.raw_text || post.summary || '',
                    metadata: {
                        post_id: post.original_post_id || post.id,
                        author: post.author_name,
                        time: post.published_at,
                        url: post.url,
                        type: 'facebook_post'
                    },
                    similarity_score: 1.0
                }))
            };
        }

        return { success: false, error: data.error || 'Search failed' };
    } catch (error) {
        console.error('Error searching posts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

export const getPostInfo = async (url: string, apifyKey?: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/get_post_info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                apify_key: apifyKey
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching post info:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

export const sendChatMessage = async (
    message: string,
    conversationHistory: Array<{ role: string; text: string }> = []
): Promise<ChatResponse> => {
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                conversation_history: conversationHistory
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
