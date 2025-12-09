# 🚀 Color Drop - Production Deployment Checklist

**Last Updated:** December 2025
**Version:** 2.0.0
**Entry Fee:** 0.1 CELO | **Prizes:** 0.6 / 0.3 / 0.1 CELO

---

## 📋 Pre-Deployment Requirements

### 1. Wallet & Accounts Setup

- [ ] **Deployer Wallet** (with sufficient CELO for gas)
  - Private key secured in password manager
  - Minimum balance: 5 CELO (for deployment + buffer)
  - Address: `___________________________________`

- [ ] **Treasury Wallet 1** (receives 0.1 CELO per pool)
  - Address: `___________________________________`
  - Verified multi-sig or secure cold storage

- [ ] **Treasury Wallet 2** (receives 0.1 CELO per pool)
  - Address: `___________________________________`
  - Verified multi-sig or secure cold storage

- [ ] **Backend Verifier Wallet** (for SELF verification)
  - Private key secured (different from deployer)
  - Minimum balance: 2 CELO (for verification transactions)
  - Address: `___________________________________`

### 2. Environment Configuration

- [ ] **CeloScan API Key** obtained from https://celoscan.io/myapikey
- [ ] **WalletConnect Project ID** obtained from https://cloud.reown.com
- [ ] **Domain** registered and DNS configured
- [ ] **SSL Certificate** ready (for HTTPS)
- [ ] **Vercel/Hosting** account setup

### 3. Smart Contract Preparation

- [ ] Contract audited by security firm (⚠️ **CRITICAL** for mainnet)
- [ ] All tests passing: `cd Contracts && npm test`
- [ ] Gas optimization reviewed
- [ ] Entry fee confirmed: 0.1 CELO
- [ ] Prize distribution verified: 0.6, 0.3, 0.1 CELO
- [ ] System fee confirmed: 0.2 CELO (0.1 each treasury)

---

## 🔧 Step 1: Smart Contract Deployment

### 1.1 Configure Environment Variables

```bash
cd Contracts
cp .env.example .env
```

Edit `Contracts/.env`:
```env
# Deployer private key (has CELO for gas)
PRIVATE_KEY=0x...

# Network RPC
CELO_RPC_URL=https://forno.celo.org

# CeloScan API key for verification
CELOSCAN_API_KEY=YOUR_CELOSCAN_API_KEY

# Treasury addresses (50/50 split of 0.2 CELO system fee)
TREASURY_ADDRESS_1=0x...
TREASURY_ADDRESS_2=0x...

# Backend verifier address (for SELF age verification)
VERIFIER_ADDRESS=0x...
```

### 1.2 Compile Contract

```bash
cd Contracts
npm install
npm run compile
```

**Expected Output:**
```
✓ Compiled 1 Solidity file successfully
✓ ColorDropPool.sol compiled
```

- [ ] Compilation successful
- [ ] No warnings or errors

### 1.3 Deploy to Celo Mainnet

```bash
npx hardhat run scripts/deploy.ts --network celo
```

**Expected Output:**
```
🚀 Deploying ColorDropPool (Upgradeable)...

📍 Deploying from: 0x...
💰 Account balance: X.XX CELO

🏦 Treasury 1: 0x...
🏦 Treasury 2: 0x...
💸 Each treasury receives: 0.1 CELO per pool (50/50 split)

⏳ Deploying proxy contract...

✅ ColorDropPool deployed successfully!
📍 Proxy Address: 0x...
📍 Implementation Address: 0x...
📍 Admin Address: 0x...

🔍 Verifying configuration...
✓ Entry Fee: 0.1 CELO
✓ Pool Size: 12 players
✓ 1st Prize: 0.6 CELO
✓ 2nd Prize: 0.3 CELO
✓ 3rd Prize: 0.1 CELO
✓ System Fee: 0.2 CELO (split 50/50)
✓ Current Pool ID: 1
✓ Contract Version: 2.0.0
```

- [ ] Deployment successful
- [ ] **Copy Proxy Address:** `___________________________________`
- [ ] **Copy Implementation Address:** `___________________________________`
- [ ] All configuration values correct

### 1.4 Verify Contract on CeloScan

```bash
npx hardhat verify --network celo PROXY_ADDRESS
```

