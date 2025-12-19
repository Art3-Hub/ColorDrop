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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prize Claimed!
        </h2>
        <p className="text-gray-600 mb-4">
          You received <span className="font-bold text-green-600">{prize} CELO</span> for winning{' '}
          {getRankEmoji(rank as 1 | 2 | 3)} {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} place in Pool #{poolId.toString()}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => shareOnFarcaster(poolId, rank, prize)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <span>📣</span> Share on Farcaster
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function WinnerCard({
  winner,
  isCurrentUser,
  poolId,
  onClaim,
  isClaiming,
}: {
  winner: Winner;
  isCurrentUser: boolean;
  poolId: bigint;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const canClaim = isCurrentUser && !winner.claimed;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      winner.rank === 1 ? 'bg-yellow-50 border border-yellow-200' :
      winner.rank === 2 ? 'bg-gray-100 border border-gray-200' :
      'bg-orange-50 border border-orange-200'
    } ${isCurrentUser ? 'ring-2 ring-purple-400' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getRankEmoji(winner.rank)}</span>
        <div>
          <div className="font-mono text-sm text-gray-800 flex items-center gap-2">
            {formatAddress(winner.address)}
            {isCurrentUser && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                You
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Accuracy: {winner.accuracy.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="text-right">
        {canClaim ? (
          <button
            onClick={onClaim}
            disabled={isClaiming}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              isClaiming
                ? 'bg-gray-200 text-gray-500 cursor-wait'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            {isClaiming ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⏳</span> Claiming...
              </span>
            ) : (
              <span>Claim {winner.prize} CELO</span>
            )}
          </button>
        ) : winner.claimed ? (
          <div className="text-sm text-gray-500">
            ✓ Claimed
          </div>
        ) : (
          <div className={`font-bold ${
            winner.rank === 1 ? 'text-yellow-600' :
            winner.rank === 2 ? 'text-gray-600' :
            'text-orange-600'
          }`}>
            {winner.prize} CELO
          </div>
        )}
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
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            #{pool.poolId.toString()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              Pool #{pool.poolId.toString()}
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full font-semibold">
                Needs Finalization
              </span>
            </div>
            <div className="text-xs text-gray-500">
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
                ? 'bg-gray-200 text-gray-500 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
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
          <div className="text-xs text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg">
            ⏱️ Waiting for timeout...
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-amber-700 bg-amber-100 rounded-lg p-3">
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
  const userHasUnclaimedPrize = pool.winners.some(
    w => userAddress &&
    w.address.toLowerCase() === userAddress.toLowerCase() &&
    !w.claimed
  );

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border ${
      userHasUnclaimedPrize ? 'border-green-300 ring-2 ring-green-200' : 'border-gray-100'
    }`}>
      {/* Pool Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            #{pool.poolId.toString()}
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              Pool #{pool.poolId.toString()}
              {userHasUnclaimedPrize && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold animate-pulse">
                  Claim Prize!
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
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
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {pool.winners.length > 0 ? (
            pool.winners.map((winner) => (
              <WinnerCard
                key={`${pool.poolId}-${winner.rank}`}
                winner={winner}
                isCurrentUser={userAddress ? winner.address.toLowerCase() === userAddress.toLowerCase() : false}
                poolId={pool.poolId}
                onClaim={() => onClaimPrize(pool.poolId)}
                isClaiming={claimingPoolId === pool.poolId}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No winner data available
            </div>
          )}
          <div className="text-center pt-2">
            <div className="text-xs text-gray-400">
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Game
        </button>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Past Games
        </h1>
        <p className="text-gray-600">
          View completed pools, winners, and claim your prizes
        </p>
        {currentPoolId !== undefined && (
          <div className="mt-2 text-sm text-purple-600">
            Current Pool: #{String(currentPoolId)}
          </div>
        )}
      </div>

      {/* Unclaimed Prizes Banner */}
      {userPrizes.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 animate-pulse-slow">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-semibold text-green-800">
                You have {userPrizes.length} unclaimed {userPrizes.length === 1 ? 'prize' : 'prizes'}!
              </div>
              <div className="text-sm text-green-700">
                Total: <span className="font-bold">{totalUnclaimedValue.toFixed(3)} CELO</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Scroll down to claim and share your wins on Farcaster
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-4xl mb-4">🎨</div>
          <p className="text-gray-600">Loading past games...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-red-600 font-medium mb-2">Failed to load past games</div>
          <button
            onClick={refetch}
            className="text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Pending Finalization Pools */}
      {!isLoading && !error && pendingFinalizationPools.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Games Yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to complete a pool and see the results here!
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Play Now
          </button>
        </div>
      )}

      {/* Pool List */}
      {!isLoading && !error && completedPools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
        <div className="mt-8 bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {completedPools.length}
              </div>
              <div className="text-xs text-gray-500">Completed Pools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(completedPools.length * 0.75).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total CELO Won</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {completedPools.reduce((sum, p) => sum + p.playerCount, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Players</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
