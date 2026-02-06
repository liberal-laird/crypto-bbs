// CryptoHub Wallet Connection Module
class WalletConnector {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        this.listeners = [];
    }

    // Check if MetaMask is installed
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }

    // Get short address for display
    getShortAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Format address for display
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Connect to wallet
    async connect() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.address = accounts[0];
            this.isConnected = true;

            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Get chain ID
            this.chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.address = accounts[0];
                    this.notifyListeners();
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = chainId;
                this.notifyListeners();
            });

            this.notifyListeners();
            console.log('✅ Wallet connected:', this.address);

            return {
                address: this.address,
                chainId: this.chainId
            };
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    }

    // Disconnect wallet
    disconnect() {
        this.address = null;
        this.signer = null;
        this.provider = null;
        this.chainId = null;
        this.isConnected = false;
        this.notifyListeners();
        console.log('Wallet disconnected');
    }

    // Sign message
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        return await this.signer.signMessage(message);
    }

    // Get current address
    getAddress() {
        return this.address;
    }

    // Check if connected
    isWalletConnected() {
        return this.isConnected;
    }

    // Get network name from chain ID
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum',
            '0x5': 'Goerli',
            '0x38': 'BSC',
            '0x89': 'Polygon',
            '0xa': 'Optimism',
            '0x2105': 'Base',
            '0xfa': 'Fantom'
        };
        return networks[chainId] || 'Unknown Network';
    }

    // Add event listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove event listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    isConnected: this.isConnected,
                    address: this.address,
                    shortAddress: this.getShortAddress(this.address),
                    chainId: this.chainId,
                    network: this.getNetworkName(this.chainId)
                });
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Auto-connect on page load
    async autoConnect() {
        if (!this.isMetaMaskInstalled()) {
            return null;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                this.address = accounts[0];
                this.isConnected = true;
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                this.notifyListeners();
                return {
                    address: this.address,
                    chainId: this.chainId
                };
            }
        } catch (error) {
            console.error('Auto-connect failed:', error);
        }
        return null;
    }
}

// Create global instance
window.wallet = new WalletConnector();
console.log('🔗 Wallet connector initialized');
