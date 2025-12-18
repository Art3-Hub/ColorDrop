'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { isFarcaster } from '@/lib/platform';
import { getCurrentUser } from '@/lib/farcaster';
import { useState, useEffect } from 'react';
import type { FarcasterUser } from '@/lib/farcaster';

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
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

  // Log connector info for debugging
  useEffect(() => {
    if (connector) {
      console.log('[ConnectButton] Active connector:', connector.name, connector.id);
    }
  }, [connector]);

  const handleBrowserConnect = () => {
    // For browser mode, open Reown AppKit modal
    // This provides WalletConnect, injected wallets (MetaMask), and EIP-6963 wallets
    open();
  };

  // Farcaster Mode - wallet is automatically connected, just display user info
  if (platformIsFarcaster) {
    // Wallet is auto-connected in Farcaster MiniApp via useAccount()
    // Show user profile if available
    if (farcasterUser && address) {
      return (
        <div className="flex items-center gap-2 w-full">
          {farcasterUser.pfpUrl && (
            <img
              src={farcasterUser.pfpUrl}
              alt={farcasterUser.displayName || farcasterUser.username || 'User'}
              className="w-8 h-8 rounded-full border-2 border-purple-200"
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-gray-900 text-sm truncate">
              {farcasterUser.displayName || `@${farcasterUser.username}`}
            </span>
            <span className="text-xs text-green-600">✓ Auto-connected</span>
          </div>
        </div>
      );
    }

    // Wallet address available but user profile still loading
    if (address) {
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1">
            <div className="text-sm font-mono text-gray-900">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-green-600">✓ Auto-connected</div>
          </div>
        </div>
      );
    }

    // Loading state - wallet should auto-connect
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="animate-pulse flex space-x-2">
          <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-purple-200 rounded w-24"></div>
            <div className="h-2 bg-purple-100 rounded w-20"></div>
          </div>
        </div>
      </div>
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
