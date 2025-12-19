'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider, cookieToInitialState } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { initializeFarcaster } from '@/lib/farcaster';
import { detectPlatform } from '@/lib/platform';
import { SelfProvider } from '@/contexts/SelfContext';
import { FarcasterProvider } from '@/contexts/FarcasterContext';
import { AutoConnect } from '@/components/auto-connect';
import { initAppKit } from '@/lib/appkit';

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

// Error/warning suppressor for WalletConnect and Lit library noise
function ErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Connection interrupted') ||
         args[0].includes('while trying to subscribe') ||
         args[0].includes('already initialized'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Multiple versions of Lit') ||
         args[0].includes('already initialized') ||
         args[0].includes('Lit is in dev mode'))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('[WebSocket] Initializing') ||
         args[0].includes('Multiple versions of Lit'))
      ) {
        return;
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
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

      // Always initialize Reown AppKit first (needed for useAppKit hook to work)
      // This must be called before any component uses useAppKit()
      console.log('[Providers] 🔧 Initializing Reown AppKit...');
      initAppKit();

      if (platform === 'farcaster' || platform === 'base') {
        const initialized = await initializeFarcaster();
        setIsFarcasterEnv(initialized);
        console.log('[Providers] 📱 Farcaster SDK initialized:', initialized);
      } else {
        console.log('[Providers] 🌐 Browser mode - AppKit modal will be used for wallet connection');
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
          <FarcasterProvider>
            <SelfProvider>
              <AutoConnect>
                {children}
              </AutoConnect>
            </SelfProvider>
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorSuppressor>
  );
}