- [ ] Contract verified on CeloScan
- [ ] **CeloScan URL:** https://celoscan.io/address/PROXY_ADDRESS

### 1.5 Test Contract on Mainnet

```bash
# Check contract state
npx hardhat console --network celo
```

```javascript
const contract = await ethers.getContractAt("ColorDropPool", "PROXY_ADDRESS");
console.log("Entry Fee:", await contract.ENTRY_FEE());
console.log("Pool Size:", await contract.POOL_SIZE());
console.log("Current Pool:", await contract.currentPoolId());
```

- [ ] Contract callable
- [ ] Values match expected configuration

---

## 🌐 Step 2: Frontend Deployment

### 2.1 Configure Frontend Environment

```bash
cd App
cp .env.example .env.local
```

Edit `App/.env.local`:
```env
# App URLs (production domain)
NEXT_PUBLIC_APP_URL=https://colordrop.app
NEXT_PUBLIC_SITE_URL=https://colordrop.app

# Celo Network
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_DEFAULT_NETWORK=celo

# Game Configuration
NEXT_PUBLIC_ENTRY_FEE=0.1

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# Contract Address (from deployment)
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=PROXY_ADDRESS_FROM_DEPLOYMENT

# Backend verifier private key (server-side only)
VERIFIER_PRIVATE_KEY=0x...

# SELF Protocol
NEXT_PUBLIC_SELF_SCOPE=colordrop
NEXT_PUBLIC_SELF_APP_NAME=Color Drop Tournament
NEXT_PUBLIC_SELF_LOGO_URL=https://colordrop.app/logo.png
NEXT_PUBLIC_SELF_USE_MOCK=false
NEXT_PUBLIC_SELF_DEEPLINK_CALLBACK=https://colordrop.app/api/verify-self
```

### 2.2 Build and Test Locally

```bash
npm install
npm run build
npm run start
```

- [ ] Build successful
- [ ] No TypeScript errors
- [ ] App runs locally
- [ ] Can connect wallet
- [ ] Can view pool status
- [ ] Contract address correct

