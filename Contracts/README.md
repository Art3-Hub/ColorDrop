# Color Drop Pool - Smart Contracts

Solidity smart contracts for the Color Drop Tournament game on Celo blockchain.

## 📋 Overview

This directory contains the smart contract implementation for Color Drop's 21-player tournament pools with automatic prize distribution.

### Contract Details

- **Network:** Celo (Mainnet & Alfajores Testnet)
- **Compiler:** Solidity 0.8.20
- **Pool Size:** 21 players
- **Entry Fee:** 1 CELO
- **Prizes:** 10 CELO (1st), 6 CELO (2nd), 3 CELO (3rd)
- **System Fee:** 1 CELO (4.76%)

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Configure Environment

Edit `.env` with your values:

```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key
TREASURY_ADDRESS=your_treasury_wallet_address
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

## 📦 Deployment

### Deploy to Alfajores Testnet

```bash
# 1. Get testnet CELO from faucet
# Visit: https://faucet.celo.org

# 2. Deploy contract
npm run deploy:alfajores

# 3. Verify contract (after deployment)
export CONTRACT_ADDRESS=0x...  # From deployment output
export TREASURY_ADDRESS=0x...
npm run verify:alfajores
```

### Deploy to Celo Mainnet

```bash
# 1. Ensure you have CELO for gas fees
# 2. Double-check treasury address in .env
# 3. Deploy
npm run deploy:celo

# 4. Verify
export CONTRACT_ADDRESS=0x...
export TREASURY_ADDRESS=0x...
npm run verify:celo
```

## 🔍 Contract Verification

Verification is done via CeloScan API (compatible with Etherscan):

```bash
# Manual verification
npx hardhat verify --network alfajores CONTRACT_ADDRESS TREASURY_ADDRESS

# Or using script
CONTRACT_ADDRESS=0x... TREASURY_ADDRESS=0x... npm run verify:alfajores
```

Get CeloScan API key: https://celoscan.io/myapikey

## 📄 Contract Architecture

### ColorDropPool.sol

Main contract managing tournament pools and prize distribution.

**Key Functions:**

```solidity
// Join current pool with 1 CELO
function joinPool(uint256 fid) external payable

// Submit accuracy score (0-10000 basis points)
function submitScore(uint256 poolId, uint16 accuracy) external

// Finalize pool and distribute prizes
function finalizePool(uint256 poolId) external

// Get pool details
function getPool(uint256 poolId) external view returns (...)

// Get player info
function getPlayer(uint256 poolId, uint8 index) external view returns (...)
```

**Events:**

```solidity
event PoolCreated(uint256 indexed poolId, bytes32 targetColor)
event PlayerJoined(uint256 indexed poolId, address indexed player, uint256 fid)
event PoolStarted(uint256 indexed poolId, uint32 startTime)
event ScoreSubmitted(uint256 indexed poolId, address indexed player, uint16 accuracy)
event PoolCompleted(uint256 indexed poolId, address first, address second, address third)
event PrizePaid(address indexed winner, uint256 amount)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run specific test file
npx hardhat test test/ColorDropPool.test.ts
```

## 🔐 Security Considerations

- Entry fee validation (exactly 1 CELO)
- One pool per player (no double-entry)
- Automatic prize distribution
- Timestamp-based tiebreakers
- Emergency withdrawal for owner (critical bugs only)
- Reentrancy protection via checks-effects-interactions

## 📊 Gas Optimization

- Optimized sorting for top 3 (bubble sort sufficient for 21 players)
- Packed structs to minimize storage
- Batch operations where possible
- Minimal external calls

## 🌐 Network Configuration

### Celo Mainnet
- **Chain ID:** 42220
- **RPC:** https://forno.celo.org
- **Explorer:** https://celoscan.io

### Alfajores Testnet
- **Chain ID:** 44787
- **RPC:** https://alfajores-forno.celo-testnet.org
- **Explorer:** https://alfajores.celoscan.io
- **Faucet:** https://faucet.celo.org

## 📝 Scripts

### Deployment Script

`scripts/deploy.ts` - Deploys ColorDropPool and outputs deployment info

### Verification Script

`scripts/verify.ts` - Verifies contract on CeloScan

## 🛠️ Development Tools

- **Hardhat:** Development environment
- **TypeScript:** Type-safe scripts
- **Ethers.js v6:** Contract interaction
- **Hardhat Toolbox:** Testing, verification, gas reporting
- **Hardhat Verify:** Automated contract verification

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Documentation](https://docs.celo.org)
- [CeloScan](https://celoscan.io)
- [Solidity Documentation](https://docs.soliditylang.org)

## 🐛 Troubleshooting

### "Insufficient funds" error
Ensure you have enough CELO for gas fees (~0.01 CELO per deployment)

### Verification fails
- Check CELOSCAN_API_KEY is valid
- Ensure contract is fully deployed (wait 5+ confirmations)
- Verify constructor arguments match deployment

### Network connection issues
- Check RPC URLs in hardhat.config.ts
- Try alternative RPC endpoints
- Verify network is not congested

## 📞 Support

For contract-related issues:
- Open an issue in the main repository
- Contact: contracts@colordrop.app

---

**License:** MIT
