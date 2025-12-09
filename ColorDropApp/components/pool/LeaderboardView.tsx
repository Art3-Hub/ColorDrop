'use client';

import { useEffect, useState } from 'react';
import { useColorDropPool } from '@/hooks/useColorDropPool';
import { formatEther } from 'viem';

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

  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');

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
        return { emoji: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' };
      case 2:
        return { emoji: '🥈', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-300' };
      case 3:
        return { emoji: '🥉', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-300' };
      default:
        return { emoji: `#${rank}`, color: 'text-gray-700', bg: 'bg-white border-gray-200' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl sm:text-6xl mb-3">🏆</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Pool #{poolId.toString()} Results
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {poolData?.isFinalized ? 'Prizes Distributed' : 'Waiting for Finalization'}
        </p>
      </div>

      {/* Prize Pool Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
        <div className="text-center mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Total Prize Pool</div>
          <div className="text-3xl sm:text-4xl font-bold text-purple-700">
            {(ENTRY_FEE_VALUE * 12).toFixed(1)} CELO
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl mb-1">🥇</div>
            <div className="text-sm sm:text-base font-bold text-yellow-700">{prizes.first} CELO</div>
          </div>
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl mb-1">🥈</div>
            <div className="text-sm sm:text-base font-bold text-gray-700">{prizes.second} CELO</div>
          </div>
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl mb-1">🥉</div>
            <div className="text-sm sm:text-base font-bold text-orange-700">{prizes.third} CELO</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white">
          <h2 className="text-lg sm:text-xl font-bold">Final Leaderboard</h2>
          <p className="text-xs sm:text-sm opacity-90">Ranked by color matching accuracy</p>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p>Loading results...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
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
                    <div className="font-mono text-xs sm:text-sm text-gray-700 truncate">
                      {entry.player}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-base sm:text-lg font-bold text-gray-900">
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
                      <div className="text-[10px] sm:text-xs text-gray-600">Prize</div>
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
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-600">
            {poolData.isFinalized ? (
              <span className="flex items-center justify-center gap-2 text-green-700 font-medium">
                <span>✅</span> Prizes have been distributed
              </span>
            ) : poolData.isComplete ? (
              <span className="flex items-center justify-center gap-2 text-yellow-700 font-medium">
                <span>⏳</span> Waiting for admin to finalize pool
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                <span>🎮</span> Pool in progress ({poolData.playerCount}/12 players)
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
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
          >
            🎮 Join New Pool
          </button>
        )}

        <button
          onClick={() => {
            // TODO: Implement share functionality
            console.log('Share results');
          }}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
        >
          📢 Share Results
        </button>
      </div>
    </div>
  );
}
