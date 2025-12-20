'use client';

import { useState, useEffect } from 'react';

interface WinnerNotificationProps {
  unclaimedPrizes: Array<{
    poolId: bigint;
    rank: number;
    amount: number;
    claimed: boolean;
  }>;
  onViewPrizes: () => void;
  onDismiss?: () => void;
}

/**
 * WinnerNotification - Shows a celebratory notification when user has unclaimed prizes
 *
 * This component alerts users that they've won in completed pools and guides them
 * to the Past Games section to claim their prizes.
 */
export function WinnerNotification({ unclaimedPrizes, onViewPrizes, onDismiss }: WinnerNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  // Show notification when there are unclaimed prizes
  useEffect(() => {
    if (unclaimedPrizes.length > 0 && !hasBeenDismissed) {
      // Small delay for better UX after returning to lobby
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [unclaimedPrizes.length, hasBeenDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    onDismiss?.();
  };

  const handleViewPrizes = () => {
    setIsVisible(false);
    onViewPrizes();
  };

  if (!isVisible || unclaimedPrizes.length === 0) {
    return null;
  }

  const totalAmount = unclaimedPrizes.reduce((sum, prize) => sum + prize.amount, 0);
  const prizeCount = unclaimedPrizes.length;

  // Get the best rank for display
  const bestRank = Math.min(...unclaimedPrizes.map(p => p.rank));
  const rankEmoji = bestRank === 1 ? '🥇' : bestRank === 2 ? '🥈' : '🥉';
  const rankText = bestRank === 1 ? '1st' : bestRank === 2 ? '2nd' : '3rd';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Notification Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[80]">
        <div className="bg-white rounded-2xl shadow-2xl border border-celo-dark-tan overflow-hidden animate-scale-in">
          {/* Confetti/celebration header */}
          <div className="bg-gradient-to-r from-celo-forest via-celo-green to-celo-forest p-6 text-center relative overflow-hidden">
            {/* Sparkle decorations */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-2 left-4 text-xl animate-pulse">✨</div>
              <div className="absolute top-4 right-6 text-lg animate-pulse delay-100">⭐</div>
              <div className="absolute bottom-2 left-8 text-sm animate-pulse delay-200">🌟</div>
              <div className="absolute bottom-3 right-4 text-xl animate-pulse delay-150">✨</div>
            </div>

            <div className="relative">
              <div className="text-5xl mb-2 animate-bounce">{rankEmoji}</div>
              <h2 className="text-xl font-bold text-white">
                Congratulations!
              </h2>
              <p className="text-white/90 text-sm mt-1">
                You placed {rankText} in a pool!
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Prize amount highlight */}
            <div className="bg-celo-light-tan rounded-xl p-4 text-center">
              <div className="text-sm text-celo-body mb-1">
                {prizeCount === 1 ? 'You won' : `You have ${prizeCount} prizes`}
              </div>
              <div className="text-3xl font-bold text-celo-forest">
                {totalAmount.toFixed(2)} CELO
              </div>
              <div className="text-xs text-celo-inactive mt-1">
                Ready to claim!
              </div>
            </div>

            {/* Prize breakdown if multiple */}
            {prizeCount > 1 && (
              <div className="space-y-2">
                {unclaimedPrizes.slice(0, 3).map((prize, index) => (
                  <div
                    key={prize.poolId.toString()}
                    className="flex items-center justify-between text-sm px-3 py-2 bg-celo-dark-tan/30 rounded-lg"
                  >
                    <span className="text-celo-body">
                      Pool #{prize.poolId.toString()} • {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : '🥉'} {prize.rank === 1 ? '1st' : prize.rank === 2 ? '2nd' : '3rd'}
                    </span>
                    <span className="font-medium text-celo-forest">
                      {prize.amount.toFixed(2)} CELO
                    </span>
                  </div>
                ))}
                {prizeCount > 3 && (
                  <div className="text-xs text-celo-inactive text-center">
                    +{prizeCount - 3} more prizes
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleViewPrizes}
                className="w-full px-6 py-3 bg-celo-forest text-white font-semibold rounded-xl hover:bg-celo-forest/90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>💰</span>
                <span>Claim Your Prizes</span>
              </button>
              <button
                onClick={handleDismiss}
                className="w-full px-6 py-2 text-celo-body hover:text-celo-brown transition-colors text-sm"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
