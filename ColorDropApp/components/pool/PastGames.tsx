'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { usePastGames, type Winner, type CompletedPool, type PendingFinalizationPool } from '@/hooks/usePastGames';

interface PastGamesProps {
  onBack: () => void;
}

const getRankEmoji = (rank: 1 | 2 | 3) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
  }
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Share on Farcaster function
async function shareOnFarcaster(poolId: bigint, rank: number, prize: number) {
  const rankText = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
  const emoji = getRankEmoji(rank as 1 | 2 | 3);

  const text = `${emoji} I just claimed ${prize} CELO for winning ${rankText} place in Color Drop Pool #${poolId}!\n\nPlay now and test your color matching skills!`;
  const embedUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.app';

  try {
    // Try Farcaster SDK first (if in mini app)
    const isInMiniApp = await sdk.isInMiniApp();
    if (isInMiniApp) {
      // Open composer with pre-filled text
      await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`);
    } else {
      // Fallback to opening Warpcast in browser
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`, '_blank');
    }
  } catch (error) {
    console.error('Failed to share on Farcaster:', error);
    // Fallback to Warpcast
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`, '_blank');
  }
}

interface ClaimSuccessModalProps {
  poolId: bigint;
  rank: number;
  prize: number;
  onClose: () => void;
}

function ClaimSuccessModal({ poolId, rank, prize, onClose }: ClaimSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-celo-dark-tan max-w-md w-full p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-celo-brown mb-2">
          Prize Claimed!
        </h2>
        <p className="text-celo-body mb-4">
          You received <span className="font-bold text-celo-success">{prize} CELO</span> for winning{' '}
          {getRankEmoji(rank as 1 | 2 | 3)} {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} place in Pool #{poolId.toString()}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => shareOnFarcaster(poolId, rank, prize)}
            className="w-full bg-celo-forest text-white px-6 py-3 rounded-xl font-semibold hover:bg-celo-forest/90 transition-all flex items-center justify-center gap-2"
          >
            <span>📣</span> Share on Farcaster
          </button>

          <button
            onClick={onClose}
            className="w-full bg-celo-dark-tan/50 text-celo-brown px-6 py-3 rounded-xl font-semibold hover:bg-celo-dark-tan transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClaimAllProgressModalProps {
  progress: {
    current: number;
    total: number;
    currentPoolId: bigint | null;
    claimedPrizes: Array<{ poolId: bigint; rank: number; amount: number }>;
    failedPrizes: Array<{ poolId: bigint; error: string }>;
  };
  isClaimingAll: boolean;
  onClose: () => void;
}

function ClaimAllProgressModal({ progress, isClaimingAll, onClose }: ClaimAllProgressModalProps) {
  const totalClaimed = progress.claimedPrizes.reduce((sum, p) => sum + p.amount, 0);
  const isComplete = !isClaimingAll && progress.current === progress.total;
  const hasErrors = progress.failedPrizes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-celo-dark-tan max-w-md w-full p-6">
        <div className="text-center">
          {isClaimingAll ? (
            <>
              <div className="text-5xl mb-4 animate-bounce">💰</div>
              <h2 className="text-xl font-bold text-celo-brown mb-2">
                Claiming Prizes...
              </h2>
              <p className="text-celo-body mb-4">
                Processing {progress.current} of {progress.total} prizes
              </p>
              {progress.currentPoolId && (
                <p className="text-sm text-celo-forest mb-4">
                  Claiming Pool #{progress.currentPoolId.toString()}
                </p>
              )}
              {/* Progress bar */}
              <div className="w-full bg-celo-dark-tan rounded-full h-3 mb-4">
                <div
                  className="bg-celo-success h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </>
          ) : isComplete ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-celo-brown mb-2">
                {hasErrors ? 'Partially Complete' : 'All Prizes Claimed!'}
              </h2>
              <p className="text-celo-body mb-4">
                You received <span className="font-bold text-celo-success">{totalClaimed.toFixed(3)} CELO</span>
              </p>
            </>
          ) : null}
        </div>

        {/* Results */}
        {(isComplete || progress.claimedPrizes.length > 0) && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {progress.claimedPrizes.map((prize, i) => (
              <div key={i} className="flex items-center justify-between bg-celo-success/10 rounded-lg px-3 py-2 text-sm">
                <span className="text-celo-success">
                  {getRankEmoji(prize.rank as 1 | 2 | 3)} Pool #{prize.poolId.toString()}
                </span>
                <span className="font-semibold text-celo-success">+{prize.amount} CELO</span>
              </div>
            ))}
            {progress.failedPrizes.map((prize, i) => (
              <div key={`failed-${i}`} className="flex items-center justify-between bg-celo-error/10 rounded-lg px-3 py-2 text-sm">
                <span className="text-celo-error">
                  ❌ Pool #{prize.poolId.toString()}
                </span>
                <span className="text-celo-error text-xs">Failed</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {isComplete && (
          <div className="mt-6 space-y-3">
            {progress.claimedPrizes.length > 0 && (
              <button
                onClick={() => {
                  const text = `🏆 Just claimed ${totalClaimed.toFixed(3)} CELO from ${progress.claimedPrizes.length} Color Drop wins!\n\nPlay now and test your color matching skills!`;
                  const embedUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.app';
                  window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`, '_blank');
                }}
                className="w-full bg-celo-forest text-white px-6 py-3 rounded-xl font-semibold hover:bg-celo-forest/90 transition-all flex items-center justify-center gap-2"
              >
                <span>📣</span> Share on Farcaster
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-celo-dark-tan/50 text-celo-brown px-6 py-3 rounded-xl font-semibold hover:bg-celo-dark-tan transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerCard({
  winner,
  isCurrentUser,
  hasClaimablePrizes,
}: {
  winner: Winner;
  isCurrentUser: boolean;
  hasClaimablePrizes: boolean;
}) {

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      winner.rank === 1 ? 'bg-celo-yellow/20 border border-celo-yellow' :
      winner.rank === 2 ? 'bg-celo-dark-tan/50 border border-celo-dark-tan' :
      'bg-celo-orange/10 border border-celo-orange/50'
    } ${isCurrentUser ? 'ring-2 ring-celo-forest' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getRankEmoji(winner.rank)}</span>
        <div>
          <div className="font-mono text-sm text-celo-brown flex items-center gap-2">
            {formatAddress(winner.address)}
            {isCurrentUser && (
              <span className="px-2 py-0.5 bg-celo-forest/10 text-celo-forest text-xs rounded-full font-semibold">
                You
              </span>
            )}
          </div>
          <div className="text-xs text-celo-inactive">
            Accuracy: {winner.accuracy.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        {/* Always show prize amount */}
        <div className={`font-bold text-lg ${
          winner.rank === 1 ? 'text-celo-forest' :
          winner.rank === 2 ? 'text-celo-brown' :
          'text-celo-orange'
        }`}>
          {winner.prize} CELO
        </div>
        {/* Show status indicator (no individual claim buttons - use summary box instead) */}
        {winner.claimed ? (
          <div className="text-xs text-celo-success">
            ✓ Claimed
          </div>
        ) : !hasClaimablePrizes ? (
          // Legacy pool - prizes were auto-distributed before v3.6.0
          <div className="text-xs text-celo-inactive italic">
            Auto-distributed
          </div>
        ) : isCurrentUser && winner.isClaimable ? (
          <div className="text-xs text-celo-success font-medium">
            Ready to claim
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PendingPoolCard({
  pool,
  onFinalize,
  isFinalizingPoolId,
}: {
  pool: PendingFinalizationPool;
  onFinalize: (poolId: bigint) => void;
  isFinalizingPoolId: bigint | null;
}) {
  const isFinalizing = isFinalizingPoolId === pool.poolId;

  return (
    <div className="bg-celo-orange/10 border-2 border-celo-orange/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-celo-orange flex items-center justify-center text-white font-bold text-sm">
            #{pool.poolId.toString()}
          </div>
          <div>
            <div className="font-semibold text-celo-brown flex items-center gap-2">
              Pool #{pool.poolId.toString()}
              <span className="px-2 py-0.5 bg-celo-orange/20 text-celo-orange text-xs rounded-full font-semibold">
                Needs Finalization
              </span>
            </div>
            <div className="text-xs text-celo-inactive">
              {formatDate(pool.startTime)} • {pool.playerCount} players
            </div>
          </div>
        </div>

        {pool.canFinalize ? (
          <button
            onClick={() => {
              console.log('🔘 Finalize button clicked for pool:', pool.poolId.toString());
              onFinalize(pool.poolId);
            }}
            disabled={isFinalizing}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              isFinalizing
                ? 'bg-celo-dark-tan text-celo-inactive cursor-wait'
                : 'bg-celo-orange text-white hover:bg-celo-orange/90'
            }`}
          >
            {isFinalizing ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⏳</span> Finalizing...
              </span>
            ) : (
              <span>🏁 Finalize Pool</span>
            )}
          </button>
        ) : (
          <div className="text-xs text-celo-orange bg-celo-orange/20 px-3 py-1.5 rounded-lg">
            ⏱️ Waiting for timeout...
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-celo-orange bg-celo-orange/20 rounded-lg p-3">
        <p className="font-medium">💡 What's happening?</p>
        <p className="text-xs mt-1">
          This pool has {pool.playerCount} players but not everyone submitted their score.
          {pool.canFinalize
            ? ' Click "Finalize Pool" to calculate winners and enable prize claiming!'
            : ' After the timeout period, anyone can finalize the pool.'}
        </p>
      </div>
    </div>
  );
}

function PoolCard({
  pool,
  isExpanded,
  onToggle,
  userAddress,
  onClaimPrize,
  claimingPoolId,
}: {
  pool: CompletedPool;
  isExpanded: boolean;
  onToggle: () => void;
  userAddress?: string;
  onClaimPrize: (poolId: bigint) => void;
  claimingPoolId: bigint | null;
}) {
  // Find all user's winning positions in this pool
  const userWinners = pool.winners.filter(
    w => userAddress && w.address.toLowerCase() === userAddress.toLowerCase()
  );

  // Calculate total claimable amount for the user in this pool
  const userUnclaimedWinners = userWinners.filter(w => !w.claimed && w.isClaimable);
  const userTotalClaimable = userUnclaimedWinners.reduce((sum, w) => sum + w.prize, 0);
  const userHasUnclaimedPrize = userUnclaimedWinners.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border ${
      userHasUnclaimedPrize ? 'border-celo-success/50 ring-2 ring-celo-success/20' : 'border-celo-dark-tan'
    }`}>
      {/* Pool Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-celo-light-tan/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-celo-forest flex items-center justify-center text-white font-bold text-sm">
            #{pool.poolId.toString()}
          </div>
          <div className="text-left">
            <div className="font-semibold text-celo-brown flex items-center gap-2">
              Pool #{pool.poolId.toString()}
              {userHasUnclaimedPrize && (
                <span className="px-2 py-0.5 bg-celo-success/10 text-celo-success text-xs rounded-full font-semibold animate-pulse">
                  Claim Prize!
                </span>
              )}
            </div>
            <div className="text-xs text-celo-inactive">
              {formatDate(pool.startTime)} • {pool.playerCount} players
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {pool.winners.slice(0, 3).map((winner, i) => (
              <span key={i} className="text-lg">{getRankEmoji(winner.rank)}</span>
            ))}
          </div>
          <svg
            className={`w-5 h-5 text-celo-inactive transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Winners List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-celo-dark-tan pt-3">
          {/* User's claimable prizes summary - shown at top inside the card with claim button */}
          {userHasUnclaimedPrize && (
            <div className="bg-celo-success/10 border border-celo-success/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <div className="text-sm font-semibold text-celo-success">
                      Your Prizes to Claim
                    </div>
                    <div className="text-xs text-celo-success/80">
                      {userUnclaimedWinners.length} {userUnclaimedWinners.length === 1 ? 'prize' : 'prizes'} available
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-bold text-celo-success">
                      {userTotalClaimable.toFixed(3)} CELO
                    </div>
                  </div>
                  <button
                    onClick={() => onClaimPrize(pool.poolId)}
                    disabled={claimingPoolId === pool.poolId}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      claimingPoolId === pool.poolId
                        ? 'bg-celo-dark-tan text-celo-inactive cursor-wait'
                        : 'bg-celo-success text-white hover:bg-celo-success/90 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {claimingPoolId === pool.poolId ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-spin">⏳</span> Claiming...
                      </span>
                    ) : (
                      <span>Claim</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legacy pool notice */}
          {!pool.hasClaimablePrizes && (
            <div className="bg-celo-dark-tan/30 border border-celo-dark-tan rounded-lg p-3 mb-2">
              <p className="text-xs text-celo-inactive text-center">
                💰 Prizes for this pool were auto-distributed to winners
              </p>
            </div>
          )}
          {pool.winners.length > 0 ? (
            pool.winners.map((winner) => (
              <WinnerCard
                key={`${pool.poolId}-${winner.rank}`}
                winner={winner}
                isCurrentUser={userAddress ? winner.address.toLowerCase() === userAddress.toLowerCase() : false}
                hasClaimablePrizes={pool.hasClaimablePrizes}
              />
            ))
          ) : (
            <div className="text-center text-celo-inactive py-4">
              No winner data available
            </div>
          )}
          <div className="text-center pt-2">
            <div className="text-xs text-celo-inactive">
              Total Prize Pool: {(0.45 + 0.225 + 0.075).toFixed(2)} CELO
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PastGames({ onBack }: PastGamesProps) {
  const { address } = useAccount();
  const {
    completedPools,
    pendingFinalizationPools,
    userPrizes,
    isLoading,
    error,
    currentPoolId,
    refetch,
    claimPrize,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,
    claimAllPrizes,
    isClaimingAll,
    claimAllProgress,
    resetClaimAllProgress,
    finalizePool,
    isFinalizePending,
    isFinalizeConfirming,
    isFinalizeSuccess,
  } = usePastGames(20);

  const [expandedPools, setExpandedPools] = useState<Set<string>>(new Set());
  const [claimingPoolId, setClaimingPoolId] = useState<bigint | null>(null);
  const [finalizingPoolId, setFinalizingPoolId] = useState<bigint | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimedPrize, setClaimedPrize] = useState<{ poolId: bigint; rank: number; prize: number } | null>(null);

  // Auto-expand pools where user has unclaimed prizes
  useEffect(() => {
    if (userPrizes.length > 0) {
      const poolsWithPrizes = userPrizes.map(p => p.poolId.toString());
      setExpandedPools(prev => {
        const newSet = new Set(prev);
        poolsWithPrizes.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [userPrizes]);

  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess && claimingPoolId) {
      // Find the prize info
      const pool = completedPools.find(p => p.poolId === claimingPoolId);
      const winner = pool?.winners.find(
        w => address && w.address.toLowerCase() === address.toLowerCase()
      );

      if (winner) {
        setClaimedPrize({
          poolId: claimingPoolId,
          rank: winner.rank,
          prize: winner.prize,
        });
        setShowSuccessModal(true);
      }
      setClaimingPoolId(null);
    }
  }, [isClaimSuccess, claimingPoolId, completedPools, address]);

  const togglePool = (poolId: string) => {
    setExpandedPools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poolId)) {
        newSet.delete(poolId);
      } else {
        newSet.add(poolId);
      }
      return newSet;
    });
  };

  const handleClaimPrize = (poolId: bigint) => {
    setClaimingPoolId(poolId);
    claimPrize(poolId);
  };

  const handleFinalizePool = (poolId: bigint) => {
    console.log('🎯 handleFinalizePool called with poolId:', poolId.toString());
    setFinalizingPoolId(poolId);
    finalizePool(poolId);
  };

  // Reset finalizing state after success
  useEffect(() => {
    if (isFinalizeSuccess && finalizingPoolId) {
      setFinalizingPoolId(null);
    }
  }, [isFinalizeSuccess, finalizingPoolId]);

  const totalUnclaimedValue = userPrizes.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Success Modal */}
      {showSuccessModal && claimedPrize && (
        <ClaimSuccessModal
          poolId={claimedPrize.poolId}
          rank={claimedPrize.rank}
          prize={claimedPrize.prize}
          onClose={() => {
            setShowSuccessModal(false);
            setClaimedPrize(null);
          }}
        />
      )}

      {/* Claim All Progress Modal */}
      {claimAllProgress && (
        <ClaimAllProgressModal
          progress={claimAllProgress}
          isClaimingAll={isClaimingAll}
          onClose={resetClaimAllProgress}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-celo-brown hover:text-celo-forest transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Game
        </button>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-celo-forest hover:text-celo-forest/80 hover:bg-celo-forest/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-celo-brown mb-2">
          Past Games
        </h1>
        <p className="text-celo-body">
          View completed pools, winners, and claim your prizes
        </p>
        {currentPoolId !== undefined && (
          <div className="mt-2 text-sm text-celo-forest">
            Current Pool: #{String(currentPoolId)}
          </div>
        )}
      </div>

      {/* Unclaimed Prizes Banner */}
      {userPrizes.length > 0 && (
        <div className="bg-celo-success/10 border border-celo-success/30 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-semibold text-celo-success">
                  You have {userPrizes.length} unclaimed {userPrizes.length === 1 ? 'prize' : 'prizes'}!
                </div>
                <div className="text-sm text-celo-success/80">
                  Total: <span className="font-bold">{totalUnclaimedValue.toFixed(3)} CELO</span>
                </div>
              </div>
            </div>
            {userPrizes.length > 1 ? (
              <button
                onClick={() => claimAllPrizes()}
                disabled={isClaimingAll}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                  isClaimingAll
                    ? 'bg-celo-dark-tan text-celo-inactive cursor-wait'
                    : 'bg-celo-success text-white hover:bg-celo-success/90 shadow-md hover:shadow-lg'
                }`}
              >
                {isClaimingAll ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Claiming...
                  </span>
                ) : (
                  <span>🎁 Claim All</span>
                )}
              </button>
            ) : (
              <div className="text-xs text-celo-success mt-1">
                👇 Scroll to claim
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-4xl mb-4">🎨</div>
          <p className="text-celo-body">Loading past games...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-celo-error/10 border border-celo-error/30 rounded-xl p-4 text-center">
          <div className="text-celo-error font-medium mb-2">Failed to load past games</div>
          <button
            onClick={refetch}
            className="text-sm text-celo-error underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Pending Finalization Pools */}
      {!isLoading && !error && pendingFinalizationPools.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-celo-brown mb-3 flex items-center gap-2">
            <span>⏳</span> Pools Awaiting Finalization
          </h2>
          <div className="space-y-3">
            {pendingFinalizationPools.map((pool) => (
              <PendingPoolCard
                key={pool.poolId.toString()}
                pool={pool}
                onFinalize={handleFinalizePool}
                isFinalizingPoolId={isFinalizePending || isFinalizeConfirming ? finalizingPoolId : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && completedPools.length === 0 && pendingFinalizationPools.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h3 className="text-lg font-semibold text-celo-brown mb-2">No Completed Games Yet</h3>
          <p className="text-celo-body mb-4">
            Be the first to complete a pool and see the results here!
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-celo-forest text-white rounded-lg hover:bg-celo-forest/90 transition-colors"
          >
            Play Now
          </button>
        </div>
      )}

      {/* Pool List */}
      {!isLoading && !error && completedPools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-celo-brown mb-3 flex items-center gap-2">
            <span>🏆</span> Completed Games
          </h2>
          {completedPools.map((pool) => (
            <PoolCard
              key={pool.poolId.toString()}
              pool={pool}
              isExpanded={expandedPools.has(pool.poolId.toString())}
              onToggle={() => togglePool(pool.poolId.toString())}
              userAddress={address}
              onClaimPrize={handleClaimPrize}
              claimingPoolId={isClaimPending || isClaimConfirming ? claimingPoolId : null}
            />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {!isLoading && completedPools.length > 0 && (
        <div className="mt-8 bg-celo-dark-tan/30 rounded-xl p-4 border border-celo-dark-tan">
          <h3 className="font-semibold text-celo-brown mb-3 text-center">Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-celo-forest">
                {completedPools.length}
              </div>
              <div className="text-xs text-celo-inactive">Completed Pools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-celo-success">
                {(completedPools.length * 0.75).toFixed(2)}
              </div>
              <div className="text-xs text-celo-inactive">Total CELO Won</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-celo-brown">
                {completedPools.reduce((sum, p) => sum + p.playerCount, 0)}
              </div>
              <div className="text-xs text-celo-inactive">Total Players</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
