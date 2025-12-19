# 🎨 Color Drop Tournament

**Ultra-fast color matching game on Farcaster x Celo**

Match the target color in 10 seconds. Win up to 0.45 CELO. Play, compete, share.

---

## 🎯 Overview

Color Drop Tournament is a **skill-based mini app** where players compete in 9-player pools to match colors with precision. Built as a **Farcaster Mini App** with **Celo blockchain** integration for instant, low-cost payments.

**🔗 Smart Contract (Celo Mainnet):** [`0x05342b1bA42A5B35807592912d7f073DfB95873a`](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a) ✅ **v3.6.2**

**🧪 Testnet Contract (Celo Sepolia):** [`0xABA644cA3692295def60E09926844830b84348Bb`](https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb) ✅ **v3.6.2**

**🔐 Role-Based Access Control:**
- **Admin:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Primary owner, manages settings)
- **Upgrader:** `0x499d377ef114cc1bf7798cecbb38412701400daf` (Deploys and upgrades contracts)

### Core Mechanics

- **Entry:** 0.1 CELO per slot (~$0.05 USD)
- **Pool Size:** 9 players per round (3×3 grid for fast-paced games)
- **Age Verification:** SELF Protocol for 18+ compliance
- **Slot Limits:** 4 slots max (unverified) or ∞ unlimited (SELF verified)
- **Gameplay:** 10 seconds to match target color using HSL sliders
- **Scoring:** Delta E 2000 color difference algorithm (scientifically accurate)
- **Winners:**
  - 🥇 **1st Place:** 0.45 CELO (50% of prize pool)
  - 🥈 **2nd Place:** 0.225 CELO (25% of prize pool)
  - 🥉 **3rd Place:** 0.075 CELO (8.33% of prize pool)
- **System Fee:** 0.15 CELO (16.67%) — Split between dual treasuries

---

## 🚀 Why Color Drop?

### Fast & Addictive
- 10-second rounds = "one more game" psychology
- No complex tutorials or learning curve
- Instant results and payouts

### Skill-Based, Not Gambling
- No random luck mechanics
- Improves with practice (streak bonuses)
- Fair competition based on color perception

### Built for Virality
- Auto-generated meme sharing
- Farcaster frame integration
- Direct challenges to friends
- Leaderboard highlights

### Farcaster Native
- One-tap sign-in (no external wallet)
- In-feed pool discovery
- Native notifications
- Channel integration (/color-drop)

---

## 📜 Complete Game Rules

### How a Pool Works

1. **Pool Creation**: A new pool opens automatically when the previous one fills
2. **Joining**: Players pay 0.1 CELO to claim a slot (up to 9 slots per pool)
3. **Multi-Slot Play**: Same player can join multiple slots in one pool
   - Unverified users: Maximum 4 slots per pool
   - SELF-verified (18+): Unlimited slots
4. **Pool Fills**: Game begins when all 9 slots are taken
5. **Color Matching**: Each slot gets 10 seconds to match a randomly generated target color
6. **Score Submission**: Accuracy is calculated using Delta E 2000 algorithm and submitted on-chain
7. **Winner Determination**: Smart contract ranks all 9 submissions by accuracy
8. **Prize Distribution**: Top 3 winners can claim their prizes directly from the contract

### Scoring System

Color accuracy is calculated using the **CIEDE2000 (Delta E 2000)** algorithm:

| Accuracy | Rating | Description |
|----------|--------|-------------|
| 95-100% | ⭐ Perfect | Nearly indistinguishable from target |
| 85-94% | 🎯 Excellent | Very close match, minor differences |
| 70-84% | ✅ Good | Noticeable but acceptable difference |
| 50-69% | 🔶 Fair | Visible color difference |
| 0-49% | ❌ Poor | Significant mismatch |

### Prize Distribution

| Place | Prize | % of Pool |
|-------|-------|-----------|
| 🥇 1st | 0.45 CELO | 50% |
| 🥈 2nd | 0.225 CELO | 25% |
| 🥉 3rd | 0.075 CELO | 8.33% |
| 💼 System Fee | 0.15 CELO | 16.67% |

**Total Pool**: 0.9 CELO (9 players × 0.1 CELO entry)

### Claiming Prizes

