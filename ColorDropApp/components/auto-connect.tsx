'use client'

import { useEffect, useRef, type PropsWithChildren } from 'react'
import { useConnect, useAccount, useConnectors, useChainId, useSwitchChain } from 'wagmi'
import { celo } from 'wagmi/chains'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * AutoConnect - Automatically connects wallet in Farcaster Mini App environment
 * Uses Celo Mainnet as the only network
 */
export function AutoConnect({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) {
  const { isConnected, isConnecting } = useAccount()
  const { connect } = useConnect()
  const connectors = useConnectors()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const hasAttemptedConnection = useRef(false)
  const hasAttemptedSwitch = useRef(false)

  // Auto-switch to Celo if connected but on wrong network
  useEffect(() => {
    if (isConnected && chainId !== celo.id && !isSwitchingChain && !hasAttemptedSwitch.current) {
      console.log('[AutoConnect] Wrong network detected (chainId:', chainId, '), switching to Celo mainnet...')
      hasAttemptedSwitch.current = true
      switchChain({ chainId: celo.id })
    }
  }, [isConnected, chainId, isSwitchingChain, switchChain])

  useEffect(() => {
    if (!enabled || hasAttemptedConnection.current) {
      return
    }

    async function handleAutoConnect() {
      try {
        // Check if we're in a mini app environment
        const isInMiniApp = await sdk.isInMiniApp()

        console.log('[AutoConnect] Environment:', {
          isInMiniApp,
          isConnected,
          isConnecting,
          connectors: connectors.map(c => c.name)
        })

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
          c => c.id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster')
        )

        if (!farcasterConnector) {
          console.error('[AutoConnect] Farcaster connector not found')
          return
        }

        console.log('[AutoConnect] Connecting with:', farcasterConnector.name)
        await connect({ connector: farcasterConnector })
        console.log('[AutoConnect] Connected successfully')

      } catch (error) {
        console.error('[AutoConnect] Failed:', error)
      }
    }

    handleAutoConnect()
  }, [connect, isConnected, isConnecting, enabled, connectors])

  return <>{children}</>
}
