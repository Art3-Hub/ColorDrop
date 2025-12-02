'use client';

import { useState, useEffect } from 'react';
import { parseEther } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

interface PlayGridProps {
  onStartGame: (slot: number) => void;
}

export function PlayGrid({ onStartGame }: PlayGridProps) {
  const { address } = useAccount();
  const [isPaying, setIsPaying] = useState<number | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<Set<number>>(new Set());

  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
  const ENTRY_FEE = `${ENTRY_FEE_VALUE} CELO`;

  // Load played slots from localStorage on mount and when returning from game
  useEffect(() => {
    const loadPlayedSlots = () => {
      const playedSlots = JSON.parse(localStorage.getItem('playedSlots') || '[]');
      setOccupiedSlots(new Set(playedSlots));
    };

    loadPlayedSlots();
    
    // Listen for storage changes (in case user plays in multiple tabs)
    window.addEventListener('storage', loadPlayedSlots);
    
    // Also check on visibility change (when returning to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPlayedSlots();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', loadPlayedSlots);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handlePlaySlot = async (slotNumber: number) => {
    setIsPaying(slotNumber);

    try {
      // TODO: Call smart contract to pay entry fee
      console.log(`Paying ${ENTRY_FEE} for slot ${slotNumber}...`);

      // Simulate payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mark slot as occupied in state
      setOccupiedSlots(prev => new Set([...prev, slotNumber]));

      // Start game with slot number
      onStartGame(slotNumber);
    } catch (error) {
      console.error('Failed to pay entry fee:', error);
    } finally {
      setIsPaying(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Slot
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Pay {ENTRY_FEE} to play • Top 3 players win prizes!
        </p>

        {/* Prize Pool */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 max-w-3xl mx-auto">
          {/* 1st Place */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-yellow-300 shadow-lg">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥇</div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-700">
              {(ENTRY_FEE_VALUE * 6).toFixed(3).replace(/\.?0+$/, '')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-yellow-600">CELO</div>
            <div className="text-[10px] sm:text-xs text-yellow-700 mt-1 font-medium">1st Place</div>
          </div>

          {/* 2nd Place */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-300 shadow-lg">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥈</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-700">
              {(ENTRY_FEE_VALUE * 3).toFixed(3).replace(/\.?0+$/, '')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-600">CELO</div>
            <div className="text-[10px] sm:text-xs text-gray-700 mt-1 font-medium">2nd Place</div>
          </div>

          {/* 3rd Place */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-orange-300 shadow-lg">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥉</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-700">
              {(ENTRY_FEE_VALUE * 1).toFixed(3).replace(/\.?0+$/, '')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-orange-600">CELO</div>
            <div className="text-[10px] sm:text-xs text-orange-700 mt-1 font-medium">3rd Place</div>
          </div>
        </div>
      </div>

      {/* Play Grid - 12 slots in 4x3 grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 mb-8">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((slotNumber) => {
          const isOccupied = occupiedSlots.has(slotNumber);
          const isProcessing = isPaying === slotNumber;

          return (
            <button
              key={slotNumber}
              onClick={() => handlePlaySlot(slotNumber)}
              disabled={isOccupied || isPaying !== null}
              className={`
                aspect-square rounded-xl sm:rounded-2xl border-2 font-bold
                transition-all duration-200 transform
                ${isOccupied
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-purple-500 border-purple-600 text-white scale-95 animate-pulse'
                  : 'bg-gradient-to-br from-purple-500 to-blue-600 border-purple-400 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                text-sm sm:text-lg
              `}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="animate-spin text-lg sm:text-2xl">⏳</div>
                  <div className="text-[10px] sm:text-xs">Paying...</div>
                </div>
              ) : isOccupied ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-lg sm:text-2xl">✓</div>
                  <div className="text-[10px] sm:text-xs">Played</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-xl sm:text-3xl">🎮</div>
                  <div className="text-xs sm:text-sm">Play</div>
                  <div className="text-[10px] sm:text-xs opacity-90">{ENTRY_FEE}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
          How to Play
        </h3>
        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-2xl flex-shrink-0">1️⃣</span>
            <div>
              <div className="font-semibold">Choose a slot and pay {ENTRY_FEE}</div>
              <div className="text-gray-600">Click any available slot to start</div>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-2xl flex-shrink-0">2️⃣</span>
            <div>
              <div className="font-semibold">Match the target color in 8 seconds</div>
              <div className="text-gray-600">Use Hue, Saturation, and Lightness sliders</div>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-2xl flex-shrink-0">3️⃣</span>
            <div>
              <div className="font-semibold">Top 3 most accurate players win prizes</div>
              <div className="text-gray-600">Winners are determined by color accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 text-center">
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {12 - occupiedSlots.size}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">Slots Available</div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {occupiedSlots.size}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">Players Joined</div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {(ENTRY_FEE_VALUE * 12).toFixed(1)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">Total Prize Pool</div>
        </div>
      </div>
    </div>
  );
}
