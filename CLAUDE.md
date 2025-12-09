# 🎨 Color Drop Tournament - Development Guide

**AI-Assisted Development Documentation for Claude Code**

Last Updated: December 2025

---

## 📋 Project Overview

Color Drop Tournament is a skill-based Farcaster Mini App where 12 players compete to match colors in 10 seconds, with winners receiving CELO prizes (0.6, 0.3, 0.1 CELO). The project integrates:

- **Frontend**: Next.js 16 + React + TypeScript
- **Blockchain**: Celo (Solidity 0.8.20 upgradeable contracts)
- **Platform**: Farcaster Mini App SDK
- **Age Verification**: SELF Protocol (zero-knowledge proofs)
- **Wallet**: Wagmi v3 + Viem

### Core Game Mechanics
- **Entry Fee**: 0.1 CELO per slot
- **Pool Size**: 12 slots per game
- **Game Duration**: 10 seconds to match color
- **Color System**: HSL sliders (Hue, Saturation, Lightness)
- **Scoring**: Delta E 2000 color difference algorithm
- **Winners**: Top 3 most accurate matches (0.6, 0.3, 0.1 CELO)
- **Multi-Slot**: Users can play multiple slots per pool
  - Unverified: Maximum 4 slots
  - SELF-verified (18+): Unlimited slots

---

## 🎮 Complete Game Workflow

### User Journey Overview

```
Pool Selection → Slot Selection → Age Verification? → Payment →
Color Matching Game (10s) → Results → Score Submission →
Pool Completion → Winner Calculation → Prize Distribution
```

### 1. Pool Selection & Slot Selection

**User arrives at Pool Status Screen**

```
┌─────────────────────────────────────────┐
│     POOL STATUS SCREEN                  │
│  Pool #248 • 7/12 Filled • Live 🔴     │
│                                          │
│  ✅ Verified - Unlimited Slots          │
│  (or: ⚠️ 2 slots remaining)            │
│                                          │
│  ┌────┬────┬────┬────┐                 │
│  │ ✓  │ ✓  │ 🎮 │ ✓  │  Click slot    │
│  │ #1 │ #2 │ #3 │ #4 │  to play       │
│  └────┴────┴────┴────┘                 │
│  ┌────┬────┬────┬────┐                 │
│  │ 🎮 │ ✓  │ 🎮 │ ✓  │                 │
│  │ #5 │ #6 │ #7 │ #8 │                 │
│  └────┴────┴────┴────┘                 │
│  ┌────┬────┬────┬────┐                 │
│  │ 🎮 │ 🎮 │ 🎮 │ 🎮 │                 │
│  │ #9 │#10 │#11 │#12 │                 │
│  └────┴────┴────┴────┘                 │
└─────────────────────────────────────────┘
```

**State Management:**
- Active pool ID tracked via `useColorDropPool` hook
- Real-time polling (2s interval) for pool status
- User slot count displayed
- Verification status shown

### 2. Age Verification Flow (Conditional)

**Triggered when:**
- User is unverified AND
- User has used ≥2 slots in current pool

```
┌─────────────────────────────────────────┐
│  VERIFICATION PROMPT                     │
│  ⚠️ 2 slots remaining                  │
│                                          │
│  Verify age (18+) with SELF Protocol   │
│  for unlimited slots                     │
│                                          │
│  [🔐 Verify Age (18+)]                  │
│  [Skip - Continue with limit]           │
└─────────────────────────────────────────┘
```

**SELF Verification Process:**

1. **Frontend generates deep link:**
```typescript
const selfUrl = `${SELF_APP_URL}/verify?scope=${SELF_SCOPE}&callback=${CALLBACK_URL}`;
window.open(selfUrl, '_blank');
```

2. **User completes verification in SELF app**

3. **SELF app sends proof to `/api/verify-self`:**
```typescript
POST /api/verify-self
{
  "proof": "...",
  "userId": "0x..."
}
```

4. **Backend verifies proof and updates contract:**
```typescript
// Verify proof
const verified = await SelfBackendVerifier.verify(proof);
// Update contract
await contract.setUserVerification(userAddress, true);
```

5. **Frontend polls `/api/verify-self/check`:**
```typescript
const checkVerification = async () => {
  const response = await fetch('/api/verify-self/check', {
    method: 'POST',
    body: JSON.stringify({ userId: address }),
  });
  const { verified } = await response.json();
  return verified;
};
```

### 3. Payment & Game Start