- Winners must **manually claim** their prizes from the Past Games section
- Claims are processed directly on the Celo blockchain
- Prize claims never expire - you can claim anytime
- Gas fees for claiming are minimal (~$0.001)

### Multi-Slot Strategy

Playing multiple slots gives you more chances but also more risk:

```
Example: Playing 3 slots in one pool
Investment: 3 × 0.1 = 0.3 CELO
Best case: Win 1st, 2nd, 3rd = 0.75 CELO profit
Worst case: No wins = -0.3 CELO loss
```

**Pro tip**: SELF-verified players can dominate pools by taking multiple slots, but higher accuracy always wins regardless of slot count.

---

## 💚 Why Celo? The Perfect Blockchain for Gaming

**Celo** is the ideal blockchain for Color Drop Tournament. Here's why we chose Celo over other chains:

### ⚡ Speed That Matters for Gaming

Gaming requires **instant feedback**. Every millisecond of delay breaks immersion.

| Feature | Celo | Ethereum | Other L2s |
|---------|------|----------|-----------|
| Block Time | ~5 seconds | ~12 seconds | 2-12 seconds |
| Finality | Single block | 6+ blocks (~72s) | Variable |
| Transaction Cost | ~$0.001 | $1-50+ | $0.01-0.50 |
| Mobile Optimized | ✅ Native | ❌ No | ⚠️ Partial |

**For Color Drop**: When you submit your color match, it's confirmed on Celo in 5 seconds. Winners see their prizes almost instantly. No waiting, no uncertainty.

### 💰 Micro-Transaction Friendly

Color Drop relies on small, frequent transactions. Traditional blockchains make this impossible:

- **Ethereum**: $5 gas fee on $0.05 game = 100× the cost!
- **Celo**: $0.001 gas fee on $0.05 game = 2% overhead

**Economics that work:**
```
Play 100 games on Celo:
  Entry fees: 10 CELO ($5)
  Gas costs: ~$0.10
  Total: ~$5.10

Play 100 games on Ethereum:
  Entry fees: 10 CELO equivalent ($5)
  Gas costs: ~$500+ (impossible!)
```

### 🌍 Global Accessibility

Color Drop is for **everyone**, not just crypto-native users:

- **Mobile-first design** — Celo was built for smartphones, not desktops
- **Opera MiniPay integration** — 300M+ potential users in Africa
- **Valora wallet** — Easy onboarding with phone number or email
- **Low entry barrier** — $0.05 per game, accessible in any country
- **No bridging required** — Native CELO, no complex cross-chain transfers

### 🌱 Carbon Negative Gaming

Every Color Drop game is **climate-positive**:

- Celo offsets 2× its carbon footprint
- Proof-of-Stake consensus (99.9% less energy than PoW)
- Tree planting initiatives funded by network fees
- Play games, help the planet

### 🔒 Enterprise-Grade Security

Celo doesn't compromise security for speed:

- **EVM compatible** — Same security model as Ethereum
- **Battle-tested** — $2B+ in total value locked
- **Validator diversity** — 100+ independent validators worldwide
- **UUPS upgradeable** — Safe contract improvements without migration
- **ReentrancyGuard** — Protection against common attack vectors

### 🎮 Why Celo is Essential for Color Drop

| Requirement | Why Celo Excels |
|-------------|-----------------|
| Instant payouts | 5-second finality = winners see prizes immediately |
| Micro-transactions | $0.001 gas = $0.05 games are economically viable |
| Mobile gaming | Native mobile optimization for Farcaster Mini App |
| Global reach | Works in 100+ countries without banking access |
| Fair competition | Low costs mean anyone can compete, not just whales |
| Sustainable | Carbon-negative means guilt-free gaming |

**Bottom Line:** Celo makes Color Drop feel like a native mobile game with real money prizes — not a clunky crypto app. No other blockchain delivers this combination of speed, cost, and accessibility.

---

## 🛡️ Why SELF Protocol? Privacy-First Age Verification

**SELF.xyz** provides **privacy-preserving age verification** using zero-knowledge cryptography. Here's why it's essential for Color Drop:

### 🔐 True Privacy Protection

Unlike traditional KYC that exposes your personal data, SELF keeps your identity **completely private**:

| Traditional KYC | SELF Protocol |
|-----------------|---------------|
| Upload ID documents | No documents uploaded |
| Name stored on servers | Name never shared |
| DOB exposed to platforms | Only "18+ yes/no" revealed |
| Data breach risk | Zero personal data to breach |
| Central database | Decentralized verification |

