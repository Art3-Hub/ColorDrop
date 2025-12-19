import { NextRequest, NextResponse } from 'next/server'
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core'

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

      global.verificationCache.set(walletAddress, {
        verified: true,
        timestamp: Date.now()
      })

      console.log('✅ Stored age verification (18+) for wallet:', walletAddress)
      console.log('🗂️ Cache size:', global.verificationCache.size)
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
