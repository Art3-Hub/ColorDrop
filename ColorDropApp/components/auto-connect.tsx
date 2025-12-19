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
 * - In Farcaster Mini App: Auto-connects using farcasterMiniApp connector
 * - In browser with MetaMask: Disconnects any existing connection, user must manually connect
 * - Ensures the correct wallet is used based on environment
 * - Handles disconnect→reconnect flow properly to switch from MetaMask to Farcaster wallet
 */
export function AutoConnect({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) {
  const { isConnected, isConnecting, connector } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { isAuthenticated, isInMiniApp, loading: farcasterLoading } = useFarcaster()
  const hasAttemptedConnection = useRef(false)
  const hasAttemptedSwitch = useRef(false)
  const hasCheckedConnector = useRef(false)

  // State to track if we're waiting for disconnect to complete before reconnecting
  const [pendingReconnect, setPendingReconnect] = useState(false)

  // Auto-switch to Celo if connected but on wrong network
  useEffect(() => {
    if (isConnected && chainId !== celo.id && !isSwitchingChain && !hasAttemptedSwitch.current) {
      console.log('[AutoConnect] Wrong network detected (chainId:', chainId, '), switching to Celo mainnet...')
      hasAttemptedSwitch.current = true
      switchChain({ chainId: celo.id })
    }
  }, [isConnected, chainId, isSwitchingChain, switchChain])

  // Check if connected with wrong connector in Farcaster environment
  // If in Farcaster but connected via MetaMask, disconnect and set pendingReconnect
  useEffect(() => {
    if (farcasterLoading || hasCheckedConnector.current) {
      return
    }

    if (isInMiniApp && isConnected && connector) {
      const connectorId = connector.id
      const isFarcasterConnector = connectorId === 'farcasterMiniApp'

      if (!isFarcasterConnector) {
        console.log('[AutoConnect] In Farcaster Mini App but connected via:', connectorId)
        console.log('[AutoConnect] Disconnecting to reconnect with Farcaster wallet...')
        hasCheckedConnector.current = true
        // Set pending reconnect BEFORE disconnecting
        setPendingReconnect(true)
        disconnect()
      }
    }
  }, [isInMiniApp, isConnected, connector, disconnect, farcasterLoading])

  // Handle reconnection after disconnect completes
  // This useEffect watches for isConnected to become false after we initiated disconnect
  useEffect(() => {
    if (!pendingReconnect || isConnected || isConnecting || farcasterLoading) {
      return
    }

    // We've disconnected and need to reconnect with Farcaster connector
    console.log('[AutoConnect] Disconnect complete, now reconnecting with Farcaster wallet...')

    async function reconnectWithFarcaster() {
      try {
        const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')

        if (!farcasterConnector) {
          console.error('[AutoConnect] Farcaster connector not found for reconnection')
          console.log('[AutoConnect] Available connectors:', connectors.map(c => c.id))
          setPendingReconnect(false)
          return
        }

        console.log('[AutoConnect] Connecting with Farcaster Mini App connector...')
        await connect({ connector: farcasterConnector })
        console.log('[AutoConnect] Reconnected successfully with Farcaster wallet')
        setPendingReconnect(false)
      } catch (error) {
        console.error('[AutoConnect] Reconnection failed:', error)
        setPendingReconnect(false)
      }
    }

    reconnectWithFarcaster()
  }, [pendingReconnect, isConnected, isConnecting, connectors, connect, farcasterLoading])

  // Initial auto-connect for fresh sessions (not reconnection after disconnect)
  useEffect(() => {
    // Wait for Farcaster context to load
    // Skip if we're in a pending reconnect flow (handled by the useEffect above)
    if (farcasterLoading || !enabled || hasAttemptedConnection.current || pendingReconnect) {
      return
    }

    async function handleAutoConnect() {
      try {
        console.log('[AutoConnect] Environment:', {
          isInMiniApp,
          isAuthenticated,
          isConnected,
          isConnecting,
          currentConnector: connector?.id,
          connectors: connectors.map(c => ({ id: c.id, name: c.name }))
        })

        // Only auto-connect if we're in Farcaster Mini App
        if (!isInMiniApp) {
          console.log('[AutoConnect] Not in mini app - skipping auto-connect')
          return
        }

        if (isConnected || isConnecting) {
          console.log('[AutoConnect] Already connected/connecting')
          return
        }

        hasAttemptedConnection.current = true

        // Find Farcaster connector
        const farcasterConnector = connectors.find(
          c => c.id === 'farcasterMiniApp'
        )

        if (!farcasterConnector) {
          console.error('[AutoConnect] Farcaster connector not found')
          console.log('[AutoConnect] Available connectors:', connectors.map(c => c.id))
          return
        }

        console.log('[AutoConnect] Connecting with Farcaster Mini App connector...')
        await connect({ connector: farcasterConnector })
        console.log('[AutoConnect] Connected successfully with Farcaster wallet')

      } catch (error) {
        console.error('[AutoConnect] Failed:', error)
      }
    }

    handleAutoConnect()
  }, [connect, isConnected, isConnecting, enabled, connectors, isInMiniApp, isAuthenticated, farcasterLoading, connector, pendingReconnect])

  return <>{children}</>
}
