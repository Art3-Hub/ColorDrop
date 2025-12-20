import { NextRequest, NextResponse } from 'next/server'

// Shared with main verify-self route
declare global {
  var selfVerificationResults: Map<string, { verified: boolean; timestamp: number }> | undefined
}

// 5 minute expiry for temp verification results
const VERIFICATION_EXPIRY_MS = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)

  try {
    const body = await request.json()
    const { userId } = body

    console.log(`[${requestId}] 📥 Verification check request for:`, userId)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const normalizedUserId = userId.toLowerCase()

    // Check temporary verification results (for deeplink flow)
    global.selfVerificationResults = global.selfVerificationResults || new Map()
    const result = global.selfVerificationResults.get(normalizedUserId)

    if (result) {
      const age = Date.now() - result.timestamp

      // Check if expired (5 minutes)
      if (age > VERIFICATION_EXPIRY_MS) {
        console.log(`[${requestId}] ⏰ Verification expired (${Math.floor(age / 1000)}s old)`)
        global.selfVerificationResults.delete(normalizedUserId)
        return NextResponse.json({ verified: false })
      }

      if (result.verified) {
        console.log(`[${requestId}] ✅ Found valid verification`)
        // Clear after successful check (one-time use)
        global.selfVerificationResults.delete(normalizedUserId)
        return NextResponse.json({ verified: true })
      }
    }

    console.log(`[${requestId}] ❌ No verification found`)
    return NextResponse.json({ verified: false })

  } catch (error) {
    console.error(`[${requestId}] 🔴 Check verification error:`, error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
