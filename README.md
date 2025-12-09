# 🎨 Color Drop Tournament

**Ultra-fast color matching game on Farcaster x Celo**

Match the target color in 10 seconds. Win up to 0.6 CELO. Play, compete, share.

---

## 🎯 Overview

Color Drop Tournament is a **skill-based mini app** where players compete in 12-player pools to match colors with precision. Built as a **Farcaster Mini App** with **Celo blockchain** integration for instant, low-cost payments.

**🔗 Smart Contract (Celo Mainnet):** [`0xFD67421de125B5D216684176c58e90D6b7BCa1Ff`](https://celo.blockscout.com/address/0xFD67421de125B5D216684176c58e90D6b7BCa1Ff) ✅ **v3.0.0**

**🧪 Testnet Contract (Celo Sepolia):** [`0x2f302E1604E3657035C1EADa450582fA4417f598`](https://celo-sepolia.blockscout.com/address/0x2f302E1604E3657035C1EADa450582fA4417f598) ✅ **v3.0.0**

**📊 Contract Implementation Addresses:**
- **Mainnet Implementation:** [`0xa76846Ed172e1DaD467b3E343BB37347cC4F943B`](https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B) (v3.0.0)
- **Sepolia Implementation:** [`0xac8E5E4965d6c1fa376C77596BC54276870efB22`](https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22) (v3.0.0)

**🔐 Role-Based Access Control:**
- **Admin:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Primary owner, manages settings)
- **Upgrader:** `0x499d377ef114cc1bf7798cecbb38412701400daf` (Deploys and upgrades contracts)

### Core Mechanics

- **Entry:** 0.1 CELO per player
- **Pool Size:** 12 players per round
- **Age Verification:** SELF Protocol for 18+ compliance
- **Slot Limits:** 4 slots max (unverified) or ∞ unlimited (SELF verified)
- **Gameplay:** 10 seconds to match target color using HSL sliders
- **Winners:**
  - 🥇 **1st Place:** 0.6 CELO (best accuracy)
  - 🥈 **2nd Place:** 0.3 CELO
  - 🥉 **3rd Place:** 0.1 CELO
- **System Fee:** 0.2 CELO (16.67%) — Split between dual treasuries

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

## 💚 Why Celo?

**Celo** is the perfect blockchain for Color Drop Tournament because:

### ⚡ Ultra-Fast & Cheap
- **5-second finality** — Instant game payouts, no waiting
- **$0.001 gas fees** — Play hundreds of games for pennies
- **Mobile-first** — Built for phone users (Farcaster's native platform)
- **Carbon negative** — Eco-friendly blockchain with offset initiatives

### 💰 Real Money, Real Fast
- **Instant settlements** — Winners get CELO in seconds, not minutes
- **Stablecoin ready** — cUSD/cEUR support for stable prizes (future)
- **Low barriers** — 0.1 CELO entry ($0.05) makes it accessible globally
- **No bridging delays** — Native CELO, no cross-chain complexity

### 🌍 Built for Everyone
- **ReFi ecosystem** — Regenerative finance for good
- **Global accessibility** — Works in 100+ countries
- **Mobile money integration** — Cash in/out via Valora, Opera MiniPay
- **Social impact** — Every transaction supports climate initiatives

### 🔒 Secure & Proven
- **EVM compatible** — Battle-tested Ethereum security model
- **Upgradeable contracts** — UUPS pattern for safe improvements
- **Audited infrastructure** — Celo validators stake reputation and capital

**Bottom Line:** Celo makes Color Drop feel like a native mobile game, not a crypto app.

---

## 🛡️ Why SELF Protocol Verification?

**SELF.xyz** provides **privacy-preserving age verification** that's critical for Color Drop:

### 🔐 Privacy-First Identity
- **Zero-knowledge proofs** — Prove you're 18+ without revealing your identity
- **No personal data stored** — SELF never sees your ID, we never see your ID
- **Cryptographic verification** — Mathematical proof, not trust-based
- **One-time verification** — Verify once, play forever (stored on-chain)

### ⚖️ Legal Compliance
- **Age-gated gaming** — Complies with international regulations for skill-based gaming
- **Regulatory protection** — Shields Color Drop from underage participation risks
- **Audit trail** — On-chain proof of compliance for regulators
- **No liability exposure** — Verified users take responsibility for their participation

### 🎮 Better Player Experience
- **Try before verify** — 4 free slots to test the game (unverified users)
- **Unlimited slots** — SELF-verified players (18+) get unlimited game participation
- **Fair play enforcement** — On-chain slot limits prevent system abuse
- **No repeated verification** — Verify once, stored permanently on Celo blockchain

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

### 1. Discover in Farcaster Feed
```
Pool #247 — 10/12 players 🔥
Prize: 0.6 | 0.3 | 0.1 CELO
[Join Now (0.1 CELO)]
```

### 2. Join Pool
- Click "Join Now" → Opens Mini App
- Auto-authenticate with Farcaster
- Pay 0.1 CELO to enter

### 3. Wait in Lobby
- See other players joining
- Pool starts when 12/12 full
- Usually fills in <2 minutes

### 4. Match the Color (10 seconds)
- Target color appears
- Adjust Hue, Saturation, Lightness sliders
- Lock in your best match before timer expires

### 5. See Results
- Instant ranking by accuracy
- Top 3 win CELO automatically
- Share results or play again

---

## 🏗️ Technical Stack

### Frontend
- **Framework:** React + TypeScript
- **SDK:** `@farcaster/miniapp-sdk`
- **Wallet:** Wagmi + Viem (Celo)
- **Styling:** TailwindCSS
- **State:** Zustand

### Blockchain
- **Network:** Celo Mainnet (Chain ID: 42220)
- **Mainnet Contract (Proxy):** [`0xFD67421de125B5D216684176c58e90D6b7BCa1Ff`](https://celo.blockscout.com/address/0xFD67421de125B5D216684176c58e90D6b7BCa1Ff) (v3.0.0)
- **Testnet Contract (Proxy):** [`0x2f302E1604E3657035C1EADa450582fA4417f598`](https://celo-sepolia.blockscout.com/address/0x2f302E1604E3657035C1EADa450582fA4417f598) (v3.0.0)
- **Smart Contracts:** Solidity 0.8.22 (Upgradeable via OpenZeppelin UUPS)
- **Development:** Hardhat 2.22 + TypeScript
- **Security:** ReentrancyGuard, Pausable, Custom Errors, SELF Age Verification

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

# Deployed Contracts (v3.0.0 - Deployed by Admin):
# Proxy: 0x2f302E1604E3657035C1EADa450582fA4417f598
# Implementation: 0xac8E5E4965d6c1fa376C77596BC54276870efB22
# Admin: 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f
# Upgrader: 0x499d377ef114cc1bf7798cecbb38412701400daf
```

### Configure Farcaster Manifest

Edit `public/.well-known/farcaster.json`:

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
    "buttonTitle": "Play Now (1 CELO)"
  }
}
```

---

## 📖 Documentation

- [GAME-RULES.md](./GAME-RULES.md) - Complete game mechanics and rules
- [GAME-GUIDE.md](./GAME-GUIDE.md) - Player guide and strategies
- [Smart Contract Docs](./Contracts/README.md) - Contract architecture and deployment
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Production deployment guide

**📊 Contract Explorers:**
- [Mainnet Proxy (Blockscout)](https://celo.blockscout.com/address/0xFD67421de125B5D216684176c58e90D6b7BCa1Ff) - Live mainnet contract (v3.0.0)
- [Mainnet Implementation (Blockscout)](https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B) - Implementation contract (v3.0.0)
- [Testnet Proxy (Blockscout)](https://celo-sepolia.blockscout.com/address/0x2f302E1604E3657035C1EADa450582fA4417f598) - Sepolia testnet contract (v3.0.0)
- [Testnet Implementation (Blockscout)](https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22) - Implementation contract (v3.0.0)

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
- [x] Celo mainnet deployment (0x39E653277AFa663B9b00C777c608B6E998cCBb22)
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
