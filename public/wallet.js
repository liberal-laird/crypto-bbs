// CryptoHub Wallet Connection Module (Fixed for ethers v6)
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

    // Get short address
    getShortAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Connect to wallet
    async connect() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed. Please install MetaMask first.');
        }

        try {
            // Request accounts
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            this.address = accounts[0];
            this.isConnected = true;

            // Create provider for read operations
            this.provider = null;
            
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
                window.location.reload(); // Reload on chain change
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

    // Disconnect
    disconnect() {
        this.address = null;
        this.signer = null;
        this.provider = null;
        this.chainId = null;
        this.isConnected = false;
        this.notifyListeners();
        console.log('Wallet disconnected');
    }

    // Sign message (optional)
    async signMessage(message) {
        try {
            if (!this.address) {
                throw new Error('Wallet not connected');
            }
            
            const signedMessage = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.address]
            });
            
            return signedMessage;
        } catch (error) {
            console.error('Sign message failed:', error);
            throw error;
        }
    }

    // Get address
    getAddress() {
        return this.address;
    }

    // Check connection
    isWalletConnected() {
        return this.isConnected;
    }

    // Get network name
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum',
            '0x5': 'Goerli',
            '0x38': 'BSC',
            '0x89': 'Polygon',
            '0xa': 'Optimism',
            '0x2105': 'Base',
            '0xfa': 'Fantom',
            '0x8274f': 'Scroll'
        };
        return networks[chainId] || 'Unknown Network';
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
            isConnected: this.isConnected,
            address: this.address,
            shortAddress: this.getShortAddress(this.address),
            chainId: this.chainId,
            network: this.getNetworkName(this.chainId)
        };
        
        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Auto-connect
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
console.log('🔗 Wallet connector initialized (v2)');
