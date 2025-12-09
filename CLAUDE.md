# 🎨 Color Drop Tournament - Development Guide

**AI-Assisted Development Documentation for Claude Code**

Last Updated: December 2025

---

## 📋 Project Overview

Color Drop Tournament is a skill-based Farcaster Mini App where 12 players compete to match colors in 8 seconds, with winners receiving CELO prizes. The project integrates:

- **Frontend**: Next.js 16 + React + TypeScript
- **Blockchain**: Celo (Solidity 0.8.20 upgradeable contracts)
- **Platform**: Farcaster Mini App SDK
- **Age Verification**: SELF Protocol (zero-knowledge proofs)
- **Wallet**: Wagmi v3 + Viem

---

## 🏗️ Architecture

### Directory Structure
```
ColorDrop/
├── App/                    # Next.js frontend application
│   ├── app/               # Next.js 16 app router
│   │   ├── api/          # API routes
│   │   │   └── verify-self/  # SELF Protocol verification endpoints
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main game page
│   ├── lib/              # Utilities and configurations
│   │   └── wagmi.ts      # Wagmi configuration for Celo
│   └── package.json      # Frontend dependencies
│
├── Contracts/             # Hardhat smart contract workspace
│   ├── contracts/        # Solidity contracts
│   │   └── ColorDropPool.sol  # Main game contract (v2.0.0)
│   ├── scripts/          # Deployment scripts
│   │   ├── deploy.ts     # Upgradeable proxy deployment
│   │   └── upgrade.ts    # Contract upgrade script
│   ├── hardhat.config.ts # Hardhat configuration
│   └── package.json      # Contract dependencies
│
├── GAME-RULES.md         # Complete gameplay rules
├── README.md             # Project documentation
└── CLAUDE.md             # This file
```

---

## 🔧 Smart Contract Architecture

### ColorDropPool.sol v2.0.0

**Contract Type**: Upgradeable (OpenZeppelin UUPS pattern)

#### Key Features
- **Entry Fee**: 0.3 CELO per slot
- **Pool Size**: 12 players
- **Age Verification**: SELF Protocol integration
- **Slot Limits**:
  - Unverified users: 4 slots max
  - SELF-verified (18+): Unlimited slots
- **Prize Distribution**:
  - 1st: 1.8 CELO
  - 2nd: 0.9 CELO
  - 3rd: 0.3 CELO
  - System Fee: 0.6 CELO (split 50/50 between dual treasuries)

#### State Variables
```solidity
mapping(uint256 => Pool) public pools;
mapping(address => uint256) public activePoolId;
mapping(address => uint8) public playerSlotCount;    // Track slots used
mapping(address => bool) public verifiedUsers;       // SELF verification status
address public treasury1;
address public treasury2;
address public verifier;                             // Backend verifier address
```

#### Critical Constants
```solidity
uint256 public constant ENTRY_FEE = 0.3 ether;
uint8 public constant POOL_SIZE = 12;
uint8 public constant UNVERIFIED_SLOT_LIMIT = 4;
uint256 public constant PRIZE_1ST = 1.8 ether;
uint256 public constant PRIZE_2ND = 0.9 ether;
uint256 public constant PRIZE_3RD = 0.3 ether;
uint256 public constant SYSTEM_FEE = 0.6 ether;
```

#### Key Functions
- `initialize(address _treasury1, address _treasury2, address _verifier)` - Initializer (replaces constructor)
- `joinPool(uint256 fid)` - Join pool (enforces slot limits)
- `submitScore(uint256 poolId, uint16 accuracy)` - Submit color accuracy
- `finalizePool(uint256 poolId)` - Distribute prizes
- `setUserVerification(address user, bool verified)` - Called by backend verifier
- `getUserStatus(address user)` - Check verification and slot count

---

## 🔐 SELF Protocol Integration

### Overview
SELF Protocol provides privacy-preserving age verification (18+) using zero-knowledge proofs. Users verify once, and the status is stored on-chain.

