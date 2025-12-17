'use client'

import { useEffect, useRef, type PropsWithChildren } from 'react'
import { useConnect, useAccount, useConnectors } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * AutoConnect - Smart connector selection based on platform
 *
 * Automatically connects to the appropriate connector:
 * - Farcaster Mini App: Uses Farcaster connector
 * - Base Mini App: Uses Base Account connector
 * - Browser: No auto-connect (uses Reown AppKit modal)
 */
export function AutoConnect({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) {
  const { isConnected, isConnecting } = useAccount()
  const { connect } = useConnect()
  const connectors = useConnectors()
  const hasAttemptedConnection = useRef(false)

  useEffect(() => {
    if (!enabled || hasAttemptedConnection.current) {
      console.log('[AutoConnect] Skipping - enabled:', enabled, 'hasAttempted:', hasAttemptedConnection.current)
      return
    }

    async function handleAutoConnect() {
      try {
        console.log('[AutoConnect] 🔍 Checking environment...')

        // Check if we're in a mini app environment
        const isInMiniApp = await sdk.isInMiniApp()
        const context = await sdk.context

        console.log('[AutoConnect] 📊 Environment:', {
          isInMiniApp,
          platform: context?.client?.platform,
          isConnected,
          isConnecting,
          availableConnectors: connectors.map(c => ({ id: c.id, name: c.name }))
        })

        if (!isInMiniApp) {
          console.log('[AutoConnect] ⏭️ Not in mini app - skipping auto-connect (browser mode)')
          return
        }

        if (isConnected || isConnecting) {
          console.log('[AutoConnect] ⏭️ Already connected/connecting - skipping')
          return
        }

        hasAttemptedConnection.current = true

        // Detect which mini app platform we're in
        // Priority:
        // 1. If context has a Farcaster user (fid > 0), it's definitely Farcaster
        // 2. If platform is explicitly 'base', it's Base
        // 3. If in iframe with no platform and no Farcaster user, assume Base
        const platform = context?.client?.platform
        const hasFarcasterUser = context?.user?.fid && context.user.fid > 0

        // Farcaster detection: has a Farcaster user OR platform is not 'base'
        // Base detection: platform is explicitly 'base' OR (in iframe with no farcaster user and no platform)
        const isFarcasterMiniApp = hasFarcasterUser || (platform !== 'base' && platform !== undefined)
        const isBaseMiniApp = platform === 'base' || (!hasFarcasterUser && !platform && typeof window !== 'undefined' && window.top !== window.self)

        console.log('[AutoConnect] 🔍 Platform detection:', {
          platform,
          hasFarcasterUser,
          fid: context?.user?.fid,
          isFarcasterMiniApp,
          isBaseMiniApp
        })

        // Find the appropriate connector from the unified config
        let connector
        if (isFarcasterMiniApp) {
          connector = connectors.find(c => c.id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster'))
          console.log('[AutoConnect] 🟣 Farcaster mini app detected - connector:', connector?.name || 'NOT FOUND')
        } else if (isBaseMiniApp) {
          connector = connectors.find(c => c.id === 'baseAccount' || c.name.toLowerCase().includes('base'))
          console.log('[AutoConnect] 🔵 Base mini app detected - connector:', connector?.name || 'NOT FOUND')
        } else {
          // Fallback: try Farcaster first, then Base
          console.log('[AutoConnect] ⚠️ Could not determine platform, trying Farcaster first...')
          connector = connectors.find(c => c.id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster'))
          if (!connector) {
            connector = connectors.find(c => c.id === 'baseAccount' || c.name.toLowerCase().includes('base'))
          }
        }

        if (!connector) {
          console.error('[AutoConnect] ❌ Connector not found for platform')
          return
        }

        await connect({ connector })
        console.log('[AutoConnect] ✅ Auto-connected successfully with:', connector.name)
      } catch (error) {
        console.error('[AutoConnect] ❌ Auto-connect failed:', error)
      }
    }

    handleAutoConnect()
  }, [connect, isConnected, isConnecting, enabled, connectors])

  return <>{children}</>
}
