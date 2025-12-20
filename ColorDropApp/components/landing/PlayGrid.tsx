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
    stopPolling,
    clearVerification
  } = useSelf();
  const { shouldUseDeeplink } = usePlatformDetection();

  const {
    poolData,
    currentPoolId,
    userStatus,
    // v4.2.0: Removed hasReachedSlotLimit - all slots are now clickable
    // SELF verification modal shows skip option based on slotsUsed count
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

      // v4.0.0: ALWAYS reset verification after successful payment
      // This ensures SELF Protocol QR is shown on EVERY slot 3+ purchase (marketing requirement)
      // User must re-verify with SELF for each slot beyond the 2 free slots
      clearVerification();
      console.log('🔄 Cleared verification state for next slot');

      // Start the game for this slot
      onStartGame(pendingSlot);
      setFlowState('idle');
      setSelectedSlot(null);
      setPendingSlot(null);
    }
  }, [isJoinSuccess, joinHash, lastProcessedHash, pendingSlot, onStartGame, clearVerification]);

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

    // v4.2.0: Check if user has ACTUALLY unsubmitted slots (orange "PLAY NOW" slots)
    // The canJoin flag from contract may be stale if activePoolId wasn't reset properly
    // We check the actual slot data to see if user has pending games
    const userHasUnsubmittedSlots = poolData?.playerSlots?.some((slot, idx) => {
      const isUserSlot = poolData.players[idx]?.toLowerCase() === address?.toLowerCase();
      return isUserSlot && !slot.hasSubmitted;
    }) ?? false;

    console.log('🔎 CRITICAL CHECK - userStatus before allowing purple slot:', {
      userStatus: userStatus,
      canJoin: userStatus?.canJoin,
      slotsUsed: userStatus?.slotsUsed,
      slotsAvailable: userStatus?.slotsAvailable,
      isVerified: userStatus?.isVerified,
      userHasUnsubmittedSlots,
      willBlock: userHasUnsubmittedSlots
    });

    // v4.2.0: Only block if user ACTUALLY has unsubmitted slots (orange slots)
    // Don't rely solely on canJoin flag which may be stale
    if (userHasUnsubmittedSlots) {
      console.log('🚫 BLOCKED! User has unsubmitted slot - must play first');
      alert('You have an unfinished game! Please click your orange "PLAY NOW" slot to play and submit your score before buying another slot.');
      return;
    }

    console.log('✅ ALLOWED - No unsubmitted slots, proceeding to SELF verification');

    // For any available slot (purple), require payment
    // Each new slot costs 0.1 CELO regardless of how many slots user already has
    console.log('💰 Opening payment modal for new slot:', slotNumber);
    setSelectedSlot(slotNumber);

    // v4.1.0: ALWAYS show SELF verification modal for marketing
    // - Slots 1-2: Show modal with SKIP option (can bypass)
    // - Slots 3+: Show modal WITHOUT skip option (mandatory verification)
    // This ensures SELF Protocol branding is ALWAYS shown for marketing purposes
    const slotsInCurrentPool = userStatus?.slotsUsed || 0;
    console.log('🔐 Showing SELF verification modal - slot', slotsInCurrentPool + 1,
      slotsInCurrentPool >= MAX_UNVERIFIED_SLOTS ? '(MANDATORY)' : '(can skip)');
    setFlowState('verification_prompt');
  };

  const handleVerifySelf = async () => {
    // Use deeplink for Farcaster mobile, otherwise QR code handles it via modal
    if (shouldUseDeeplink) {
      // Start deeplink verification - this opens SELF app and starts polling
      // DO NOT proceed to payment here - wait for polling to set isVerified=true
      // The useEffect above (lines 56-62) will handle proceeding to payment when verified
      await initiateDeeplinkVerification();
      console.log('🔗 Deeplink opened, waiting for verification to complete via polling...');
      // Keep flowState as 'verification_prompt' - the modal will show "Verifying..." state
      // Once polling detects verification success, isVerified becomes true and useEffect proceeds to payment
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
              <div className="inline-flex items-center gap-1.5 bg-celo-forest/10 text-celo-forest px-2 py-0.5 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-celo-success rounded-full animate-pulse"></span>
                Pool #{poolData?.poolId?.toString() || '...'}
              </div>
              {userStatus && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-celo-yellow/20 text-celo-brown border border-celo-yellow/50">
                  {currentPoolSlots >= MAX_UNVERIFIED_SLOTS
                    ? '🔐 SELF Required'
                    : `${Math.max(0, MAX_UNVERIFIED_SLOTS - currentPoolSlots)}/${MAX_UNVERIFIED_SLOTS} free`}
                </div>
              )}
            </div>
            {/* Motivating headline */}
            <div className="text-sm font-semibold text-celo-brown mb-1">
              Win up to <span className="text-celo-forest">{(ENTRY_FEE_VALUE * 7).toFixed(2)} CELO</span> now!
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-celo-body">
              <span>{ENTRY_FEE}/slot</span>
              <span>•</span>
              <span>🥇{(ENTRY_FEE_VALUE * 7).toFixed(2)} 🥈{(ENTRY_FEE_VALUE * 5).toFixed(2)} 🥉{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</span>
            </div>
          </div>

          {/* Desktop/Tablet: Full detailed header */}
          <div className="hidden sm:block">
            <div className="inline-flex items-center gap-2 bg-celo-forest/10 text-celo-forest px-3 py-1 rounded-full text-xs font-medium mb-2">
              <span className="w-2 h-2 bg-celo-success rounded-full animate-pulse"></span>
              Pool #{poolData?.poolId?.toString() || '...'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-celo-brown mb-1">
              Play & Win up to <span className="text-celo-forest">{(ENTRY_FEE_VALUE * 7).toFixed(2)} CELO</span>!
            </h2>
            <p className="text-sm text-celo-body mb-3">
              {ENTRY_FEE} per slot • Top 3 win prizes!
            </p>

            {/* User Status Badge - v4.0.0: Always show slots status, never show "Unlimited" */}
            {userStatus && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-3 bg-celo-yellow/20 text-celo-brown border border-celo-yellow/50">
                {currentPoolSlots >= MAX_UNVERIFIED_SLOTS ? (
                  <>
                    <span>🔐</span>
                    <span>SELF verification required for more slots</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold">{Math.max(0, MAX_UNVERIFIED_SLOTS - currentPoolSlots)}</span>
                    <span>/ {MAX_UNVERIFIED_SLOTS} free slots left</span>
                  </>
                )}
              </div>
            )}

            {/* Prize Pool - Desktop only */}
            <div className="bg-celo-dark-tan/30 rounded-xl p-4 border border-celo-dark-tan">
              <div className="text-xs text-celo-body text-center mb-2 font-medium">🏆 Prize Pool</div>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥇</div>
                  <div className="text-lg font-bold text-celo-orange">{(ENTRY_FEE_VALUE * 7).toFixed(2)}</div>
                  <div className="text-xs text-celo-inactive">CELO</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥈</div>
                  <div className="text-lg font-bold text-celo-brown">{(ENTRY_FEE_VALUE * 5).toFixed(2)}</div>
                  <div className="text-xs text-celo-inactive">CELO</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-0.5">🥉</div>
                  <div className="text-lg font-bold text-celo-brown/70">{(ENTRY_FEE_VALUE * 2.5).toFixed(2)}</div>
                  <div className="text-xs text-celo-inactive">CELO</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings - Show on all sizes when needed */}
          {hasActiveSlots && userStatus && !userStatus.canJoin && (
            <div className="bg-celo-orange/10 border border-celo-orange/30 rounded-lg px-2 py-1.5 text-xs text-celo-brown mt-2">
              <span className="font-medium">⚠️</span> Tap your orange slot to play
            </div>
          )}

          {isWrongChain && (
            <div className="bg-celo-error/10 border border-celo-error/30 rounded-lg px-2 py-1.5 text-xs text-celo-error flex items-center justify-between gap-2 mt-2">
              <span>Wrong Network: {connectedChain?.name || 'Unknown'}</span>
              <button
                onClick={() => switchToCorrectChain()}
                disabled={isSwitchingChain}
                className="px-2 py-0.5 bg-celo-forest text-white rounded text-xs font-medium hover:bg-celo-forest/90 disabled:opacity-50"
              >
                {isSwitchingChain ? '...' : 'Switch'}
              </button>
            </div>
          )}
        </div>

        {/* Play Grid - 16 slots in 4x4 grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-celo-dark-tan p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: POOL_SIZE }, (_, i) => i + 1).map((slotNumber) => {
              const slotIndex = slotNumber - 1;
              const isOccupied = poolData && slotIndex < poolData.playerCount;
              // Check if THIS slot belongs to the current user
              const isMySlot = isOccupied && poolData && address &&
                poolData.players[slotIndex]?.toLowerCase() === address.toLowerCase();
              // Check if score has been submitted for this slot (on-chain)
              const hasSubmitted = poolData?.playerSlots?.[slotIndex]?.hasSubmitted ?? false;
              // v4.2.0: Button disabled conditions simplified
              // - Slot is occupied by someone else (not my slot) = disabled
              // - My slot but score already submitted = disabled
              // - All available (empty) slots are ALWAYS clickable
              // - If user at limit, clicking shows mandatory SELF verification (no skip)
              const isDisabled = Boolean((isOccupied && !isMySlot) || (isMySlot && hasSubmitted));

              // Determine slot styling based on state
              // v4.2.0: Removed "locked" state - all available slots are clickable
              let slotClassName = '';
              if (isMySlot) {
                if (hasSubmitted) {
                  slotClassName = 'bg-celo-success border-celo-success/50 text-white';
                } else {
                  slotClassName = 'bg-celo-orange border-celo-orange/50 text-white hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md';
                }
              } else if (isOccupied) {
                slotClassName = 'bg-celo-dark-tan/50 border-celo-dark-tan text-celo-inactive';
              } else {
                // v4.2.0: All available slots are forest green/clickable
                // If user is at limit, clicking will show mandatory SELF verification
                slotClassName = 'bg-celo-forest border-celo-forest/50 text-white hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md';
              }

              return (
                <button
                  key={slotNumber}
                  onClick={() => handleSlotClick(slotNumber)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-xl border-2 font-medium
                    transition-all duration-150 transform
                    ${slotClassName}
                    disabled:cursor-not-allowed
                    flex flex-col items-center justify-center
                  `}
                >
                  {/* v4.2.0: Removed locked state - all available slots are clickable */}
                  {isMySlot ? (
                    hasSubmitted ? (
                      <>
                        <span className="text-2xl sm:text-3xl">✓</span>
                        <span className="text-[10px] sm:text-xs mt-0.5 opacity-90">Done</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl">▶</span>
                        <span className="text-[10px] sm:text-xs mt-0.5 font-semibold">PLAY</span>
                      </>
                    )
                  ) : isOccupied ? (
                    <>
                      <span className="text-xl sm:text-2xl">●</span>
                      <span className="text-[10px] sm:text-xs mt-0.5">Taken</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-xs font-semibold">TAP TO</span>
                      <span className="text-[10px] sm:text-xs font-semibold">PLAY</span>
                      <span className="text-[9px] sm:text-[10px] mt-0.5 opacity-80">{ENTRY_FEE_VALUE} CELO</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend - compact */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-celo-dark-tan/50 text-[10px] text-celo-body">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-celo-forest"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-celo-orange"></span>
              <span>Your Turn</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-celo-success"></span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* How to Play - Horizontal 3-column layout */}
        <div className="bg-white rounded-xl shadow-sm border border-celo-dark-tan mb-4 p-3">
          <h3 className="text-sm font-semibold text-celo-brown mb-2 text-center">How to Play</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-celo-forest text-white flex items-center justify-center text-xs font-medium mb-1">1</span>
              <div className="text-xs font-medium text-celo-brown">Pay {ENTRY_FEE}</div>
              <div className="text-[10px] text-celo-body">Tap slot to join</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-celo-forest text-white flex items-center justify-center text-xs font-medium mb-1">2</span>
              <div className="text-xs font-medium text-celo-brown">Match Color</div>
              <div className="text-[10px] text-celo-body">10s with sliders</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="w-6 h-6 rounded-full bg-celo-forest text-white flex items-center justify-center text-xs font-medium mb-1">3</span>
              <div className="text-xs font-medium text-celo-brown">Win Prizes!</div>
              <div className="text-[10px] text-celo-body">Top 3 win CELO</div>
            </div>
          </div>
        </div>

        {/* Stats Bar - Compact inline */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-celo-dark-tan mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-celo-forest">
              {poolData ? POOL_SIZE - poolData.playerCount : POOL_SIZE}
            </div>
            <div className="text-[10px] text-celo-body">Open</div>
          </div>
          <div className="h-8 w-px bg-celo-dark-tan"></div>
          <div className="text-center">
            <div className="text-lg font-bold text-celo-brown">
              {poolData?.playerCount || 0}/{POOL_SIZE}
            </div>
            <div className="text-[10px] text-celo-body">Filled</div>
          </div>
          <div className="h-8 w-px bg-celo-dark-tan"></div>
          <div className="text-center">
            <div className="text-lg font-bold text-celo-success">
              {(ENTRY_FEE_VALUE * POOL_SIZE).toFixed(1)}
            </div>
            <div className="text-[10px] text-celo-body">Prize Pool</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* View Leaderboard Button - Show if pool is complete */}
          {poolData?.isComplete && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="w-full px-4 py-3 bg-celo-orange text-white font-medium rounded-xl hover:bg-celo-orange/90 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="text-lg">🏆</span>
              <span>View Results</span>
            </button>
          )}

          {/* Past Games Navigation */}
          {onViewPastGames && (
            <button
              onClick={onViewPastGames}
              className="w-full px-4 py-2.5 bg-white border border-celo-dark-tan text-celo-brown font-medium rounded-xl hover:bg-celo-light-tan transition-all flex items-center justify-center gap-2 text-sm"
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
        onProceedVerified={() => setFlowState('payment')}
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
