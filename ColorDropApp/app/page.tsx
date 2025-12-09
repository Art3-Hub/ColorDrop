'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { ConnectButton } from '@/components/ConnectButton';
import { PlatformIndicator } from '@/components/PlatformIndicator';
import { PlayGrid } from '@/components/landing/PlayGrid';
import { GameScreen } from '@/components/game/GameScreen';
import { LeaderboardView } from '@/components/pool/LeaderboardView';
import { isFarcaster } from '@/lib/platform';
import { NETWORK_INFO } from '@/lib/wagmi';
import { useColorDropPool } from '@/hooks/useColorDropPool';

type AppState = 'landing' | 'game' | 'leaderboard';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { poolData, currentPoolId } = useColorDropPool();
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentSlot, setCurrentSlot] = useState<number>(1);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const platformIsFarcaster = isFarcaster();

  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');

  // Initialize Farcaster SDK and call ready() to hide splash screen
  useEffect(() => {
    async function initFarcaster() {
      try {
        const result = await sdk.isInMiniApp();
        setIsMiniApp(result);

        if (result) {
          // Call ready() to hide Farcaster splash screen
          sdk.actions.ready();
          console.log('[ColorDrop] 🎯 Farcaster MiniApp detected');
          console.log('[ColorDrop] 📱 SDK ready() called - splash screen hidden');
          console.log('[ColorDrop] 💡 Wallet should auto-connect via wagmi useAccount()');
        } else {
          console.log('[ColorDrop] 🌐 Running in browser mode');
        }
      } catch (error) {
        console.error('[ColorDrop] ❌ Failed to initialize Farcaster SDK:', error);
        setIsMiniApp(false);
      }
    }

    initFarcaster();
  }, []);

  // Log wallet connection status for debugging
  useEffect(() => {
    if (platformIsFarcaster && address) {
      console.log('[ColorDrop] ✅ Farcaster wallet auto-connected:', address);
    } else if (platformIsFarcaster && !address) {
      console.log('[ColorDrop] ⏳ Waiting for Farcaster wallet auto-connection...');
    }
  }, [platformIsFarcaster, address]);

  const handleStartGame = (slot: number) => {
    setCurrentSlot(slot);
    setAppState('game');
  };

  const handleBackToLanding = () => {
    setAppState('landing');
  };

  const handleViewLeaderboard = () => {
    setAppState('leaderboard');
  };

  // Auto-show leaderboard when pool completes
  useEffect(() => {
    if (poolData?.isComplete && appState === 'landing') {
      // Optional: Auto-navigate to leaderboard
      // setAppState('leaderboard');
      console.log('Pool is complete! Players can view results.');
    }
  }, [poolData?.isComplete, appState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl">🎨</div>
              <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900">Color Drop</h1>
                  {NETWORK_INFO.isTestnet && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold rounded-full border border-yellow-300">
                      TESTNET
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                  {platformIsFarcaster ? 'Farcaster Mini App' : 'Tournament Game'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {process.env.NODE_ENV === 'development' && <PlatformIndicator />}
              <div className="min-w-[140px] sm:min-w-[200px]">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-4 sm:py-8">
        {!isConnected && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-12 text-center space-y-4 sm:space-y-6">
              <div className="text-5xl sm:text-7xl">🎨</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome to Color Drop!
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto">
                Pay {ENTRY_FEE_VALUE} CELO, match colors in 10 seconds, win prizes!
              </p>
              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-4">
                  Connect your wallet to start playing
                </p>
                {NETWORK_INFO.isTestnet && NETWORK_INFO.faucet && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      🧪 <strong>Testing on {NETWORK_INFO.name}</strong>
                    </p>
                    <p className="text-xs text-yellow-700 mb-3">
                      Need test tokens? Get free CELO from the faucet:
                    </p>
                    <a
                      href={NETWORK_INFO.faucet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Get Test CELO
                      <span>→</span>
                    </a>
                  </div>
                )}
              </div>

              {/* How It Works */}
              <div className="bg-gray-50 rounded-xl p-6 text-left mt-8">
                <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎮</span>
                    <div>
                      <div className="font-semibold">Choose a Slot & Pay {ENTRY_FEE_VALUE} CELO</div>
                      <div className="text-gray-600">Pick any available slot to start</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="font-semibold">Match the Color in 8 Seconds</div>
                      <div className="text-gray-600">Use HSL sliders to match the target</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="font-semibold">Top 3 Win Prizes</div>
                      <div className="text-gray-600">
                        {ENTRY_FEE_VALUE * 6} CELO • {ENTRY_FEE_VALUE * 3} CELO • {ENTRY_FEE_VALUE * 1} CELO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isConnected && appState === 'landing' && (
          <PlayGrid onStartGame={handleStartGame} onViewLeaderboard={handleViewLeaderboard} />
        )}

        {isConnected && appState === 'game' && (
          <GameScreen onBackToLobby={handleBackToLanding} slotNumber={currentSlot} />
        )}

        {isConnected && appState === 'leaderboard' && currentPoolId !== undefined && typeof currentPoolId === 'bigint' ? (
          <LeaderboardView poolId={currentPoolId} onBackToLobby={handleBackToLanding} />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Built on Celo • Powered by Farcaster •{' '}
              <a
                href="https://github.com"
                className="text-purple-600 hover:text-purple-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
