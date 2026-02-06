// Web3Auth Wallet Connector
class Web3AuthConnector {
    constructor() {
        this.web3auth = null;
        this.provider = null;
        this.connected = false;
        this.userInfo = null;
        this.listeners = [];
    }

    // Initialize Web3Auth
    async init(clientId) {
        try {
            const { Web3Auth } = await import('@web3auth/modal');
            
            this.web3auth = new Web3Auth({
                clientId: clientId || 'YOUR_WEB3AUTH_CLIENT_ID', // Replace with your Web3Auth Client ID
                chainConfig: {
                    chainId: '0x1',
                    rpcTarget: 'https://rpc.ankr.com/eth',
                    displayName: 'Ethereum',
                    ticker: 'ETH',
                    tickerName: 'Ethereum',
                    blockExplorer: 'https://etherscan.io/'
                },
                uiConfig: {
                    appName: 'CryptoHub',
                    theme: 'dark',
                    loginMethodsOrder: ['metamask', 'walletconnect', 'google', 'email_passwordless'],
                    defaultLanguage: 'en'
                },
                modalZIndex: 1000
            });

            // Subscribe to auth events
            this.web3auth.on('connected', (data) => {
                console.log('✅ Web3Auth connected:', data);
                this.provider = data.provider;
                this.connected = true;
                this.notifyListeners();
            });

            this.web3auth.on('disconnected', () => {
                console.log('Web3Auth disconnected');
                this.provider = null;
                this.connected = false;
                this.userInfo = null;
                this.notifyListeners();
            });

            this.web3auth.on('error', (error) => {
                console.error('Web3Auth error:', error);
            });

            await this.web3auth.initModal();
            console.log('🔐 Web3Auth initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Web3Auth:', error);
            return false;
        }
    }

    // Connect wallet
    async connect() {
        if (!this.web3auth) {
            throw new Error('Web3Auth not initialized');
        }

        try {
            await this.web3auth.connect();
            this.userInfo = await this.web3auth.getUserInfo();
            return this.getAddress();
        } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
        }
    }

    // Disconnect
    async disconnect() {
        if (this.web3auth && this.connected) {
            await this.web3auth.logout();
            this.provider = null;
            this.connected = false;
            this.userInfo = null;
            this.notifyListeners();
        }
    }

    // Get wallet address
    async getAddress() {
        if (!this.provider) return null;

        try {
            const { ethers } = await import('ethers');
            const ethersProvider = new ethers.BrowserProvider(this.provider);
            const signer = await ethersProvider.getSigner();
            return await signer.getAddress();
        } catch (error) {
            console.error('Failed to get address:', error);
            return null;
        }
    }

    // Sign message
    async signMessage(message) {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }

        try {
            const { ethers } = await import('ethers');
            const ethersProvider = new ethers.BrowserProvider(this.provider);
            const signer = await ethersProvider.getSigner();
            return await signer.signMessage(message);
        } catch (error) {
            console.error('Failed to sign:', error);
            throw error;
        }
    }

    // Get user info
    getUserInfo() {
        return this.userInfo;
    }

    // Check if connected
    isConnected() {
        return this.connected;
    }

    // Add listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // Notify listeners
    notifyListeners() {
        const state = {
            connected: this.connected,
            address: this.getAddressSync(),
            shortAddress: this.shortenAddress(this.getAddressSync()),
            userInfo: this.userInfo
        };

        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Get address synchronously (if cached)
    getAddressSync() {
        return this._address;
    }

    // Shorten address
    shortenAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}

// Create global instance
window.web3auth = new Web3AuthConnector();
console.log('🔐 Web3Auth connector initialized');
