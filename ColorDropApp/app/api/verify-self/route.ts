import { NextRequest, NextResponse } from 'next/server'
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core'
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { getContract } from 'viem'

// Initialize the Self Backend Verifier
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || 'colordrop',
  (process.env.NEXT_PUBLIC_APP_URL || '') + '/api/verify-self',
  process.env.NEXT_PUBLIC_SELF_USE_MOCK === 'true', // mockPassport (false for mainnet)
  AllIds, // allowed attestation IDs
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: false
  }),
  'hex' // user identifier type (ethereum address)
)

// Viem client for contract interaction
const publicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org')
})

// ColorDropPool ABI (only the function we need)
const contractABI = [
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

export async function POST(request: NextRequest) {
  console.log('🚀 /api/verify-self POST endpoint hit!')
  console.log('📍 Request URL:', request.url)

  try {
    const body = await request.json()
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

    // Check verification details
    const { isValid, isMinimumAgeValid } = result.isValidDetails

    if (!isValid || !isMinimumAgeValid) {
      return NextResponse.json({
        status: 'error',
        result: false,
        reason: 'Verification failed - User does not meet minimum age requirement or verification is invalid'
      }, { status: 200 })
    }

    // Extract date of birth from disclosure output
    const dateOfBirthRaw = result.discloseOutput?.dateOfBirth // Format: YYMMDD like "750429"

    // Convert YYMMDD to YYYY-MM-DD format
    let dateOfBirth: string | undefined
    if (dateOfBirthRaw && dateOfBirthRaw.length === 6) {
      const yy = dateOfBirthRaw.substring(0, 2)
      const mm = dateOfBirthRaw.substring(2, 4)
      const dd = dateOfBirthRaw.substring(4, 6)
      const century = parseInt(yy) >= 50 ? '19' : '20'
      const yyyy = century + yy
      dateOfBirth = yyyy + '-' + mm + '-' + dd
    }

    // Extract wallet address from userContextData (hex encoded)
    let walletAddress: string | null = null
    try {
      const hexData = userContextData.slice(64) // Skip first 32 bytes (attestationId)
      const addressHex = '0x' + hexData.slice(24, 64) // Extract 20-byte address
      walletAddress = addressHex.toLowerCase() as `0x${string}`
      console.log('💼 Extracted wallet address:', walletAddress)
    } catch (err) {
      console.error('Failed to extract wallet address:', err)
    }

    // Store verification result for polling endpoint using wallet address
    if (dateOfBirth && walletAddress) {
      global.verificationCache = global.verificationCache || new Map()

      global.verificationCache.set(walletAddress, {
        verified: true,
        date_of_birth: dateOfBirth,
        name: result.discloseOutput?.name || '',
        nationality: result.discloseOutput?.nationality || '',
        timestamp: Date.now()
      })

      console.log('✅ Stored verification for wallet:', walletAddress)

      // Update smart contract verification status (if contract address is configured)
      if (process.env.NEXT_PUBLIC_COLOR_DROP_CONTRACT_ADDRESS && process.env.VERIFIER_PRIVATE_KEY) {
        try {
          // Note: In production, this should be done via a secure backend service
          // with proper key management, not directly in the API route
          console.log('🔗 Updating contract verification status...')

          // This is a placeholder - implement contract interaction based on your backend setup
          // You may want to use a queue/worker pattern for this

        } catch (contractError) {
          console.error('Failed to update contract:', contractError)
          // Don't fail the verification if contract update fails
        }
      }
    }

    // Return successful verification with disclosed data
    return NextResponse.json({
      status: 'success',
      result: true,
      data: {
        date_of_birth: dateOfBirth,
        name: result.discloseOutput?.name || '',
        nationality: result.discloseOutput?.nationality || ''
      }
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