### Flow
```
1. User clicks "Verify Age with SELF"
   ↓
2. Frontend generates SELF deep link
   ↓
3. User completes verification in SELF app
   ↓
4. SELF app sends proof to /api/verify-self
   ↓
5. Backend verifies proof and extracts wallet address
   ↓
6. Backend calls contract.setUserVerification(address, true)
   ↓
7. User now has unlimited slots
```

### Backend API Routes

#### `/api/verify-self/route.ts`
- **Method**: POST
- **Purpose**: Receive and verify SELF attestation
- **Process**:
  1. Verify zero-knowledge proof using `SelfBackendVerifier`
  2. Extract wallet address from proof
  3. Store verification in cache (1 hour TTL)
  4. Update smart contract via `setUserVerification()`

#### `/api/verify-self/check/route.ts`
- **Method**: POST
- **Purpose**: Poll verification status
- **Input**: `{ userId: "0x..." }`
- **Output**: `{ verified: boolean, date_of_birth?: string }`

### Environment Variables
```env
NEXT_PUBLIC_SELF_SCOPE=colordrop
NEXT_PUBLIC_SELF_APP_NAME=Color Drop Tournament
NEXT_PUBLIC_SELF_USE_MOCK=false
NEXT_PUBLIC_SITE_URL=https://colordrop.app
NEXT_PUBLIC_COLOR_DROP_CONTRACT_ADDRESS=0x...
VERIFIER_PRIVATE_KEY=0x...  # Backend wallet for setUserVerification calls
```

---

## 🚀 Deployment Guide

### Prerequisites
1. Node.js 18+
2. Celo wallet with CELO for gas
3. Two treasury wallet addresses
4. Backend verifier wallet address

### Smart Contract Deployment

#### 1. Configure Environment
```bash
cd Contracts
cp .env.example .env
```

Edit `.env`:
```env
PRIVATE_KEY=0x...  # Deployer private key
TREASURY_ADDRESS_1=0x...
TREASURY_ADDRESS_2=0x...
VERIFIER_ADDRESS=0x...  # Backend service wallet
CELO_RPC_URL=https://forno.celo.org
CELOSCAN_API_KEY=...
```

#### 2. Compile Contract
```bash
npm install
npm run compile
```

#### 3. Deploy to Testnet (Celo Sepolia)
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

#### 4. Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.ts --network celo
```

#### 5. Verify on CeloScan
```bash
npx hardhat verify --network celo PROXY_ADDRESS
```

### Frontend Deployment

#### 1. Configure Environment
```bash
cd App
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_COLOR_DROP_CONTRACT_ADDRESS=0x...  # Proxy address
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_SELF_SCOPE=colordrop
NEXT_PUBLIC_SITE_URL=https://colordrop.app
VERIFIER_PRIVATE_KEY=0x...  # Same as contract verifier
```

#### 2. Deploy to Vercel
```bash
npm install
npm run build
vercel --prod
```

---

## 🧪 Testing Workflow

### Smart Contract Tests
```bash
cd Contracts
npx hardhat test
npx hardhat coverage
```

### Frontend Local Development
```bash
cd App
npm run dev
# Open http://localhost:3000
```

### Test SELF Integration (Mock Mode)
```env
NEXT_PUBLIC_SELF_USE_MOCK=true
```

---

## 🔄 Contract Upgrade Process

### When to Upgrade
- Add new features
- Fix bugs
- Optimize gas usage
- Update economics

### Upgrade Steps
```bash
cd Contracts

# 1. Update ColorDropPool.sol
# 2. Update version() function
# 3. Compile
npm run compile

# 4. Set PROXY_ADDRESS in .env
PROXY_ADDRESS=0x...

# 5. Deploy new implementation
npx hardhat run scripts/upgrade.ts --network celo

