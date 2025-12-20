'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk'; // Used for sharing functionality
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

// Share pool on Farcaster to invite friends
// Uses sdk.actions.composeCast() for proper mini app embed display in Farcaster
async function sharePoolOnFarcaster(poolId: bigint | undefined, prizePool: number, slotsRemaining: number) {
  const poolIdStr = poolId?.toString() || '???';

  // Dynamic messaging based on slots remaining
  let emoji: string;
  let callToAction: string;

  if (slotsRemaining <= 3) {
    emoji = '🔥';
    callToAction = `Almost full! Only ${slotsRemaining} slots left! ⚡`;
  } else if (slotsRemaining <= 6) {
    emoji = '🎯';
    callToAction = `${slotsRemaining} slots left - join now! 🚀`;
  } else {
    emoji = '🎮';
    callToAction = `Come and win fast! ${slotsRemaining} slots open 🚀`;
  }

  const entryFee = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
  const text = `${emoji} Join me in Color Drop Pool #${poolIdStr}!\n\n🎨 Match colors in 10 seconds\n🎟️ Entry: ${entryFee} CELO\n💰 Prize Pool: ${prizePool.toFixed(2)} CELO\n🏆 Top 3 win prizes!\n\n${callToAction}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.art3hub.xyz';

  try {
    const isInMiniApp = await sdk.isInMiniApp();
    if (isInMiniApp) {
      // Use composeCast with embeds for proper mini app display in Farcaster
      // This shows the mini app card in the cast instead of just a link
      console.log('[Share] Using composeCast with embeds:', [appUrl]);
      await sdk.actions.composeCast({
        text,
        embeds: [appUrl],
      });
    } else {
      // Fallback for browser - use warpcast compose URL
      const encodedText = encodeURIComponent(text);
      const embedsParam = `&embeds[]=${encodeURIComponent(appUrl)}`;
      window.open(`https://farcaster.xyz/~/compose?text=${encodedText}${embedsParam}`, '_blank');
    }
  } catch (error) {
    console.error('Failed to share on Farcaster:', error);
    // Fallback to warpcast URL
    const encodedText = encodeURIComponent(text);
    const embedsParam = `&embeds[]=${encodeURIComponent(appUrl)}`;
    window.open(`https://farcaster.xyz/~/compose?text=${encodedText}${embedsParam}`, '_blank');
  }
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { poolData, currentPoolId } = useColorDropPool();
  const { isInMiniApp, isAuthenticated } = useFarcaster();
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentSlot, setCurrentSlot] = useState<number>(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const POOL_SIZE = 16;
  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');

  // Log Farcaster environment detection
  // Note: sdk.actions.ready() is now called earlier in initializeFarcaster() (lib/farcaster.ts)
  useEffect(() => {
    if (isInMiniApp) {
      console.log('[ColorDrop] 🎯 Farcaster MiniApp detected');
      console.log('[ColorDrop] 💡 Wallet should auto-connect via wagmi useAccount()');
    } else {
      console.log('[ColorDrop] 🌐 Running in browser mode');
    }
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
    <div className="min-h-screen bg-celo-light-tan">
      {/* Header - Elegant minimal design */}
      <header className="border-b border-celo-dark-tan bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button - Only show when connected */}
              {isConnected && (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="sm:hidden p-1.5 rounded-md hover:bg-celo-dark-tan/50 transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5 text-celo-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <img src="/icon.png" alt="Color Drop" className="w-14 h-14 sm:w-14 sm:h-14 rounded-lg" />
              <h1 className="text-lg sm:text-xl font-semibold text-celo-brown tracking-tight">
                Color Drop
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {process.env.NODE_ENV === 'development' && <PlatformIndicator />}
              {/* Share Button - Only show when connected */}
              {isConnected && (
                <button
                  onClick={() => sharePoolOnFarcaster(
                    poolData?.poolId,
                    ENTRY_FEE_VALUE * POOL_SIZE,
                    poolData ? POOL_SIZE - poolData.playerCount : POOL_SIZE
                  )}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-celo-forest text-white rounded-md text-sm font-medium hover:bg-celo-forest/90 transition-colors"
                  title="Invite friends to play"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              )}
              {/* Connect Button - Hidden on mobile when connected (moved to hamburger menu) */}
              <div className={isConnected ? 'hidden sm:block' : ''}>
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-slide-in-left">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-celo-dark-tan">
              <div className="flex items-center gap-2">
                <img src="/icon.png" alt="Color Drop" className="w-8 h-8 rounded-lg" />
                <span className="font-semibold text-celo-brown">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-celo-dark-tan/50 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 text-celo-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-3">
              <button
                onClick={() => {
                  setAppState('landing');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  appState === 'landing'
                    ? 'bg-celo-forest/10 text-celo-forest'
                    : 'hover:bg-celo-dark-tan/50 text-celo-brown'
                }`}
              >
                <span className="text-xl">🎮</span>
                <div>
                  <div className="font-medium">Play Now</div>
                  <div className="text-xs text-celo-body">Join a pool & compete</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setAppState('pastGames');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mt-1 ${
                  appState === 'pastGames'
                    ? 'bg-celo-forest/10 text-celo-forest'
                    : 'hover:bg-celo-dark-tan/50 text-celo-brown'
                }`}
              >
                <span className="text-xl">💰</span>
                <div>
                  <div className="font-medium">Claim Prizes</div>
                  <div className="text-xs text-celo-body">View past games & claim</div>
                </div>
              </button>

              {/* Wallet Section - Mobile only */}
              <div className="mt-3 pt-3 border-t border-celo-dark-tan">
                <div className="px-4 py-2 text-xs text-celo-inactive font-medium uppercase tracking-wide">Wallet</div>
                <div className="px-4">
                  <ConnectButton />
                </div>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-celo-dark-tan bg-celo-light-tan">
              <div className="flex items-center justify-center gap-2 text-xs text-celo-inactive">
                <span>Built on</span>
                <span className="font-medium text-celo-forest">Celo</span>
                <span>•</span>
                <span className="font-medium text-celo-brown">Farcaster</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-4 sm:py-8">
        {!isConnected && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-celo-dark-tan p-5 sm:p-10 text-center">
              {/* Hero Section */}
              <div className="mb-6 sm:mb-8">
                <div className="text-5xl sm:text-7xl mb-4">🎨</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-celo-brown mb-2">
                  Color Drop Tournament
                </h2>
                <p className="text-base sm:text-lg text-celo-body max-w-md mx-auto">
                  Match colors in 10 seconds. Top 3 win CELO prizes!
                </p>
              </div>

              {/* Prize Highlight */}
              <div className="bg-celo-dark-tan/30 rounded-xl p-4 sm:p-6 mb-6">
                <div className="text-sm text-celo-body mb-3">Prize Pool per Game</div>
                <div className="flex justify-center items-center gap-3 sm:gap-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className="text-lg sm:text-xl font-bold text-celo-orange">{(ENTRY_FEE_VALUE * 7).toFixed(2)}</div>
                    <div className="text-xs text-celo-inactive">CELO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="text-lg sm:text-xl font-bold text-celo-brown">{(ENTRY_FEE_VALUE * 5).toFixed(2)}</div>
                    <div className="text-xs text-celo-inactive">CELO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="text-lg sm:text-xl font-bold text-celo-brown/70">{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</div>
                    <div className="text-xs text-celo-inactive">CELO</div>
                  </div>
                </div>
                <div className="text-xs text-celo-inactive mt-3">
                  Entry: {ENTRY_FEE_VALUE} CELO • 16 players per pool
                </div>
              </div>

              {/* Connect CTA */}
              <div className="mb-6">
                <p className="text-sm text-celo-body mb-4">
                  Connect your wallet to start playing
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>

              {NETWORK_INFO.isTestnet && NETWORK_INFO.faucet && (
                <div className="bg-celo-yellow/20 border border-celo-yellow/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-celo-brown mb-2">
                    🧪 <strong>Testing on {NETWORK_INFO.name}</strong>
                  </p>
                  <p className="text-xs text-celo-body mb-3">
                    Need test tokens? Get free CELO from the faucet:
                  </p>
                  <a
                    href={NETWORK_INFO.faucet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-celo-forest hover:bg-celo-forest/90 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Get Test CELO →
                  </a>
                </div>
              )}

              {/* How It Works */}
              <div className="bg-celo-light-tan rounded-xl p-5 sm:p-6 text-left">
                <h3 className="font-semibold text-celo-brown mb-4 text-center">How It Works</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-celo-forest/10 flex items-center justify-center flex-shrink-0 text-celo-forest font-medium">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-celo-brown">Choose a Slot</div>
                      <div className="text-celo-body">Pay {ENTRY_FEE_VALUE} CELO to join the pool</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-celo-forest/10 flex items-center justify-center flex-shrink-0 text-celo-forest font-medium">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-celo-brown">Match the Color</div>
                      <div className="text-celo-body">10 seconds to match using HSL sliders</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-celo-forest/10 flex items-center justify-center flex-shrink-0 text-celo-forest font-medium">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-celo-brown">Win Prizes</div>
                      <div className="text-celo-body">Top 3 most accurate players win CELO</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Built on Celo badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-celo-inactive">
                <span>Built on</span>
                <span className="font-medium text-celo-forest">Celo</span>
                <span>•</span>
                <span>Powered by</span>
                <span className="font-medium text-celo-brown">Farcaster</span>
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
      <footer className="border-t border-celo-dark-tan bg-white/80 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-celo-inactive">
            <div className="flex items-center gap-1.5">
              <span>Built on</span>
              <span className="font-medium text-celo-forest">Celo</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="font-medium text-celo-brown">Farcaster</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <a
              href="https://github.com/Art3-Hub/ColorDrop"
              className="text-celo-inactive hover:text-celo-forest font-medium transition-colors"
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
