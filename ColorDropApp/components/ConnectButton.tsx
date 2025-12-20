'use client';

import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { useEffect, useCallback } from 'react';
import { getAppKit } from '@/lib/appkit';

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { user: farcasterUser, isInMiniApp } = useFarcaster();

  // Get AppKit instance directly (only available in browser mode)
  // In Farcaster environment, this will be null since AppKit is not initialized
  const appKit = getAppKit();

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
              className="w-8 h-8 rounded-full border-2 border-celo-dark-tan"
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-celo-brown text-sm truncate">
              {farcasterUser.displayName || `@${farcasterUser.username}`}
            </span>
            <span className="text-xs text-celo-success">✓ Auto-connected</span>
          </div>
        </div>
      );
    }

    // Wallet address available but user profile still loading
    if (address) {
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1">
            <div className="text-sm font-mono text-celo-brown">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-celo-success">✓ Auto-connected</div>
          </div>
        </div>
      );
    }

    // Loading state - wallet should auto-connect
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="animate-pulse flex space-x-2">
          <div className="w-8 h-8 bg-celo-dark-tan rounded-full"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-celo-dark-tan rounded w-24"></div>
            <div className="h-2 bg-celo-dark-tan/50 rounded w-20"></div>
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
              <div className="text-sm font-mono text-celo-brown">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <div className="text-xs text-celo-error">⚠️ Wrong Network</div>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1.5 text-sm border border-celo-dark-tan rounded-md hover:bg-celo-dark-tan/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
          <button
            onClick={() => switchChain({ chainId: celo.id })}
            disabled={isSwitchingChain}
            className="w-full px-4 py-2 bg-celo-orange text-white rounded-md hover:bg-celo-orange/90 transition-colors disabled:opacity-50"
          >
            {isSwitchingChain ? 'Switching...' : 'Switch to Celo Mainnet'}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <div className="text-sm font-mono text-celo-brown">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-xs text-celo-success">Connected to Celo</div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-sm border border-celo-dark-tan rounded-md hover:bg-celo-dark-tan/30 transition-colors"
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
      className="w-full px-4 py-2 bg-celo-forest text-white rounded-md hover:bg-celo-forest/90 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