# 6. Verify new implementation
npx hardhat verify --network celo NEW_IMPLEMENTATION_ADDRESS
```

**Note**: Proxy address remains the same; only implementation changes.

---

## 📊 Key Metrics to Monitor

### On-Chain
- Total pools created
- Active players
- Prize pool size
- System fee collected
- Verification rate (% SELF-verified)

### Off-Chain
- API response times
- SELF verification success rate
- Cache hit rates
- Failed transactions

---

## 🛡️ Security Considerations

### Smart Contract
- ✅ ReentrancyGuard on all payable functions
- ✅ Pausable for emergency stops
- ✅ Custom errors for gas efficiency
- ✅ Access control (onlyOwner, verifier-only)
- ⚠️ **NOT YET AUDITED** - Required before mainnet

### Backend
- Secure verifier private key management
- Rate limiting on SELF endpoints
- Input validation on all API routes
- CORS configuration for Farcaster origins

### Frontend
- No private keys in client code
- Wallet connection via Wagmi
- Transaction simulation before execution

---

## 🐛 Common Issues & Solutions

### Contract Compilation Fails
**Issue**: `@openzeppelin/hardhat-upgrades` incompatible with Hardhat 3.0

**Solution**: Upgrades plugin temporarily disabled in config. Contract compiles successfully. For deployment:
1. Use Foundry, or
2. Downgrade to Hardhat 2.x temporarily, or
3. Wait for OpenZeppelin compatibility update

### SELF Verification Not Persisting
**Check**:
1. Verify cache is working (`global.verificationCache`)
2. Check wallet address extraction from proof
3. Ensure verifier wallet has gas for `setUserVerification` call

### Transaction Reverts with "SlotLimitExceeded"
**Cause**: User has used all 4 unverified slots

**Solution**: User must complete SELF verification

---

## 📚 Development Commands

### Contracts
```bash
npm run compile          # Compile contracts
npm run test            # Run tests
npm run deploy:sepolia  # Deploy to testnet
npm run deploy:celo     # Deploy to mainnet
npm run clean           # Clean artifacts
```

### Frontend
```bash
npm run dev             # Development server
npm run build           # Production build
npm run lint            # ESLint
npm run type-check      # TypeScript check
```

---

## 🔗 Important Links

- **Celo Docs**: https://docs.celo.org
- **Farcaster Mini Apps**: https://docs.farcaster.xyz/developers/miniapps
- **SELF Protocol**: https://docs.self.xyz
- **OpenZeppelin Upgrades**: https://docs.openzeppelin.com/upgrades-plugins
- **Wagmi**: https://wagmi.sh

---

## 📝 Development Notes

### Version History
- **v1.0.0** (Dec 2025): Initial release with basic pool mechanics
- **v2.0.0** (Dec 2025):
  - Added SELF Protocol age verification
  - Implemented slot limit system (4 unverified / unlimited verified)
  - Dual treasury system
  - Upgradeable contract pattern

### Future Enhancements
- [ ] NFT rewards for top performers
- [ ] Leaderboard system
- [ ] Daily challenges
- [ ] Referral program
- [ ] Mobile app (React Native)
- [ ] Multi-chain support

---

## 🤝 Contributing

When working on this project:

1. **Always read contract state** before modifying
2. **Test on Sepolia** before mainnet deployment
3. **Update GAME-RULES.md** if mechanics change
4. **Document new environment variables**
5. **Follow Solidity style guide**
6. **Add NatSpec comments** to all public functions

---

## 🎯 Quick Start for Claude

When Claude works on this project:

1. **Understand current state**:
   - Read [ColorDropPool.sol](Contracts/contracts/ColorDropPool.sol)
   - Check [GAME-RULES.md](GAME-RULES.md) for gameplay mechanics
   - Review [README.md](README.md) for project overview

2. **Before making changes**:
   - Read existing files first
   - Understand the slot limit system
   - Check SELF integration endpoints
   - Review contract upgrade safety

3. **Common tasks**:
   - Update prize distribution → Edit constants in ColorDropPool.sol
   - Change slot limits → Edit `UNVERIFIED_SLOT_LIMIT` constant
   - Add treasury → Modify `initialize()` and `_distributePrizes()`
   - Fix SELF integration → Check `/api/verify-self/` routes

---

**For questions or issues, refer to contract comments and GAME-RULES.md**
