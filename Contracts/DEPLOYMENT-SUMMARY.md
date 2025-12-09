# ColorDropPool v3.0.1 - Final Deployment Summary

**Deployment Date:** 2025-12-09
**Version:** 3.0.1
**Deployer:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Admin Wallet)
**All Contracts:** Deployed by Admin (both Proxy and Implementation)

---

## 🎯 Deployed Contracts

### Celo Mainnet (Chain ID: 42220)

**Proxy Contract:**
- **Address:** [`0x05342b1bA42A5B35807592912d7f073DfB95873a`](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a)
- **Purpose:** Main contract address (use for all interactions)
- **Deployed by:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Admin)

**Implementation Contract:**
- **Address:** [`0xdD0CD03E304535a0c8ae1Cd3C4C1b8BD1C9910E7`](https://celo.blockscout.com/address/0xdD0CD03E304535a0c8ae1Cd3C4C1b8BD1C9910E7)
- **Purpose:** Logic contract (upgradeable)
- **Deployed by:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Admin)
- **Version:** 3.0.1

### Celo Sepolia Testnet (Chain ID: 11142220)

**Proxy Contract:**
- **Address:** [`0xABA644cA3692295def60E09926844830b84348Bb`](https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb)
- **Purpose:** Main testnet contract
- **Deployed by:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Admin)

**Implementation Contract:**
- **Address:** [`0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85`](https://celo-sepolia.blockscout.com/address/0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85)
- **Purpose:** Logic contract (upgradeable)
- **Deployed by:** `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` (Admin)
- **Version:** 3.0.1

---

## 🔐 Role Configuration

| Role | Address | Permissions |
|------|---------|-------------|
| **ADMIN_ROLE** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | Primary owner: manage treasuries, verifier, pause, emergency withdraw, grant/revoke roles |
| **UPGRADER_ROLE** | `0x499d377ef114cc1bf7798cecbb38412701400daf` | Can authorize contract upgrades (operational access only) |
| **DEFAULT_ADMIN_ROLE** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | OpenZeppelin super admin (can assign all roles) |

### Treasury Configuration

| Treasury | Address | Share |
|----------|---------|-------|
| **Treasury 1** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | 50% (0.1 CELO per pool) |
| **Treasury 2** | `0x274f2719a0a241f696d4f82f177160a2531cf4f5` | 50% (0.1 CELO per pool) |

### Backend Verifier

**Address:** `0x499d377ef114cc1bf7798cecbb38412701400daf`
**Purpose:** Calls `setUserVerification()` after SELF Protocol age verification

---

## ✅ Blockscout Verification

### Celo Mainnet (2 contracts)

**Proxy (auto-detected after implementation verified):**
https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a

**Implementation (verify this one):**
https://celo.blockscout.com/address/0xdD0CD03E304535a0c8ae1Cd3C4C1b8BD1C9910E7

### Celo Sepolia (2 contracts)

**Proxy (auto-detected after implementation verified):**
https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb

**Implementation (verify this one):**
https://celo-sepolia.blockscout.com/address/0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85

### Verification Steps (for both implementations)

1. Click 'Code' → 'Verify & Publish'
2. **Name:** `ColorDropPool` | **Compiler:** `v0.8.22+commit.4fc1097e` | **Optimization:** Yes (200 runs)
3. Paste `flattened.sol` contents
4. **Constructor Args (no 0x):**
   ```
   000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f000000000000000000000000499d377ef114cc1bf7798cecbb38412701400daf000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f000000000000000000000000274f2719a0a241f696d4f82f177160a2531cf4f5000000000000000000000000499d377ef114cc1bf7798cecbb38412701400daf
   ```

**Note:** Proxy contracts automatically show as verified once their implementation is verified.

---

## 📝 Key Changes in v3.0.1

- ✅ **ALL contracts deployed by Admin** (0xc2564e41b7f5cb66d2d99466450cfebce9e8228f)
- ✅ Upgrader (0x499d377ef114cc1bf7798cecbb38412701400daf) has operational access only via UPGRADER_ROLE
- ✅ Version updated from 3.0.0 to 3.0.1

---

## 🚀 Frontend Integration

Update `App/.env` with new contract addresses:

```bash
# Mainnet
NEXT_PUBLIC_DEFAULT_NETWORK=celo
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x05342b1bA42A5B35807592912d7f073DfB95873a

# Sepolia Testnet
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0xABA644cA3692295def60E09926844830b84348Bb
```

---

## 🔗 Quick Links

### Mainnet
- [Proxy](https://celo.blockscout.com/address/0x05342b1bA42A5B35807592912d7f073DfB95873a)
- [Implementation](https://celo.blockscout.com/address/0xdD0CD03E304535a0c8ae1Cd3C4C1b8BD1C9910E7)

### Testnet
- [Proxy](https://celo-sepolia.blockscout.com/address/0xABA644cA3692295def60E09926844830b84348Bb)
- [Implementation](https://celo-sepolia.blockscout.com/address/0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85)

---

**Status:** ✅ **READY - All contracts deployed by Admin**

**Last Updated:** 2025-12-09
