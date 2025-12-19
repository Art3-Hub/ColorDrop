'use client'

import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { useConnect, useAccount, useConnectors, useChainId, useSwitchChain, useDisconnect } from 'wagmi'
import { celo } from 'wagmi/chains'
import { useFarcaster } from '@/contexts/FarcasterContext'

/**
 * AutoConnect - Automatically connects wallet in Farcaster Mini App environment
 * Uses Celo Mainnet as the only network
 *
 * Key behavior:
 * - In Farcaster (web browser or mobile): Auto-connects using farcasterMiniApp connector
 * - In standalone browser: User connects via Reown AppKit modal (no auto-connect)
 *
 * IMPORTANT: Two MUTUALLY EXCLUSIVE wallet connection paths:
 * 1. Farcaster environment → farcasterMiniApp connector (@farcaster/miniapp-wagmi-connector)
 * 2. Browser environment → Reown AppKit (initialized only in browser mode)
 * These do NOT work together - only one is active based on environment.
 *
 * IMPORTANT FIX: Continuously checks and switches to Farcaster wallet when in Farcaster environment
 * This prevents race conditions where persisted MetaMask connection loads AFTER initial check
 */

// Valid Farcaster connector IDs:
// - 'farcasterMiniApp' from @farcaster/miniapp-wagmi-connector (native Farcaster mobile app)
// - 'farcaster' provided by Farcaster web browser environment
const VALID_FARCASTER_CONNECTOR_IDS = ['farcasterMiniApp', 'farcaster'] as const

// Check if a connector ID is a valid Farcaster connector
const isValidFarcasterConnector = (connectorId: string): boolean => {
  return (VALID_FARCASTER_CONNECTOR_IDS as readonly string[]).includes(connectorId)
}

// Find the best available Farcaster connector (prefer farcasterMiniApp, fallback to farcaster)
const findFarcasterConnector = <T extends { id: string }>(connectors: readonly T[]): T | null => {
  for (const id of VALID_FARCASTER_CONNECTOR_IDS) {
    const connector = connectors.find(c => c.id === id)
    if (connector) return connector
  }
  return null
}

