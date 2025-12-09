# ColorDropPool Smart Contract

**Upgradeable tournament-style pool contract for Color Drop game on Farcaster x Celo**

## 📋 Contract Overview

- **Version:** 2.0.0 (Upgradeable with OpenZeppelin)
- **Network:** Celo Mainnet / Sepolia Testnet
- **Entry Fee:** 0.3 CELO per player
- **Pool Size:** 12 players
- **Prize Distribution:** 1.8 / 0.9 / 0.3 CELO (top 3)
- **System Fee:** 0.6 CELO (split 50/50 between dual treasuries)

## 🏗️ Architecture

### Upgradeable Pattern
- **Type:** UUPS (Universal Upgradeable Proxy Standard)
- **Framework:** OpenZeppelin Upgradeable Contracts v5.0
- **Proxy:** ERC1967 Proxy with admin controls
- **Initialization:** Custom `initialize()` function replaces constructor

### Security Features
- ✅ **ReentrancyGuard** - Prevents reentrancy attacks on all payable functions
- ✅ **Pausable** - Emergency stop mechanism for critical issues
- ✅ **Ownable** - Role-based access control for admin functions
- ✅ **Custom Errors** - Gas-efficient error handling
- ✅ **Dual Treasury** - 50/50 split for decentralized system fees

## 📊 Economics

```
12 players × 0.3 CELO = 3.6 CELO total pool

Distribution:
├─ 1st Place:  1.8 CELO (50.0%) - 6x ROI
├─ 2nd Place:  0.9 CELO (25.0%) - 3x ROI
├─ 3rd Place:  0.3 CELO (8.3%)  - 1x breakeven
└─ System Fee: 0.6 CELO (16.7%)
   ├─ Treasury 1: 0.3 CELO (50%)
   └─ Treasury 2: 0.3 CELO (50%)
```

## 🚀 Quick Start

### Prerequisites

```bash
cd Contracts
npm install --legacy-peer-deps
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Deployment wallet
PRIVATE_KEY=your_private_key_here

# Dual treasury addresses (REQUIRED - receives 50/50 split of system fees)
TREASURY_ADDRESS_1=0x...
TREASURY_ADDRESS_2=0x...

# RPC URLs
CELO_RPC_URL=https://forno.celo.org
SEPOLIA_RPC_URL=https://sepolia-forno.celo-testnet.org

# CeloScan API key (for verification)
CELOSCAN_API_KEY=your_api_key_here
```

## 📦 Deployment

### Deploy to Testnet (Sepolia)

```bash
npm run deploy:sepolia
```

### Deploy to Mainnet (Celo)

```bash
npm run deploy:celo
```

After deployment, save the addresses to your `.env`:

```bash
PROXY_ADDRESS=0x...  # Main contract address (use this for interactions)
IMPLEMENTATION_ADDRESS=0x...  # Implementation contract (for reference)
```

## 🔄 Upgrade Contract

After initial deployment, you can upgrade the implementation:

```bash
# Make sure PROXY_ADDRESS is set in .env
npm run upgrade:celo
```

**Note:** Upgrades preserve all state (pools, players, balances).

## 📝 Contract Functions

### Public Functions

#### `joinPool(uint256 fid)`
Join current pool with 0.3 CELO entry fee
- **Payment:** Exactly 0.3 CELO required
- **Params:** `fid` - Farcaster ID of player
- **Requirements:** Valid FID, not already in active pool
- **Events:** `PlayerJoined`, `PoolStarted` (when 12/12)

#### `submitScore(uint256 poolId, uint16 accuracy)`
Submit accuracy score (0-10000 basis points)
- **Params:** `poolId`, `accuracy` (e.g., 9580 = 95.80%)
- **Requirements:** Player in pool, not already submitted
- **Events:** `ScoreSubmitted`, `PoolCompleted` (if all submitted)

#### `finalizePool(uint256 poolId)`
Finalize pool and distribute prizes
- **Callable by:** Anyone (after 2-minute timeout)
- **Auto-triggers:** When all 12 players submit scores
- **Distributes:** Prizes to top 3, fees to dual treasuries
- **Events:** `PoolCompleted`, `PrizePaid` (×3), `SystemFeePaid` (×2)

### View Functions

#### `getPool(uint256 poolId)`
Returns: `(id, playerCount, isActive, isCompleted, startTime, targetColor)`

#### `getPlayer(uint256 poolId, uint8 index)`
Returns: `(wallet, fid, accuracy, timestamp, hasSubmitted)`

#### `version()`
Returns contract version string (e.g., "2.0.0")

### Admin Functions (Owner Only)

#### `setTreasuries(address _treasury1, address _treasury2)`
Update dual treasury addresses

