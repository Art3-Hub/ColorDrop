# ColorDropPool v3.0.0 - Role-Based Access Control System

## 📋 Overview

ColorDropPool v3.0.0 introduces a **two-owner role system** using OpenZeppelin's `AccessControlEnumerable` for enhanced security and operational flexibility.

## 🔐 Role Structure

### 1. DEFAULT_ADMIN_ROLE (Super Admin)
- **Address:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f`
- **Purpose:** OpenZeppelin's built-in super admin role
- **Permissions:**
  - Grant any role to any address
  - Revoke any role from any address
  - Highest privilege level in the contract

### 2. ADMIN_ROLE (Primary Owner)
- **Address:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (same as DEFAULT_ADMIN_ROLE)
- **Purpose:** Business logic management and emergency controls
- **Permissions:**
  - Update treasury addresses (`setTreasuries()`)
  - Update verifier address (`setVerifier()`)
  - Pause/unpause contract (`pause()` / `unpause()`)
  - Emergency withdraw funds (`emergencyWithdraw()`)
  - Authorize contract upgrades (`_authorizeUpgrade()`)

**Recommended Storage:** 🔒 Cold wallet (hardware wallet, multisig)

### 3. UPGRADER_ROLE (Technical Operator)
- **Address:** `0x499d377ef114cc1bf7798cecbb38412701400daf`
- **Purpose:** Deploy and upgrade contracts
- **Permissions:**
  - Authorize contract upgrades (`_authorizeUpgrade()`)
  - Deploy new contracts
  - Verify contracts on Blockscout

**Recommended Storage:** 🔥 Hot wallet (for CI/CD automation)

## 🎯 Why Two Owners?

### Security Benefits
1. **Separation of Concerns**
   - Admin handles critical business decisions (cold storage)
   - Upgrader handles technical deployments (hot wallet)

2. **Reduced Risk**
   - Upgrader wallet can be compromised without losing treasury control
   - Admin wallet can stay offline most of the time

3. **Operational Flexibility**
   - Upgrader can deploy/upgrade without waiting for cold wallet
   - Admin maintains ultimate control over funds and settings

### Use Cases

| Operation | Who Can Do It | Wallet Type |
|-----------|---------------|-------------|
| Deploy new contract | UPGRADER_ROLE | Hot wallet |
| Upgrade contract | ADMIN_ROLE or UPGRADER_ROLE | Either |
| Verify on Blockscout | UPGRADER_ROLE | Hot wallet |
| Change treasuries | ADMIN_ROLE only | Cold wallet |
| Pause contract | ADMIN_ROLE only | Cold wallet |
| Emergency withdraw | ADMIN_ROLE only | Cold wallet |
| Grant/revoke roles | DEFAULT_ADMIN_ROLE only | Cold wallet |

## 🚀 Deployment Flow

### Initial Deployment

```bash
# 1. Set environment variables
ADMIN_ADDRESS=0xc2564e41b7f5cb66d2d99466450cfebce9e8228f
UPGRADER_ADDRESS=0x499d377ef114cc1bf7798cecbb38412701400daf
PRIVATE_KEY=<upgrader_private_key>

# 2. Deploy contract
npm run deploy:sepolia  # or deploy:celo