export function AutoConnect({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) {
  const { isConnected, isConnecting, connector, status: accountStatus } = useAccount()
  const { connect, status: connectStatus } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { isAuthenticated, isInMiniApp, loading: farcasterLoading } = useFarcaster()
  const hasAttemptedSwitch = useRef(false)

  // State to track if we're waiting for disconnect to complete before reconnecting
  const [pendingReconnect, setPendingReconnect] = useState(false)
  // Track if we've successfully connected with Farcaster wallet this session
  const [hasConnectedWithFarcaster, setHasConnectedWithFarcaster] = useState(false)
  // Debounce timer to let wagmi state settle
  const [isSettled, setIsSettled] = useState(false)

  // Wait for wagmi to settle after initial load (cookies may restore connection async)
  useEffect(() => {
    // Give wagmi 500ms to restore any persisted connections
    const timer = setTimeout(() => {
      setIsSettled(true)
      console.log('[AutoConnect] Wagmi state settled, accountStatus:', accountStatus, 'connectStatus:', connectStatus)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-switch to Celo if connected but on wrong network
  useEffect(() => {
    if (isConnected && chainId !== celo.id && !isSwitchingChain && !hasAttemptedSwitch.current) {
      console.log('[AutoConnect] Wrong network detected (chainId:', chainId, '), switching to Celo mainnet...')
      hasAttemptedSwitch.current = true
      switchChain({ chainId: celo.id })
    }
  }, [isConnected, chainId, isSwitchingChain, switchChain])

  // CONTINUOUS CHECK: Monitor and fix wrong connector in Farcaster environment
  // This runs every time connection state changes to catch late MetaMask restoration
  useEffect(() => {
    // Wait for both Farcaster context and wagmi to settle
    if (farcasterLoading || !isSettled || pendingReconnect) {
      return
    }

    // Only relevant if we're in Farcaster Mini App
    if (!isInMiniApp) {
      return
    }

    // If connected with wrong connector, fix it
    if (isConnected && connector && !isConnecting) {
      const connectorId = connector.id
      const isFarcasterConnector = isValidFarcasterConnector(connectorId)

      if (!isFarcasterConnector) {
        console.log('[AutoConnect] ⚠️ In Farcaster Mini App but connected via:', connectorId)
        console.log('[AutoConnect] 🔄 Will disconnect and reconnect with Farcaster connector...')
        console.log('[AutoConnect] Debug state:', {
          isConnected,
          connectorId,
          hasConnectedWithFarcaster,
          isSettled,
          accountStatus
        })

        // Set pending reconnect BEFORE disconnecting
        setPendingReconnect(true)
        disconnect()
      } else if (!hasConnectedWithFarcaster) {
        // Mark that we're correctly connected with Farcaster wallet
        console.log('[AutoConnect] ✅ Correctly connected with Farcaster connector:', connectorId)
        setHasConnectedWithFarcaster(true)
      }
    }
  }, [isInMiniApp, isConnected, isConnecting, connector, disconnect, farcasterLoading, pendingReconnect, isSettled, hasConnectedWithFarcaster, accountStatus])

  // Handle reconnection after disconnect completes
  useEffect(() => {
    if (!pendingReconnect || isConnected || isConnecting || farcasterLoading) {
      return
    }

    // We've disconnected and need to reconnect with Farcaster connector
    console.log('[AutoConnect] 🔄 Disconnect complete, now reconnecting with Farcaster connector...')

    async function reconnectWithFarcaster() {
      try {
        const farcasterConnector = findFarcasterConnector(connectors)

        if (!farcasterConnector) {
          console.error('[AutoConnect] ❌ No Farcaster connector found')
          console.log('[AutoConnect] Available connectors:', connectors.map(c => c.id))
          console.log('[AutoConnect] Looking for:', VALID_FARCASTER_CONNECTOR_IDS)
          setPendingReconnect(false)
          return
        }

        console.log('[AutoConnect] 🔗 Connecting with Farcaster connector:', farcasterConnector.id)
        await connect({ connector: farcasterConnector })
        console.log('[AutoConnect] ✅ Reconnected successfully with:', farcasterConnector.id)
        setHasConnectedWithFarcaster(true)
        setPendingReconnect(false)
      } catch (error) {
        console.error('[AutoConnect] ❌ Reconnection failed:', error)
        setPendingReconnect(false)
        // Retry after a short delay
        setTimeout(() => {
          if (!isConnected) {
            console.log('[AutoConnect] 🔄 Retrying Farcaster connector connection...')
            setPendingReconnect(true)
          }
        }, 1000)
      }
    }

    reconnectWithFarcaster()
  }, [pendingReconnect, isConnected, isConnecting, connectors, connect, farcasterLoading])

  // Initial auto-connect for fresh sessions (no persisted connection)
  useEffect(() => {
    // Wait for Farcaster context AND wagmi to settle
    // Skip if we're in a pending reconnect flow
    if (farcasterLoading || !enabled || !isSettled || pendingReconnect) {
      return
    }

    // Only auto-connect if we're in Farcaster Mini App and NOT connected
    if (!isInMiniApp) {
      console.log('[AutoConnect] Not in mini app - skipping auto-connect (use Reown AppKit)')
      return
    }

    if (isConnected || isConnecting) {
      // Let the continuous check handle wrong connector
      console.log('[AutoConnect] Already connected/connecting, current connector:', connector?.id)
      return
    }

    async function handleAutoConnect() {
      try {
        console.log('[AutoConnect] 🚀 Farcaster environment detected:', {
          isInMiniApp,
          isAuthenticated,
          isConnected,
          isConnecting,
          currentConnector: connector?.id,
          connectors: connectors.map(c => ({ id: c.id, name: c.name })),
          isSettled,
          accountStatus
        })

        // Find a valid Farcaster connector (prefer farcasterMiniApp, fallback to farcaster)
        const farcasterConnector = findFarcasterConnector(connectors)

        if (!farcasterConnector) {
          console.error('[AutoConnect] ❌ No Farcaster connector found')
          console.log('[AutoConnect] Available connectors:', connectors.map(c => c.id))
          console.log('[AutoConnect] Looking for:', VALID_FARCASTER_CONNECTOR_IDS)
          return
        }

        console.log('[AutoConnect] 🔗 Connecting with Farcaster connector:', farcasterConnector.id)
        await connect({ connector: farcasterConnector })
        console.log('[AutoConnect] ✅ Connected successfully with:', farcasterConnector.id)
        setHasConnectedWithFarcaster(true)

      } catch (error) {
        console.error('[AutoConnect] ❌ Failed:', error)
      }
    }

    handleAutoConnect()
  }, [connect, isConnected, isConnecting, enabled, connectors, isInMiniApp, isAuthenticated, farcasterLoading, connector, pendingReconnect, isSettled, accountStatus])

  return <>{children}</>
}
