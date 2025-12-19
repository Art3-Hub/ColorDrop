'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PaymentModal } from '../PaymentModal';
import { SelfVerificationModal } from '../SelfVerificationModal';
import { useSelf } from '@/contexts/SelfContext';
import { useColorDropPool } from '@/hooks/useColorDropPool';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { getCurrentUser } from '@/lib/farcaster';

interface PlayGridProps {
  onStartGame: (slot: number) => void;
  onViewLeaderboard?: () => void;
  onViewPastGames?: () => void;
}

type FlowState = 'idle' | 'verification_prompt' | 'payment' | 'playing';

export function PlayGrid({ onStartGame, onViewLeaderboard, onViewPastGames }: PlayGridProps) {
  const { address } = useAccount();
  const {
    isVerified,
    initiateSelfVerification,
    initiateDeeplinkVerification,
    stopPolling
  } = useSelf();
  const { shouldUseDeeplink } = usePlatformDetection();

  const {
    poolData,
    currentPoolId,
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

  // Auto-proceed to payment when verification completes
  useEffect(() => {
    if (isVerified && flowState === 'verification_prompt') {
      console.log('✅ Verification completed! Proceeding to payment...');
      stopPolling(); // Stop polling since we're verified
      setFlowState('payment');
    }
  }, [isVerified, flowState, stopPolling]);

  const POOL_SIZE = 16; // 16-player pools for attractive economics
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

  // User has slots in this pool (but may or may not have submitted scores)
  const hasActiveSlots = userStatus && userStatus.slotsUsed > 0;

  // Handle successful join - track by hash to avoid stale success
  useEffect(() => {
    if (isJoinSuccess && joinHash && joinHash !== lastProcessedHash && pendingSlot) {
      console.log('🎮 Transaction confirmed! Starting game for slot:', pendingSlot);
      setLastProcessedHash(joinHash);

      // Start the game for this slot
      // Note: SELF verification persists in session - verified users get unlimited slots
      onStartGame(pendingSlot);
      setFlowState('idle');
      setSelectedSlot(null);
      setPendingSlot(null);
    }
  }, [isJoinSuccess, joinHash, lastProcessedHash, pendingSlot, onStartGame]);

  const handleSlotClick = (slotNumber: number) => {
    const slotIndex = slotNumber - 1;
    // Check if this slot belongs to the current user
    const isOccupied = poolData && slotIndex < poolData.playerCount;
    const isMySlot = isOccupied && poolData && address &&
      poolData.players[slotIndex]?.toLowerCase() === address.toLowerCase();

    console.log('🔍 Slot click analysis:', {
      slotNumber,
      slotIndex,
      isOccupied,
      isMySlot,
      playerAtSlot: poolData?.players[slotIndex] || 'none',
      userAddress: address,
      poolPlayerCount: poolData?.playerCount,
      allPlayers: poolData?.players,
      canJoin: userStatus?.canJoin
    });

    // Check if score has been submitted for this slot
    const hasSubmitted = poolData?.playerSlots?.[slotIndex]?.hasSubmitted ?? false;

    // If clicking on own slot that has NOT submitted, go to game to play/submit
    if (isMySlot && !hasSubmitted) {
      console.log('🎮 User clicking their own slot (not submitted), starting game for slot:', slotNumber);
      onStartGame(slotNumber);
      return;
    }

    // If clicking on own slot that HAS already submitted, do nothing (slot is complete)
    if (isMySlot && hasSubmitted) {
      console.log('✅ Slot already submitted, cannot play again');
      return;
    }

    // If slot is occupied by someone else, do nothing (shouldn't happen due to button disable)
    if (isOccupied && !isMySlot) {
      console.log('🚫 Slot occupied by another player, ignoring click');
      return;
    }

    // IMPORTANT: Smart contract only allows ONE active slot at a time
    // User must submit their score before buying another slot
    // Check if user has an unfinished game (canJoin: false means they have an active slot)
    console.log('🔎 CRITICAL CHECK - userStatus before allowing purple slot:', {
      userStatus: userStatus,
      canJoin: userStatus?.canJoin,
      slotsUsed: userStatus?.slotsUsed,
      slotsAvailable: userStatus?.slotsAvailable,
      isVerified: userStatus?.isVerified,
      willBlock: userStatus && !userStatus.canJoin && userStatus.slotsUsed > 0
    });

    if (userStatus && !userStatus.canJoin && userStatus.slotsUsed > 0) {
      console.log('🚫 BLOCKED! User has unfinished game - canJoin is FALSE');
      console.log('📊 Contract returned canJoin=false, meaning activePoolId[user] != 0');
      console.log('💡 This should have been reset to 0 after submitScore() in v3.5.0');
      alert('You have an unfinished game! Please click your orange "PLAY NOW" slot to play and submit your score before buying another slot.');
      return;
    }

    console.log('✅ ALLOWED - userStatus.canJoin is true, proceeding to payment');

    // For any available slot (purple), require payment
    // Each new slot costs 0.1 CELO regardless of how many slots user already has
    console.log('💰 Opening payment modal for new slot:', slotNumber);
    setSelectedSlot(slotNumber);

    // v3.9.0: Show SELF verification on EVERY slot click for unverified users
    // This encourages verification without blocking gameplay
    // slotsUsed from contract is now PER-POOL (not lifetime)
    const slotsInCurrentPool = userStatus?.slotsUsed || 0;

    if (!isVerified) {
      // Always show verification prompt for unverified users
      // They can skip if under the per-pool limit (2 slots)
      if (slotsInCurrentPool >= MAX_UNVERIFIED_SLOTS) {
        // At limit - must verify to continue (can't skip)
        console.log('🔐 SELF verification REQUIRED - at per-pool slot limit');
      } else {
        // Under limit - can skip but we still encourage verification
        console.log('🔐 Offering SELF verification (can skip)');
      }
      setFlowState('verification_prompt');
    } else {
      // Verified user - go directly to payment (unlimited slots)
      setFlowState('payment');
    }
  };

  const handleVerifySelf = async () => {
    // Use deeplink for Farcaster mobile, otherwise QR code handles it via modal
    if (shouldUseDeeplink) {
      await initiateDeeplinkVerification();
      // After verification starts, proceed to payment
      setFlowState('payment');
    } else {
      // For browser/farcaster-browser, the QR code is shown in the modal
      // and polling starts when QR is scanned - no need to call initiateSelfVerification here
      // The modal will handle the QR code display and polling
      // Just keep the verification_prompt state until user completes or skips
    }
  };

  // Check if user can skip verification (only if under per-pool slot limit)
  // v3.9.0: This is now PER-POOL slots, not lifetime
  const currentPoolSlots = userStatus?.slotsUsed || 0;
  const MAX_UNVERIFIED_SLOTS = 2; // Must match contract UNVERIFIED_POOL_SLOT_LIMIT
  const canSkipVerification = currentPoolSlots < MAX_UNVERIFIED_SLOTS;

  const handleSkipVerification = () => {
    if (canSkipVerification) {
      // User can skip - proceed to payment
      setFlowState('payment');
    } else {
      // User at limit - cancel and go back to idle
      setFlowState('idle');
      setSelectedSlot(null);
    }
  };

  const handleCancelVerification = () => {
    // Cancel always goes back to idle
    setFlowState('idle');
    setSelectedSlot(null);
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

  return (
    <>
      <div className="max-w-lg mx-auto px-3 sm:px-4">
        {/* Header - Compact on mobile, detailed on desktop */}
        <div className="text-center mb-3 sm:mb-4">
          {/* Mobile: Ultra-compact motivating header */}
          <div className="sm:hidden">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Pool #{poolData?.poolId?.toString() || '...'}
              </div>
              {userStatus && (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isVerified
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isVerified ? '✓ Unlimited' : `${Math.max(0, MAX_UNVERIFIED_SLOTS - currentPoolSlots)}/${MAX_UNVERIFIED_SLOTS} left`}
                </div>
              )}
            </div>
            {/* Motivating headline */}
            <div className="text-sm font-bold text-gray-800 mb-1">
              Win up to <span className="text-purple-600">{(ENTRY_FEE_VALUE * 7).toFixed(2)} CELO</span> now!
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <span>{ENTRY_FEE}/slot</span>
              <span>•</span>
              <span>🥇{(ENTRY_FEE_VALUE * 7).toFixed(2)} 🥈{(ENTRY_FEE_VALUE * 5).toFixed(2)} 🥉{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</span>
            </div>
          </div>

          {/* Desktop/Tablet: Full detailed header */}
          <div className="hidden sm:block">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Pool #{poolData?.poolId?.toString() || '...'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Play & Win up to <span className="text-purple-600">{(ENTRY_FEE_VALUE * 7).toFixed(2)} CELO</span>!
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {ENTRY_FEE} per slot • Top 3 win prizes!
            </p>

            {/* User Status Badge */}
            {userStatus && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-3 ${
                isVerified
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isVerified ? (
                  <>
                    <span>✓</span>
                    <span>Unlimited Slots</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold">{Math.max(0, MAX_UNVERIFIED_SLOTS - currentPoolSlots)}</span>
                    <span>/ {MAX_UNVERIFIED_SLOTS} slots left</span>
                  </>
                )}
              </div>
            )}

            {/* Prize Pool - Desktop only */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-xs text-gray-500 text-center mb-2 font-medium">🏆 Prize Pool</div>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥇</div>
                  <div className="text-lg font-bold text-yellow-600">{(ENTRY_FEE_VALUE * 7).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">CELO</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥈</div>
                  <div className="text-lg font-bold text-gray-500">{(ENTRY_FEE_VALUE * 5).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">CELO</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥉</div>
                  <div className="text-lg font-bold text-orange-500">{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">CELO</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings - Show on all sizes when needed */}
          {hasActiveSlots && userStatus && !userStatus.canJoin && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 text-xs text-orange-700 mt-2">
              <span className="font-semibold">⚠️</span> Tap your orange slot to play
            </div>
          )}

          {isWrongChain && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 text-xs text-red-700 flex items-center justify-between gap-2 mt-2">
              <span>Wrong Network: {connectedChain?.name || 'Unknown'}</span>
              <button
                onClick={() => switchToCorrectChain()}
                disabled={isSwitchingChain}
                className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isSwitchingChain ? '...' : 'Switch'}
              </button>
            </div>
          )}
        </div>

        {/* Play Grid - 16 slots in 4x4 grid */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: POOL_SIZE }, (_, i) => i + 1).map((slotNumber) => {
              const slotIndex = slotNumber - 1;
              const isOccupied = poolData && slotIndex < poolData.playerCount;
              // Check if THIS slot belongs to the current user
              const isMySlot = isOccupied && poolData && address &&
                poolData.players[slotIndex]?.toLowerCase() === address.toLowerCase();
              // Check if score has been submitted for this slot (on-chain)
              const hasSubmitted = poolData?.playerSlots?.[slotIndex]?.hasSubmitted ?? false;
              // User can play if: they own the slot OR they haven't reached slot limit
              const canPlay = isMySlot || !hasReachedSlotLimit;

              // Button should be disabled if:
              // 1. Slot is occupied by someone else (not my slot)
              // 2. Slot is empty but user has reached slot limit
              // 3. My slot but score already submitted (completed - can't play again)
              const isDisabled = Boolean((isOccupied && !isMySlot) || (!isOccupied && hasReachedSlotLimit) || (isMySlot && hasSubmitted));

              // Determine slot styling based on state
              let slotClassName = '';
              if (isMySlot) {
                if (hasSubmitted) {
                  slotClassName = 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white';
                } else {
                  slotClassName = 'bg-gradient-to-br from-orange-400 to-amber-500 border-orange-300 text-white hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg';
                }
              } else if (isOccupied) {
                slotClassName = 'bg-gray-100 border-gray-200 text-gray-400';
              } else if (!canPlay) {
                slotClassName = 'bg-gray-50 border-gray-200 text-gray-300';
              } else {
                slotClassName = 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400 text-white hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg';
              }

              return (
                <button
                  key={slotNumber}
                  onClick={() => handleSlotClick(slotNumber)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-xl border-2 font-semibold
                    transition-all duration-150 transform
                    ${slotClassName}
                    disabled:cursor-not-allowed
                    flex flex-col items-center justify-center
                  `}
                >
                  {isMySlot ? (
                    hasSubmitted ? (
                      <>
                        <span className="text-2xl sm:text-3xl">✓</span>
                        <span className="text-[10px] sm:text-xs mt-0.5 opacity-90">Done</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl">▶</span>
                        <span className="text-[10px] sm:text-xs mt-0.5 font-bold">PLAY</span>
                      </>
                    )
                  ) : isOccupied ? (
                    <>
                      <span className="text-xl sm:text-2xl">●</span>
                      <span className="text-[10px] sm:text-xs mt-0.5">Taken</span>
                    </>
                  ) : !canPlay ? (
                    <>
                      <span className="text-xl sm:text-2xl">🔒</span>
                      <span className="text-[10px] sm:text-xs mt-0.5">Limit</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-xs font-bold">TAP TO</span>
                      <span className="text-[10px] sm:text-xs font-bold">PLAY</span>
                      <span className="text-[9px] sm:text-[10px] mt-0.5 opacity-80">{ENTRY_FEE_VALUE} CELO</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend - compact */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-br from-purple-500 to-indigo-600"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-br from-orange-400 to-amber-500"></span>
              <span>Your Turn</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-400 to-teal-500"></span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* How to Play - Horizontal 3-column layout */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">How to Play</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mb-1">1</span>
              <div className="text-xs font-semibold text-gray-800">Pay {ENTRY_FEE}</div>
              <div className="text-[10px] text-gray-500">Tap slot to join</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mb-1">2</span>
              <div className="text-xs font-semibold text-gray-800">Match Color</div>
              <div className="text-[10px] text-gray-500">10s with sliders</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mb-1">3</span>
              <div className="text-xs font-semibold text-gray-800">Win Prizes!</div>
              <div className="text-[10px] text-gray-500">Top 3 win CELO</div>
            </div>
          </div>
        </div>

        {/* Stats Bar - Compact inline */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {poolData ? POOL_SIZE - poolData.playerCount : POOL_SIZE}
            </div>
            <div className="text-[10px] text-gray-500">Open</div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {poolData?.playerCount || 0}/{POOL_SIZE}
            </div>
            <div className="text-[10px] text-gray-500">Filled</div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {(ENTRY_FEE_VALUE * POOL_SIZE).toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-500">Prize Pool</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* View Leaderboard Button - Show if pool is complete */}
          {poolData?.isComplete && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="text-lg">🏆</span>
              <span>View Results</span>
            </button>
          )}

          {/* Past Games Navigation */}
          {onViewPastGames && (
            <button
              onClick={onViewPastGames}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>📜</span>
              <span>Past Games & Prizes</span>
            </button>
          )}
        </div>
      </div>

      {/* SELF Verification Modal */}
      <SelfVerificationModal
        isOpen={flowState === 'verification_prompt'}
        onVerify={handleVerifySelf}
        onSkip={handleSkipVerification}
        onCancel={handleCancelVerification}
        slotsRemaining={Math.max(0, MAX_UNVERIFIED_SLOTS - currentPoolSlots)}
        canSkip={canSkipVerification}
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
