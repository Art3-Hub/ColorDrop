# 🎨 Color Drop Tournament

**Ultra-fast color matching game on Farcaster x Celo**

Match the target color in 8 seconds. Win up to 10 CELO. Play, compete, share.

---

## 🎯 Overview

Color Drop Tournament is a **skill-based mini app** where players compete in 21-player pools to match colors with precision. Built as a **Farcaster Mini App** with **Celo blockchain** integration for instant, low-cost payments.

### Core Mechanics

- **Entry:** 1 CELO per player
- **Pool Size:** 21 players per round
- **Gameplay:** 8 seconds to match target color using HSL sliders
- **Winners:**
  - 🥇 **1st Place:** 10 CELO (best accuracy)
  - 🥈 **2nd Place:** 6 CELO
  - 🥉 **3rd Place:** 3 CELO
- **System Fee:** 1 CELO (4.76% of pool)

---

## 🚀 Why Color Drop?

### Fast & Addictive
- 8-second rounds = "one more game" psychology
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

## 🎮 How to Play

### 1. Discover in Farcaster Feed
```
Pool #247 — 18/21 players 🔥
Prize: 10 | 6 | 3 CELO
[Join Now (1 CELO)]
```

### 2. Join Pool
- Click "Join Now" → Opens Mini App
- Auto-authenticate with Farcaster
- Pay 1 CELO to enter

### 3. Wait in Lobby
- See other players joining
- Pool starts when 21/21 full
- Usually fills in <2 minutes

### 4. Match the Color (8 seconds)
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
- **Network:** Celo Mainnet
- **Smart Contracts:** Solidity 0.8.20
- **Development:** Foundry + Hardhat
- **Testnet:** Celo Alfajores

### Backend
- **Hosting:** Vercel Edge Functions
- **Database:** Supabase (leaderboards, stats)
- **Real-time:** WebSockets (lobby updates)
- **Media:** Cloudinary (meme generation)

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

### Deploy Contracts (Alfajores Testnet)

```bash
cd contracts

# Install Foundry dependencies
forge install

# Run tests
forge test

# Deploy to Alfajores
forge script script/Deploy.s.sol --rpc-url $ALFAJORES_RPC --broadcast
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

- [GAME-RULES.md](./Docs/GAME-RULES.md) - Complete game mechanics and rules
- [IDEA.md](./Docs/IDEA.md) - Original concept and design thinking
- [Smart Contract Docs](./contracts/README.md) - Contract architecture

---

## 🎯 Roadmap

### Phase 1: MVP (Weeks 1-2) ✅
- [x] Core color matching gameplay
- [x] Pool smart contract
- [x] Farcaster authentication
- [x] Basic UI/UX

### Phase 2: Beta Launch (Week 3)
- [ ] Alfajores testnet deployment
- [ ] Alpha testing with 100 users
- [ ] Feedback integration
- [ ] Bug fixes

### Phase 3: Mainnet Launch (Week 4)
- [ ] Celo mainnet deployment
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
- 1,000 CELO daily volume
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

- Farcaster team for Mini App SDK
- Celo Foundation for blockchain support
- Early testers and community feedback
- Color science references and HSL theory

---

**Ready to play? Join a pool and prove your color skills! 🎨**
