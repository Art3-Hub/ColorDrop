'use client';

import { useEffect, useState } from 'react';
import { useColorDropPool } from '@/hooks/useColorDropPool';
import { formatEther } from 'viem';
import { sdk } from '@farcaster/miniapp-sdk';

interface LeaderboardEntry {
  rank: number;
  player: `0x${string}`;
  score: number;
  prize?: string;
}

interface LeaderboardViewProps {
  poolId: bigint;
  onBackToLobby?: () => void;
}

export function LeaderboardView({ poolId, onBackToLobby }: LeaderboardViewProps) {
  const { poolData, getLeaderboard } = useColorDropPool();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.5');

  // Calculate prizes
  const prizes = {
    first: ENTRY_FEE_VALUE * 6,
    second: ENTRY_FEE_VALUE * 3,
    third: ENTRY_FEE_VALUE * 1,
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const players = await getLeaderboard(poolId);

        // Sort by accuracy descending
        const sortedPlayers = [...players].sort((a, b) => b.accuracy - a.accuracy);

        // Create leaderboard entries
        const entries: LeaderboardEntry[] = sortedPlayers.map((player, index) => {
          const rank = index + 1;
          let prize: string | undefined;

          if (rank === 1) prize = `${prizes.first} CELO`;
          else if (rank === 2) prize = `${prizes.second} CELO`;
          else if (rank === 3) prize = `${prizes.third} CELO`;

          return {
            rank,
            player: player.wallet,
            score: player.accuracy,
            prize,
          };
        });

        setLeaderboard(entries);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        // Show mock data if contract fails
        const mockLeaderboard: LeaderboardEntry[] = [
          { rank: 1, player: '0x1234...5678' as `0x${string}`, score: 9876, prize: `${prizes.first} CELO` },
          { rank: 2, player: '0xabcd...efgh' as `0x${string}`, score: 9654, prize: `${prizes.second} CELO` },
          { rank: 3, player: '0x9999...0000' as `0x${string}`, score: 9432, prize: `${prizes.third} CELO` },
        ];
        setLeaderboard(mockLeaderboard);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [poolId, getLeaderboard, prizes.first, prizes.second, prizes.third]);

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', color: 'text-celo-forest', bg: 'bg-celo-yellow/20 border-celo-yellow' };
      case 2:
        return { emoji: '🥈', color: 'text-celo-brown', bg: 'bg-celo-dark-tan/50 border-celo-dark-tan' };
      case 3:
        return { emoji: '🥉', color: 'text-celo-orange', bg: 'bg-celo-orange/10 border-celo-orange/50' };
      default:
        return { emoji: `#${rank}`, color: 'text-celo-body', bg: 'bg-white border-celo-dark-tan' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl sm:text-6xl mb-3">🏆</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-celo-brown mb-2">
          Pool #{poolId.toString()} Results
        </h1>
        <p className="text-sm sm:text-base text-celo-body">
          {poolData?.isFinalized ? 'Prizes Distributed' : 'Waiting for Finalization'}
        </p>
      </div>

      {/* Prize Pool Summary */}
      <div className="bg-celo-dark-tan/30 rounded-2xl p-4 sm:p-6 border border-celo-dark-tan">
        <div className="text-center mb-4">
          <div className="text-sm font-medium text-celo-body mb-1">Total Prize Pool</div>
          <div className="text-3xl sm:text-4xl font-bold text-celo-forest">
            {(ENTRY_FEE_VALUE * 12).toFixed(1)} CELO
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-celo-dark-tan">
            <div className="text-xl sm:text-2xl mb-1">🥇</div>
            <div className="text-sm sm:text-base font-bold text-celo-forest">{prizes.first} CELO</div>
          </div>
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-celo-dark-tan">
            <div className="text-xl sm:text-2xl mb-1">🥈</div>
            <div className="text-sm sm:text-base font-bold text-celo-brown">{prizes.second} CELO</div>
          </div>
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-celo-dark-tan">
            <div className="text-xl sm:text-2xl mb-1">🥉</div>
            <div className="text-sm sm:text-base font-bold text-celo-orange">{prizes.third} CELO</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-lg border border-celo-dark-tan overflow-hidden">
        <div className="bg-celo-forest p-4 sm:p-6 text-white">
          <h2 className="text-lg sm:text-xl font-bold">Final Leaderboard</h2>
          <p className="text-xs sm:text-sm opacity-90">Ranked by color matching accuracy</p>
        </div>

        <div className="divide-y divide-celo-dark-tan">
          {isLoading ? (
            <div className="p-8 text-center text-celo-inactive">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p>Loading results...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-celo-inactive">
              <div className="text-4xl mb-2">🎯</div>
              <p>No results yet</p>
            </div>
          ) : (
            leaderboard.map((entry) => {
              const rankStyle = getRankDisplay(entry.rank);
              return (
                <div
                  key={entry.rank}
                  className={`p-4 sm:p-6 flex items-center gap-3 sm:gap-4 ${
                    entry.rank <= 3 ? `border-2 ${rankStyle.bg}` : 'bg-white'
                  }`}
                >
                  {/* Rank */}
                  <div className={`text-2xl sm:text-3xl font-bold ${rankStyle.color} min-w-[3rem] text-center`}>
                    {rankStyle.emoji}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs sm:text-sm text-celo-body truncate">
                      {entry.player}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-base sm:text-lg font-bold text-celo-brown">
                        {(entry.score / 100).toFixed(2)}% accuracy
                      </div>
                    </div>
                  </div>

                  {/* Prize */}
                  {entry.prize && (
                    <div className="text-right">
                      <div className={`text-base sm:text-lg font-bold ${rankStyle.color}`}>
                        {entry.prize}
                      </div>
                      <div className="text-[10px] sm:text-xs text-celo-inactive">Prize</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pool Status */}
      {poolData && (
        <div className="bg-celo-dark-tan/30 rounded-xl p-4 text-center border border-celo-dark-tan">
          <div className="text-sm">
            {poolData.isFinalized ? (
              <span className="flex items-center justify-center gap-2 text-celo-success font-medium">
                <span>✅</span> Prizes have been distributed
              </span>
            ) : poolData.isComplete ? (
              <span className="flex items-center justify-center gap-2 text-celo-orange font-medium">
                <span>⏳</span> Waiting for admin to finalize pool
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-celo-forest font-medium">
                <span>🎮</span> Pool in progress ({poolData.playerCount}/16 players)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {onBackToLobby && (
          <button
            onClick={onBackToLobby}
            className="w-full px-6 py-4 bg-celo-forest text-white font-semibold rounded-xl hover:bg-celo-forest/90 transition-all shadow-sm"
          >
            🎮 Join New Pool
          </button>
        )}

        <button
          onClick={async () => {
            const topPlayer = leaderboard[0];
            const topScore = topPlayer ? (topPlayer.score / 100).toFixed(2) : '??';
            const text = `🏆 Color Drop Pool #${poolId.toString()} Results!\n\n🥇 Top Score: ${topScore}% accuracy\n🎟️ Entry: ${ENTRY_FEE_VALUE} CELO\n💰 Prize Pool: ${(ENTRY_FEE_VALUE * 16).toFixed(2)} CELO\n\n🎨 Think you can beat that? Join the next pool!`;
            const embedUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://colordrop.app';

            try {
              const isInMiniApp = await sdk.isInMiniApp();
              if (isInMiniApp) {
                await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`);
              } else {
                window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`, '_blank');
              }
            } catch (error) {
              console.error('Failed to share:', error);
              window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`, '_blank');
            }
          }}
          className="w-full px-6 py-3 bg-celo-dark-tan/50 text-celo-brown font-semibold rounded-xl hover:bg-celo-dark-tan transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Results
        </button>
      </div>
    </div>
  );
}
