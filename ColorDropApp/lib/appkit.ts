'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo } from '@reown/appkit/networks'

// Get WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - Reown AppKit may not work properly')
}

// App metadata
const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Color Drop Tournament',
  description: 'Match colors, win CELO prizes on Farcaster',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://colordrop.art3hub.xyz',
  icons: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://colordrop.art3hub.xyz'}/icon.png`],
}

// Create Wagmi adapter for Reown AppKit (browser mode only)
// This is separate from the main wagmi config to avoid conflicts with Farcaster connector
export const wagmiAdapter = new WagmiAdapter({
  networks: [celo],
  projectId,
})

// Create AppKit instance for browser wallet connections
// This provides a polished modal UI for MetaMask, WalletConnect, Coinbase, etc.
let appKitInstance: ReturnType<typeof createAppKit> | null = null

export function initAppKit() {
  if (typeof window === 'undefined') return null

  if (!appKitInstance && projectId) {
    appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      networks: [celo],
      projectId,
      metadata,
      features: {
        analytics: false,
        email: false,
        socials: false, // Disable social logins, keep wallet connections only
      },
      themeMode: 'light',
      themeVariables: {
        '--w3m-accent': '#3B82F6', // Blue accent to match app
        '--w3m-border-radius-master': '8px',
      },
    })
    console.log('[AppKit] Initialized for browser mode')
  }

  return appKitInstance
}

export function getAppKit() {
  return appKitInstance
}