### 2.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy production
vercel --prod
```

**Configure in Vercel Dashboard:**
- [ ] Add all environment variables from `.env.local`
- [ ] Set `VERIFIER_PRIVATE_KEY` as **secret** (encrypted)
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up automatic deployments from `main` branch

- [ ] Deployment successful
- [ ] **Live URL:** https://colordrop.app

### 2.4 Verify Frontend

- [ ] App loads correctly
- [ ] Wallet connection works
- [ ] Pool status displays
- [ ] Entry fee shows 0.1 CELO
- [ ] Prize amounts correct (0.6, 0.3, 0.1)
- [ ] SELF verification button visible

---

## 🔐 Step 3: SELF Protocol Integration

### 3.1 Configure SELF Backend

- [ ] Backend verifier wallet funded (2+ CELO)
- [ ] `setUserVerification()` function accessible
- [ ] API endpoints deployed:
  - `/api/verify-self` (POST - receive verification)
  - `/api/verify-self/check` (POST - poll status)

### 3.2 Test SELF Verification Flow

1. [ ] Click "Verify Age with SELF"
2. [ ] SELF app opens with deep link
3. [ ] Complete verification
4. [ ] Backend receives proof
5. [ ] Contract updated (`verifiedUsers[address] = true`)
6. [ ] Frontend reflects unlimited slots

---

## 🧪 Step 4: End-to-End Testing

### 4.1 Complete Game Flow Test

Use testnet first, then repeat on mainnet with small amounts:

1. [ ] **Join Pool** - Pay 0.1 CELO entry fee
2. [ ] **Wait for Pool Fill** - 12/12 players
3. [ ] **Play Game** - 10-second color matching
4. [ ] **Submit Score** - Accuracy calculated
5. [ ] **View Results** - Leaderboard displayed
6. [ ] **Receive Prize** - Winners get CELO automatically

### 4.2 Multi-Slot Test

- [ ] Play 2 slots as unverified user (success)
- [ ] Play 3 slots as unverified user (success)
- [ ] Try 5th slot as unverified (blocked - verification prompt)
- [ ] Complete SELF verification
- [ ] Play 5+ slots as verified user (success)

### 4.3 Edge Cases

- [ ] Pool finalization timeout (2 minutes)
- [ ] Disconnection during game (score = 0% or last submitted)
- [ ] Identical scores (tiebreaker by timestamp)
- [ ] Failed prize transfer (fallback handling)

---

## 📊 Step 5: Monitoring & Analytics Setup

### 5.1 Smart Contract Monitoring

- [ ] Set up CeloScan alerts for contract events
- [ ] Monitor pool creation events
- [ ] Monitor prize distribution events
- [ ] Track treasury balance growth

### 5.2 Frontend Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure uptime monitoring
- [ ] Analytics integration (Google Analytics, Mixpanel)
- [ ] Track key metrics:
  - Daily Active Users
  - Pools created per day
  - Average pool fill time
  - Verification rate (% SELF verified)

### 5.3 Financial Monitoring

- [ ] Track total volume (entry fees collected)
- [ ] Monitor prize distribution accuracy
- [ ] Verify treasury splits (50/50)
- [ ] Alert on anomalies

---

## 🛡️ Step 6: Security Hardening

### 6.1 Smart Contract

- [ ] Pause contract initially for final checks
- [ ] Set emergency pause multisig (if applicable)
- [ ] Verify owner address correct
- [ ] Test emergency withdraw (while paused)
- [ ] **Unpause contract** for production

### 6.2 Backend

- [ ] Rate limiting on API endpoints
- [ ] CORS configured for Farcaster origins
- [ ] Input validation on all routes
- [ ] Verifier private key secured
- [ ] No secrets in client code

### 6.3 Frontend

- [ ] All API calls use HTTPS
- [ ] No private keys in code
- [ ] Transaction simulation before submission
- [ ] User confirmation for all payments

---

## 📢 Step 7: Launch Preparation

### 7.1 Pre-Launch Checklist

- [ ] Smart contract deployed and verified
- [ ] Frontend live and tested
- [ ] SELF verification working
- [ ] Documentation updated (GAME-RULES.md)
- [ ] Support email setup (support@colordrop.app)
- [ ] Social media accounts created

### 7.2 Soft Launch (Recommended)

- [ ] Limited announcement to small group
- [ ] Monitor first 5-10 pools closely
- [ ] Fix any issues discovered
- [ ] Collect user feedback

### 7.3 Official Launch

- [ ] Announce on Farcaster channel (/color-drop)
- [ ] Post launch cast with demo video
- [ ] Share on Twitter/X
- [ ] Community engagement

---

## 📝 Post-Deployment Tasks

### Daily

- [ ] Monitor pool activity
- [ ] Check for failed transactions
- [ ] Review error logs
- [ ] Respond to support tickets

### Weekly

- [ ] Analyze metrics and trends
- [ ] Review treasury balances
- [ ] Check for contract issues
- [ ] Community updates

### Monthly

- [ ] Security review
- [ ] Performance optimization
- [ ] Feature roadmap review
- [ ] Financial reporting

---

## 🚨 Emergency Procedures

### Contract Issues

1. Pause contract: `contract.pause()`
2. Investigate issue
3. Deploy fix (upgrade if needed)
4. Unpause: `contract.unpause()`

### Frontend Issues

1. Revert to previous Vercel deployment
2. Fix bug in development
3. Test thoroughly
4. Redeploy

### Support Contact

- **Technical Issues:** dev@colordrop.app
- **Security Issues:** security@colordrop.app
- **General Support:** support@colordrop.app

---

## ✅ Final Verification

Before going live, confirm:

- [ ] Smart contract: Entry fee 0.1 CELO ✓
- [ ] Smart contract: Prizes 0.6, 0.3, 0.1 CELO ✓
- [ ] Smart contract: System fee 0.2 CELO (0.1 each treasury) ✓
- [ ] Frontend: Entry fee displays 0.1 CELO ✓
- [ ] Frontend: Prize amounts correct ✓
- [ ] SELF: Verification flow working ✓
- [ ] SELF: Slot limits enforced (4 unverified, ∞ verified) ✓
- [ ] Monitoring: All systems operational ✓
- [ ] Documentation: All files updated ✓

---

## 🎉 Deployment Complete!

**Contract Address:** `___________________________________`
**Live App:** `___________________________________`
**Deployed By:** `___________________________________`
**Date:** `___________________________________`

Good luck and may your pools fill quickly! 🎨🚀
