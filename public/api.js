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

    // Users
    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async getTopTraders() {
        return this.request('/top-traders');
    }

    // Trending
    async getTrending() {
        return this.request('/trending');
    }
}

// Export for use
window.CryptoHubAPI = CryptoHubAPI;
console.log('📡 CryptoHub API Client 已加载');
