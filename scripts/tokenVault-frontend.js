const { ethers } = require('ethers');

class TokenVaultFrontend {
    constructor(provider, contractAddress) {
        this.provider = new ethers.providers.Web3Provider(provider);
        this.contractAddress = contractAddress;
    }

    /**
     * Connect to user's wallet
     * @returns {Promise<string>} User's wallet address
     */
    async connectWallet() {
        try {
            await this.provider.send("eth_requestAccounts", []);
            const signer = this.provider.getSigner();
            const address = await signer.getAddress();
            console.log('Connected wallet:', address);
            return address;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    /**
     * Sign withdrawal request using EIP712
     * @param {Object} withdrawalData - Data from backend
     * @returns {Promise<string>} Signature
     */
    async signWithdrawalRequest(withdrawalData) {
        try {
            const signer = this.provider.getSigner();
            
            console.log('Signing withdrawal request...');
            console.log('Domain:', withdrawalData.domain);
            console.log('Types:', withdrawalData.types);
            console.log('Data:', withdrawalData.data);

            const signature = await signer._signTypedData(
                withdrawalData.domain,
                withdrawalData.types,
                withdrawalData.data
            );

            console.log('Signature created:', signature);
            return signature;
        } catch (error) {
            console.error('Error signing withdrawal request:', error);
            throw error;
        }
    }

    /**
     * Complete withdrawal process
     * @param {string} recipient - Recipient address
     * @param {string} amount - Amount to withdraw
     * @param {number} deadline - Signature deadline
     * @param {string} signature - User's signature
     * @returns {Promise<Object>} Transaction result
     */
    async completeWithdrawal(recipient, amount, deadline, signature) {
        try {
            const signer = this.provider.getSigner();
            
            // Contract ABI for withdrawTo function
            const abi = [
                "function withdrawTo(address recipient, uint256 amount, uint256 deadline, bytes calldata signature) external"
            ];
            
            const contract = new ethers.Contract(this.contractAddress, abi, signer);
            
            console.log('Submitting withdrawal transaction...');
            console.log('Recipient:', recipient);
            console.log('Amount:', amount);
            console.log('Deadline:', deadline);
            console.log('Signature:', signature);

            const tx = await contract.withdrawTo(recipient, amount, deadline, signature);
            const receipt = await tx.wait();

            console.log('Withdrawal completed!');
            console.log('Transaction hash:', receipt.transactionHash);

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('Error completing withdrawal:', error);
            throw error;
        }
    }

    /**
     * Get user's token balance
     * @param {string} tokenAddress - Token contract address
     * @param {string} userAddress - User's wallet address
     * @returns {Promise<string>} Token balance
     */
    async getTokenBalance(tokenAddress, userAddress) {
        try {
            const abi = [
                "function balanceOf(address owner) external view returns (uint256)"
            ];
            
            const tokenContract = new ethers.Contract(tokenAddress, abi, this.provider);
            const balance = await tokenContract.balanceOf(userAddress);
            
            return balance.toString();
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }
}

// Frontend usage example (for browser environment)
class TokenVaultFrontendBrowser {
    constructor(contractAddress) {
        this.contractAddress = contractAddress;
    }

    /**
     * Initialize and connect to MetaMask
     * @returns {Promise<TokenVaultFrontend>} Initialized frontend instance
     */
    async initialize() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not found. Please install MetaMask.');
        }

        const frontend = new TokenVaultFrontend(window.ethereum, this.contractAddress);
        await frontend.connectWallet();
        return frontend;
    }

    /**
     * Complete withdrawal flow with backend integration
     * @param {string} recipient - Recipient address
     * @param {string} amount - Amount to withdraw
     * @param {string} backendUrl - Backend API URL
     * @returns {Promise<Object>} Withdrawal result
     */
    async withdrawWithBackend(recipient, amount, backendUrl) {
        try {
            const frontend = await this.initialize();
            
            // Step 1: Get withdrawal request from backend
            console.log('Requesting withdrawal data from backend...');
            const requestResponse = await fetch(`${backendUrl}/api/withdrawal/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipient, amount })
            });

            if (!requestResponse.ok) {
                throw new Error('Failed to get withdrawal request from backend');
            }

            const requestData = await requestResponse.json();
            console.log('Received withdrawal request:', requestData);

            // Step 2: Sign the withdrawal request
            console.log('Signing withdrawal request...');
            const signature = await frontend.signWithdrawalRequest(requestData.data);

            // Step 3: Submit to backend for processing
            console.log('Submitting signed withdrawal to backend...');
            const processResponse = await fetch(`${backendUrl}/api/withdrawal/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient,
                    amount,
                    deadline: requestData.data.deadline,
                    signature
                })
            });

