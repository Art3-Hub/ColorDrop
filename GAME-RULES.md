# 🎮 Color Drop Tournament — Game Rules & Mechanics

**Official rules and gameplay mechanics for Color Drop Tournament**

Version 1.0 | Last Updated: December 2025

---

## 📋 Table of Contents

1. [Game Overview](#game-overview)
2. [Pool System](#pool-system)
3. [Gameplay Rules](#gameplay-rules)
4. [Scoring System](#scoring-system)
5. [Prize Distribution](#prize-distribution)
6. [Player Eligibility](#player-eligibility)
7. [Fair Play & Anti-Cheat](#fair-play--anti-cheat)
8. [Special Features](#special-features)
9. [Edge Cases & Disputes](#edge-cases--disputes)

---

## 🎯 Game Overview

### Objective
Match a randomly generated target color as accurately as possible within 10 seconds using HSL (Hue, Saturation, Lightness) sliders.

### Format
- **Tournament-style pools** of 12 players
- **Single elimination** — only top 3 win prizes
- **Skill-based** — accuracy determines ranking
- **Fast-paced** — 10 seconds per round

### Entry Requirements
- Valid Farcaster account (FID)
- 0.3 CELO entry fee
- Connected wallet (auto-managed via Farcaster Mini App)

---

## 🏊 Pool System

### Pool Formation

#### Standard Pool
- **Size:** 12 players exactly
- **Entry Fee:** 0.1 CELO per player
- **Total Pool:** 1.2 CELO
- **Prize Pool:** 1.0 CELO (0.6 + 0.3 + 0.1)
- **System Fee:** 0.2 CELO (16.67%)

#### Pool States
1. **Open** — Accepting players (0-11/12)
2. **Full** — 12 players joined, waiting to start
3. **Active** — Game in progress (10 seconds)
4. **Completed** — Results finalized, prizes distributed

#### Pool Lifecycle
```
Open → Full → Active → Completed
 ↓       ↓       ↓         ↓
0-11   12/12   Playing   Paid Out
```

### Joining a Pool

#### Requirements
- Farcaster account in good standing
- Sufficient CELO balance (0.3 CELO + gas)
- No active participation in another pool
- Accept Terms of Service

#### Process
1. Select available pool from lobby
2. Confirm 0.3 CELO payment
3. Transaction broadcast to Celo network
4. Wait for confirmation (usually <5 seconds)
5. Enter lobby and wait for pool to fill

#### Cancellation Policy
- **Before pool fills:** No withdrawal allowed once joined
- **After pool fills:** No refunds, must play
- **Technical failures:** Full refund if game cannot start

---

## 🎮 Gameplay Rules

### Game Start
- Pool starts automatically when 12/12 players joined
- 3-second countdown before target color reveals
- All players see identical target color simultaneously

### Time Limit
- **Total time:** 10 seconds from color reveal
- **Warning:** Visual/audio alert at 7 seconds remaining
- **Auto-submit:** If no manual lock-in, current color auto-submitted at 0 seconds

### Controls

#### HSL Sliders (Default)
- **Hue (H):** 0-360° — Color wheel position
- **Saturation (S):** 0-100% — Color intensity
- **Lightness (L):** 0-100% — Brightness

#### RGB Sliders (Alternative)
- **Red (R):** 0-255
- **Green (G):** 0-255
- **Blue (B):** 0-255

#### HEX Input (Advanced)
- Direct hex code entry: `#RRGGBB`
- Validation required before submission

### Submission Rules
- **One submission only** — No edits after lock-in
- **Manual lock:** Click "Lock In" button
- **Auto-lock:** Automatically at 0 seconds
- **No re-entry** — Cannot change after submission

### Prohibited Actions
- ❌ Using external color picker tools
- ❌ Screenshotting target color for analysis
- ❌ Coordinating with other players
- ❌ Using browser extensions for color detection
- ❌ Multiple accounts in same pool (collusion)

---

## 📊 Scoring System

### Accuracy Calculation

#### Color Distance Formula (Delta E 2000)
Color accuracy measured using industry-standard **CIEDE2000** algorithm:

```
ΔE = √[(ΔL'/kL·SL)² + (ΔC'/kC·SC)² + (ΔH'/kH·SH)² + RT·(ΔC'/kC·SC)·(ΔH'/kH·SH)]
```

**Simplified explanation:**
- Converts colors to LAB color space
- Calculates perceptual difference
- Lower ΔE = more accurate match

#### Accuracy Score
```
Accuracy % = max(0, 100 - (ΔE × 2))
```

**Examples:**
- ΔE = 0 → 100% (perfect match)
- ΔE = 10 → 80% (good match)
- ΔE = 25 → 50% (poor match)
- ΔE ≥ 50 → 0% (no match)

### Tiebreaker Rules

If multiple players achieve identical accuracy:

1. **Time-based:** Player who locked in first wins
2. **If still tied:** Earlier pool join time wins
3. **If still tied (rare):** Split prize equally

**Example:**
```
Player A: 95.3% @ 4.2s → Rank 1
Player B: 95.3% @ 5.8s → Rank 2
```

### Ranking Display
```
🥇 @player1 — 98.7% (4.2s) → 0.6 CELO
🥈 @player2 — 97.1% (6.1s) → 0.3 CELO
🥉 @player3 — 95.8% (7.9s) → 0.1 CELO
───────────────────────────────────
4. @player4 — 94.2% (5.5s) ❌
5. @player5 — 93.7% (3.8s) ❌
...
12. @player12 — 42.1% (8.0s) ❌
```

---

## 💰 Prize Distribution

### Standard Pool Prizes

| Rank | Prize | % of Pool | Condition |
|------|-------|-----------|-----------|
| 🥇 1st | 0.6 CELO | 50.0% | Highest accuracy |
| 🥈 2nd | 0.3 CELO | 25.0% | Second highest |
| 🥉 3rd | 0.1 CELO | 8.3% | Third highest |
| 4-12 | 0 CELO | 0% | No prize |
| Treasury 1 | 0.1 CELO | 8.3% | Platform operations |
| Treasury 2 | 0.1 CELO | 8.3% | Development fund |
| **Total** | **1.2 CELO** | **100%** | — |

### Payout Process

#### Automatic Distribution
- Winners receive CELO instantly upon pool completion
- Sent directly to Farcaster-linked wallet
- No manual claim required
- Transaction hash provided for verification

#### Timing
- **Instant:** Prizes distributed within 5 seconds of result finalization
- **Gas covered:** System pays gas fees for prize transfers
- **Confirmation:** On-chain notification sent to winners

#### Failed Payments
If prize transfer fails (e.g., invalid wallet):
1. Prize held in escrow for 30 days
2. Player notified to update wallet address
3. Manual claim available via support
4. After 30 days, prize returned to treasury

---

## 👤 Player Eligibility

### Account Requirements

#### Farcaster Account
- Valid FID (Farcaster ID)
- Active account (not banned/suspended)
- Verified profile information
- Minimum account age: 7 days (anti-Sybil)

#### Wallet Requirements
- Valid Celo-compatible wallet
- Sufficient balance (0.3 CELO + ~0.01 gas)
- No blacklisted addresses
- Accepts terms of service

### Restrictions

#### Age Verification & Slot Limits

**SELF Protocol Integration:**
Color Drop uses **SELF Protocol** for age verification to ensure compliance with global regulations.

**Slot Limits Based on Verification:**

| Status | Max Slots per Game | Verification Required |
|--------|-------------------|----------------------|
| **Unverified** | 4 slots | None - Try before verify |
| **SELF Verified (18+)** | ∞ Unlimited | One-time age verification |

**How it works:**
1. **Unverified users** can play up to **4 slots** in a single game to try it out
2. **SELF Verified users (18+)** have **unlimited slots** — play as many as you want
3. Click "Verify Age with SELF" button to complete one-time verification
4. Backend validates zero-knowledge proof from SELF Protocol
5. Backend calls smart contract to grant unlimited slots on-chain
6. Contract enforces slot limits automatically when you join pools
7. Verification persists across all sessions (stored on Celo blockchain)

**Why verify?**
- ✅ **Unlimited slots** in every game (no 4-slot limit)
- ✅ Comply with global legal requirements (18+)
- ✅ Support responsible gaming practices
- ✅ Unlock full platform features and bonuses
- ✅ Privacy-preserving (zero-knowledge proof)

#### Geographic Restrictions
- Available globally except restricted jurisdictions
- Compliance with local regulations required
- VPN/proxy use prohibited

#### Account Limits
- **One account per person** (strictly enforced)
- Multiple FIDs from same wallet = flagged
- Detected collusion = permanent ban

---

## 🛡️ Fair Play & Anti-Cheat

### Cheat Detection Systems

#### Automated Monitoring
- **Impossible accuracy patterns** (>99.5% consistently)
- **Identical submissions** across multiple players
- **Timing anomalies** (submissions at exact same millisecond)
- **Device fingerprinting** (multiple accounts, same device)

#### Manual Review
- Top performers reviewed weekly
- Community reports investigated within 24h
- Video proof may be requested for suspicious activity

### Penalties

#### Warning (First Offense)
- Account flagged for monitoring
- No prize confiscation (unless proven)
- Required to verify human identity

#### Suspension (Second Offense)
- 30-day ban from all pools
- Prizes from suspicious games withheld
- Must complete verification to return

#### Permanent Ban (Third Offense or Serious Violation)
- All accounts linked to identity banned
- Wallet addresses blacklisted
- Prizes forfeited
- Cannot create new accounts

### Reporting Cheating
```
Email: report@colordrop.app
Include:
- Pool ID
- Player username/FID
- Description of suspicious behavior
- Evidence (screenshots, etc.)
```

---

## ✨ Special Features

### Streak Bonuses

#### Consecutive Play Rewards
- **3-day streak:** +1% accuracy boost
- **7-day streak:** +3% accuracy boost
- **30-day streak:** +7% accuracy boost (max)

**How it works:**
- Play at least 1 pool per day
- Boost applied to final accuracy score
- Resets if you skip a day
- Cannot exceed 100% total accuracy

**Example:**
```
Raw accuracy: 93.5%
7-day streak bonus: +3%
Final score: 96.5%
```

### Near-Miss Incentives

If you rank **4th or 5th** (just outside prizes):

- **+1 second** bonus on next game
- **50% entry discount** on immediate replay
- **Consolation badge** (collectible)

**Example:**
```
You: Rank 4 — 94.8% (missed 3rd by 1%)
Reward: Next game has 9-second timer
```

### Daily Challenges

Complete challenges for bonus rewards:

| Challenge | Reward | Frequency |
|-----------|--------|-----------|
| Win 1st place | 0.5 CELO bonus | Daily |
| Play 10 pools | Rare color NFT | Daily |
| Achieve 95%+ | Leaderboard highlight | Daily |
| Perfect 100% | Jackpot entry | Weekly |

### Color Library (Collectibles)

Unlock colors by achieving **90%+ accuracy**:

- Color stored as NFT (Celo chain)
- Build personal collection
- Display in profile
- Trade/gift to other players
- Rare colors worth more

**Rarity tiers:**
- Common: 90-94.9%
- Rare: 95-97.9%
- Epic: 98-99.4%
- Legendary: 99.5-99.9%
- Perfect: 100%

---

## ⚖️ Edge Cases & Disputes

### Technical Issues

#### Server Downtime
- Pool cancelled if game cannot start
- Full refunds issued automatically
- Compensation: Free entry to next pool

#### Player Disconnection
- **Before game starts:** Full refund
- **During game:** Last submitted color used, or 0% if none
- **After submission:** No impact, score stands

#### Smart Contract Failures
- Automatic rollback and refund
- All players notified
- Pool restarted if desired

### Dispute Resolution

#### Prize Disputes
1. Submit support ticket within 48 hours
2. Provide: Pool ID, FID, dispute reason
3. Review completed within 5 business days
4. Decision final and binding

#### Suspected Cheating
1. Automated system flags account
2. Manual review initiated
3. Player notified and given 72 hours to respond
4. Final decision made by moderation team

#### Appeals Process
- Email: appeals@colordrop.app
- Include all relevant evidence
- One appeal per incident
- Decision within 10 business days

---

## 📜 Rule Updates

### Version History
- **v1.0** (Dec 2025) — Initial ruleset

### Amendment Process
- Rule changes announced 7 days in advance
- Community feedback period
- Updated rules apply to all new pools
- Existing pools use rules at time of creation

### Notification
- In-app announcements
- Farcaster channel posts (/color-drop)
- Email notifications (if opted in)

---

## 📞 Support & Contact

### Get Help
- **In-App Support:** Help button in Mini App
- **Email:** support@colordrop.app
- **Farcaster:** @colordrop
- **Discord:** discord.gg/colordrop

### Response Times
- General questions: 24 hours
- Technical issues: 12 hours
- Prize disputes: 5 business days
- Cheat reports: 24 hours

---

## ✅ Terms Acceptance

By playing Color Drop Tournament, you agree to:

- Follow all rules and guidelines
- Accept anti-cheat monitoring
- Understand prize distribution mechanics
- Acknowledge risk of losing entry fee
- Comply with local regulations

**Last Updated:** December 2025
**Version:** 1.0
**Effective Date:** Upon first game entry

---

**Good luck and may your color perception be sharp! 🎨**
