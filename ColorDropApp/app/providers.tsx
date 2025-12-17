'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider, cookieToInitialState } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, projectId, metadata, networks, wagmiAdapter } from '@/lib/wagmi';
import { initializeFarcaster } from '@/lib/farcaster';
import { detectPlatform } from '@/lib/platform';
import { SelfProvider } from '@/contexts/SelfContext';
import { AutoConnect } from '@/components/auto-connect';
import { createAppKit } from '@reown/appkit/react';

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

// Create Reown AppKit modal immediately (before component render)
// This provides the wallet connection UI for browser mode
let appKitModal: ReturnType<typeof createAppKit> | null = null;

if (typeof window !== 'undefined' && !appKitModal) {
  appKitModal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    defaultNetwork: networks[0],
    metadata,
    features: {
      analytics: true,
      email: false,
      socials: false,
    },
    featuresOrder: ['injected', 'eip6963', 'walletConnect'],
  });
}

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

export function Providers({ children, cookies }: { children: React.ReactNode; cookies?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isFarcasterEnv, setIsFarcasterEnv] = useState(false);
  const initialState = cookieToInitialState(config, cookies);

  useEffect(() => {
    setMounted(true);

    async function initialize() {
      const platform = detectPlatform();
      console.log('[Providers] 🔍 Detected platform:', platform);

      if (platform === 'farcaster' || platform === 'base') {
        const initialized = await initializeFarcaster();
        setIsFarcasterEnv(initialized);
        console.log('[Providers] 📱 Farcaster SDK initialized:', initialized);
      }

      setIsLoading(false);
    }

    initialize();
  }, []);

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return null;
  }

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
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <AutoConnect>
            <SelfProvider>
              {children}
            </SelfProvider>
          </AutoConnect>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorSuppressor>
  );
}
