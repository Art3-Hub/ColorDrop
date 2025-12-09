import { cookieStorage, createStorage, http } from 'wagmi';
import { celo } from 'wagmi/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { Chain } from 'wagmi/chains';

// Reown AppKit Project ID (WalletConnect Project ID - get from https://cloud.reown.com)
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - wallet connection may not work properly');
}

// MAINNET ONLY - Production configuration
const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'celo';
const chains = [celo] as readonly [Chain, ...Chain[]];

console.log('🌐 Wagmi Configuration - MAINNET ONLY:', {
  network: defaultNetwork,
  chainId: celo.id,
  chainName: celo.name,
  rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org',
});

// Create Wagmi adapter for Reown AppKit
// This handles both browser wallets AND Farcaster Mini App injected provider
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: chains as [Chain, ...Chain[]],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  },
});

// Export Wagmi config for providers
export const config = wagmiAdapter.wagmiConfig;

// Export network info for display - MAINNET ONLY
export const NETWORK_INFO = {
  name: 'Celo Mainnet',
  chainId: celo.id,
  isTestnet: false,
  faucet: null,
  explorer: 'https://celoscan.io',
};
