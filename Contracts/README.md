# ColorDropPool Smart Contract

**Upgradeable tournament-style pool contract for Color Drop game on Farcaster x Celo**

## 📋 Contract Overview

- **Version:** 3.0.0 (Upgradeable with Role-Based Access Control)
- **Mainnet:** Celo (Chain ID: 42220)
  - **Proxy:** [`0xdD862847952c35021E0664E73fa3c29cE6aF2B80`](https://celo.blockscout.com/address/0xdD862847952c35021E0664E73fa3c29cE6aF2B80) ✅ **v3.0.0**
  - **Implementation:** [`0xa76846Ed172e1DaD467b3E343BB37347cC4F943B`](https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B) ✅ **v3.0.0**
- **Testnet:** Celo Sepolia (Chain ID: 11142220)
  - **Proxy:** [`0x32b476880AbCAeD213128F225371d99113F93883`](https://celo-sepolia.blockscout.com/address/0x32b476880AbCAeD213128F225371d99113F93883) ✅ **v3.0.0**
  - **Implementation:** [`0xac8E5E4965d6c1fa376C77596BC54276870efB22`](https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22) ✅ **v3.0.0**
- **Entry Fee:** 0.1 CELO per player
- **Pool Size:** 12 players
- **Prize Distribution:** 0.6 / 0.3 / 0.1 CELO (top 3)
- **System Fee:** 0.2 CELO (split 50/50 between dual treasuries)
- **Age Verification:** SELF Protocol integration (18+ required for unlimited slots)

### 🔐 Role-Based Access Control (v3.0.0)

The contract uses OpenZeppelin's **AccessControl** for a two-owner system:

| Role | Address | Permissions |
|------|---------|-------------|
| **ADMIN_ROLE** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | Primary owner: Grant/revoke roles, manage treasuries, pause, emergency withdraw |
| **UPGRADER_ROLE** | `0x499d377ef114cc1bf7798cecbb38412701400daf` | Can deploy and upgrade contracts, verify contracts on Blockscout |
| **DEFAULT_ADMIN_ROLE** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | OpenZeppelin super admin role (can assign all roles) |

**Why Two Owners?**
- Separation of concerns: Admin manages business logic, Upgrader handles technical deployments
- Security: Upgrader wallet can be hot wallet for CI/CD, Admin wallet stays in cold storage
- Flexibility: Both wallets can upgrade contracts, but only Admin can change treasuries/settings

## 🏗️ Architecture

### Upgradeable Pattern
- **Type:** UUPS (Universal Upgradeable Proxy Standard)
- **Framework:** OpenZeppelin Upgradeable Contracts v5.0
- **Proxy:** ERC1967 Proxy with admin controls
- **Initialization:** Custom `initialize()` function replaces constructor

### Security Features
- ✅ **ReentrancyGuard** - Prevents reentrancy attacks on all payable functions
- ✅ **Pausable** - Emergency stop mechanism for critical issues
- ✅ **AccessControl** - Two-owner role-based system (Admin + Upgrader)
- ✅ **Custom Errors** - Gas-efficient error handling
- ✅ **Dual Treasury** - 50/50 split for decentralized system fees
- ✅ **SELF Age Verification** - Backend validates zero-knowledge proofs, on-chain enforcement
- ✅ **Slot Limits** - 4 slots for unverified users, unlimited for SELF-verified (18+)

## 📊 Economics

```
12 players × 0.1 CELO = 1.2 CELO total pool

Distribution:
├─ 1st Place:  0.6 CELO (50.0%) - 6x ROI
├─ 2nd Place:  0.3 CELO (25.0%) - 3x ROI
├─ 3rd Place:  0.1 CELO (8.3%)  - 1x breakeven
└─ System Fee: 0.2 CELO (16.7%)
   ├─ Treasury 1: 0.1 CELO (50%)
   └─ Treasury 2: 0.1 CELO (50%)
```

## 🎯 SELF Age Verification System

**How it Works:**
1. **Frontend** → User clicks "Verify Age with SELF" button
2. **SELF Protocol** → Generates zero-knowledge proof (18+ verification)
3. **Backend API** → Validates ZK proof via `/api/verify-self` endpoint
4. **Backend Wallet** → Calls `setUserVerification(userAddress, true)` on smart contract
5. **Smart Contract** → Stores verification on-chain, grants unlimited slots
6. **On-Chain Enforcement** → Contract enforces 4-slot limit for unverified, unlimited for verified

**Why On-Chain Storage:**
- Prevents users from bypassing backend by calling contract directly
- Verification persists permanently (stored on Celo blockchain)
- No need to re-verify for future games

**Slot Limits:**
- **Unverified Users:** 4 slots per game (try before verifying)
- **SELF Verified (18+):** Unlimited slots (play as much as you want)

## 🚀 Quick Start

### Prerequisites

```bash
cd Contracts
npm install --legacy-peer-deps
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Upgrader wallet private key (NEVER COMMIT THIS)
# This wallet deploys and upgrades contracts
PRIVATE_KEY=your_upgrader_private_key_here

# Role Addresses (Two-Owner System)
ADMIN_ADDRESS=0x... # Primary owner (manages settings, cold storage)
UPGRADER_ADDRESS=0x... # Deploys/upgrades contracts (must match PRIVATE_KEY)

# Dual treasury addresses (REQUIRED - receives 50/50 split of system fees)
TREASURY_ADDRESS_1=0x...
TREASURY_ADDRESS_2=0x...

# Backend verifier wallet (calls setUserVerification after SELF validation)
VERIFIER_ADDRESS=0x...

# RPC URLs
CELO_RPC_URL=https://forno.celo.org
SEPOLIA_RPC_URL=https://celo-sepolia.drpc.org

# CeloScan API keys (for contract verification)
CELOSCAN_API_KEY=your_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ Security Notes:**
- **NEVER** commit `.env` file to version control
- Keep private keys and API keys secure
- Use separate wallets for deployment, treasuries, and verifier
- Consider using hardware wallets for mainnet deployment

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
Join current pool with 0.1 CELO entry fee
- **Payment:** Exactly 0.1 CELO required
- **Params:** `fid` - Farcaster ID of player
- **Requirements:** Valid FID, not already in active pool, within slot limits
- **Slot Enforcement:** 4 slots for unverified, unlimited for SELF-verified
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

### Admin Functions

#### `setTreasuries(address _treasury1, address _treasury2)` (ADMIN_ROLE only)
Update dual treasury addresses

#### `setVerifier(address _verifier)` (ADMIN_ROLE only)
Update backend verifier wallet address (calls `setUserVerification()`)

#### `pause()` / `unpause()` (ADMIN_ROLE only)
Emergency pause/unpause contract operations

#### `emergencyWithdraw()` (ADMIN_ROLE only)
Emergency fund withdrawal (requires paused state)

#### `grantRole(bytes32 role, address account)` (DEFAULT_ADMIN_ROLE only)
Grant ADMIN_ROLE or UPGRADER_ROLE to new addresses

#### `revokeRole(bytes32 role, address account)` (DEFAULT_ADMIN_ROLE only)
Revoke roles from addresses

#### `_authorizeUpgrade(address newImplementation)` (ADMIN_ROLE or UPGRADER_ROLE)
Authorize contract upgrades (called internally by OpenZeppelin)

### SELF Verification Functions

#### `setUserVerification(address user, bool verified)` (Verifier Only)
Called by backend verifier wallet after SELF proof validation
- **Caller:** Only the designated verifier wallet can call this
- **Params:** `user` - User's wallet address, `verified` - true for 18+ verification
- **Effect:** Grants unlimited slots to verified users
- **Events:** `UserVerificationSet`

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

### Automated Verification (Blockscout)

For Celo mainnet and testnet, use the Blockscout verification script:

```bash
# Verify on Celo Mainnet (Blockscout)
npm run verify:blockscout:celo

# Verify on Celo Sepolia (Blockscout)
npm run verify:blockscout:sepolia
```

The script will:
1. Generate flattened contract source code
2. Encode constructor arguments
3. Provide manual verification instructions
4. Create all necessary files for Blockscout verification

### Manual Verification (Blockscout Web Interface)

1. **Go to Blockscout:**
   - Mainnet: https://celo.blockscout.com/address/0x1eDf8c2290d4a14FDd80c5522AaE2F8d13F6BA43
   - Testnet: https://celo-sepolia.blockscout.com/address/0x723D8583b56456A0343589114228281F37a3b290

2. **Click** 'Code' tab → 'Verify & Publish'

3. **Enter Contract Details:**
   - Contract Name: `ColorDropPool`
   - Compiler: `v0.8.22+commit.4fc1097e`
   - Optimization: Yes (200 runs)
   - EVM Version: default

4. **Paste Flattened Contract:**
   ```bash
   npx hardhat flatten contracts/ColorDropPool.sol
   ```

5. **Constructor Arguments (ABI-encoded):**
   ```
   000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f000000000000000000000000274f2719a0a241f696d4f82f177160a2531cf4f5000000000000000000000000499d377ef114cc1bf7798cecbb38412701400daf
   ```

6. **Click** 'Verify and Publish'

### CeloScan Verification (Alternative)

```bash
# Verify implementation contract
npx hardhat verify --network celo 0x1eDf8c2290d4a14FDd80c5522AaE2F8d13F6BA43 \
  "0xc2564e41b7f5cb66d2d99466450cfebce9e8228f" \
  "0x274f2719a0a241f696d4f82f177160a2531cf4f5" \
  "0x499d377ef114cc1bf7798cecbb38412701400daf"
```

**Note:** Proxy contracts are automatically recognized by Blockscout. You only need to verify the implementation contract.

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
- **Chain ID:** 11142220
- **RPC:** https://celo-sepolia.drpc.org
- **Explorer:** https://celo-sepolia.blockscout.com
- **Faucet:** https://faucet.celo.org
- **Deployment:** [0x723D8583b56456A0343589114228281F37a3b290](https://celo-sepolia.blockscout.com/address/0x723D8583b56456A0343589114228281F37a3b290)

### Production Deployments
- **Celo Mainnet:** [0x39E653277AFa663B9b00C777c608B6E998cCBb22](https://celo.blockscout.com/address/0x39E653277AFa663B9b00C777c608B6E998cCBb22) ✅ LIVE
- **Celo Sepolia:** [0x723D8583b56456A0343589114228281F37a3b290](https://celo-sepolia.blockscout.com/address/0x723D8583b56456A0343589114228281F37a3b290) ✅ TESTNET

## 🛠️ Development Stack

- **Hardhat 2.22** - Development environment (downgraded for compatibility)
- **TypeScript** - Type-safe scripts
- **Ethers.js v6** - Contract interaction
- **OpenZeppelin Contracts Upgradeable 5.0** - Secure upgrade patterns (requires Solidity 0.8.22)
- **OpenZeppelin Hardhat Upgrades** - Deploy & upgrade tools
- **Solidity 0.8.22** - Smart contract language (required for OpenZeppelin 5.0)

## 🐛 Troubleshooting

### Network Configuration Issues
**Error:** `ConnectTimeoutError` or `ECONNREFUSED` when deploying
**Solution:**
- Celo migrated from Alfajores to Sepolia testnet
- Use Chain ID **11142220** (not 44787)
- Use RPC: `https://celo-sepolia.drpc.org`
- Explorer: `https://celo-sepolia.blockscout.com`

### Solidity Version Mismatch
**Error:** `The Solidity version pragma statement doesn't match`
**Solution:**
- OpenZeppelin Contracts 5.0 requires Solidity **0.8.22** or higher
- Update contract pragma: `pragma solidity ^0.8.22;`
- Update hardhat.config.js: `solidity: { version: "0.8.22" }`

### UUPS Upgrade Safety
**Error:** `Implementation is missing upgradeTo function`
**Solution:**
- Import: `@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol`
- Add to inheritance: `contract ColorDropPool is ... UUPSUpgradeable`
- Add function: `function _authorizeUpgrade(address) internal override onlyOwner {}`

### Package Dependency Conflicts
**Error:** `ERESOLVE unable to resolve dependency tree`
**Solution:**
- Use **Hardhat 2.22** (not 3.x) for compatibility
- Install with: `npm install --legacy-peer-deps`
- Downgrade packages if needed:
  - `@nomicfoundation/hardhat-ethers@^3.0.8`
  - `@nomicfoundation/hardhat-toolbox@^5.0.0`

### ES Module Import Errors
**Error:** `Named export 'ethers' not found`
**Solution:** Use proper import syntax:
```typescript
import hre from "hardhat";
const { ethers, upgrades } = hre;
```

### Deployment Fails with "Insufficient Funds"
- Ensure deployer wallet has ≥0.1 CELO for gas fees
- Get testnet CELO from: https://faucet.celo.org

### Verifier Update Fails
- Ensure you're calling from the **owner** wallet
- Verifier address must be non-zero
- Transaction requires gas (~50K gas units)

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
