import { http, createConfig } from 'wagmi'
import { celo } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { walletConnect, injected } from 'wagmi/connectors'

// Get Celo RPC URL from environment or use default
const CELO_RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'

// WalletConnect project ID is required for WalletConnect v2
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - WalletConnect may not work properly')
}

// App metadata for WalletConnect
const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Color Drop Tournament',
  description: 'Match colors, win CELO prizes on Farcaster',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://colordrop.art3hub.xyz',
  icons: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://colordrop.art3hub.xyz'}/icon.png`],
}

// Configure connectors array
const connectors = [
  // Farcaster Mini App Connector (auto-activated in Farcaster environment)
  farcasterMiniApp(),

  // Injected Connector (for browser extension wallets like MetaMask)
  injected(),

  // WalletConnect Connector (for mobile wallets and QR code connection)
  walletConnect({
    projectId,
    showQrModal: true,
    metadata,
  }),
]

// Create wagmi config - CELO MAINNET ONLY
export const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(CELO_RPC_URL),
  },
  connectors,
})

console.log('🌐 Wagmi Configuration - CELO MAINNET ONLY:', {
  chainId: celo.id,
  chainName: celo.name,
  rpcUrl: CELO_RPC_URL,
})

// Export network info for display
export const NETWORK_INFO: {
  name: string;
  chainId: number;
  isTestnet: boolean;
  explorer: string;
  faucet?: string;
} = {
  name: 'Celo Mainnet',
  chainId: celo.id,
  isTestnet: false,
  explorer: 'https://celoscan.io',
  // No faucet for mainnet
}
