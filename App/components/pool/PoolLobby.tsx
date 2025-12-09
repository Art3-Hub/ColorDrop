'use client';

import { useState } from 'react';

interface Player {
  address: string;
  fid?: number;
  username?: string;
  joinedAt: number;
}

interface PoolLobbyProps {
  poolId?: number;
  onJoinPool: () => Promise<void>;
  onStartGame: () => void;
}

export function PoolLobby({ poolId, onJoinPool, onStartGame }: PoolLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const POOL_SIZE = 21;
  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
  const ENTRY_FEE = `${ENTRY_FEE_VALUE} CELO`;
  const FIRST_PRIZE = ENTRY_FEE_VALUE * 10; // 10x entry fee
  const SECOND_PRIZE = ENTRY_FEE_VALUE * 6; // 6x entry fee
  const THIRD_PRIZE = ENTRY_FEE_VALUE * 3; // 3x entry fee

  const handleJoinPool = async () => {
    setIsJoining(true);
    try {
      await onJoinPool();
      setHasJoined(true);
      // Add mock player for demo
      setPlayers(prev => [...prev, {
        address: '0x...',
        joinedAt: Date.now(),
      }]);
    } catch (error) {
      console.error('Failed to join pool:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const spotsLeft = POOL_SIZE - players.length;
  const isPoolFull = players.length >= POOL_SIZE;
  // Allow starting immediately in demo mode (testnet) after joining
  const isDemoMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEFAULT_NETWORK === 'sepolia';
  const canStart = hasJoined && (isPoolFull || isDemoMode);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-4 sm:p-8 text-white">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Pool #{poolId || '---'}</h1>
          <p className="text-sm sm:text-base text-purple-100 mb-4 sm:mb-6">
            21-Player Tournament • {ENTRY_FEE} Entry
          </p>

          {/* Prize Pool */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-white border-opacity-30">
              <div className="text-2xl sm:text-3xl mb-1">🥇</div>
              <div className="text-lg sm:text-2xl font-bold text-white">{FIRST_PRIZE} CELO</div>
              <div className="text-xs sm:text-sm text-white font-medium">1st Place</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-white border-opacity-30">
              <div className="text-2xl sm:text-3xl mb-1">🥈</div>
              <div className="text-lg sm:text-2xl font-bold text-white">{SECOND_PRIZE} CELO</div>
              <div className="text-xs sm:text-sm text-white font-medium">2nd Place</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-white border-opacity-30">
              <div className="text-2xl sm:text-3xl mb-1">🥉</div>
              <div className="text-lg sm:text-2xl font-bold text-white">{THIRD_PRIZE} CELO</div>
              <div className="text-xs sm:text-sm text-white font-medium">3rd Place</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Status */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Players ({players.length}/{POOL_SIZE})
          </h2>
          <div className={`px-4 py-2 rounded-full font-semibold ${
            isPoolFull
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isPoolFull ? 'Pool Full' : `${spotsLeft} spots left`}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${(players.length / POOL_SIZE) * 100}%` }}
            />
          </div>
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          {Array.from({ length: POOL_SIZE }).map((_, index) => {
            const player = players[index];
            return (
              <div
                key={index}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold ${
                  player
                    ? 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200 border-dashed'
                }`}
              >
                {player ? (
                  <div className="text-center">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="text-xs">
                      {player.username || `P${index + 1}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl">?</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {!hasJoined && !isPoolFull && (
            <button
              onClick={handleJoinPool}
              disabled={isJoining}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isJoining ? 'Joining Pool...' : `Join Pool (${ENTRY_FEE})`}
            </button>
          )}

          {hasJoined && !isPoolFull && !isDemoMode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold text-green-700">
                You're in the pool!
              </div>
              <div className="text-sm text-green-600">
                Waiting for {spotsLeft} more {spotsLeft === 1 ? 'player' : 'players'}...
              </div>
            </div>
          )}

          {hasJoined && isDemoMode && !isPoolFull && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center mb-3">
              <div className="text-sm text-yellow-700">
                🧪 <strong>Demo Mode:</strong> You can start the game now for testing
              </div>
            </div>
          )}

          {canStart && (
            <button
              onClick={onStartGame}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              {isDemoMode && !isPoolFull ? 'Start Game (Demo) 🎮' : 'Start Tournament 🎮'}
            </button>
          )}
        </div>
      </div>

      {/* Game Rules */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-3">How to Win</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">🎨</span>
            <span>Match the target color as closely as possible in 10 seconds</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🎯</span>
            <span>Use HSL sliders (Hue, Saturation, Lightness) to adjust your color</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📊</span>
            <span>Top 3 most accurate matches win CELO prizes</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">⚡</span>
            <span>All 21 players play simultaneously when pool is full</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
