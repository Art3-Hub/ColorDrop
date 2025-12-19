'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { ConnectButton } from '@/components/ConnectButton';
import { PlatformIndicator } from '@/components/PlatformIndicator';
import { PlayGrid } from '@/components/landing/PlayGrid';
import { GameScreen } from '@/components/game/GameScreen';
import { LeaderboardView } from '@/components/pool/LeaderboardView';
import { PastGames } from '@/components/pool/PastGames';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { NETWORK_INFO } from '@/lib/wagmi';
import { useColorDropPool } from '@/hooks/useColorDropPool';

type AppState = 'landing' | 'game' | 'leaderboard' | 'pastGames';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { poolData, currentPoolId } = useColorDropPool();
  const { isInMiniApp, isAuthenticated } = useFarcaster();
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentSlot, setCurrentSlot] = useState<number>(1);

  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');

  // Initialize Farcaster SDK and call ready() to hide splash screen
  useEffect(() => {
    async function initFarcaster() {
      try {
        // Call ready() if in mini app to hide Farcaster splash screen
        if (isInMiniApp) {
          sdk.actions.ready();
          console.log('[ColorDrop] 🎯 Farcaster MiniApp detected');
          console.log('[ColorDrop] 📱 SDK ready() called - splash screen hidden');
          console.log('[ColorDrop] 💡 Wallet should auto-connect via wagmi useAccount()');
        } else {
          console.log('[ColorDrop] 🌐 Running in browser mode');
        }
      } catch (error) {
        console.error('[ColorDrop] ❌ Failed to initialize Farcaster SDK:', error);
      }
    }

    initFarcaster();
  }, [isInMiniApp]);

  // Log wallet connection status for debugging
  useEffect(() => {
    if (isInMiniApp && address) {
      console.log('[ColorDrop] ✅ Farcaster wallet auto-connected:', address);
    } else if (isInMiniApp && !address) {
      console.log('[ColorDrop] ⏳ Waiting for Farcaster wallet auto-connection...');
    }
  }, [isInMiniApp, address]);

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

  const handleViewPastGames = () => {
    setAppState('pastGames');
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl">🎨</div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Color Drop</h1>
                  {NETWORK_INFO.isTestnet && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-semibold rounded-full border border-yellow-300">
                      TEST
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {process.env.NODE_ENV === 'development' && <PlatformIndicator />}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-4 sm:py-8">
        {!isConnected && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-10 text-center">
              {/* Hero Section */}
              <div className="mb-6 sm:mb-8">
                <div className="text-5xl sm:text-7xl mb-4">🎨</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Color Drop Tournament
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto">
                  Match colors in 10 seconds. Top 3 win CELO prizes!
                </p>
              </div>

              {/* Prize Highlight */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6">
                <div className="text-sm text-gray-600 mb-3">Prize Pool per Game</div>
                <div className="flex justify-center items-center gap-3 sm:gap-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">{(ENTRY_FEE_VALUE * 7).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">CELO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-500">{(ENTRY_FEE_VALUE * 5).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">CELO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="text-lg sm:text-xl font-bold text-orange-500">{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">CELO</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Entry: {ENTRY_FEE_VALUE} CELO • 16 players per pool
                </div>
              </div>

              {/* Connect CTA */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Connect your wallet to start playing
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>

              {NETWORK_INFO.isTestnet && NETWORK_INFO.faucet && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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
                    Get Test CELO →
                  </a>
                </div>
              )}

              {/* How It Works */}
              <div className="bg-gray-50 rounded-xl p-5 sm:p-6 text-left">
                <h3 className="font-bold text-gray-900 mb-4 text-center">How It Works</h3>
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">1</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Choose a Slot</div>
                      <div className="text-gray-600">Pay {ENTRY_FEE_VALUE} CELO to join the pool</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">2</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Match the Color</div>
                      <div className="text-gray-600">10 seconds to match using HSL sliders</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">3</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Win Prizes</div>
                      <div className="text-gray-600">Top 3 most accurate players win CELO</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Built on Celo badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>Built on</span>
                <span className="font-semibold text-green-600">Celo</span>
                <span>•</span>
                <span>Powered by</span>
                <span className="font-semibold text-purple-600">Farcaster</span>
              </div>
            </div>
          </div>
        )}

        {isConnected && appState === 'landing' && (
          <PlayGrid
            onStartGame={handleStartGame}
            onViewLeaderboard={handleViewLeaderboard}
            onViewPastGames={handleViewPastGames}
          />
        )}

        {isConnected && appState === 'game' && (
          <GameScreen onBackToLobby={handleBackToLanding} slotNumber={currentSlot} />
        )}

        {isConnected && appState === 'leaderboard' && currentPoolId !== undefined && typeof currentPoolId === 'bigint' ? (
          <LeaderboardView poolId={currentPoolId} onBackToLobby={handleBackToLanding} />
        ) : null}

        {isConnected && appState === 'pastGames' && (
          <PastGames onBack={handleBackToLanding} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Built on</span>
              <span className="font-semibold text-green-600">Celo</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="font-semibold text-purple-600">Farcaster</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <a
              href="https://github.com/art3hub/colordrop"
              className="text-gray-500 hover:text-purple-600 font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
