import { createConfig, http } from 'wagmi';
import { celo, celoSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Note: WalletConnect temporarily removed due to Next.js 16 Turbopack compatibility issues
// with pino/thread-stream test files being bundled. Will add back once resolved.
// Injected connector works for both browser wallets AND Farcaster Mini App (which provides injected provider)

// Default to testnet for development/testing
const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'sepolia';
const chains = defaultNetwork === 'sepolia'
  ? [celoSepolia, celo]
  : [celo, celoSepolia];

export const config = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    [celoSepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia-forno.celo-testnet.org'
    ),
  },
  ssr: true,
});

// Export network info for display
export const NETWORK_INFO = {
  name: defaultNetwork === 'sepolia' ? 'Celo Sepolia Testnet' : 'Celo Mainnet',
  chainId: defaultNetwork === 'sepolia' ? celoSepolia.id : celo.id,
  isTestnet: defaultNetwork === 'sepolia',
  faucet: defaultNetwork === 'sepolia' ? 'https://faucet.celo.org' : null,
  explorer: defaultNetwork === 'sepolia'
    ? 'https://sepolia.celoscan.io'
    : 'https://celoscan.io',
};
