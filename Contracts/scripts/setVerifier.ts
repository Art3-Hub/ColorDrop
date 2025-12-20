/**
 * Script to set the verifier address in ColorDropPool contract
 *
 * The verifier is the backend wallet that can call setUserVerification()
 * after SELF Protocol proof validation.
 *
 * Run with admin wallet private key:
 * ADMIN_PRIVATE_KEY=0x... npx hardhat run scripts/setVerifier.ts --network celo
 */

import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'

// Contract address (proxy)
const CONTRACT_ADDRESS = '0x05342b1bA42A5B35807592912d7f073DfB95873a' as const

// The verifier address to set (backend wallet)
const VERIFIER_ADDRESS = '0x499D377eF114cC1BF7798cECBB38412701400daF' as const

// ABI for setVerifier function
const SET_VERIFIER_ABI = [
  {
    inputs: [{ name: 'newVerifier', type: 'address' }],
    name: 'setVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

async function main() {
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY

  if (!adminPrivateKey) {
    console.error('❌ ADMIN_PRIVATE_KEY environment variable not set')
    console.log('')
    console.log('Usage:')
    console.log('  ADMIN_PRIVATE_KEY=0x... npx hardhat run scripts/setVerifier.ts --network celo')
    console.log('')
    console.log('The admin wallet must be: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f')
    process.exit(1)
  }

  // Create account from private key
  const account = privateKeyToAccount(adminPrivateKey.startsWith('0x') ? adminPrivateKey as `0x${string}` : `0x${adminPrivateKey}` as `0x${string}`)

  console.log('🔧 ColorDropPool - Set Verifier Script')
  console.log('=====================================')
  console.log('')
  console.log('📝 Contract:', CONTRACT_ADDRESS)
  console.log('👛 Admin wallet:', account.address)
  console.log('🎯 New verifier:', VERIFIER_ADDRESS)
  console.log('')

  // Verify admin address
  if (account.address.toLowerCase() !== '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'.toLowerCase()) {
    console.error('❌ Error: Private key does not match expected admin address')
    console.error('   Expected: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f')
    console.error('   Got:      ' + account.address)
    process.exit(1)
  }

  // Create clients
  const publicClient = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org')
  })

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http('https://forno.celo.org')
  })

  // Check current verifier
  const currentVerifier = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: SET_VERIFIER_ABI,
    functionName: 'verifier'
  })

  console.log('📋 Current verifier:', currentVerifier)

  if (currentVerifier.toLowerCase() === VERIFIER_ADDRESS.toLowerCase()) {
    console.log('✅ Verifier is already set correctly!')
    return
  }

  console.log('')
  console.log('🔄 Sending transaction to set verifier...')

  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: SET_VERIFIER_ABI,
      functionName: 'setVerifier',
      args: [VERIFIER_ADDRESS]
    })

    console.log('📤 Transaction sent:', hash)
    console.log('⏳ Waiting for confirmation...')

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      console.log('✅ Transaction confirmed! Block:', receipt.blockNumber)

      // Verify the change
      const newVerifier = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: SET_VERIFIER_ABI,
        functionName: 'verifier'
      })

      console.log('')
      console.log('🎉 Verifier successfully updated!')
      console.log('   New verifier:', newVerifier)
    } else {
      console.error('❌ Transaction reverted')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Transaction failed:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
