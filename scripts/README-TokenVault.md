# TokenVault Integration Guide

This guide explains how to use the TokenVault smart contract with JavaScript backend and frontend integration.

## 📁 Files Overview

- `tokenVault-backend.js` - Backend server with Express.js API
- `tokenVault-frontend.js` - Frontend integration with MetaMask
- `tokenVault-example.js` - Complete integration examples
- `package.json` - Dependencies and scripts

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
TOKEN_VAULT_ADDRESS=0x...your_contract_address
TOKEN_ADDRESS=0x...your_token_address
```

### 3. Update Configuration
Edit `tokenVault-example.js` and update the `CONFIG` object:
```javascript
const CONFIG = {
    RPC_URL: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    CHAIN_ID: 1, // Your chain ID
    TOKEN_VAULT_ADDRESS: '0x...', // Your TokenVault contract
    TOKEN_ADDRESS: '0x...', // Your token contract
    BACKEND_URL: 'http://localhost:3000'
};
```

### 4. Start the Server
```bash
npm run server
```

## 🔧 API Endpoints

### Backend API

#### GET `/health`
Health check endpoint
```bash
curl http://localhost:3000/health
```

#### GET `/api/contract/balance`
Get contract balance
```bash
curl http://localhost:3000/api/contract/balance
```

#### GET `/api/user/:address/nonce`
Get user's nonce
```bash
curl http://localhost:3000/api/user/0x123.../nonce
```

#### POST `/api/withdrawal/request`
Create withdrawal request
```bash
curl -X POST http://localhost:3000/api/withdrawal/request \
  -H "Content-Type: application/json" \
  -d '{"recipient": "0x123...", "amount": "1000000000000000000"}'
```

#### POST `/api/withdrawal/process`
Process withdrawal with signature
```bash
curl -X POST http://localhost:3000/api/withdrawal/process \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x123...",
    "amount": "1000000000000000000",
    "deadline": 1234567890,
    "signature": "0x..."
  }'
```

## 💻 Frontend Integration

### HTML Example
```html
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
        
        async function withdraw() {
            try {
                const recipient = document.getElementById('recipient').value;
                const amount = document.getElementById('amount').value;
                
                if (!recipient || !amount) {
                    alert('Please fill in all fields');
                    return;
                }
                
                document.getElementById('result').innerHTML = 'Processing withdrawal...';
                
                // Step 1: Get withdrawal request
                const requestResponse = await fetch(`${BACKEND_URL}/api/withdrawal/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient, amount })
                });
                
                const requestData = await requestResponse.json();
                
                // Step 2: Sign with MetaMask
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                
                const signature = await signer._signTypedData(
                    requestData.data.domain,
                    requestData.data.types,
                    requestData.data.data
                );
                
                // Step 3: Process withdrawal
                const processResponse = await fetch(`${BACKEND_URL}/api/withdrawal/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient,
                        amount,
                        deadline: requestData.data.deadline,
                        signature
                    })
                });
                
                const result = await processResponse.json();
                
                document.getElementById('result').innerHTML = 
                    `Withdrawal successful! Transaction hash: ${result.result.transactionHash}`;
                    
            } catch (error) {
                document.getElementById('result').innerHTML = `Error: ${error.message}`;
                console.error('Withdrawal error:', error);
            }
        }
    </script>
</body>
</html>
```

## 🔐 Security Features

### EIP712 Signature Verification
The system uses EIP712 for secure signature verification:

1. **Domain**: Contract-specific domain for signature isolation
2. **Types**: Structured data types for type safety
3. **Nonce**: Prevents replay attacks
4. **Deadline**: Signature expiration for security

### Withdrawal Flow
```
1. User requests withdrawal → Backend creates EIP712 data
2. User signs data → MetaMask creates signature
3. Backend verifies signature → Calls smart contract
4. Contract validates → Executes withdrawal
```

## 🛠️ Development

### Running Examples
```bash
# Start the server
npm run server

# Run examples
npm start

# Development mode with auto-restart
npm run dev
```

### Testing
```bash
# Test backend API
curl http://localhost:3000/health

# Test withdrawal request
curl -X POST http://localhost:3000/api/withdrawal/request \
  -H "Content-Type: application/json" \
  -d '{"recipient": "0x123...", "amount": "1000000000000000000"}'
```

## 📋 Configuration

### Required Environment Variables
- `PRIVATE_KEY`: Your wallet private key for backend transactions
- `RPC_URL`: Ethereum RPC endpoint (Infura, Alchemy, etc.)
- `TOKEN_VAULT_ADDRESS`: Deployed TokenVault contract address
- `TOKEN_ADDRESS`: ERC20 token contract address

### Network Configuration
Update the `CONFIG` object in `tokenVault-example.js`:
```javascript
const CONFIG = {
    RPC_URL: 'https://mainnet.infura.io/v3/YOUR_KEY',
    CHAIN_ID: 1, // 1 for mainnet, 5 for goerli, etc.
    TOKEN_VAULT_ADDRESS: '0x...',
    TOKEN_ADDRESS: '0x...',
    BACKEND_URL: 'http://localhost:3000'
};
```

## 🔍 Troubleshooting

### Common Issues

1. **MetaMask not found**
   - Ensure MetaMask is installed and unlocked
   - Check if the correct network is selected

2. **Signature verification failed**
   - Verify the contract address is correct
   - Check if the nonce is current
   - Ensure the deadline hasn't expired

3. **Transaction failed**
   - Check gas limits and prices
   - Verify contract has sufficient tokens
   - Ensure user has enough ETH for gas

4. **CORS errors**
   - Ensure the backend has CORS enabled
   - Check if the frontend URL is allowed

### Debug Mode
Enable debug logging:
```javascript
// In tokenVault-backend.js
console.log('Debug info:', { recipient, amount, deadline, signature });
```

## 📚 Additional Resources

- [EIP712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [MetaMask Documentation](https://docs.metamask.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 