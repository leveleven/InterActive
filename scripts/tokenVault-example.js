const { ethers } = require('ethers');

// Configuration
const CONFIG = {
    // Network configuration
    RPC_URL: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // Replace with your RPC URL
    CHAIN_ID: 1, // Replace with your chain ID
    
    // Contract addresses
    TOKEN_VAULT_ADDRESS: '0x...', // Replace with your TokenVault contract address
    TOKEN_ADDRESS: '0x...', // Replace with your token contract address
    
    // Backend configuration
    BACKEND_URL: 'http://localhost:3000',
    
    // Gas settings
    GAS_LIMIT: 200000,
    GAS_PRICE: ethers.utils.parseUnits('20', 'gwei')
};

// Complete example showing the full flow
class TokenVaultExample {
    constructor() {
        this.backend = null;
        this.frontend = null;
    }

    /**
     * Initialize backend connection
     */
    async initializeBackend() {
        const TokenVaultBackend = require('./tokenVault-backend');
        
        this.backend = new TokenVaultBackend(
            CONFIG.RPC_URL,
            CONFIG.TOKEN_VAULT_ADDRESS,
            process.env.PRIVATE_KEY // Set your private key as environment variable
        );
        
        console.log('Backend initialized');
    }

    /**
     * Initialize frontend connection
     */
    async initializeFrontend(provider) {
        const { TokenVaultFrontend } = require('./tokenVault-frontend');
        
        this.frontend = new TokenVaultFrontend(provider, CONFIG.TOKEN_VAULT_ADDRESS);
        await this.frontend.connectWallet();
        
        console.log('Frontend initialized');
    }

    /**
     * Complete withdrawal flow example
     */
    async completeWithdrawalFlow(recipient, amount) {
        try {
            console.log('=== Starting Withdrawal Flow ===');
            console.log('Recipient:', recipient);
            console.log('Amount:', amount);

            // Step 1: Get withdrawal request from backend
            console.log('\n1. Getting withdrawal request from backend...');
            const withdrawalRequest = await this.backend.createWithdrawalRequest(recipient, amount);
            console.log('Withdrawal request created:', withdrawalRequest);

            // Step 2: Sign the request with frontend
            console.log('\n2. Signing withdrawal request...');
            const signature = await this.frontend.signWithdrawalRequest(withdrawalRequest);
            console.log('Signature created:', signature);

            // Step 3: Process withdrawal on backend
            console.log('\n3. Processing withdrawal on backend...');
            const result = await this.backend.processWithdrawal(
                recipient,
                amount,
                withdrawalRequest.data.deadline,
                signature
            );
            console.log('Withdrawal processed:', result);

            return result;
        } catch (error) {
            console.error('Error in withdrawal flow:', error);
            throw error;
        }
    }

    /**
     * Get contract information
     */
    async getContractInfo() {
        try {
            console.log('=== Contract Information ===');
            
            const balance = await this.backend.getContractBalance();
            console.log('Contract balance:', ethers.utils.formatEther(balance), 'tokens');
            
            return { balance };
        } catch (error) {
            console.error('Error getting contract info:', error);
            throw error;
        }
    }

    /**
     * Get user information
     */
    async getUserInfo(userAddress) {
        try {
            console.log('=== User Information ===');
            console.log('User address:', userAddress);
            
            const nonce = await this.backend.getNonce(userAddress);
            console.log('User nonce:', nonce);
            
            const tokenBalance = await this.frontend.getTokenBalance(CONFIG.TOKEN_ADDRESS, userAddress);
            console.log('User token balance:', ethers.utils.formatEther(tokenBalance), 'tokens');
            
            return { nonce, tokenBalance };
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }
}

// Express.js server example with complete integration
const express = require('express');
const cors = require('cors');

class TokenVaultServer {
    constructor() {
        this.app = express();
        this.backend = null;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // Get contract balance
        this.app.get('/api/contract/balance', async (req, res) => {
            try {
                const balance = await this.backend.getContractBalance();
                res.json({
                    success: true,
                    balance: balance,
                    formatted: ethers.utils.formatEther(balance)
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get user nonce
        this.app.get('/api/user/:address/nonce', async (req, res) => {
            try {
                const { address } = req.params;
                const nonce = await this.backend.getNonce(address);
                res.json({
                    success: true,
                    address: address,
                    nonce: nonce
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Create withdrawal request
        this.app.post('/api/withdrawal/request', async (req, res) => {
            try {
                const { recipient, amount, deadlineMinutes = 30 } = req.body;
                
                if (!recipient || !amount) {
                    return res.status(400).json({ error: 'Missing recipient or amount' });
                }

                const withdrawalRequest = await this.backend.createWithdrawalRequest(
                    recipient, 
                    amount, 
                    deadlineMinutes
                );
                
                res.json({
                    success: true,
                    data: withdrawalRequest
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Process withdrawal
        this.app.post('/api/withdrawal/process', async (req, res) => {
            try {
                const { recipient, amount, deadline, signature } = req.body;
                
                if (!recipient || !amount || !deadline || !signature) {
                    return res.status(400).json({ error: 'Missing required parameters' });
                }

                const result = await this.backend.processWithdrawal(recipient, amount, deadline, signature);
                
                res.json({
                    success: true,
                    result: result
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Complete withdrawal flow (frontend + backend)
        this.app.post('/api/withdrawal/complete', async (req, res) => {
            try {
                const { recipient, amount, provider } = req.body;
                
                if (!recipient || !amount) {
                    return res.status(400).json({ error: 'Missing recipient or amount' });
                }

                // Initialize frontend
                const { TokenVaultFrontend } = require('./tokenVault-frontend');
                const frontend = new TokenVaultFrontend(provider, CONFIG.TOKEN_VAULT_ADDRESS);
                await frontend.connectWallet();

                // Create withdrawal request
                const withdrawalRequest = await this.backend.createWithdrawalRequest(recipient, amount);
                
                // Sign the request
                const signature = await frontend.signWithdrawalRequest(withdrawalRequest);
                
                // Process withdrawal
                const result = await this.backend.processWithdrawal(
                    recipient,
                    amount,
                    withdrawalRequest.data.deadline,
                    signature
                );
                
                res.json({
                    success: true,
                    result: result
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    async start() {
        // Initialize backend
        const TokenVaultBackend = require('./tokenVault-backend');
        this.backend = new TokenVaultBackend(
            CONFIG.RPC_URL,
            CONFIG.TOKEN_VAULT_ADDRESS,
            process.env.PRIVATE_KEY
        );

        const PORT = process.env.PORT || 3000;
        this.app.listen(PORT, () => {
            console.log(`TokenVault Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
}

// Usage examples
async function runExamples() {
    console.log('=== TokenVault Integration Examples ===\n');

    // Example 1: Backend only
    console.log('1. Backend Example:');
    try {
        const backend = new (require('./tokenVault-backend'))(
            CONFIG.RPC_URL,
            CONFIG.TOKEN_VAULT_ADDRESS,
            process.env.PRIVATE_KEY
        );
        
        const balance = await backend.getContractBalance();
        console.log('Contract balance:', ethers.utils.formatEther(balance), 'tokens');
    } catch (error) {
        console.error('Backend example error:', error.message);
    }

    // Example 2: Frontend only (requires MetaMask)
    console.log('\n2. Frontend Example:');
    console.log('Note: This requires MetaMask to be installed and connected');
    
    // Example 3: Complete integration
    console.log('\n3. Complete Integration Example:');
    console.log('Starting server...');
    
    const server = new TokenVaultServer();
    await server.start();
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = { TokenVaultExample, TokenVaultServer, CONFIG }; 