**How it works:**
1. You verify your age with SELF **once** (using your government ID locally)
2. SELF generates a **zero-knowledge proof** (mathematical proof you're 18+)
3. This proof is stored **on-chain** — no personal data, just "verified: true"
4. Color Drop only sees: "This wallet is verified 18+" — nothing else

### ⚖️ Legal Compliance Without Compromise

Color Drop involves real money prizes. Age verification isn't optional — it's **required by law** in most jurisdictions:

- **Gaming regulations** — Skill-based games with prizes often require 18+ verification
- **Financial compliance** — Cryptocurrency transactions may have age requirements
- **Platform protection** — Shields Color Drop from regulatory penalties
- **User protection** — Ensures minors aren't exposed to gambling-adjacent activities

**SELF provides:**
- ✅ Cryptographic proof of age compliance
- ✅ On-chain audit trail for regulators
- ✅ No liability for user misrepresentation
- ✅ International compliance (works globally)

### 🎮 Unlock Full Game Potential

SELF verification directly impacts your gameplay:

| Feature | Unverified | SELF Verified (18+) |
|---------|------------|---------------------|
| Slots per pool | Maximum 4 | **Unlimited** |
| Strategy options | Limited | Full multi-slot tactics |
| Pool domination | Restricted | Can claim all 9 slots |
| Competitive edge | Basic | Maximum |

**Why this matters:**
```
Unverified player: 4 slots max = 44% pool coverage
SELF verified: 9 slots possible = 100% pool coverage
```

SELF-verified players can:
- Take more positions in competitive pools
- Hedge bets across multiple color matches
- Maximize winning potential per pool
- Dominate pools with superior accuracy

### 💡 The SELF Advantage

Why SELF over other identity solutions?

1. **Mobile-native** — Works seamlessly in Farcaster Mini App
2. **One-time process** — Verify once, play forever
3. **Platform detection** — QR code for desktop, deep link for mobile
4. **Instant verification** — Takes seconds, not days
5. **No ongoing fees** — Free for users
6. **Permanent record** — Stored on Celo blockchain, survives app updates

### 📱 Platform-Aware Verification Flow

Color Drop automatically detects the user's platform and provides the optimal verification experience:

| Platform | Method | User Experience |
|----------|--------|-----------------|
| **Browser** (Desktop/Mobile) | QR Code | Scan with SELF mobile app |
| **Farcaster Web** (Browser) | QR Code | Scan with SELF mobile app |
| **Farcaster Mobile** (App) | Deep Link | Opens SELF app directly |

#### How It Works

1. **Platform Detection** (`usePlatformDetection` hook)
   - Detects if running in browser, Farcaster web, or Farcaster mobile
   - Uses `@farcaster/miniapp-sdk` to check Mini App environment
   - Returns `shouldShowQRCode` or `shouldUseDeeplink` flag

2. **QR Code Flow** (Browser/Farcaster Web)
   ```
   User clicks "Verify Age" → QR Code displayed (SelfQRcodeWrapper)
   → User scans with SELF app → SELF app sends proof to backend
   → Backend verifies proof → Backend calls setUserVerification()
   → Frontend polls /api/verify-self/check → User verified ✅
   ```

3. **Deep Link Flow** (Farcaster Mobile)
   ```
   User clicks "Open SELF App" → Universal link opens SELF app
   → User completes verification → SELF app sends proof to backend
   → Backend verifies proof → Backend calls setUserVerification()
   → Frontend polls /api/verify-self/check → User verified ✅
   ```

#### Technical Implementation

**Platform Detection Hook** (`hooks/usePlatformDetection.ts`):
```typescript
export function usePlatformDetection() {
  // Returns: platform, shouldShowQRCode, shouldUseDeeplink
  // Platform types: 'browser' | 'farcaster-browser' | 'farcaster-mobile'
}
```

**SELF Context** (`contexts/SelfContext.tsx`):
- `initiateSelfVerification()` — Opens SELF app (browser/desktop)
- `initiateDeeplinkVerification()` — Opens SELF app via deep link (mobile)
- `startPolling()` — Polls backend for verification status after QR scan
- `checkVerificationStatus()` — Checks `/api/verify-self/check` endpoint

**Verification Modal** (`components/SelfVerificationModal.tsx`):
- Shows QR code when `shouldShowQRCode` is true
- Shows "Open SELF App" button when `shouldUseDeeplink` is true
- Displays verification progress indicator during polling

### 🚫 Why Not Just Frontend Checks?
Without on-chain verification, players could:
- Call the smart contract directly from Etherscan/MetaMask
- Bypass backend API age checks completely
- Play unlimited games while claiming to be unverified
- Create regulatory and legal risks for the platform

**Solution:** Backend validates SELF proofs → Calls `setUserVerification()` → Smart contract enforces limits on-chain.

**Bottom Line:** SELF makes Color Drop legally compliant while preserving player privacy and preventing system abuse.

---

## 🎮 How to Play

### 1. Open the Mini App
```
Open Color Drop in Farcaster
→ See current pool status
→ Pool #247 — 7/9 filled 🔥
→ Prizes: 0.45 | 0.225 | 0.075 CELO
```

### 2. Select a Slot
- View the 3×3 grid of available slots
- Click any empty slot to join
- Multiple slots? Click more (up to 4 unverified, unlimited if SELF verified)

### 3. Pay Entry Fee
- Confirm 0.1 CELO payment per slot
- Transaction confirms in ~5 seconds on Celo
- Your slot is reserved immediately

### 4. Play the Color Game (10 seconds)
When the pool fills (9/9), each slot plays:
- **Target color** appears on screen
- Use **3 sliders** to match it:
  - 🌈 **Hue** (0-360°) — The base color
  - 💧 **Saturation** (0-100%) — Color intensity
  - ☀️ **Lightness** (0-100%) — Brightness level
- Submit before the 10-second timer runs out!

### 5. Score Submission
- Your accuracy is calculated automatically (Delta E 2000)
- Score is submitted to the smart contract
- See your accuracy percentage and ranking

### 6. Claim Your Prize
- Check "Past Games" tab for completed pools
- If you're in top 3, click "Claim" button
- Prize transfers directly to your wallet
- 🥇 0.45 CELO | 🥈 0.225 CELO | 🥉 0.075 CELO

---

## 🏗️ Technical Stack

### Frontend
- **Framework:** Next.js 16 + React 19 + TypeScript
- **SDK:** `@farcaster/miniapp-sdk`
- **Wallet:** Wagmi v3 + Viem (Celo)
- **Styling:** TailwindCSS
- **State:** React Context + Custom Hooks

### Blockchain
- **Network:** Celo Mainnet (Chain ID: 42220)
- **Mainnet Contract (Proxy):** [`0x05342b1bA42A5B35807592912d7f073DfB95873a`](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a) (v3.6.2)
- **Testnet Contract (Proxy):** [`0xABA644cA3692295def60E09926844830b84348Bb`](https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb) (v3.6.2)
- **Smart Contracts:** Solidity 0.8.20 (Upgradeable via OpenZeppelin UUPS)
- **Development:** Hardhat 2.22 + TypeScript
- **Security:** ReentrancyGuard, Pausable, Custom Errors, SELF Age Verification, Role-Based Access Control

### Backend
- **Hosting:** Vercel Edge Functions
- **Database:** Supabase (leaderboards, stats)
- **Real-time:** WebSockets (lobby updates)
- **Media:** Cloudinary (meme generation)
- **Age Verification:** SELF Protocol integration
  - Backend validates zero-knowledge proofs (18+)
  - Backend wallet calls `setUserVerification()` on smart contract
  - Contract enforces 4-slot limit for unverified, unlimited for verified

### Farcaster Integration
- Mini App SDK for auth & social features
- Frame integration for in-feed pools
- Channel posting (/color-drop)
- Notification system

---

## 📦 Project Structure

```
ColorDrop/
├── contracts/          # Solidity smart contracts
│   ├── ColorDropPool.sol
│   └── test/
├── src/                # React Mini App
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── public/
│   └── .well-known/
│       └── farcaster.json  # Mini App manifest
├── Docs/
│   ├── IDEA.md
│   └── GAME-RULES.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22.11.0+
- pnpm or npm
- Foundry (for contracts)
- Farcaster account

### Installation

```bash
# Clone repository
git clone https://github.com/art3hub/colordrop.git
cd colordrop

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your keys

# Run development server
pnpm dev
```

### Deploy Contracts (Celo Sepolia Testnet)

```bash
cd Contracts

# Install dependencies
npm install --legacy-peer-deps

# Configure .env file
cp .env.example .env
# Add your PRIVATE_KEY, TREASURY_ADDRESS_1, TREASURY_ADDRESS_2, VERIFIER_ADDRESS

# Run tests
npm test

# Deploy to Celo Sepolia
npm run deploy:sepolia

# Deployed Contracts (v3.6.2):
# Proxy: 0xABA644cA3692295def60E09926844830b84348Bb
# Admin: 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f
# Upgrader: 0x499d377ef114cc1bf7798cecbb38412701400daf
```

### Configure Farcaster Manifest

Edit `app/.well-known/farcaster.json/route.ts`:

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "name": "Color Drop Tournament",
    "iconUrl": "https://your-domain.com/icon.png",
    "homeUrl": "https://your-domain.com",
    "imageUrl": "https://your-domain.com/preview.png",
    "buttonTitle": "Play Now (0.1 CELO)"
  }
}
```

---

## 📖 Documentation

- [GAME-RULES.md](./GAME-RULES.md) - Complete game mechanics and rules
- [GAME-GUIDE.md](./GAME-GUIDE.md) - Player guide and strategies
- [CLAUDE.md](./CLAUDE.md) - AI-assisted development documentation
- [Smart Contract Docs](./Contracts/README.md) - Contract architecture and deployment
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Production deployment guide

**📊 Contract Explorers:**
- [Mainnet Proxy (Blockscout)](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a) - Live mainnet contract (v3.6.2)
- [Testnet Proxy (Blockscout)](https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb) - Sepolia testnet contract (v3.6.2)

---

## 🎯 Roadmap

### Phase 1: MVP (Weeks 1-2) ✅
- [x] Core color matching gameplay
- [x] Pool smart contract
- [x] Farcaster authentication
- [x] Basic UI/UX

### Phase 2: Beta Launch (Week 3) ✅
- [x] Celo Sepolia testnet deployment
- [x] SELF Protocol age verification integration
- [x] Smart contract with UUPS upgradeability
- [ ] Alpha testing with 100 users
- [ ] Feedback integration
- [ ] Bug fixes

### Phase 3: Mainnet Launch (Week 4) ✅
- [x] Celo mainnet deployment (0x05342b1bA42A5B35807592912d7f073DfB95873a)
- [x] SELF verification production setup
- [ ] Security audit for smart contracts
- [ ] Frame integration
- [ ] Meme generator
- [ ] Channel setup (/color-drop)

### Phase 4: Growth (Weeks 5-8)
- [ ] Influencer partnerships
- [ ] Community tournaments
- [ ] Leaderboard season 1
- [ ] Daily/weekly challenges

### Phase 5: Features (Month 2+)
- [ ] Private rooms
- [ ] Streak bonuses
- [ ] Power-ups system
- [ ] Color library (collectibles)
- [ ] Mobile app optimization

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Component tests (Jest + React Testing Library)
- Contract tests (Forge)

---

## 📊 Key Metrics

### Target (30 Days Post-Launch)
- 10,000+ unique players (FIDs)
- 100,000+ rounds played
- 300+ CELO daily volume
- 25% weekly retention
- 40% share rate

---

## 🔐 Security

- Smart contracts audited by [TBD]
- Regular security updates
- Bug bounty program (coming soon)

**Report vulnerabilities:** security@colordrop.app

---

## 📜 License

MIT License - see [LICENSE](./LICENSE)

---

## 🌐 Links

- **Website:** https://colordrop.app
- **Farcaster:** /color-drop channel
- **Twitter:** [@ColorDropGame](https://twitter.com/ColorDropGame)
- **Discord:** [Join Community](https://discord.gg/colordrop)

---

## 👥 Team

Built by [Art3Hub](https://art3hub.io) with ❤️ for the Farcaster x Celo ecosystem.

---

## 🙏 Acknowledgments

- **Farcaster** team for Mini App SDK and protocol
- **Celo Foundation** for mobile-first blockchain infrastructure
- **SELF Protocol** for privacy-preserving age verification
- Early testers and community feedback
- Color science references and HSL theory

---

**Ready to play? Join a pool and prove your color skills! 🎨**

