# 🎨 Color Drop Tournament

<div align="center">

![Color Drop Banner](https://colordrop.art3hub.xyz/banner.png)

### **The Ultimate Color Matching Challenge on Web3**

*Match colors. Win CELO. Prove your perception.*

[![Celo](https://img.shields.io/badge/Built%20on-Celo-35D07F?style=for-the-badge&logo=celo)](https://celo.org)
[![Farcaster](https://img.shields.io/badge/Farcaster-Mini%20App-8B5CF6?style=for-the-badge)](https://farcaster.xyz)
[![SELF Protocol](https://img.shields.io/badge/Verified%20by-SELF%20Protocol-00D4AA?style=for-the-badge)](https://self.xyz)

[**🎮 Play Now**](https://colordrop.art3hub.xyz) · [**📖 Game Rules**](./GAME-RULES.md) · [**🔗 View Contract**](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a)

</div>

---

## ⚡ What is Color Drop?

Color Drop Tournament is a **skill-based micro-gaming experience** where 16 players compete in real-time to match a target color with surgical precision. Built as a **Farcaster Mini App** on **Celo blockchain**, it combines the addictive simplicity of casual gaming with the transparency and instant payouts of Web3.

```
🎯 Match the color → 🏆 Beat 15 opponents → 💰 Win up to 3.5 CELO
```

**No luck. No randomness. Pure skill.**

---

## 🏆 Why Players Love It

| Feature | What It Means For You |
|---------|----------------------|
| **10-Second Rounds** | Quick dopamine hits, perfect for mobile |
| **Skill-Based Wins** | Your color perception = Your advantage |
| **Instant Payouts** | Win? CELO hits your wallet in 5 seconds |
| **Micro Stakes** | Just $0.05 per game — anyone can play |
| **Privacy First** | SELF Protocol: Verify age without exposing identity |
| **Carbon Negative** | Every game plants trees (Celo's commitment) |

---

## 🎮 How It Works

```mermaid
flowchart LR
    subgraph JOIN["🎯 JOIN POOL"]
        A[Select Slot] --> B[Pay 0.5 CELO]
        B --> C[Wait for 16 Players]
    end

    subgraph PLAY["🎨 PLAY GAME"]
        C --> D[See Target Color]
        D --> E[Adjust HSL Sliders]
        E --> F[10 Second Timer]
        F --> G[Submit Match]
    end

    subgraph WIN["🏆 WIN PRIZES"]
        G --> H[Delta E Scoring]
        H --> I{Rank in Top 3?}
        I -->|🥇 1st| J[3.5 CELO]
        I -->|🥈 2nd| K[2.5 CELO]
        I -->|🥉 3rd| L[1.25 CELO]
        I -->|4th-16th| M[Try Again!]
    end

    style JOIN fill:#35D07F,color:#fff
    style PLAY fill:#8B5CF6,color:#fff
    style WIN fill:#FBCC5C,color:#000
```

### The Game Loop

1. **Join a Pool** — Pick any empty slot in the 4×4 grid, pay 0.5 CELO
2. **Wait for Players** — Pool starts when all 16 slots are filled
3. **Match the Color** — You have exactly 10 seconds to match the target using Hue, Saturation, and Lightness sliders
4. **Score Calculated** — Delta E 2000 algorithm measures your accuracy (used by professional colorists!)
5. **Winners Announced** — Top 3 players claim prizes directly from the smart contract

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["📱 Frontend Layer"]
        FC[Farcaster Mini App]
        WG[Wagmi + Viem]
        UI[React + TailwindCSS]
    end

    subgraph BLOCKCHAIN["⛓️ Celo Blockchain"]
        PROXY[UUPS Proxy Contract]
        IMPL[ColorDropPool v5.0.0]
        SELF_STORE[(Verification Storage)]
    end

    subgraph VERIFICATION["🔐 SELF Protocol"]
        SELF_APP[SELF Mobile App]
        ZKP[Zero-Knowledge Proof]
        BACKEND[Verification Backend]
    end

    subgraph SERVICES["☁️ Backend Services"]
        API[Vercel Edge Functions]
        CACHE[(Redis Cache)]
    end

    FC --> WG
    WG --> PROXY
    PROXY --> IMPL

    UI --> SELF_APP
    SELF_APP --> ZKP
    ZKP --> BACKEND
    BACKEND --> IMPL
    IMPL --> SELF_STORE

    API --> CACHE
    API --> BACKEND

    style CLIENT fill:#8B5CF6,color:#fff
    style BLOCKCHAIN fill:#35D07F,color:#fff
    style VERIFICATION fill:#00D4AA,color:#fff
    style SERVICES fill:#FBCC5C,color:#000
```

---

## 🎯 Complete Player Journey

```mermaid
sequenceDiagram
    autonumber
    participant P as 👤 Player
    participant F as 📱 Farcaster App
    participant C as ⛓️ Celo Contract
    participant S as 🔐 SELF Protocol

    Note over P,S: 🎮 JOINING A POOL
    P->>F: Open Color Drop Mini App
    F->>C: Read current pool status
    C-->>F: Pool #248: 8/16 players
    P->>F: Select empty slot #6

    Note over P,S: 💳 PAYMENT FLOW
    F->>C: joinPool(fid) + 0.5 CELO
    C->>C: Check slot limits
    C-->>F: Transaction confirmed (5s)
    F-->>P: ✅ You're in slot #6!

    Note over P,S: ⏳ WAITING FOR POOL
    loop Every 2 seconds
        F->>C: Poll player count
        C-->>F: 9/16... 12/16... 15/16... 16/16!
    end

    Note over P,S: 🎨 GAMEPLAY (10 SECONDS)
    F->>P: Show target color + timer
    P->>F: Adjust H/S/L sliders
    P->>F: Submit (or auto-submit at 0s)
    F->>F: Calculate Delta E accuracy
    F->>C: submitScore(accuracy * 100)
    C-->>F: Score recorded: 94.67%

    Note over P,S: 🏆 RESULTS & PRIZES
    C->>C: All 16 scores submitted
    C->>C: Rank players by accuracy
    C-->>F: You ranked #2! 🥈
    P->>C: claimPrize(poolId)
    C-->>P: 💰 2.5 CELO sent!
```

---

## 🔐 Age Verification Flow (SELF Protocol)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant CD as 🎮 Color Drop
    participant S as 📱 SELF App
    participant B as ☁️ Backend
    participant C as ⛓️ Smart Contract

    Note over U,C: 🔍 VERIFICATION TRIGGER
    U->>CD: Try to use 5th slot
    CD->>C: Check verification status
    C-->>CD: Not verified (4 slot limit)
    CD->>U: "Verify age for unlimited slots"

    Note over U,C: 📱 SELF VERIFICATION
    alt Desktop/Browser
        CD->>U: Show QR Code
        U->>S: Scan with SELF app
    else Mobile/Farcaster
        CD->>S: Deep link to SELF app
    end

    S->>S: User confirms identity locally
    S->>S: Generate ZK proof (18+ only)
    S->>B: Send proof + wallet address

    Note over U,C: ✅ ON-CHAIN VERIFICATION
    B->>B: Validate ZK proof
    B->>C: setUserVerification(address, true)
    C->>C: Store: verifiedUsers[addr] = true

    Note over U,C: 🎮 UNLIMITED ACCESS
    CD->>C: Poll verification status
    C-->>CD: ✅ User verified!
    CD->>U: "Unlimited slots unlocked! 🎉"
```

---

## 💚 Why We Built on Celo

### The Perfect Blockchain for Gaming

```mermaid
mindmap
  root((Celo))
    Speed
      5s block time
      Single-block finality
      Instant payouts
    Cost
      $0.001 gas fees
      Micro-transactions viable
      No fee anxiety
    Mobile
      Phone-native design
      Valora wallet
      Opera MiniPay
    Sustainability
      Carbon negative
      2x offset
      Tree planting
    Security
      EVM compatible
      Battle-tested
      100+ validators
```

### Celo vs Other Chains

| Requirement | Celo | Ethereum | Polygon | Arbitrum |
|-------------|------|----------|---------|----------|
| **Block Time** | 5 seconds | 12 seconds | 2 seconds | 0.25 seconds |
| **Finality** | ✅ 1 block | ❌ 6+ blocks | ⚠️ Variable | ⚠️ L1 dependent |
| **Gas Cost** | **$0.001** | $5-50+ | $0.01-0.10 | $0.01-0.50 |
| **Mobile SDK** | ✅ Native | ❌ None | ❌ None | ❌ None |
| **Carbon Status** | ✅ **Negative** | ⚠️ Neutral | ⚠️ Neutral | ⚠️ Neutral |

### Why This Matters for Color Drop

```
💰 Economics That Work:

On Ethereum:
  Entry fee: $0.05
  Gas cost:  $5.00
  Total:     $5.05 (100x overhead!)

On Celo:
  Entry fee: $0.05
  Gas cost:  $0.001
  Total:     $0.051 (2% overhead)

→ Celo makes micro-gaming possible.
```

---

## 🛡️ Why SELF Protocol for Age Verification

### Privacy-Preserving Compliance

```mermaid
graph LR
    subgraph TRADITIONAL["❌ Traditional KYC"]
        T1[Upload ID] --> T2[Name Stored]
        T2 --> T3[DOB Exposed]
        T3 --> T4[Data Breach Risk]
    end

    subgraph SELF["✅ SELF Protocol"]
        S1[Verify Locally] --> S2[ZK Proof Generated]
        S2 --> S3[Only '18+ Yes/No']
        S3 --> S4[Zero Personal Data]
    end

    style TRADITIONAL fill:#ff6b6b,color:#fff
    style SELF fill:#00D4AA,color:#fff
```

### What Gets Stored

| Data Point | Traditional KYC | SELF Protocol |
|------------|-----------------|---------------|
| Full Name | ✅ Stored | ❌ Never shared |
| Date of Birth | ✅ Stored | ❌ Never shared |
| ID Document | ✅ Uploaded | ❌ Stays on device |
| Home Address | ✅ Stored | ❌ Never shared |
| **Age Verified (18+)** | ✅ Yes | ✅ **Yes (only this!)** |

### Unlock Full Game Potential

| Feature | Unverified | SELF Verified |
|---------|------------|---------------|
| Slots per pool | Max 4 | **Unlimited** |
| Pool coverage | 44% max | 100% possible |
| Strategic depth | Limited | Full multi-slot tactics |
| Competitive edge | Basic | Maximum |

---

## 📊 Smart Contract Architecture

```mermaid
classDiagram
    class ColorDropPool {
        +uint256 currentPoolId
        +mapping pools
        +mapping verifiedUsers
        +address treasury1
        +address treasury2
        +address treasury3
        +joinPool(fid) payable
        +submitScore(accuracy)
        +claimPrize(poolId, rank)
        +setUserVerification(user, status)
        +finalizePool(poolId)
    }

    class Pool {
        +uint256 id
        +uint8 playerCount
        +bool isActive
        +bool isCompleted
        +uint32 startTime
        +bytes32 targetColor
        +Player[16] players
    }

    class Player {
        +address wallet
        +uint256 fid
        +uint16 accuracy
        +bool hasSubmitted
    }

    class UUPSUpgradeable {
        +_authorizeUpgrade()
    }

    class ReentrancyGuard {
        +nonReentrant modifier
    }

    class Pausable {
        +pause()
        +unpause()
    }

    ColorDropPool --|> UUPSUpgradeable
    ColorDropPool --|> ReentrancyGuard
    ColorDropPool --|> Pausable
    ColorDropPool "1" *-- "many" Pool
    Pool "1" *-- "16" Player
```

### Contract Details

| Property | Value |
|----------|-------|
| **Mainnet Proxy** | [`0x05342b1bA42A5B35807592912d7f073DfB95873a`](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a) |
| **Version** | v5.0.0 |
| **Network** | Celo Mainnet (Chain ID: 42220) |
| **Entry Fee** | 0.5 CELO |
| **Pool Size** | 16 players |
| **Treasuries** | 3 (fee split equally) |
| **Upgradeable** | UUPS Pattern |

### Prize Distribution

```
Total Pool: 8 CELO (16 × 0.5 CELO)

🥇 1st Place:  3.5 CELO   (43.75%)
🥈 2nd Place:  2.5 CELO   (31.25%)
🥉 3rd Place:  1.25 CELO  (15.625%)
💼 Platform:   0.75 CELO  (9.375% - split 3 ways)
```

---

## 🎨 Color Scoring Algorithm

We use **Delta E 2000 (CIEDE2000)** — the same algorithm used by professional colorists and industrial color matching systems.

```mermaid
flowchart LR
    subgraph INPUT["🎨 Input Colors"]
        TC[Target HSL]
        UC[User HSL]
    end

    subgraph CONVERT["🔄 Convert"]
        TC --> RGB1[RGB]
        UC --> RGB2[RGB]
        RGB1 --> LAB1[LAB*]
        RGB2 --> LAB2[LAB*]
    end

    subgraph CALCULATE["📐 Calculate"]
        LAB1 --> DE[Delta E 2000]
        LAB2 --> DE
        DE --> DIFF[Color Difference]
    end

    subgraph SCORE["📊 Score"]
        DIFF --> ACC[Accuracy %]
        ACC --> |0-50| POOR[❌ Poor]
        ACC --> |50-70| FAIR[🔶 Fair]
        ACC --> |70-85| GOOD[✅ Good]
        ACC --> |85-95| EXCELLENT[🎯 Excellent]
        ACC --> |95-100| PERFECT[⭐ Perfect]
    end

    style INPUT fill:#8B5CF6,color:#fff
    style CONVERT fill:#35D07F,color:#fff
    style CALCULATE fill:#FBCC5C,color:#000
    style SCORE fill:#00D4AA,color:#fff
```

### Accuracy Ratings

| Score | Rating | Description |
|-------|--------|-------------|
| 95-100% | ⭐ **Perfect** | Nearly indistinguishable |
| 85-94% | 🎯 **Excellent** | Very close match |
| 70-84% | ✅ **Good** | Noticeable but acceptable |
| 50-69% | 🔶 **Fair** | Visible difference |
| 0-49% | ❌ **Poor** | Significant mismatch |

---

## 🚀 Quick Start

### For Players

1. **Open Farcaster** and search for Color Drop
2. **Connect wallet** (auto-connects in Mini App)
3. **Join a pool** (0.5 CELO entry)
4. **Match colors** when pool is full
5. **Claim prizes** if you're in top 3!

### For Developers

```bash
# Clone the repository
git clone https://github.com/art3hub/colordrop.git
cd colordrop

# Install frontend
cd ColorDropApp
npm install
npm run dev

# Deploy contracts (optional)
cd ../Contracts
npm install
npm run deploy:sepolia
```

---

## 📁 Project Structure

```
ColorDrop/
├── ColorDropApp/           # Next.js 16 Frontend
│   ├── app/               # App Router pages
│   │   ├── api/          # Edge API routes
│   │   └── .well-known/  # Farcaster manifest
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   └── lib/              # Utilities
│
├── Contracts/             # Solidity Smart Contracts
│   ├── contracts/        # ColorDropPool.sol
│   ├── scripts/          # Deploy & upgrade scripts
│   └── test/             # Contract tests
│
├── CLAUDE.md             # AI development guide
├── GAME-RULES.md         # Complete game rules
└── README.md             # This file
```

---

## 🎯 Roadmap

```mermaid
gantt
    title Color Drop Roadmap 2025
    dateFormat  YYYY-MM
    section Phase 1
    Core Game MVP           :done, 2024-11, 2024-12
    Celo Integration        :done, 2024-12, 2024-12
    section Phase 2
    SELF Protocol           :done, 2024-12, 2024-12
    Testnet Launch          :done, 2024-12, 2024-12
    section Phase 3
    Mainnet Launch          :active, 2024-12, 2025-01
    Security Audit          :2025-01, 2025-02
    section Phase 4
    Tournaments             :2025-02, 2025-03
    Leaderboards            :2025-02, 2025-03
    section Phase 5
    Private Rooms           :2025-03, 2025-04
    NFT Rewards             :2025-04, 2025-05
    Mobile App              :2025-05, 2025-06
```

### Upcoming Features

- [ ] **Daily Challenges** — Special color palettes with boosted prizes
- [ ] **Streak Bonuses** — Win consecutive games for multipliers
- [ ] **Private Rooms** — Invite friends to compete
- [ ] **NFT Trophies** — Collectible achievements for top players
- [ ] **Leaderboards** — Season rankings with exclusive rewards

---

## 🔐 Security

| Protection | Implementation |
|------------|----------------|
| Reentrancy | `ReentrancyGuard` on all payable functions |
| Pausable | Emergency stop capability |
| Access Control | Role-based (Admin, Upgrader, Verifier) |
| Upgradeable | UUPS pattern for safe upgrades |
| Age Verification | SELF Protocol zero-knowledge proofs |

**Report vulnerabilities:** security@art3hub.xyz

---

## 🌐 Links

| Resource | Link |
|----------|------|
| **Play Now** | [colordrop.art3hub.xyz](https://colordrop.art3hub.xyz) |
| **Smart Contract** | [Celo Blockscout](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a) |
| **Farcaster** | /color-drop channel |
| **GitHub** | [Art3Hub/ColorDrop](https://github.com/art3hub/colordrop) |

---

## 👥 Built By

<div align="center">

**[Art3Hub](https://art3hub.xyz)** — Building the future of Web3 gaming

*With love for the Farcaster × Celo ecosystem*

</div>

---

## 🙏 Acknowledgments

- **Farcaster** — For the Mini App SDK and social layer
- **Celo Foundation** — For mobile-first, carbon-negative blockchain
- **SELF Protocol** — For privacy-preserving identity verification
- **OpenZeppelin** — For battle-tested smart contract libraries

---

<div align="center">

**Ready to prove your color perception? 🎨**

[**🎮 Play Color Drop Now**](https://colordrop.art3hub.xyz)

*Match colors. Win CELO. Be the best.*

</div>
