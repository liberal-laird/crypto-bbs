// API client with wallet authentication
class CryptoHubAPI {
    constructor(baseUrl = API_BASE) {
        this.baseUrl = baseUrl;
        this.walletAddress = null;
    }

    // Set wallet address for authentication
    setWalletAddress(address) {
        this.walletAddress = address;
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add wallet address header if connected
        if (this.walletAddress) {
            headers['X-Wallet-Address'] = this.walletAddress;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers,
            ...options
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // Auth - Register/Login with wallet
    async authWithWallet(walletAddress, signature = null) {
        const data = await this.request('/auth/wallet', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, signature })
        });
        
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        return data;
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

    async getUserByWallet(walletAddress) {
        return this.request(`/users/wallet/${walletAddress}`);
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

// Export
window.CryptoHubAPI = CryptoHubAPI;
console.log('📡 CryptoHub API Client v3.0 已加载 (支持钱包认证)');
