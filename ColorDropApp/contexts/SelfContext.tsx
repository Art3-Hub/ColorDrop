"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { SelfAppBuilder, type SelfApp, getUniversalLink } from '@selfxyz/qrcode'

interface VerificationData {
  verified: boolean
  userIdentifier?: string
  timestamp?: number
}

interface SelfContextType {
  // State
  isVerified: boolean
  verificationData: VerificationData | null
  isVerifying: boolean
  error: string | null
  selfApp: SelfApp | null
  universalLink: string | null

  // Actions
  initiateSelfVerification: () => Promise<void>
  initiateDeeplinkVerification: () => Promise<void>
  checkVerificationStatus: () => Promise<void>
  clearVerification: () => void
  startPolling: () => void
  stopPolling: () => void

  // Widget visibility
  showWidget: boolean
  setShowWidget: (show: boolean) => void
}

const SelfContext = createContext<SelfContextType | null>(null)

export function useSelf() {
  const context = useContext(SelfContext)
  if (!context) {
    throw new Error('useSelf must be used within SelfProvider')
  }
  return context
}

interface SelfProviderProps {
  children: React.ReactNode
}

export function SelfProvider({ children }: SelfProviderProps) {
  const { address, isConnected } = useAccount()

  // Note: isVerified is session-only, resets on page reload
  // Each slot click requires fresh SELF verification
  const [isVerified, setIsVerified] = useState(false)
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState<string | null>(null)
  const [showWidget, setShowWidget] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const scope = process.env.NEXT_PUBLIC_SELF_SCOPE || 'colordrop'
  const appName = process.env.NEXT_PUBLIC_SELF_APP_NAME || 'Color Drop Tournament'
  const logoUrl = process.env.NEXT_PUBLIC_SELF_LOGO_URL || ''
  const useMock = process.env.NEXT_PUBLIC_SELF_USE_MOCK === 'true'
  const minimumAge = 18
  const excludedCountries: any[] = []
  const ofac = false

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!address) return

    try {
      const response = await fetch('/api/verify-self/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address })
      })

      const data = await response.json()

      if (data.verified) {
        setIsVerified(true)
        setVerificationData(data)
        setError(null)

        // Stop polling if active
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
    } catch (err) {
      console.error('Failed to check verification status:', err)
    }
  }, [address, pollingInterval])

  // Initialize Self app when address changes
  useEffect(() => {
    if (!address || !isConnected) {
      setSelfApp(null)
      setUniversalLink(null)
      return
    }

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-self`

      // Get deeplinkCallback - this is where SELF app will redirect back after verification
      // For Farcaster Mini Apps, use https://farcaster.xyz to return to Farcaster
      // Farcaster will handle reopening the Mini App context
      const deeplinkCallback = process.env.NEXT_PUBLIC_SELF_DEEPLINK_CALLBACK ||
        (typeof window !== 'undefined' ? window.location.href : '')

      console.log('🔧 Self Protocol Configuration:', {
        endpoint,
        scope,
        userId: address,
        deeplinkCallback,
      })

      // Build the SELF app configuration
      // deeplinkCallback is set for mobile deep link flow - SELF app opens this URL after verification
      // For QR code flow, the SelfQRcodeWrapper's onSuccess callback handles completion
      const app = new SelfAppBuilder({
        version: 2,
        appName,
        scope,
        endpoint,
        deeplinkCallback, // Required for mobile deep link redirect back to app
        logoBase64: logoUrl,
        userId: address,
        endpointType: 'https',
        userIdType: 'hex',
        disclosures: {
          minimumAge,
          excludedCountries,
          ofac,
          date_of_birth: false, // Only verify age 18+, don't collect DOB
        }
      }).build()

      setSelfApp(app)
      setUniversalLink(getUniversalLink(app))
    } catch (err) {
      console.error('Failed to initialize Self app:', err)
      setError('Failed to initialize Self Protocol')
    }
  }, [address, isConnected, appName, scope, logoUrl, minimumAge, ofac])

  // Check verification status when user returns from SELF app (callback redirect)
  // This handles the mobile deep link flow where user is redirected back after verification
  useEffect(() => {
    if (!address || !isConnected) return

    // Check if this is a return from SELF app verification
    // When user returns from SELF app, we should check their verification status
    const checkOnReturn = async () => {
      // Small delay to ensure backend has processed the verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      await checkVerificationStatus()
    }

    // Check immediately on mount (handles callback return scenario)
    checkOnReturn()
  }, [address, isConnected]) // Note: intentionally not including checkVerificationStatus to avoid loops

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const initiateSelfVerification = useCallback(async () => {
    if (!universalLink || !address) {
      setError('Self Protocol not initialized')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      console.log('🔗 Generated Self deeplink:', universalLink)
      console.log('📍 Verification endpoint:', `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-self`)
      console.log('👤 User address:', address)

      // Check if we're in Farcaster environment
      const { sdk } = await import('@farcaster/miniapp-sdk')
      const isInMiniAppResult = await sdk.isInMiniApp()

      // Clear any existing polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }

      if (isInMiniAppResult) {
        // In Farcaster app - open with SDK
        try {
          await sdk.actions.openUrl(universalLink)
          console.log('✅ Opened Self app with Farcaster SDK')
        } catch (sdkError) {
          console.error('Error opening Self app with SDK:', sdkError)
          // Fallback to window.open
          window.open(universalLink, '_blank')
          console.log('⚠️ Fell back to window.open')
        }
      } else {
        // In browser - open in new tab
        window.open(universalLink, '_blank')
        console.log('🌐 Opened Self app in new browser tab')
      }

      let pollAttempts = 0
      const maxPollAttempts = 60 // 60 attempts * 5 seconds = 5 minutes max

      // Start polling for verification results
      const interval = setInterval(async () => {
        pollAttempts++

        // Stop after max attempts
        if (pollAttempts > maxPollAttempts) {
          clearInterval(interval)
          setPollingInterval(null)
          setIsVerifying(false)
          if (!isVerified) {
            setError('Verification timeout. Please try again or refresh the page.')
          }
          console.log(`⏱️ Polling stopped after ${pollAttempts} attempts (${(pollAttempts * 5) / 60} minutes)`)
          return
        }

        await checkVerificationStatus()
      }, 5000) // Poll every 5 seconds

      setPollingInterval(interval)

    } catch (err) {
      console.error('Failed to initiate Self verification:', err)
      setError('Failed to open Self app')
      setIsVerifying(false)
    }
  }, [universalLink, address, checkVerificationStatus, isVerified, pollingInterval])

  const clearVerification = useCallback(() => {
    setIsVerified(false)
    setVerificationData(null)
    setError(null)
    setIsVerifying(false)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }, [pollingInterval])

  // Start polling for verification status (used after QR code scan)
  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    setIsVerifying(true)
    setError(null)

    let pollAttempts = 0
    const maxPollAttempts = 60 // 60 attempts * 5 seconds = 5 minutes max

    const interval = setInterval(async () => {
      pollAttempts++

      if (pollAttempts > maxPollAttempts) {
        clearInterval(interval)
        setPollingInterval(null)
        setIsVerifying(false)
        if (!isVerified) {
          setError('Verification timeout. Please try again or refresh the page.')
        }
        console.log(`⏱️ Polling stopped after ${pollAttempts} attempts`)
        return
      }

      await checkVerificationStatus()
    }, 5000)

    setPollingInterval(interval)
  }, [pollingInterval, isVerified, checkVerificationStatus])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setIsVerifying(false)
  }, [pollingInterval])

  // Initiate deeplink verification (for Farcaster mobile)
  const initiateDeeplinkVerification = useCallback(async () => {
    if (!universalLink || !address) {
      setError('Self Protocol not initialized')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      console.log('🔗 Opening Self deeplink for mobile:', universalLink)

      // Check if we're in Farcaster environment
      const { sdk } = await import('@farcaster/miniapp-sdk')
      const isInMiniAppResult = await sdk.isInMiniApp()

      if (isInMiniAppResult) {
        try {
          await sdk.actions.openUrl(universalLink)
          console.log('✅ Opened Self app with Farcaster SDK')
        } catch (sdkError) {
          console.error('Error opening Self app with SDK:', sdkError)
          window.open(universalLink, '_blank')
          console.log('⚠️ Fell back to window.open')
        }
      } else {
        window.open(universalLink, '_blank')
        console.log('🌐 Opened Self app in new browser tab')
      }

      // Start polling for results
      startPolling()
    } catch (err) {
      console.error('Failed to initiate Self verification:', err)
      setError('Failed to open Self app')
      setIsVerifying(false)
    }
  }, [universalLink, address, startPolling])

  const value: SelfContextType = {
    isVerified,
    verificationData,
    isVerifying,
    error,
    selfApp,
    universalLink,
    initiateSelfVerification,
    initiateDeeplinkVerification,
    checkVerificationStatus,
    clearVerification,
    startPolling,
    stopPolling,
    showWidget,
    setShowWidget,
  }

  return (
    <SelfContext.Provider value={value}>
      {children}
    </SelfContext.Provider>
  )
}
