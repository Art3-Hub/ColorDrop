'use client'

import { useState, useEffect } from 'react'

export type PlatformType = 'browser' | 'farcaster-browser' | 'farcaster-mobile'

/**
 * Hook to detect the current platform for SELF Protocol integration
 * - browser: Standard web browser (show QR code)
 * - farcaster-browser: Farcaster web app (show QR code)
 * - farcaster-mobile: Farcaster mobile app (use deeplink)
 */
export function usePlatformDetection() {
  const [platform, setPlatform] = useState<PlatformType>('browser')
  const [isLoading, setIsLoading] = useState(true)
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  useEffect(() => {
    const detectPlatform = async () => {
      if (typeof window === 'undefined') {
        setPlatform('browser')
        setIsLoading(false)
        return
      }

      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const inMiniApp = await sdk.isInMiniApp()
        setIsInMiniApp(inMiniApp)

        if (inMiniApp) {
          // Check if we're on mobile
          const userAgent = navigator.userAgent.toLowerCase()
          const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent)
          const isFarcasterMobile = userAgent.includes('farcastermobile')

          if (isFarcasterMobile || isMobile) {
            setPlatform('farcaster-mobile')
          } else {
            setPlatform('farcaster-browser')
          }
        } else {
          setPlatform('browser')
        }
      } catch (error) {
        console.warn('[PlatformDetection] Failed to detect platform:', error)
        setPlatform('browser')
      }

      setIsLoading(false)
    }

    // Small delay to ensure SDK context is loaded
    const timer = setTimeout(detectPlatform, 100)
    return () => clearTimeout(timer)
  }, [])

  return {
    platform,
    isLoading,
    isInMiniApp,
    isBrowser: platform === 'browser',
    isFarcasterBrowser: platform === 'farcaster-browser',
    isFarcasterMobile: platform === 'farcaster-mobile',
    isFarcaster: platform === 'farcaster-browser' || platform === 'farcaster-mobile',
    // For SELF Protocol: show QR in browser and farcaster-browser, use deeplink in farcaster-mobile
    shouldShowQRCode: platform === 'browser' || platform === 'farcaster-browser',
    shouldUseDeeplink: platform === 'farcaster-mobile',
  }
}
