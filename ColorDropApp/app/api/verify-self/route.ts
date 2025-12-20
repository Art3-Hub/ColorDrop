import { NextRequest, NextResponse } from 'next/server'
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core'

// Temporary verification cache - only for deeplink flow polling
// Expires after 5 minutes, cleared after first successful check
declare global {
  var selfVerificationResults: Map<string, { verified: boolean; timestamp: number }> | undefined
}

// Initialize the Self Backend Verifier
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

// Extract wallet address from SELF verification data
function extractWalletAddress(result: any, userContextData: string): string | null {
  // Method 1: Check discloseOutput.userId
  if (result.discloseOutput?.userId) {
    const userId = result.discloseOutput.userId
    if (userId.startsWith('0x') && userId.length === 42) {
      return userId.toLowerCase()
    } else if (userId.length === 40 && /^[a-f0-9]{40}$/i.test(userId)) {
      return ('0x' + userId).toLowerCase()
    }
  }

  // Method 2: Check result.userId directly
  if (result.userId) {
    const userId = result.userId
    if (userId.startsWith('0x') && userId.length === 42) {
      return userId.toLowerCase()
    } else if (userId.length === 40 && /^[a-f0-9]{40}$/i.test(userId)) {
      return ('0x' + userId).toLowerCase()
    }
  }

  // Method 3: Parse userContextData
  if (userContextData) {
    // Direct address with 0x
    if (userContextData.startsWith('0x') && userContextData.length === 42) {
      return userContextData.toLowerCase()
    }
    // Direct address without 0x (40 chars)
    if (userContextData.length === 40 && /^[a-f0-9]{40}$/i.test(userContextData)) {
      return ('0x' + userContextData).toLowerCase()
    }
    // 128-char format: attestation ID (64) + padded address (64)
    if (userContextData.length === 128) {
      const addressHex = '0x' + userContextData.slice(88, 128)
      if (/^0x[a-f0-9]{40}$/i.test(addressHex)) {
        return addressHex.toLowerCase()
      }
    }
    // 64-char format: padded address
    if (userContextData.length === 64) {
      const addressHex = '0x' + userContextData.slice(24, 64)
      if (/^0x[a-f0-9]{40}$/i.test(addressHex)) {
        return addressHex.toLowerCase()
      }
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  console.log('🚀 /api/verify-self POST endpoint hit!')

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

    // Verify the attestation using SELF Backend Verifier
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

    // Verification passed - user is 18+
    console.log('✅ SELF verification passed - user is 18+')

    // Extract wallet address for deeplink polling support
    const walletAddress = extractWalletAddress(result, userContextData)

    if (walletAddress) {
      // Store temporary result for deeplink flow polling (expires in 5 min)
      global.selfVerificationResults = global.selfVerificationResults || new Map()
      global.selfVerificationResults.set(walletAddress, {
        verified: true,
        timestamp: Date.now()
      })
      console.log('📝 Stored temp verification for deeplink polling:', walletAddress)
    }

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
