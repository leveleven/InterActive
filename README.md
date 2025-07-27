# InterActive - Ethereum Smart Contract Project

This is an Ethereum-based smart contract project that includes token contracts, receiver contracts, and token vault contracts, along with corresponding deployment scripts.

## 📁 Project Structure

```
InterActive/
├── contracts/          # Smart contract source code
│   ├── MyToken.sol     # ERC20 token contract
│   ├── Receiver.sol    # Receiver contract
│   └── TokenVault.sol  # Token vault contract
├── scripts/            # Deployment scripts
│   ├── deploy_with_ethers.ts    # Deployment using ethers.js
│   ├── deploy_with_web3.ts      # Deployment using web3.js
│   ├── ethers-lib.ts            # ethers.js utility library
│   └── web3-lib.ts              # web3.js utility library
├── artifacts/          # Compiled contract files
└── README.md          # Project documentation
```

## 🚀 Smart Contracts

### MyToken.sol
ERC20 token contract based on OpenZeppelin with ERC20Permit extension support.

**Features:**
- Standard ERC20 token functionality
- ERC20Permit support (gasless approvals)
- Configurable initial supply

**Deployment Parameters:**
- `initialSupply`: Initial token supply

### TokenVault.sol
Secure token vault contract with signature-based withdrawal functionality.

**Features:**
- EIP712 signature verification
- Replay attack protection
- Owner permission management
- Secure withdrawal functionality

**Main Functions:**
- `withdrawTo()`: Withdraw funds using signature
- `getBalance()`: Query contract balance
- `transferOwnership()`: Transfer ownership
- `transferToken()`: Owner token transfer

### Receiver.sol
Token receiver contract for handling token transfers.

## 📜 Deployment Scripts

The project provides multiple deployment methods:

### Using ethers.js
- `deploy_with_ethers.ts` - Main deployment script
- `deploy_with_ethers1.ts` - Backup deployment script
- `deploy_with_ethers2.ts` - Backup deployment script

### Using web3.js
- `deploy_with_web3.ts` - Main deployment script
- `deploy_with_web31.ts` - Backup deployment script
- `deploy_with_web32.ts` - Backup deployment script

## 🛠️ Development Environment

### Prerequisites
- Node.js (recommended v16+)
- npm or yarn
- Ethereum development environment (Hardhat, Remix, etc.)

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Compile Contracts
```bash
npx hardhat compile
# or compile in Remix IDE
```

### Deploy Contracts
1. Configure network and private key
2. Run deployment script:
```bash
npx hardhat run scripts/deploy_with_ethers.ts --network <network>
```

## 🔧 Technology Stack

- **Smart Contracts**: Solidity ^0.8.20
- **Development Framework**: Hardhat (recommended)
- **JavaScript Libraries**: ethers.js, web3.js
- **Token Standards**: OpenZeppelin ERC20
- **Signature Standards**: EIP712

## 📋 Contract Addresses

After deployment, please record the following contract addresses:
- MyToken: `0x...`
- TokenVault: `0x...`
- Receiver: `0x...`

## 🔐 Security Features

- Uses OpenZeppelin standard libraries
- EIP712 signature verification
- Replay attack protection
- Permission controls
- Input validation

## 📝 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

**Note**: Please ensure thorough testing and auditing before deploying to production. 