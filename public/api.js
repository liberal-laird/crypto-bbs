// CryptoHub BBS API Client
const API_BASE = '/api';

class CryptoHubAPI {
    constructor(baseUrl = API_BASE) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    }

    // Stats
    async getStats() {
        return this.request('/stats');
    }

    // Topics
    async getTopics(options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/topics?${params}`);
    }

    async getTopic(id) {
        return this.request(`/topics/${id}`);
    }

    async createTopic(data) {
        return this.request('/topics', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getTopicComments(topicId) {
        return this.request(`/topics/${topicId}/comments`);
    }

    async createComment(topicId, data) {
        return this.request(`/topics/${topicId}/comments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Users
    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async getTopTraders() {
        return this.request('/top-traders');
    }

    async followTrader(traderId) {
        return this.request('/follow', {
            method: 'POST',
            body: JSON.stringify({ traderId })
        });
    }

    async unfollowTrader(traderId) {
        return this.request('/follow', {
            method: 'DELETE',
            body: JSON.stringify({ traderId })
        });
    }

    // Trending
    async getTrending() {
        return this.request('/trending');
    }

    // Search
    async search(query, type = 'all') {
        const params = new URLSearchParams({ q: query, type });
        return this.request(`/search?${params}`);
    }

    // Likes
    async likeTopic(topicId) {
        return this.request(`/topics/${topicId}/like`, {
            method: 'POST'
        });
    }

    async unlikeTopic(topicId) {
        return this.request(`/topics/${topicId}/like`, {
            method: 'DELETE'
        });
    }

    // Health check
    async health() {
        return this.request('/health');
    }
}

// Export for use
window.CryptoHubAPI = CryptoHubAPI;
console.log('📡 CryptoHub API Client v2.0 已加载');
