'use client';

import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { celo } from 'wagmi/chains';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { useEffect, useCallback } from 'react';

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { user: farcasterUser, isInMiniApp } = useFarcaster();

  // Reown AppKit hook for browser mode wallet connection
  // AppKit is always initialized in providers.tsx so this hook is safe to call
  const appKit = useAppKit();

  const isWrongNetwork = isConnected && chainId !== celo.id;

  // Auto-switch to Celo mainnet if on wrong network
  useEffect(() => {
    if (isWrongNetwork && !isSwitchingChain) {
      console.log('[ConnectButton] Wrong network detected (chainId:', chainId, '), switching to Celo mainnet...');
      switchChain({ chainId: celo.id });
    }
  }, [isWrongNetwork, isSwitchingChain, switchChain, chainId]);

  // Log connector info for debugging
  useEffect(() => {
    if (connector) {
      console.log('[ConnectButton] Active connector:', connector.name, connector.id);
    }
  }, [connector]);

  // Browser mode: Open Reown AppKit modal
  const handleBrowserConnect = useCallback(() => {
    console.log('[ConnectButton] Opening Reown AppKit modal...');
    appKit?.open();
  }, [appKit]);

  // Farcaster Mode - wallet is automatically connected, just display user info
  if (isInMiniApp) {
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
    // Show wrong network warning
    if (isWrongNetwork) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-mono text-gray-900">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <div className="text-xs text-red-600">⚠️ Wrong Network</div>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
          <button
            onClick={() => switchChain({ chainId: celo.id })}
            disabled={isSwitchingChain}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {isSwitchingChain ? 'Switching...' : 'Switch to Celo Mainnet'}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <div className="text-sm font-mono text-gray-900">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-xs text-green-600">Connected to Celo</div>
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

  // Browser Mode: Not connected - show connect button
  return (
    <button
      onClick={handleBrowserConnect}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