**Payment Modal:**
```
┌─────────────────────────────────────────┐
│  PAYMENT MODAL                           │
│  Slot #3 • Entry Fee: 0.1 CELO          │
│                                          │
│  Prize Pool: 1.2 CELO                   │
│  Your Potential: 0.6 CELO (1st)         │
│                                          │
│  [Confirm Payment →]                     │
└─────────────────────────────────────────┘
```

**Transaction Flow:**
```typescript
const joinPool = useCallback(async (fid: number) => {
  joinWriteContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'joinPool',
    args: [BigInt(fid)],
    value: parseEther('0.1'), // Entry fee
  });
}, [joinWriteContract]);
```

**Smart Contract Logic:**
```solidity
function joinPool(uint256 fid) external payable {
    require(msg.value == ENTRY_FEE, "IncorrectFee");

    // Check slot limits
    if (!verifiedUsers[msg.sender]) {
        require(playerSlotCount[msg.sender] < UNVERIFIED_SLOT_LIMIT, "SlotLimitExceeded");
    }

    // Add player to pool
    Pool storage pool = pools[currentPoolId];
    pool.players[pool.playerCount] = Player({
        playerAddress: msg.sender,
        fid: fid,
        score: 0,
        hasSubmitted: false
    });

    playerSlotCount[msg.sender]++;
    pool.playerCount++;
}
```

### 4. Color Matching Game (10 seconds)

**Game Screen Layout:**
```
┌─────────────────────────────────────────┐
│  GAME SCREEN                             │
│  Slot #3 • ⏱️ 10 seconds               │
│                                          │
│  Target Color    │    Your Color        │
│  ┌─────────┐     │    ┌─────────┐      │
│  │ ████████│     │    │ ████████│      │
│  │ ████████│     │    │ ████████│      │
│  └─────────┘     │    └─────────┘      │
│  H:240 S:75%     │                      │
│  L:60%           │    Adjust sliders:   │
│                  │                      │
│  🌈 Hue:        ●────────────           │
│  💧 Saturation: ───●─────────           │
│  ☀️ Lightness:  ─────●───────           │
└─────────────────────────────────────────┘
```

**State Management:**
```typescript
const [gameState, setGameState] = useState<GameState>('playing');
const [targetColor, setTargetColor] = useState<HSLColor>(generateRandomColor());
const [userColor, setUserColor] = useState<HSLColor>({ h: 180, s: 50, l: 50 });
const [result, setResult] = useState<GameResult | null>(null);

const GAME_DURATION = 10; // 10 seconds
```

**Timer Logic:**
```typescript
const handleTimeUp = useCallback(() => {
  const accuracy = calculateAccuracy(userColor, targetColor);
  const gameResult: GameResult = {
    targetColor,
    userColor,
    accuracy,
    timestamp: Date.now(),
  };
  setResult(gameResult);
  setGameState('finished');
}, [userColor, targetColor]);
```

### 5. Color Difference Calculation

**Algorithm: Delta E 2000 (CIEDE2000)**

```typescript
// 1. Convert HSL → RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// 2. Convert RGB → LAB color space
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // RGB → XYZ conversion
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  const x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
  const y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
  const z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

  // XYZ → LAB (D65 illuminant)
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  let xr = x / xn;
  let yr = y / yn;
  let zr = z / zn;

  xr = xr > 0.008856 ? Math.pow(xr, 1/3) : (7.787 * xr + 16/116);
  yr = yr > 0.008856 ? Math.pow(yr, 1/3) : (7.787 * yr + 16/116);
  zr = zr > 0.008856 ? Math.pow(zr, 1/3) : (7.787 * zr + 16/116);

  const L = (116 * yr) - 16;
  const a = 500 * (xr - yr);
  const b_val = 200 * (yr - zr);

  return [L, a, b_val];
}

// 3. Calculate Euclidean distance in LAB space
export function calculateColorDifference(color1: HSLColor, color2: HSLColor): number {
  const [r1, g1, b1] = hslToRgb(color1.h, color1.s, color1.l);
  const [r2, g2, b2] = hslToRgb(color2.h, color2.s, color2.l);

  const [L1, a1, b1_lab] = rgbToLab(r1, g1, b1);
  const [L2, a2, b2_lab] = rgbToLab(r2, g2, b2);

  const deltaL = L1 - L2;
  const deltaA = a1 - a2;
  const deltaB = b1_lab - b2_lab;

  const distance = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);

  // Normalize to 0-100 range (max LAB distance is ~177)
  return Math.min(100, (distance / 177) * 100);
}

// 4. Calculate accuracy percentage
export function calculateAccuracy(userColor: HSLColor, targetColor: HSLColor): number {
  const difference = calculateColorDifference(userColor, targetColor);
  return Math.max(0, 100 - difference);
}
```

