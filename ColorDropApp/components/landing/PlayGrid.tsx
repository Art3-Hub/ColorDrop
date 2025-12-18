'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PaymentModal } from '../PaymentModal';
import { SelfVerificationModal } from '../SelfVerificationModal';
import { useSelf } from '@/contexts/SelfContext';
import { useColorDropPool } from '@/hooks/useColorDropPool';
import { getCurrentUser } from '@/lib/farcaster';

interface PlayGridProps {
  onStartGame: (slot: number) => void;
  onViewLeaderboard?: () => void;
}

type FlowState = 'idle' | 'verification_prompt' | 'payment' | 'playing';

export function PlayGrid({ onStartGame, onViewLeaderboard }: PlayGridProps) {
  const { address } = useAccount();
  const {
    isVerified,
    initiateSelfVerification
  } = useSelf();

  const {
    poolData,
    userStatus,
    hasReachedSlotLimit,
    joinPool,
    isJoinPending,
    isJoinConfirming,
    isJoinSuccess,
    joinError,
    joinHash,
    isWrongChain,
    isSwitchingChain,
    targetChain,
    connectedChain,
    switchToCorrectChain
  } = useColorDropPool();

  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null); // Track slot during transaction
  const [lastProcessedHash, setLastProcessedHash] = useState<`0x${string}` | null>(null);

  const POOL_SIZE = 9; // 9-player pools for faster games
  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
  const ENTRY_FEE = `${ENTRY_FEE_VALUE} CELO`;

  // Debug: Log transaction states and user status
  useEffect(() => {
    console.log('📊 Transaction state:', {
      isJoinPending,
      isJoinConfirming,
      isJoinSuccess,
      joinHash: joinHash ? `${joinHash.slice(0, 10)}...` : null,
      pendingSlot,
      flowState
    });
    console.log('👤 User status:', userStatus);
  }, [isJoinPending, isJoinConfirming, isJoinSuccess, joinHash, pendingSlot, flowState, userStatus]);

  // Check if user can't join (already in active pool)
  const cannotJoin = userStatus && !userStatus.canJoin;

  // Check if user is already in an active pool (needs to play their game first)
  const isAlreadyInPool = cannotJoin && userStatus && userStatus.slotsUsed > 0;

  // Handle successful join - track by hash to avoid stale success
  useEffect(() => {
    if (isJoinSuccess && joinHash && joinHash !== lastProcessedHash && pendingSlot) {
      console.log('🎮 Transaction confirmed! Starting game for slot:', pendingSlot);
      setLastProcessedHash(joinHash);
      // Start the game for this slot
      onStartGame(pendingSlot);
      setFlowState('idle');
      setSelectedSlot(null);
      setPendingSlot(null);
    }
  }, [isJoinSuccess, joinHash, lastProcessedHash, pendingSlot, onStartGame]);

  const handleSlotClick = (slotNumber: number) => {
    const slotIndex = slotNumber - 1;
    // Check if this slot belongs to the current user
    const isMySlot = poolData && address &&
      slotIndex < poolData.playerCount &&
      poolData.players[slotIndex]?.toLowerCase() === address.toLowerCase();

    // If clicking on own slot, go directly to game
    if (isMySlot) {
      console.log('🎮 User clicking their own slot, starting game for slot:', slotNumber);
      onStartGame(slotNumber);
      return;
    }

    // If user is already in a pool (different slot), redirect to game instead of payment
    if (isAlreadyInPool) {
      console.log('🎮 User already in pool, redirecting to game');
      onStartGame(slotNumber);
      return;
    }

    setSelectedSlot(slotNumber);

    // Show verification prompt if not verified and approaching limit
    if (!isVerified && userStatus && userStatus.slotsUsed >= 2) {
      setFlowState('verification_prompt');
    } else {
      // Skip directly to payment
      setFlowState('payment');
    }
  };

  const handleVerifySelf = async () => {
    await initiateSelfVerification();
    // After verification starts, proceed to payment
    setFlowState('payment');
  };

  const handleSkipVerification = () => {
    setFlowState('payment');
  };

  const handleConfirmPayment = async () => {
    if (!selectedSlot || !address) return;

    try {
      // Store the slot we're paying for BEFORE starting transaction
      setPendingSlot(selectedSlot);
      console.log('💰 Starting payment for slot:', selectedSlot);

      // Get user's FID from Farcaster context
      let fid = BigInt(1); // Default fallback

      try {
        const farcasterUser = await getCurrentUser();
        if (farcasterUser?.fid) {
          fid = BigInt(farcasterUser.fid);
          console.log('Using Farcaster FID:', fid);
        } else {
          console.warn('No Farcaster FID found, using fallback FID:', fid);
        }
      } catch (error) {
        console.warn('Failed to get Farcaster FID, using fallback:', error);
      }

      await joinPool(fid);
    } catch (error) {
      console.error('Failed to join pool:', error);
      // Reset pending slot on error
      setPendingSlot(null);
    }
  };

  const handleCancelPayment = () => {
    if (!isJoinPending && !isJoinConfirming) {
      setFlowState('idle');
      setSelectedSlot(null);
      setPendingSlot(null);
    }
  };


  const slotsRemaining = userStatus
    ? Math.max(0, userStatus.slotsAvailable - userStatus.slotsUsed)
    : 4;

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Pool #{poolData?.poolId?.toString() || '...'} - Choose Your Slot
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Pay {ENTRY_FEE} per slot • Top 3 players win prizes!
          </p>

          {/* User Status Banner */}
          {userStatus && (
            <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isVerified
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}>
              {isVerified ? (
                <>
                  <span>✅</span>
                  <span>Verified - Unlimited Slots</span>
                </>
              ) : (
                <>
                  <span>⚠️</span>
                  <span>{slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} remaining (4 max)</span>
                </>
              )}
            </div>
          )}

          {hasReachedSlotLimit && !isAlreadyInPool && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold">Slot limit reached!</p>
              <p>Verify your age to unlock unlimited slots.</p>
            </div>
          )}

          {/* Already in Pool Info */}
          {isAlreadyInPool && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold">🎮 You're in this pool!</p>
              <p>You have {userStatus?.slotsUsed} slot(s). Click your green slot(s) below to play your game and submit your score.</p>
            </div>
          )}

          {/* Wrong Chain Warning */}
          {isWrongChain && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              <p className="font-semibold">⚠️ Wrong Network</p>
              <p>
                Connected to {connectedChain?.name || 'Unknown'}.
                Please switch to {targetChain.name} to play.
              </p>
              <button
                onClick={() => switchToCorrectChain()}
                disabled={isSwitchingChain}
                className="mt-2 px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {isSwitchingChain ? 'Switching...' : `Switch to ${targetChain.name}`}
              </button>
            </div>
          )}

          {/* Prize Pool - 9 players x 0.1 CELO = 0.9 CELO total */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 max-w-3xl mx-auto">
            {/* 1st Place - 0.45 CELO (50%) */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-yellow-300 shadow-lg">
              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥇</div>
              <div className="text-lg sm:text-2xl font-bold text-yellow-700">
                {(ENTRY_FEE_VALUE * 4.5).toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-yellow-600">CELO</div>
              <div className="text-[10px] sm:text-xs text-yellow-700 mt-1 font-medium">1st Place</div>
            </div>

            {/* 2nd Place - 0.225 CELO (25%) */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-300 shadow-lg">
              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥈</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-700">
                {(ENTRY_FEE_VALUE * 2.25).toFixed(3)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-gray-600">CELO</div>
              <div className="text-[10px] sm:text-xs text-gray-700 mt-1 font-medium">2nd Place</div>
            </div>

            {/* 3rd Place - 0.075 CELO (8.33%) */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-orange-300 shadow-lg">
              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥉</div>
              <div className="text-lg sm:text-2xl font-bold text-orange-700">
                {(ENTRY_FEE_VALUE * 0.75).toFixed(3)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-orange-600">CELO</div>
              <div className="text-[10px] sm:text-xs text-orange-700 mt-1 font-medium">3rd Place</div>
            </div>
          </div>
        </div>

        {/* Play Grid - 9 slots in 3x3 grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-md mx-auto">
          {Array.from({ length: POOL_SIZE }, (_, i) => i + 1).map((slotNumber) => {
            const slotIndex = slotNumber - 1;
            const isOccupied = poolData && slotIndex < poolData.playerCount;
            // Check if THIS slot belongs to the current user
            const isMySlot = isOccupied && poolData && address &&
              poolData.players[slotIndex]?.toLowerCase() === address.toLowerCase();
            const canPlay = !hasReachedSlotLimit || isAlreadyInPool; // Allow clicking if already in pool

            return (
              <button
                key={slotNumber}
                onClick={() => handleSlotClick(slotNumber)}
                disabled={isOccupied && !isMySlot || (!canPlay && !isMySlot)}
                className={`
                  aspect-square rounded-xl sm:rounded-2xl border-2 font-bold
                  transition-all duration-200 transform
                  ${isMySlot
                    ? 'bg-gradient-to-br from-green-500 to-teal-600 border-green-400 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                    : isOccupied
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : !canPlay
                    ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 border-purple-400 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-sm sm:text-lg
                `}
              >
                {isMySlot ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-xl sm:text-3xl">▶️</div>
                    <div className="text-xs sm:text-sm">Continue</div>
                    <div className="text-[10px] sm:text-xs opacity-90">Your Slot</div>
                  </div>
                ) : isOccupied ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-lg sm:text-2xl">✓</div>
                    <div className="text-[10px] sm:text-xs">Filled</div>
                  </div>
                ) : !canPlay ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-lg sm:text-2xl">🔒</div>
                    <div className="text-[10px] sm:text-xs">Limit</div>
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
                <div className="font-semibold">Match the target color in 10 seconds</div>
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
              {poolData ? POOL_SIZE - poolData.playerCount : POOL_SIZE}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600">Slots Available</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {poolData?.playerCount || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600">Slots Filled</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {(ENTRY_FEE_VALUE * POOL_SIZE).toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600">Total Prize Pool</div>
          </div>
        </div>

        {/* View Leaderboard Button - Show if pool is complete */}
        {poolData?.isComplete && onViewLeaderboard && (
          <div className="mt-6">
            <button
              onClick={onViewLeaderboard}
              className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🏆</span>
              <span>View Pool Results</span>
            </button>
          </div>
        )}
      </div>

      {/* SELF Verification Modal */}
      <SelfVerificationModal
        isOpen={flowState === 'verification_prompt'}
        onVerify={handleVerifySelf}
        onSkip={handleSkipVerification}
        slotsRemaining={slotsRemaining}
        isUnlimited={isVerified}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={flowState === 'payment'}
        slotNumber={selectedSlot || 0}
        entryFee={ENTRY_FEE}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
        isProcessing={isJoinPending || isJoinConfirming}
        error={joinError}
      />
    </>
  );
}