# 3. Contract automatically grants roles during initialization:
# - ADMIN_ADDRESS gets DEFAULT_ADMIN_ROLE and ADMIN_ROLE
# - UPGRADER_ADDRESS gets UPGRADER_ROLE
```

### Upgrading Contracts

**Option A: Using UPGRADER_ROLE (Hot Wallet)**
```bash
# Upgrader can upgrade without Admin approval
PRIVATE_KEY=<upgrader_private_key> npm run upgrade:celo
```

**Option B: Using ADMIN_ROLE (Cold Wallet)**
```bash
# Admin can also upgrade if needed
PRIVATE_KEY=<admin_private_key> npm run upgrade:celo
```

## 🔄 Upgrade Process (v2.0.0 → v3.0.0)

### Current State (v2.0.0)
- Uses `OwnableUpgradeable` (single owner)
- Owner: `0x499d377ef114cc1bf7798cecbb38412701400daf`

### Upgrade Steps

1. **Compile v3.0.0**
   ```bash
   npm run compile
   ```

2. **Create Upgrade Script**
   ```typescript
   // scripts/upgrade-to-v3.ts
   import hre from "hardhat";
   const { ethers, upgrades } = hre;

   async function main() {
     const proxyAddress = "0x39E653277AFa663B9b00C777c608B6E998cCBb22"; // Mainnet
     const ColorDropPoolV3 = await ethers.getContractFactory("ColorDropPool");

     console.log("Upgrading ColorDropPool to v3.0.0...");
     const upgraded = await upgrades.upgradeProxy(proxyAddress, ColorDropPoolV3);
     await upgraded.waitForDeployment();

     console.log("✅ Upgraded successfully!");
     console.log("New implementation:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
   }

   main().catch(console.error);
   ```

3. **Run Upgrade**
   ```bash
   # Using Upgrader wallet (hot wallet)
   npx hardhat run scripts/upgrade-to-v3.ts --network celo
   ```

4. **Verify New Roles**
   ```bash
   # Check that roles were properly assigned during upgrade
   npx hardhat console --network celo
   > const pool = await ethers.getContractAt("ColorDropPool", "0x39E653277AFa663B9b00C777c608B6E998cCBb22")
   > await pool.hasRole(await pool.ADMIN_ROLE(), "0xc2564e41b7f5cb66d2d99466450cfebce9e8228f")
   > await pool.hasRole(await pool.UPGRADER_ROLE(), "0x499d377ef114cc1bf7798cecbb38412701400daf")
   ```

### ⚠️ Important Migration Notes

**Breaking Change:** The `initialize()` function signature changed:

**v2.0.0:**
```solidity
function initialize(
    address _treasury1,
    address _treasury2,
    address _verifier
) public initializer
```

**v3.0.0:**
```solidity
function initialize(
    address _admin,
    address _upgrader,
    address _treasury1,
    address _treasury2,
    address _verifier
) public initializer
```

**Impact:**
- Existing deployed proxies (v2.0.0) **DO NOT** need reinitialization
- Only new deployments will use the new `initialize()` signature
- Upgrade preserves all state (pools, players, balances, treasuries)

## 🛡️ Security Considerations

### Best Practices

1. **Cold Storage for Admin**
   - Use hardware wallet (Ledger, Trezor)
   - Or use multisig wallet (Gnosis Safe)
   - Never expose private key to internet

2. **Hot Wallet for Upgrader**
   - Can be software wallet for convenience
   - Rotate keys regularly
   - Monitor for suspicious activity

3. **Role Management**
   - Only DEFAULT_ADMIN_ROLE can grant/revoke roles
   - Be cautious when adding new addresses
   - Revoke compromised roles immediately

### Emergency Procedures

**If Upgrader Wallet Compromised:**
```bash
# Admin revokes UPGRADER_ROLE from compromised address
npx hardhat console --network celo
> const pool = await ethers.getContractAt("ColorDropPool", "PROXY_ADDRESS")
> await pool.revokeRole(await pool.UPGRADER_ROLE(), "COMPROMISED_ADDRESS")
> await pool.grantRole(await pool.UPGRADER_ROLE(), "NEW_SAFE_ADDRESS")
```

**If Admin Wallet Compromised:**
```bash
# Transfer DEFAULT_ADMIN_ROLE to new safe address
# This requires access to the compromised wallet BEFORE attacker acts
> await pool.grantRole(await pool.DEFAULT_ADMIN_ROLE(), "NEW_SAFE_ADDRESS")
> await pool.revokeRole(await pool.DEFAULT_ADMIN_ROLE(), "COMPROMISED_ADDRESS")
```

## 📊 Role Enumeration

The contract uses `AccessControlEnumerableUpgradeable` which provides:

```solidity
// Get number of addresses with a role
uint256 count = getRoleMemberCount(ADMIN_ROLE);

// Get role member by index
address member = getRoleMember(ADMIN_ROLE, 0);

// Check if address has role
bool hasRole = hasRole(ADMIN_ROLE, address);
```

## 🔗 Related Documentation

- [OpenZeppelin AccessControl](https://docs.openzeppelin.com/contracts/5.x/access-control)
- [UUPS Upgradeable Pattern](https://docs.openzeppelin.com/contracts/5.x/api/proxy#UUPSUpgradeable)
- [ColorDropPool Contract README](./README.md)

---

**Version:** 3.0.0
**Last Updated:** 2025-12-09