**Example Calculation:**
```
Target:  H:240, S:75%, L:60% (deep blue)
User:    H:238, S:73%, L:62% (close blue)

→ RGB conversion: (61, 38, 153) vs (64, 42, 156)
→ LAB distance: 13.2 units
→ Difference: 7.5%
→ Accuracy: 92.5% ✨ Excellent
```

### 6. Results & Score Submission

**Results Screen:**
```
┌─────────────────────────────────────────┐
│  RESULTS SCREEN                          │
│  🌟 Excellent! 92.47%                   │
│                                          │
│  Target Color    Your Color             │
│  ████████        ████████               │
│  H:240 S:75%     H:238 S:73%            │
│  L:60%           L:62%                   │
│                                          │
│  [📊 Submit Score to Pool]              │
│  [Back to Lobby]                         │
└─────────────────────────────────────────┘
```

**Score Submission Flow:**
```typescript
const handleSubmitScore = useCallback(async () => {
  if (!result) return;

  setGameState('submitting');
  try {
    await submitScore(result.accuracy);
  } catch (error) {
    console.error('Failed to submit score:', error);
    setGameState('finished');
  }
}, [result, submitScore]);

const submitScore = useCallback(async (accuracy: number) => {
  if (!address) throw new Error('Wallet not connected');
  if (!currentPoolId) throw new Error('No active pool');

  // Convert accuracy percentage (92.47%) to uint256 (9247)
  const scoreValue = Math.round(accuracy * 100);

  scoreWriteContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'submitScore',
    args: [BigInt(scoreValue)],
  });
}, [address, currentPoolId, scoreWriteContract]);
```

**Smart Contract Score Storage:**
```solidity
function submitScore(uint256 score) external {
    require(score <= 10000, "InvalidScore"); // Max 100.00%

    Pool storage pool = pools[activePoolId[msg.sender]];

    // Find player slot
    for (uint8 i = 0; i < pool.playerCount; i++) {
        if (pool.players[i].playerAddress == msg.sender && !pool.players[i].hasSubmitted) {
            pool.players[i].score = score;
            pool.players[i].hasSubmitted = true;
            pool.submittedCount++;
            break;
        }
    }

    // Auto-finalize if all players submitted
    if (pool.submittedCount == POOL_SIZE) {
        _finalizePool(activePoolId[msg.sender]);
    }
}
```

### 7. Pool Completion & Winner Calculation

**Triggered when all 12 slots submitted scores:**

**Winner Calculation Algorithm:**
```solidity
function _finalizePool(uint256 poolId) internal {
    Pool storage pool = pools[poolId];
    require(pool.submittedCount == POOL_SIZE, "PoolNotComplete");

    // 1. Sort players by score (descending)
    Player[] memory sortedPlayers = new Player[](POOL_SIZE);
    for (uint8 i = 0; i < POOL_SIZE; i++) {
        sortedPlayers[i] = pool.players[i];
    }

    // Bubble sort (gas-optimized for small arrays)
    for (uint8 i = 0; i < POOL_SIZE - 1; i++) {
        for (uint8 j = 0; j < POOL_SIZE - i - 1; j++) {
            if (sortedPlayers[j].score < sortedPlayers[j + 1].score) {
                Player memory temp = sortedPlayers[j];
                sortedPlayers[j] = sortedPlayers[j + 1];
                sortedPlayers[j + 1] = temp;
            }
        }
    }

    // 2. Identify top 3 winners
    address winner1 = sortedPlayers[0].playerAddress;
    address winner2 = sortedPlayers[1].playerAddress;
    address winner3 = sortedPlayers[2].playerAddress;

    // 3. Distribute prizes
    _distributePrizes(winner1, winner2, winner3);

    pool.isFinalized = true;
}

function _distributePrizes(address winner1, address winner2, address winner3) internal {
    // Transfer prizes
    payable(winner1).transfer(PRIZE_1ST);  // 1.8 CELO
    payable(winner2).transfer(PRIZE_2ND);  // 0.9 CELO
    payable(winner3).transfer(PRIZE_3RD);  // 0.3 CELO

    // Split system fee between treasuries
    uint256 feePerTreasury = SYSTEM_FEE / 2;  // 0.3 CELO each
    payable(treasury1).transfer(feePerTreasury);
    payable(treasury2).transfer(feePerTreasury);
}
```

