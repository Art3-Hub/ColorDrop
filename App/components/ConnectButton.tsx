'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { isFarcaster } from '@/lib/platform';
import { getCurrentUser } from '@/lib/farcaster';
import { useState, useEffect } from 'react';
import type { FarcasterUser } from '@/lib/farcaster';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);

  const platformIsFarcaster = isFarcaster();

  // Auto-load user from Farcaster context (no auth needed)
  useEffect(() => {
    if (platformIsFarcaster) {
      getCurrentUser().then(user => {
        if (user) {
          setFarcasterUser(user);
        }
      });
    }
  }, [platformIsFarcaster]);

  const handleRefreshUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setFarcasterUser(user);
        console.log('Farcaster user loaded:', user);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleBrowserConnect = () => {
    // Open Reown AppKit modal - works for both browser wallets and Farcaster injected wallet
    open();
  };

  // Farcaster Mode
  if (platformIsFarcaster) {
    // User already available from context
    if (farcasterUser) {
      return (
        <div className="flex items-center gap-3 w-full">
          {farcasterUser.pfpUrl && (
            <img
              src={farcasterUser.pfpUrl}
              alt={farcasterUser.displayName || farcasterUser.username || 'User'}
              className="w-10 h-10 rounded-full border-2 border-purple-200"
            />
          )}
          <div className="flex flex-col flex-1">
            <span className="font-medium text-gray-900">
              {farcasterUser.displayName || `@${farcasterUser.username}`}
            </span>
            {farcasterUser.username && (
              <span className="text-xs text-gray-500">@{farcasterUser.username}</span>
            )}
            <span className="text-xs text-purple-600">FID: {farcasterUser.fid}</span>
          </div>
          {isConnected && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Wallet Connected
            </span>
          )}
        </div>
      );
    }

    // Fallback: refresh button if user not loaded yet
    return (
      <button
        onClick={handleRefreshUser}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
      >
        Load Farcaster Profile
      </button>
    );
  }

  // Browser Mode
  if (isConnected) {
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <div className="text-sm font-mono text-gray-900">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-xs text-green-600">Connected</div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleBrowserConnect}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
