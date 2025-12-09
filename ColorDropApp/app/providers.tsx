'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, projectId } from '@/lib/wagmi';
import { initializeFarcaster } from '@/lib/farcaster';
import { detectPlatform } from '@/lib/platform';
import { SelfProvider } from '@/contexts/SelfContext';

// Create QueryClient at module level (Farcaster Mini App pattern)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// AppKit metadata for browser mode
const metadata = {
  name: 'Color Drop Tournament',
  description: 'Match colors, win CELO prizes on Farcaster',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz',
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz'}/icon.png`],
};

// Note: We're using plain wagmi with farcasterMiniApp() connector
// For browser mode, we use wagmi's native WalletConnect modal via the connector
// No Reown AppKit initialization needed - connectors handle everything

// Error suppressor for WalletConnect subscription errors
function ErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Connection interrupted') ||
         args[0].includes('while trying to subscribe'))
      ) {
        // Suppress WalletConnect subscription errors on reload
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFarcasterEnv, setIsFarcasterEnv] = useState(false);

  useEffect(() => {
    async function initialize() {
      const platform = detectPlatform();

      if (platform === 'farcaster') {
        const initialized = await initializeFarcaster();
        setIsFarcasterEnv(initialized);
      }

      setIsLoading(false);
    }

    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Color Drop...</h2>
          <p className="text-sm text-gray-600">
            {isFarcasterEnv ? 'Initializing Farcaster SDK' : 'Preparing game'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorSuppressor>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <SelfProvider>
            {children}
          </SelfProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorSuppressor>
  );
}
