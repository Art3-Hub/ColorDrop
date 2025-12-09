# Color Drop - Complete Game Guide

**Quick Reference:** Everything you need to know about playing Color Drop, from basic rules to advanced strategies.

---

## 📖 Table of Contents
1. [Game Overview](#game-overview)
2. [How to Play](#how-to-play)
3. [Color Matching Mechanics](#color-matching-mechanics)
4. [Scoring & Rankings](#scoring--rankings)
5. [SELF Age Verification](#self-age-verification)
6. [Complete User Flow](#complete-user-flow)
7. [Strategy Tips](#strategy-tips)
8. [Workflow & Optimization](#workflow--optimization)

---

## Game Overview

### Basic Concept
Match colors as accurately as possible in 10 seconds using HSL sliders. Top 3 players win prizes!

**Entry Fee:** 0.1 CELO per slot
**Pool Size:** 12 slots
**Time Limit:** 10 seconds per game
**Winners:** Top 3 most accurate matches

### Prize Distribution
| Rank | Prize | Multiplier |
|------|-------|------------|
| 🥇 1st | 0.6 CELO | 6× entry fee |
| 🥈 2nd | 0.3 CELO | 3× entry fee |
| 🥉 3rd | 0.1 CELO | 1× entry fee |

**System Fee:** 0.2 CELO (50/50 to dual treasuries)

---

## How to Play

### Step-by-Step

**1. Choose a Slot**
- View pool status screen with 12 slots
- Available slots show 🎮 "Play" button
- Filled slots show ✓ checkmark
- Click any available slot

**2. Age Verification (Optional)**
- Appears if unverified AND ≥2 slots used
- Verify with SELF Protocol (18+) for unlimited slots
- Or skip and continue with 4-slot limit
- One-time verification persists forever

**3. Pay Entry Fee**
- Confirm payment of 0.3 CELO
- Transaction broadcasts to contract
- Game starts immediately

**4. Match the Color**
```
┌────────────────────────────────────────┐
│  Target Color    │    Your Color       │
│  ┌─────────┐     │    ┌─────────┐     │
│  │ ████████│     │    │ ████████│     │
│  │ ████████│     │    │ ████████│     │
│  └─────────┘     │    └─────────┘     │
│                  │                     │
│  Random HSL      │    Adjust with:    │
│  H: 240, S: 75%  │    🌈 Hue slider    │
│  L: 60%          │    💧 Saturation   │
│                  │    ☀️ Lightness    │
└────────────────────────────────────────┘
        ⏱️ You have 10 seconds
```

**5. Submit Score**
- Timer expires automatically at 10 seconds
- Accuracy calculated using Delta E 2000
- Score submitted to smart contract
- Returns to pool lobby

**6. Wait for Winners**
- When all 12 slots filled and scored
- Smart contract calculates top 3
- Prizes distributed automatically
- View results on leaderboard

---

## Color Matching Mechanics

### HSL Color System

**Hue (0-360°)** - The color itself
- 0° = Red
- 60° = Yellow
- 120° = Green
- 180° = Cyan
- 240° = Blue
- 300° = Magenta

**Saturation (0-100%)** - Color intensity
- 0% = Gray (no color)
- 50% = Moderate
- 100% = Vivid

**Lightness (0-100%)** - Brightness
- 0% = Black
- 50% = True color
- 100% = White

### Delta E 2000 Algorithm

**What it measures:** Perceptual color difference (how different colors look to human eyes)

**Process:**
1. Convert HSL → RGB → LAB color space
2. Calculate Euclidean distance in LAB space
3. Normalize to 0-100 scale
4. Accuracy = 100 - difference

**Example:**
```
Target:  H:240, S:75%, L:60% (deep blue)
User:    H:238, S:73%, L:62% (close blue)

→ LAB distance: 13.2 units
→ Difference: 7.5%
→ Accuracy: 92.5% ✨ Excellent
```

### Accuracy Tiers
| Accuracy | Tier | Emoji |
|----------|------|-------|
| ≥95% | Perfect! | 🌟 |
| 90-94% | Excellent | 💎 |
| 80-89% | Great | ✨ |
| 70-79% | Good | 👍 |
| 60-69% | Okay | 👌 |
| <60% | Try Again | 🎯 |

---

## Scoring & Rankings

### Score Storage

**Format:**
- Accuracy percentage (92.47%) stored as integer (9247)
- 2 decimal precision
- Allows precise ranking without floating-point issues

```solidity
struct Player {
  address playerAddress;
  uint256 fid;
  uint256 score;  // 9247 = 92.47%
  bool hasSubmitted;
}
```

### Winner Calculation

When all 12 slots complete:
1. Contract sorts scores (descending)
2. Identifies top 3
3. Distributes prizes
4. Sends system fees to treasuries

**Example Leaderboard:**
```
🥇 1st  @alice   97.64%  →  0.6 CELO
🥈 2nd  @bob     95.23%  →  0.3 CELO
🥉 3rd  @charlie 92.47%  →  0.1 CELO
   4th  @dave    88.91%
   5th  @eve     85.56%
   ...
   12th @zoe     62.34%
```

---

## SELF Age Verification

### What is SELF Protocol?

**Zero-knowledge age verification** - Proves you're 18+ without revealing personal data.

### Benefits of Verification

| Status | Max Slots | Verification |
|--------|-----------|--------------|
| **Unverified** | 4 slots per game | None needed |
| **SELF Verified** | ∞ Unlimited | One-time (18+) |

**Why verify?**
- ✅ Unlimited slots in every game
- ✅ One-time verification (persists forever)
- ✅ Privacy-preserving (zero-knowledge proof)
- ✅ Comply with global regulations
- ✅ Play as many slots as you want

### How to Verify

1. When approaching slot limit, verification prompt appears
2. Click "Verify Age with SELF"
3. SELF app opens (deep link)
4. Complete verification in SELF app
5. Return to Color Drop
6. Unlimited slots unlocked ✅

**Privacy Note:** SELF uses zero-knowledge proofs. Your personal data never leaves your device or gets stored on-chain.

---

## Complete User Flow

### Visual Journey

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
              ↓ User clicks Slot #3
┌─────────────────────────────────────────┐
│  VERIFICATION PROMPT (if needed)        │
│  ⚠️ 2 slots remaining                  │
│                                          │
│  [🔐 Verify Age (18+)]                  │
│  [Skip - Continue with limit]           │
└─────────────────────────────────────────┘
              ↓ Proceed to payment
┌─────────────────────────────────────────┐
│  PAYMENT MODAL                           │
│  Slot #3 • Entry Fee: 0.3 CELO          │
│                                          │
│  [Confirm Payment →]                     │
└─────────────────────────────────────────┘
              ↓ Payment successful
┌─────────────────────────────────────────┐
│  GAME SCREEN                             │
│  Slot #3 • ⏱️ 10 seconds               │
│                                          │
│  Target       Your Color                │
│  ████████     ████████                  │
│                                          │
│  🌈 Hue:        ●────────                │
│  💧 Saturation: ───●─────                │
│  ☀️ Lightness:  ─────●───                │
└─────────────────────────────────────────┘
              ↓ Time expires
┌─────────────────────────────────────────┐
│  RESULTS SCREEN                          │
│  🌟 Excellent! 92.47%                   │
│                                          │
│  Target    Your Color                   │
│  ████████  ████████                     │
│                                          │
│  [📊 Submit Score to Pool]              │
│  [Back to Lobby]                         │
└─────────────────────────────────────────┘
              ↓ Score submitted
         Back to Pool #248
         (Slot #3 now shows ✓ Filled)
```

### Multi-Slot Strategy

**Unverified User Example:**
```
Game Session:
1. Play Slot #1 → 85.32% (8th place)
2. Play Slot #5 → 91.78% (3rd place 🥉)
3. Play Slot #9 → 79.45% (11th place)
4. Slot #12 → 🔒 LOCKED (limit reached)

Investment: 3 × 0.1 = 0.3 CELO
Winnings: 0.1 CELO (3rd place)
Net: -0.2 CELO
```

**Verified User Example:**
```
Game Session:
1-12. Play all 12 slots
      Best scores: #3 (97.64%), #7 (95.23%), #10 (92.47%)
      Rankings: 🥇 1st, 🥈 2nd, 🥉 3rd

Investment: 12 × 0.1 = 1.2 CELO
Winnings: 0.6 + 0.3 + 0.1 = 1.0 CELO
Net: -0.2 CELO (guaranteed top 3, but negative ROI)
```

---

## Strategy Tips

### Optimal Color Matching

**Step 1: Identify Hue (0-3 seconds)**
- Look at the base color family
- Red, Yellow, Green, Cyan, Blue, or Magenta
- Move Hue slider to approximate range

**Step 2: Adjust Saturation (3-6 seconds)**
- Low saturation = grayish/pale
- High saturation = vivid/intense
- Match the color's vividness

**Step 3: Fine-Tune Lightness (6-9 seconds)**
- Low lightness = dark
- High lightness = bright/pastel
- Match overall brightness

**Step 4: Final Tweaks (9-10 seconds)**
- Small adjustments only
- Trust visual comparison
- Don't overthink

### Common Mistakes

❌ **Over-adjusting** - Making it worse with too many changes
❌ **Ignoring one dimension** - Focusing only on hue or lightness
❌ **Trusting numbers over eyes** - The numbers are guides, not goals
✅ **Visual comparison** - Side-by-side matching is key
✅ **Deliberate changes** - Small, intentional adjustments
✅ **Balance all three** - Hue, saturation, and lightness equally important

### Multi-Slot Tactics

**Conservative (1-2 slots):**
- Low risk, practice gameplay
- Learn color matching
- Minimal investment

**Competitive (4-6 slots):**
- Balanced approach
- Multiple chances to win
- Good risk/reward ratio
- **Recommended for verified users**

**Aggressive (8-12 slots):**
- Maximum coverage
- Expensive but guarantees top 3 (if you're best)
- Only for confident players

---

## Workflow & Optimization

### Current Flow Timing

```
Pool Screen           → 2s   (user thinking)
Click Slot            → 0.5s
Verification Modal    → 3s   (if shown)
Payment Modal         → 2s   (confirm)
Payment Transaction   → 5s   (blockchain)
Game Screen           → 1s   (load)
Playing Game          → 10s  (fixed timer)
Results Screen        → 2s   (view results)
Submit Score          → 0.5s (tap button)
Score Transaction     → 5s   (blockchain)
Back to Pool          → 1s
─────────────────────────────
Total: ~32 seconds per slot
```

### Recommended Optimizations

**🚀 Speed Improvements:**

1. **Auto-Submit Scores**
   - Eliminate manual "Submit Score" button
   - Automatically submit when timer expires
   - **Saves: 2-3 seconds**

2. **Async Payment Processing**
   - Game starts immediately after confirm
   - Payment processes in background
   - Show status notification
   - **Saves: 5 seconds psychological wait**

3. **Non-Blocking Verification**
   - Replace modal with top banner
   - "⚠️ 2 slots left - Tap to verify"
   - Doesn't interrupt flow
   - **Saves: 3 seconds**

4. **Quick Replay Button**
   - "Play Another Slot" on results screen
   - Skip returning to pool
   - **Saves: 1-2 seconds**

**Result: 32s → 18.5s (42% faster)**

### Mobile Optimizations

**Better Touch Targets:**
```css
.slot-button {
  min-height: 80px;  /* Easy to tap */
  padding: 16px;
}

.slider-thumb {
  width: 24px;   /* Larger than default */
  height: 24px;
}
```

**Native Patterns:**
- Bottom sheet modals (swipe to dismiss)
- Inline confirmations (no blocking modals)
- Haptic feedback (via Farcaster SDK)
- Progressive loading (skeleton states)

### Proposed Future UI

**Streamlined Pool Screen:**
```
┌─────────────────────────────────────────┐
│  🎨 Color Drop #248        [@alice | ✅]│
│  ⚠️ 2 slots left - Tap to verify       │ ← Non-blocking banner
├─────────────────────────────────────────┤
│  🏆 1.2 CELO  •  7/12  •  Live 🔴      │
│                                          │
│  Tap any slot to play instantly:        │
│  ┌────┬────┬────┬────┐                 │
│  │ ✓  │ ✓  │ 🎮 │ ✓  │                 │ ← One tap
│  └────┴────┴────┴────┘                 │   to play
│  ┌────┬────┬────┬────┐                 │
│  │ 🎮 │ ✓  │ 🎮 │ ✓  │                 │
│  └────┴────┴────┴────┘                 │
│  ┌────┬────┬────┬────┐                 │
│  │ 🎮 │ 🎮 │ 🎮 │ 🎮 │                 │
│  └────┴────┴────┴────┘                 │
│                                          │
│  [📊 History] [🏆 Leaderboard]         │
└─────────────────────────────────────────┘
```

---

## Quick Reference Card

**🎯 Goal:** Match target color in 10 seconds
**💰 Entry:** 0.1 CELO per slot
**🏆 Prizes:** 0.6 / 0.3 / 0.1 CELO (top 3)
**👥 Pool:** 12 slots total
**🔐 Limits:** 4 slots (unverified) or ∞ (verified)
**⏱️ Timer:** 10 seconds per game
**📊 Scoring:** Delta E 2000 color difference
**🌈 Controls:** Hue, Saturation, Lightness sliders

**Fast Facts:**
- One-time SELF verification unlocks unlimited slots
- Same user can play multiple slots in same pool
- Scores stored as integers (92.47% = 9247)
- Winners calculated automatically when pool fills
- Privacy-preserving age verification (18+)
- Mobile-optimized Farcaster Mini App

---

## Additional Resources

- **Smart Contract:** [ColorDropPool.sol](Contracts/contracts/ColorDropPool.sol)
- **Game Rules:** [GAME-RULES.md](GAME-RULES.md)
- **Implementation:** [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
- **Developer Guide:** [CLAUDE.md](CLAUDE.md)
- **README:** [README.md](README.md)

---

**Built on Celo • Powered by Farcaster • Verified by SELF Protocol**
