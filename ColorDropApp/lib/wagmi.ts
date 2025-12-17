import { http, cookieStorage, createStorage, createConfig } from 'wagmi';
import { celo } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { walletConnect, injected } from 'wagmi/connectors';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { celo as celoCoin } from '@reown/appkit/networks';

// WalletConnect Project ID (required for WalletConnect / Reown AppKit)
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - wallet connection may not work properly');
}

// App metadata for Reown AppKit and WalletConnect
export const metadata = {
  name: 'Color Drop Tournament',
  description: 'Match colors, win CELO prizes on Farcaster',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz',
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz'}/icon.png`],
};

// Networks configuration for Reown AppKit
export const networks = [celoCoin];

// MAINNET ONLY - Production configuration
console.log('🌐 Wagmi Configuration - MAINNET ONLY:', {
  network: 'celo',
  chainId: celo.id,
  chainName: celo.name,
  rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org',
});

// Create Wagmi Adapter with Reown AppKit (handles WalletConnect + injected wallets in browser)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
    key: 'wagmi.colordrop.v2'
  }),
  ssr: true,
  projectId,
  networks: [celoCoin]
});

// Create unified config with all connectors
// Supports: Farcaster Mini App, Base Mini App, Browser (MetaMask, WalletConnect, etc.)
export const config = createConfig({
  chains: [celo],
  connectors: [
    farcasterMiniApp(),                                    // Farcaster Mini App (auto-connects)
    injected({ shimDisconnect: true }),                    // MetaMask, Coinbase Wallet, etc.
    ...wagmiAdapter.wagmiConfig.connectors,                // Reown AppKit connectors (WalletConnect)
    walletConnect({                                        // WalletConnect fallback
      projectId,
      showQrModal: true,
      metadata,
    }),
  ],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
    key: 'wagmi.colordrop.v2'
  }),
});

console.log('🔌 Connectors:', config.connectors.map(c => c.name));

// Export network info for display - MAINNET ONLY
export const NETWORK_INFO = {
  name: 'Celo Mainnet',
  chainId: celo.id,
  isTestnet: false,
  faucet: null,
  explorer: 'https://celoscan.io',
};