#### `pause()` / `unpause()`
Emergency pause/unpause contract operations

#### `emergencyWithdraw()`
Emergency fund withdrawal (requires paused state)

## 🧪 Testing

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Gas report
REPORT_GAS=true npm test

# Clean build artifacts
npm run clean
```

## 🔐 Security Features

### ✅ Implemented
- [x] ReentrancyGuard on `joinPool()`, `submitScore()`, `finalizePool()`
- [x] Pausable for emergency stops
- [x] Custom errors for gas efficiency
- [x] Upgradeable pattern with initialization protection
- [x] Dual treasury validation (non-zero addresses)
- [x] Transfer failure handling with reverts
- [x] Input validation on all user inputs
- [x] 2-minute finalization timeout (down from 5 minutes)

### ⚠️ Pre-Production Checklist
- [ ] External security audit by reputable firm
- [ ] Comprehensive test coverage (>90% unit + integration)
- [ ] Testnet stress testing with 100+ games
- [ ] Gas optimization review and benchmarking
- [ ] Emergency response procedures documented
- [ ] Multi-sig wallet for owner functions
- [ ] Upgrade governance process established

## 📜 Contract Verification

After deployment, verify on CeloScan:

```bash
# Verify proxy contract
npx hardhat verify --network celo <PROXY_ADDRESS>

# Manual verification if automated fails
npx hardhat verify --network celo <IMPLEMENTATION_ADDRESS>
```

## 🔍 Upgrade Process

1. **Develop New Version**
   - Modify `ColorDropPool.sol`
   - Increment `version()` return value
   - Test thoroughly on local/testnet
   - Document breaking changes

2. **Test Upgrade on Testnet**
   ```bash
   npm run upgrade:sepolia
   ```

3. **Deploy to Mainnet**
   ```bash
   PROXY_ADDRESS=0x... npm run upgrade:celo
   ```

4. **Verify Upgrade**
   - Check new implementation address
   - Verify state preservation (currentPoolId, treasuries, etc.)
   - Test all critical functions
   - Monitor first few pools closely

## 🌐 Network Configuration

### Celo Mainnet
- **Chain ID:** 42220
- **RPC:** https://forno.celo.org
- **Explorer:** https://celoscan.io
- **Gas Token:** CELO

### Celo Sepolia Testnet
- **Chain ID:** 84532
- **RPC:** https://sepolia-forno.celo-testnet.org
- **Explorer:** https://sepolia.celoscan.io
- **Faucet:** https://faucet.celo.org

## 🛠️ Development Stack

- **Hardhat 3.0** - Development environment
- **TypeScript** - Type-safe scripts
- **Ethers.js v6** - Contract interaction
- **OpenZeppelin Upgradeable** - Secure upgrade patterns
- **OpenZeppelin Hardhat Upgrades** - Deploy & upgrade tools

## 🐛 Troubleshooting

### Hardhat v3 Compatibility Issue
**Known Issue**: `@openzeppelin/hardhat-upgrades` has compatibility issues with Hardhat 3.0.

**Workaround for compilation**:
- The contract compiles successfully without the upgrades plugin
- For deployment with proxy pattern, you can:
  1. Use Hardhat 2.x temporarily for deployment
  2. Wait for OpenZeppelin to release Hardhat 3.0 compatible version
  3. Use Foundry with OpenZeppelin's Foundry tools

**Current configuration**:
- Contract compiles successfully with Hardhat 3.0
- Upgrades plugin is temporarily disabled in `hardhat.config.ts`
- Re-enable once compatibility is resolved

### Hardhat v3 ESM Issues
If you encounter module import errors:
```bash
npm pkg set type="module"
npm install --legacy-peer-deps
```

### "Module not found" errors
Clean install dependencies:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Deployment fails with "insufficient funds"
Ensure deployer has ≥0.1 CELO for gas fees

### Upgrade fails
- Verify PROXY_ADDRESS is set correctly in `.env`
- Ensure you're deploying from the same account that owns the proxy
- Check that contract follows upgrade safety rules (no constructor, use `initialize()`)

## 📞 Support

- **Security Issues:** security@colordrop.app
- **Technical Support:** dev@colordrop.app
- **Documentation:** https://docs.colordrop.app

## 📄 License

MIT License - See [LICENSE](../LICENSE)

---

**⚠️ Production Deployment Warning**

This contract handles real funds. Before mainnet deployment:
1. Complete comprehensive security audit
2. Run extensive testnet testing (100+ games)
3. Set up monitoring and alerting systems
4. Establish emergency response procedures
5. Use multi-sig wallet for owner functions
6. Have upgrade governance process in place

**Current Status:** ⚠️ NOT PRODUCTION READY - Requires security audit and testing
