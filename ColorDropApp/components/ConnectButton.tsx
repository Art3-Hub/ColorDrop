'use client';

import { useAccount, useDisconnect, useConnect, useChainId, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';
import { isFarcaster } from '@/lib/platform';
import { getCurrentUser } from '@/lib/farcaster';
import { useState, useEffect } from 'react';
import type { FarcasterUser } from '@/lib/farcaster';

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending } = useConnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [showConnectorMenu, setShowConnectorMenu] = useState(false);

  const platformIsFarcaster = isFarcaster();
  const isWrongNetwork = isConnected && chainId !== celo.id;

  // Auto-switch to Celo mainnet if on wrong network
  useEffect(() => {
    if (isWrongNetwork && !isSwitchingChain) {
      console.log('[ConnectButton] Wrong network detected (chainId:', chainId, '), switching to Celo mainnet...');
      switchChain({ chainId: celo.id });
    }
  }, [isWrongNetwork, isSwitchingChain, switchChain, chainId]);

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

  // Close menu when clicking outside
  useEffect(() => {
    if (showConnectorMenu) {
      const handleClickOutside = () => setShowConnectorMenu(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showConnectorMenu]);

  const handleBrowserConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConnectorMenu(!showConnectorMenu);
  };

  const handleConnectorSelect = (connectorId: string) => {
    const selectedConnector = connectors.find(c => c.id === connectorId);
    if (selectedConnector) {
      connect({ connector: selectedConnector });
      setShowConnectorMenu(false);
    }
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

  // Get display name for connector
  const getConnectorDisplayName = (connectorName: string) => {
    const names: Record<string, string> = {
      'Farcaster Mini App': 'Farcaster',
      'Injected': 'Browser Wallet',
      'WalletConnect': 'WalletConnect',
      'MetaMask': 'MetaMask',
      'Coinbase Wallet': 'Coinbase',
    };
    return names[connectorName] || connectorName;
  };

  return (
    <div className="relative">
      <button
        onClick={handleBrowserConnect}
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showConnectorMenu && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                handleConnectorSelect(c.id);
              }}
              className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 transition-colors"
            >
              {getConnectorDisplayName(c.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