**Example Leaderboard:**
```
Pool #248 - Final Results

🥇 1st  @alice   97.64%  →  0.6 CELO
🥈 2nd  @bob     95.23%  →  0.3 CELO
🥉 3rd  @charlie 92.47%  →  0.1 CELO
   4th  @dave    88.91%
   5th  @eve     85.56%
   6th  @frank   82.34%
   7th  @grace   79.12%
   8th  @henry   75.67%
   9th  @iris    71.23%
   10th @jack    68.45%
   11th @kelly   64.89%
   12th @leo     62.34%
```

### 8. Multi-Slot Strategy Example

**Unverified User (4-slot limit):**
```
Session Timeline:
─────────────────────────────────────────
Pool #248 opens (0/12 filled)

1. Play Slot #1
   → Color: H:120, S:80%, L:50% (target)
   → User:  H:118, S:82%, L:48%
   → Score: 85.32%
   → Status: 8th place (not in top 3)

2. Play Slot #5
   → Color: H:300, S:60%, L:40% (target)
   → User:  H:302, S:58%, L:41%
   → Score: 91.78%
   → Status: 3rd place 🥉 (winning!)

3. Play Slot #9
   → Color: H:60, S:90%, L:70% (target)
   → User:  H:55, S:85%, L:75%
   → Score: 79.45%
   → Status: 11th place (not in top 3)

4. Slot #12 → 🔒 LOCKED (4 slots used)
   → Prompt: "Verify age (18+) for unlimited slots"

Final Results:
Investment: 3 × 0.1 = 0.3 CELO
Winnings: 0.1 CELO (3rd place)
Net: -0.2 CELO
```

**Verified User (unlimited slots):**
```
Session Timeline:
─────────────────────────────────────────
Pool #249 opens (0/12 filled)

1-12. Play all 12 slots
      Scores: 97.64%, 95.23%, 92.47%, 88.91%, 85.56%,
              82.34%, 79.12%, 75.67%, 71.23%, 68.45%,
              64.89%, 62.34%

      Rankings: 🥇 1st, 🥈 2nd, 🥉 3rd (all yours!)

Final Results:
Investment: 12 × 0.1 = 1.2 CELO
Winnings: 0.6 + 0.3 + 0.1 = 1.0 CELO
Net: -0.2 CELO (guaranteed top 3 but negative ROI)

Note: This is an extreme example. The optimal strategy
is typically 4-6 slots for competitive play.
```

### 9. Workflow Timing Analysis

**Current User Flow (per slot):**
```
Action                        Time      Notes
──────────────────────────────────────────────────
Pool Screen (thinking)        2.0s      User decision
Click Slot                    0.5s      Navigation
Verification Modal (if shown) 3.0s      Conditional
Payment Modal                 2.0s      User confirms
Payment Transaction           5.0s      Blockchain wait
Game Screen Load              1.0s      Component mount
Playing Game (timer)          10.0s     Fixed gameplay
Results Screen                2.0s      View results
Submit Score Button           0.5s      User tap
Score Transaction             5.0s      Blockchain wait
Back to Pool                  1.0s      Navigation
──────────────────────────────────────────────────
Total:                        ~32s      Per slot
```

**Potential Optimizations:**
1. **Auto-submit scores** → Save 2-3s (no manual button)
2. **Async payment** → Save 5s psychological wait
3. **Non-blocking verification** → Save 3s (banner instead of modal)
4. **Quick replay button** → Save 1-2s (skip pool return)

**Optimized Flow: ~18.5s per slot (42% faster)**

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
- **Entry Fee**: 0.1 CELO per slot
- **Pool Size**: 12 players
- **Age Verification**: SELF Protocol integration
- **Slot Limits**:
  - Unverified users: 4 slots max
  - SELF-verified (18+): Unlimited slots
- **Prize Distribution**:
  - 1st: 0.6 CELO
  - 2nd: 0.3 CELO
  - 3rd: 0.1 CELO
  - System Fee: 0.2 CELO (split 50/50 between dual treasuries)

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
uint256 public constant ENTRY_FEE = 0.1 ether;
uint8 public constant POOL_SIZE = 12;
uint8 public constant UNVERIFIED_SLOT_LIMIT = 4;
uint256 public constant PRIZE_1ST = 0.6 ether;
uint256 public constant PRIZE_2ND = 0.3 ether;
uint256 public constant PRIZE_3RD = 0.1 ether;
uint256 public constant SYSTEM_FEE = 0.2 ether;
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
