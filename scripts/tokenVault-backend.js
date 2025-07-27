const { ethers } = require('ethers');

// TokenVault Contract ABI (only the functions we need)
const TOKEN_VAULT_ABI = [
    "function withdrawTo(address recipient, uint256 amount, uint256 deadline, bytes calldata signature) external",
    "function getBalance() external view returns (uint256)",
    "function nonces(address) external view returns (uint256)",
    "event Withdraw(address indexed recipient, uint256 amount, uint256 nonce)"
];

// EIP712 Domain for TokenVault
const DOMAIN = {
    name: 'WithdrawAuthorization',
    version: '1',
    chainId: 1, // Replace with your chain ID
    verifyingContract: '0x...' // Replace with your TokenVault contract address
};

// EIP712 Types
const TYPES = {
    Withdraw: [
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

class TokenVaultBackend {
    constructor(provider, contractAddress, privateKey) {
        this.provider = new ethers.providers.JsonRpcProvider(provider);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, TOKEN_VAULT_ABI, this.wallet);
    }

    /**
     * Get current nonce for a user
     * @param {string} userAddress - User's wallet address
     * @returns {Promise<number>} Current nonce
     */
    async getNonce(userAddress) {
        try {
            const nonce = await this.contract.nonces(userAddress);
            return nonce.toNumber();
        } catch (error) {
            console.error('Error getting nonce:', error);
            throw error;
        }
    }

    /**
     * Get contract balance
     * @returns {Promise<string>} Contract balance in wei
     */
    async getContractBalance() {
        try {
            const balance = await this.contract.getBalance();
            return balance.toString();
        } catch (error) {
            console.error('Error getting contract balance:', error);
            throw error;
        }
    }

    /**
     * Process withdrawal with signature verification
     * @param {string} recipient - Recipient address
     * @param {string} amount - Amount to withdraw (in wei)
     * @param {string} deadline - Signature deadline timestamp
     * @param {string} signature - EIP712 signature from frontend
     * @returns {Promise<Object>} Transaction result
     */
    async processWithdrawal(recipient, amount, deadline, signature) {
        try {
            console.log('Processing withdrawal...');
            console.log('Recipient:', recipient);
            console.log('Amount:', amount);
            console.log('Deadline:', deadline);
            console.log('Signature:', signature);

            // Verify signature before calling contract
            const isValid = await this.verifySignature(recipient, amount, deadline, signature);
            if (!isValid) {
                throw new Error('Invalid signature');
            }

            // Call the contract
            const tx = await this.contract.withdrawTo(recipient, amount, deadline, signature);
            const receipt = await tx.wait();

            console.log('Withdrawal successful!');
            console.log('Transaction hash:', receipt.transactionHash);
            console.log('Gas used:', receipt.gasUsed.toString());

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                gasUsed: receipt.gasUsed.toString(),
                events: receipt.events
            };
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            throw error;
        }
    }

    /**
     * Verify EIP712 signature
     * @param {string} recipient - Recipient address
     * @param {string} amount - Amount to withdraw
     * @param {string} deadline - Signature deadline
     * @param {string} signature - EIP712 signature
     * @returns {Promise<boolean>} Whether signature is valid
     */
    async verifySignature(recipient, amount, deadline, signature) {
        try {
            // Get current nonce
            const nonce = await this.getNonce(recipient);

            // Create the data to sign
            const data = {
                recipient: recipient,
                amount: amount,
                nonce: nonce,
                deadline: deadline
            };

            // Recover the signer
            const recoveredAddress = ethers.utils.verifyTypedData(
                DOMAIN,
                TYPES,
                data,
                signature
            );

            console.log('Recovered signer:', recoveredAddress);
            console.log('Expected recipient:', recipient);

            return recoveredAddress.toLowerCase() === recipient.toLowerCase();
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    /**
     * Create withdrawal request data for frontend
     * @param {string} recipient - Recipient address
     * @param {string} amount - Amount to withdraw
     * @param {number} deadlineMinutes - Minutes from now for deadline
     * @returns {Promise<Object>} Data for frontend to sign
     */
    async createWithdrawalRequest(recipient, amount, deadlineMinutes = 30) {
        try {
            const nonce = await this.getNonce(recipient);
            const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

            const data = {
                recipient: recipient,
                amount: amount,
                nonce: nonce,
                deadline: deadline
            };

            return {
                domain: DOMAIN,
                types: TYPES,
                data: data,
                message: `Withdraw ${ethers.utils.formatEther(amount)} tokens to ${recipient}`
            };
        } catch (error) {
            console.error('Error creating withdrawal request:', error);
            throw error;
        }
    }
}

// Express.js API endpoints example
const express = require('express');
const app = express();
app.use(express.json());

// Initialize TokenVault backend
const tokenVaultBackend = new TokenVaultBackend(
    'YOUR_RPC_URL', // Replace with your RPC URL
    'YOUR_TOKEN_VAULT_ADDRESS', // Replace with your contract address
    'YOUR_PRIVATE_KEY' // Replace with your private key
);

// API Endpoints
app.post('/api/withdrawal/request', async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        
        if (!recipient || !amount) {
            return res.status(400).json({ error: 'Missing recipient or amount' });
        }

        const withdrawalRequest = await tokenVaultBackend.createWithdrawalRequest(recipient, amount);
        
        res.json({
            success: true,
            data: withdrawalRequest
        });
    } catch (error) {
        console.error('Error creating withdrawal request:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/withdrawal/process', async (req, res) => {
    try {
        const { recipient, amount, deadline, signature } = req.body;
        
        if (!recipient || !amount || !deadline || !signature) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const result = await tokenVaultBackend.processWithdrawal(recipient, amount, deadline, signature);
        
        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/balance', async (req, res) => {
    try {
        const balance = await tokenVaultBackend.getContractBalance();
        res.json({
            success: true,
            balance: balance
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/nonce/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const nonce = await tokenVaultBackend.getNonce(address);
        res.json({
            success: true,
            nonce: nonce
        });
    } catch (error) {
        console.error('Error getting nonce:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TokenVault Backend running on port ${PORT}`);
});

module.exports = TokenVaultBackend; 