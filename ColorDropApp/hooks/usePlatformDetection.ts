'use client'

import { useState, useEffect } from 'react'
import { useFarcaster } from '@/contexts/FarcasterContext'

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
  const { isInMiniApp, loading: farcasterLoading } = useFarcaster()

  useEffect(() => {
    // Wait for Farcaster context to load
    if (farcasterLoading) {
      return
    }

    const detectPlatform = () => {
      if (typeof window === 'undefined') {
        setPlatform('browser')
        setIsLoading(false)
        return
      }

      const userAgent = navigator.userAgent
      const userAgentLower = userAgent.toLowerCase()

      // Multiple ways to detect mobile:
      // 1. Common mobile user agent patterns
      const isMobileUA = /android|iphone|ipad|ipod|mobile|webos|blackberry|opera mini|iemobile/i.test(userAgentLower)
      // 2. Farcaster mobile app specific
      const isFarcasterMobileUA = userAgent.includes('Farcaster') || userAgentLower.includes('farcaster')
      // 3. Touch device with small screen (fallback)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth <= 768

      console.log('[PlatformDetection] Detection:', {
        isInMiniApp,
        userAgent,
        isMobileUA,
        isFarcasterMobileUA,
        isTouchDevice,
        isSmallScreen,
        screenWidth: window.innerWidth
      })

      if (isInMiniApp) {
        // In Farcaster Mini App - determine mobile vs browser
        // If any mobile indicator is true, treat as mobile
        const isMobile = isMobileUA || (isFarcasterMobileUA && (isTouchDevice || isSmallScreen))

        if (isMobile) {
          console.log('[PlatformDetection] Detected: farcaster-mobile')
          setPlatform('farcaster-mobile')
        } else {
          console.log('[PlatformDetection] Detected: farcaster-browser')
          setPlatform('farcaster-browser')
        }
      } else {
        console.log('[PlatformDetection] Detected: browser')
        setPlatform('browser')
      }

      setIsLoading(false)
    }

    // Small delay to ensure window properties are available
    const timer = setTimeout(detectPlatform, 100)
    return () => clearTimeout(timer)
  }, [isInMiniApp, farcasterLoading])

  const isFarcaster = platform === 'farcaster-browser' || platform === 'farcaster-mobile'

  return {
    platform,
    isLoading,
    isInMiniApp,
    isBrowser: platform === 'browser',
    isFarcasterBrowser: platform === 'farcaster-browser',
    isFarcasterMobile: platform === 'farcaster-mobile',
    isFarcaster,
    // For SELF Protocol:
    // - Browser: show QR code only (user scans with SELF app on phone)
    // - Farcaster (any): show BOTH QR code AND deeplink button
    //   - QR for users on Farcaster web or who want to scan with another device
    //   - Deeplink for mobile users to open SELF app directly
    shouldShowQRCode: true, // Always show QR code
    shouldUseDeeplink: isFarcaster, // Show deeplink button in Farcaster environment
    // Show both options in Farcaster since mobile detection is unreliable
    shouldShowBothOptions: isFarcaster,
  }
}
