import { http, cookieStorage, createStorage, createConfig } from 'wagmi';
import { celo } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { walletConnect, injected } from 'wagmi/connectors';

// WalletConnect Project ID (required for WalletConnect)
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - wallet connection may not work properly');
}

// MAINNET ONLY - Production configuration
const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'celo';

console.log('🌐 Wagmi Configuration - MAINNET ONLY:', {
  network: defaultNetwork,
  chainId: celo.id,
  chainName: celo.name,
  rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org',
});

// Configure connectors array
// IMPORTANT: farcasterMiniApp() must be FIRST for auto-detection in Farcaster
const connectors = [
  farcasterMiniApp(), // Auto-connects in Farcaster MiniApp
  injected(), // Browser extension wallets (MetaMask, etc.)
  walletConnect({ // WalletConnect for mobile wallets
    projectId,
    showQrModal: true,
    metadata: {
      name: 'Color Drop Tournament',
      description: 'Match colors, win CELO prizes',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz',
      icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz'}/icon.png`],
    },
  }),
];

// Create wagmi config with Farcaster connector
export const config = createConfig({
  chains: [celo],
  connectors,
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

console.log('🔌 Connectors:', connectors.map(c => c.name));

// Export network info for display - MAINNET ONLY
export const NETWORK_INFO = {
  name: 'Celo Mainnet',
  chainId: celo.id,
  isTestnet: false,
  faucet: null,
  explorer: 'https://celoscan.io',
};