            if (!processResponse.ok) {
                throw new Error('Failed to process withdrawal on backend');
            }

            const result = await processResponse.json();
            console.log('Withdrawal processed:', result);

            return result;
        } catch (error) {
            console.error('Error in withdrawal flow:', error);
            throw error;
        }
    }

    /**
     * Get contract balance from backend
     * @param {string} backendUrl - Backend API URL
     * @returns {Promise<string>} Contract balance
     */
    async getContractBalance(backendUrl) {
        try {
            const response = await fetch(`${backendUrl}/api/balance`);
            if (!response.ok) {
                throw new Error('Failed to get contract balance');
            }
            
            const data = await response.json();
            return data.balance;
        } catch (error) {
            console.error('Error getting contract balance:', error);
            throw error;
        }
    }

    /**
     * Get user's nonce from backend
     * @param {string} userAddress - User's wallet address
     * @param {string} backendUrl - Backend API URL
     * @returns {Promise<number>} User's nonce
     */
    async getUserNonce(userAddress, backendUrl) {
        try {
            const response = await fetch(`${backendUrl}/api/nonce/${userAddress}`);
            if (!response.ok) {
                throw new Error('Failed to get user nonce');
            }
            
            const data = await response.json();
            return data.nonce;
        } catch (error) {
            console.error('Error getting user nonce:', error);
            throw error;
        }
    }
}

// HTML Example for browser usage
const htmlExample = `
<!DOCTYPE html>
<html>
<head>
    <title>TokenVault Withdrawal</title>
    <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
</head>
<body>
    <h1>TokenVault Withdrawal</h1>
    
    <div>
        <label>Recipient Address:</label>
        <input type="text" id="recipient" placeholder="0x...">
    </div>
    
    <div>
        <label>Amount (in wei):</label>
        <input type="text" id="amount" placeholder="1000000000000000000">
    </div>
    
    <button onclick="withdraw()">Withdraw</button>
    
    <div id="result"></div>

    <script>
        const BACKEND_URL = 'http://localhost:3000';
        const CONTRACT_ADDRESS = 'YOUR_TOKEN_VAULT_ADDRESS';
        
        const frontend = new TokenVaultFrontendBrowser(CONTRACT_ADDRESS);
        
        async function withdraw() {
            try {
                const recipient = document.getElementById('recipient').value;
                const amount = document.getElementById('amount').value;
                
                if (!recipient || !amount) {
                    alert('Please fill in all fields');
                    return;
                }
                
                document.getElementById('result').innerHTML = 'Processing withdrawal...';
                
                const result = await frontend.withdrawWithBackend(recipient, amount, BACKEND_URL);
                
                document.getElementById('result').innerHTML = 
                    \`Withdrawal successful! Transaction hash: \${result.result.transactionHash}\`;
                    
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    \`Error: \${error.message}\`;
                console.error('Withdrawal error:', error);
            }
        }
        
        // Initialize on page load
        window.addEventListener('load', async () => {
            try {
                await frontend.initialize();
                console.log('Frontend initialized successfully');
            } catch (error) {
                console.error('Failed to initialize frontend:', error);
            }
        });
    </script>
</body>
</html>
`;

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TokenVaultFrontend, TokenVaultFrontendBrowser };
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.TokenVaultFrontend = TokenVaultFrontend;
    window.TokenVaultFrontendBrowser = TokenVaultFrontendBrowser;
} 