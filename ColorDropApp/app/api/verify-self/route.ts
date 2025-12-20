import { NextRequest, NextResponse } from 'next/server'
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'

// Contract ABI for setUserVerification function only
const SET_USER_VERIFICATION_ABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'verified', type: 'bool' }
    ],
    name: 'setUserVerification',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Initialize the Self Backend Verifier
// Note: Using NEXT_PUBLIC_APP_URL for consistency with SelfContext
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || 'colordrop',
  `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-self`,
  process.env.NEXT_PUBLIC_SELF_USE_MOCK === 'true', // mockPassport (false for mainnet)
  AllIds, // allowed attestation IDs
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: false
  }),
  'hex' // user identifier type (ethereum address)
)

// Contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET as `0x${string}`

// Function to call smart contract setUserVerification
async function setUserVerificationOnChain(userAddress: string): Promise<boolean> {
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not set in environment')
    return false
  }

  if (!CONTRACT_ADDRESS) {
    console.error('❌ CONTRACT_ADDRESS not set in environment')
    return false
  }

  try {
    console.log('🔗 Setting up wallet client for on-chain verification...')

    // Create account from private key
    const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`)
    console.log('👛 Verifier wallet address:', account.address)

    // Create wallet client for transactions
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org')
    })

    // Create public client for reading
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org')
    })

    console.log('📝 Calling setUserVerification on contract:', CONTRACT_ADDRESS)
    console.log('👤 User address:', userAddress)

    // Send transaction to set user verification
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: SET_USER_VERIFICATION_ABI,
      functionName: 'setUserVerification',
      args: [userAddress as `0x${string}`, true]
    })

    console.log('📤 Transaction sent:', hash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      console.log('✅ On-chain verification successful! Block:', receipt.blockNumber)
      return true
    } else {
      console.error('❌ Transaction reverted')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to set on-chain verification:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 /api/verify-self POST endpoint hit!')
  console.log('📍 Request URL:', request.url)
  console.log('🔗 Origin:', request.headers.get('origin'))
  console.log('🔗 Referer:', request.headers.get('referer'))

  try {
    const body = await request.json()
    console.log('📦 Request body keys:', Object.keys(body))

    const { attestationId, proof, publicSignals, userContextData } = body

    console.log('Self verification request received:', {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      userContextData
    })

    // Verify the attestation
    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    )

    console.log('Self verification result:', {
      isValid: result.isValidDetails.isValid,
      isMinimumAgeValid: result.isValidDetails.isMinimumAgeValid,
      hasDiscloseOutput: !!result.discloseOutput
    })

    // Log the full discloseOutput to debug
    console.log('🔍 Full discloseOutput:', JSON.stringify(result.discloseOutput, null, 2))

    // Check verification details - we only care about age (18+)
    const { isValid, isMinimumAgeValid } = result.isValidDetails

    if (!isValid || !isMinimumAgeValid) {
      console.log('❌ Verification failed:', { isValid, isMinimumAgeValid })
      return NextResponse.json({
        status: 'error',
        result: false,
        reason: 'Verification failed - User does not meet minimum age requirement (18+)'
      }, { status: 200 })
    }

    // Extract wallet address from userContextData (hex encoded)
    let walletAddress: string | null = null
    try {
      // The userContextData contains the wallet address
      // It's hex-encoded, starts with userId
      const decoded = Buffer.from(userContextData, 'hex').toString('utf8')
      console.log('🔓 Decoded userContextData:', decoded)

      // Try to parse JSON from decoded data
      const jsonMatch = decoded.match(/\{.*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('📝 Parsed user data:', parsed)
      }

      // Extract address from publicSignals or userContextData hex
      // The address is in the userContextData as hex (after the attestation ID)
      const hexData = userContextData.slice(64) // Skip first 32 bytes (attestationId)
      const addressHex = '0x' + hexData.slice(24, 64) // Extract 20-byte address
      walletAddress = addressHex.toLowerCase()
      console.log('💼 Extracted wallet address:', walletAddress)
    } catch (err) {
      console.error('Failed to extract wallet address:', err)
    }

    // Store verification result for polling endpoint using wallet address
    // We only store that they are verified (18+), no personal data
    if (walletAddress) {
      global.verificationCache = global.verificationCache || new Map()

      // 1. Store in memory cache for immediate polling response
      global.verificationCache.set(walletAddress, {
        verified: true,
        timestamp: Date.now()
      })

      console.log('✅ Stored age verification (18+) in cache for wallet:', walletAddress)
      console.log('🗂️ Cache size:', global.verificationCache.size)

      // 2. Call smart contract to set on-chain verification (allows unlimited slots)
      console.log('🔗 Calling smart contract to set on-chain verification...')
      const onChainSuccess = await setUserVerificationOnChain(walletAddress)

      if (onChainSuccess) {
        console.log('✅ On-chain verification set successfully!')
      } else {
        console.log('⚠️ On-chain verification failed - user may still be limited to 2 slots')
        // Don't fail the whole request - cache verification still works for polling
        // The user can retry verification if needed
      }
    } else {
      console.log('❌ Could not store - missing walletAddress')
    }

    // Return successful verification - no personal data returned
    return NextResponse.json({
      status: 'success',
      result: true,
      message: 'Age verified (18+)'
    }, { status: 200 })

  } catch (error) {
    console.error('Self verification error:', error)

    return NextResponse.json({
      status: 'error',
      result: false,
      reason: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 200 })
  }
}

// Handle GET requests (for health check)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Self Protocol verification endpoint is active',
    scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'colordrop'
  })
}
