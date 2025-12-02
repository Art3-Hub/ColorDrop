import { createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Note: WalletConnect temporarily removed due to Next.js 16 Turbopack compatibility issues
// with pino/thread-stream test files being bundled. Will add back once resolved.
// Injected connector works for both browser wallets AND Farcaster Mini App (which provides injected provider)

export const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    [celoAlfajores.id]: http(
      process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    ),
  },
  ssr: true,
});
