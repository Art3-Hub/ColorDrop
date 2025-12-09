# ColorDropPool v3.0.0 - Blockscout Verification Guide

## 🔍 Manual Verification Instructions

Since Blockscout's API verification has limitations, follow these steps to manually verify the contracts through their web interface.

### Step 1: Navigate to Implementation Contract

#### Celo Sepolia Testnet
**Implementation Contract:** [0xac8E5E4965d6c1fa376C77596BC54276870efB22](https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22)

1. Go to: https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22
2. Click on the "**Code**" tab
3. Click "**Verify & Publish**" button

#### Celo Mainnet
**Implementation Contract:** [0xa76846Ed172e1DaD467b3E343BB37347cC4F943B](https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B)

1. Go to: https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B
2. Click on the "**Code**" tab
3. Click "**Verify & Publish**" button

---

### Step 2: Fill in Verification Form

#### Contract Address
This will be pre-filled based on the page you're on.

#### Contract Name
```
ColorDropPool
```

#### Compiler
Select from dropdown or enter:
```
v0.8.22+commit.4fc1097e
```

#### Optimization
- ✅ **Enabled: Yes**
- **Runs:** `200`

#### EVM Version
```
default
```

---

### Step 3: Paste Flattened Source Code

The flattened source code is located in:
```
/Users/osx/Projects/Art3Hub/ColorDrop/Contracts/flattened.sol
```

**Option A: Copy file contents**
```bash
# From Contracts directory
cat flattened.sol
```

**Option B: Open in editor**
```bash
# macOS
open flattened.sol

# Or use your preferred editor
code flattened.sol
vim flattened.sol
```

Copy the **entire contents** of `flattened.sol` and paste into the "**Solidity Contract Code**" field.

**File size:** ~208,000 characters
**Note:** The file is large but Blockscout accepts it. Make sure to copy the entire file.

---

### Step 4: Constructor Arguments (ABI-encoded)

**IMPORTANT:** Use the constructor arguments **WITHOUT** the `0x` prefix.

#### Constructor Arguments:
```
000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f000000000000000000000000499d377ef114cc1bf7798cecbb38412701400daf000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f000000000000000000000000274f2719a0a241f696d4f82f177160a2531cf4f5000000000000000000000000499d377ef114cc1bf7798cecbb38412701400daf
```

**Breakdown (for reference):**
| Parameter | Address | Notes |
|-----------|---------|-------|
| **Admin** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | Primary owner with DEFAULT_ADMIN_ROLE and ADMIN_ROLE |
| **Upgrader** | `0x499d377ef114cc1bf7798cecbb38412701400daf` | Has UPGRADER_ROLE, can authorize upgrades |
| **Treasury 1** | `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f` | First treasury wallet |
| **Treasury 2** | `0x274f2719a0a241f696d4f82f177160a2531cf4f5` | Second treasury wallet |
| **Verifier** | `0x499d377ef114cc1bf7798cecbb38412701400daf` | Backend SELF Protocol verifier |

---

### Step 5: Submit Verification

1. Review all fields are filled correctly
2. Click "**Verify and Publish**" button
3. Wait for verification (usually takes 30-60 seconds)

---

### Step 6: Verify Success

After successful verification, you should see:

✅ **Contract Source Code Verified**

The contract page will now show:
- ✅ Green checkmark next to contract address
- 📄 Readable source code in "Code" tab
- 📝 Contract functions in "Read Contract" and "Write Contract" tabs
- 🔍 Constructor parameters decoded

---

## 🔗 Verification Links

### Celo Sepolia Testnet
- **Proxy:** [0x2f302E1604E3657035C1EADa450582fA4417f598](https://celo-sepolia.blockscout.com/address/0x2f302E1604E3657035C1EADa450582fA4417f598)
- **Implementation:** [0xac8E5E4965d6c1fa376C77596BC54276870efB22](https://celo-sepolia.blockscout.com/address/0xac8E5E4965d6c1fa376C77596BC54276870efB22) ⚠️ **Verify this one**

### Celo Mainnet
- **Proxy:** [0xFD67421de125B5D216684176c58e90D6b7BCa1Ff](https://celo.blockscout.com/address/0xFD67421de125B5D216684176c58e90D6b7BCa1Ff)
- **Implementation:** [0xa76846Ed172e1DaD467b3E343BB37347cC4F943B](https://celo.blockscout.com/address/0xa76846Ed172e1DaD467b3E343BB37347cC4F943B) ⚠️ **Verify this one**

---

## ⚠️ Important Notes

1. **Only verify the Implementation contracts**, not the Proxy contracts
2. Proxy contracts are **automatically recognized** by Blockscout once the implementation is verified
3. **Use the exact compiler version** `v0.8.22+commit.4fc1097e`
4. **Constructor arguments must NOT have** the `0x` prefix
5. The flattened source code is **very large** (~208KB) - this is normal
6. Verification usually completes within **30-60 seconds**

---

## 🆘 Troubleshooting

### "Compilation Error"
- Ensure you copied the **entire** flattened.sol file
- Check that compiler version is **exactly** `v0.8.22+commit.4fc1097e`
- Ensure optimization is **enabled** with **200 runs**

### "Constructor Arguments Invalid"
- Remove the `0x` prefix from constructor arguments
- Ensure there are no spaces or line breaks in the constructor arguments string
- The constructor arguments string should be exactly 320 characters long (64 chars per address × 5 addresses)

### "Source Code Does Not Match"
- Verify you're using the correct flattened.sol file
- Ensure the contract address matches the implementation contract (not proxy)
- Try regenerating flattened.sol: `npm run flatten`

---

## ✅ Post-Verification Checklist

After successful verification:

- [ ] Implementation contract shows green checkmark on Blockscout
- [ ] "Read Contract" tab is accessible with all functions visible
- [ ] "Write Contract" tab is accessible for admin operations
- [ ] Constructor parameters are correctly decoded
- [ ] Proxy contract automatically shows "Proxy" badge
- [ ] Proxy contract's "Read as Proxy" and "Write as Proxy" tabs work

---

## 📝 Verification Summary

**Contract:** ColorDropPool v3.0.0 (UUPS Upgradeable with Role-Based Access Control)
**Compiler:** Solidity 0.8.22
**Optimization:** Enabled (200 runs)
**OpenZeppelin Version:** 5.0.0
**Pattern:** UUPS Proxy with AccessControlEnumerable
**Deployment Date:** 2025-12-09
**Deployer:** 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f (Admin)
