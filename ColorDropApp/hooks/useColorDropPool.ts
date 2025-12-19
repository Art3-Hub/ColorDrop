'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { celo } from 'wagmi/chains';
import ColorDropPoolABI from '@/contracts/ColorDropPool.json';

// MAINNET ONLY - Production configuration
const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'celo';
const POOL_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET as `0x${string}`;
const TARGET_CHAIN = celo;
const ENTRY_FEE = parseEther(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
const POLL_INTERVAL = 2000; // 2 seconds

console.log('🔧 ColorDropPool Hook Configuration - MAINNET ONLY:', {
  DEFAULT_NETWORK,
  POOL_ADDRESS,
  TARGET_CHAIN: TARGET_CHAIN.name,
  CHAIN_ID: TARGET_CHAIN.id,
  ENTRY_FEE: ENTRY_FEE.toString(),
  ENTRY_FEE_CELO: (Number(ENTRY_FEE) / 1e18).toFixed(2) + ' CELO',
  EXPECTED_VERSION: '3.9.0 - per-pool slot tracking + lifetime stats',
});

export interface PlayerSlot {
  wallet: `0x${string}`;
  hasSubmitted: boolean;
}

export interface PoolData {
  poolId: bigint;
  playerCount: number;
  players: `0x${string}`[];
  playerSlots: PlayerSlot[]; // Detailed player data including submission status
  isComplete: boolean;
  isFinalized: boolean;
}

export interface UserStatus {
  isVerified: boolean;
  slotsUsed: number;
  slotsAvailable: number;
  canJoin: boolean;
}

export interface PlayerData {
  wallet: `0x${string}`;
  fid: bigint;
  accuracy: number;
  hasPlayed: boolean;
}

export function useColorDropPool() {
  const { address, chain } = useAccount();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _connectedChainId = useChainId(); // Keep for potential future use
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [currentPoolData, setCurrentPoolData] = useState<PoolData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [poolPlayerCount, setPoolPlayerCount] = useState<number>(0);

  // Check if we need to switch chains
  const isWrongChain = chain && chain.id !== TARGET_CHAIN.id;

  // Log chain mismatch warnings
  useEffect(() => {
    if (isWrongChain) {
      console.warn('⚠️ Chain Mismatch:', {
        connectedChain: chain?.name,
        connectedChainId: chain?.id,
        targetChain: TARGET_CHAIN.name,
        targetChainId: TARGET_CHAIN.id,
        message: 'Will auto-switch when making a transaction'
      });
    }
  }, [chain, isWrongChain]);

  // Read current pool ID - always read from Celo regardless of connected chain
  const { data: currentPoolId, refetch: refetchPoolId, isLoading: isLoadingPoolId, error: poolIdError } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'currentPoolId',
    chainId: TARGET_CHAIN.id, // Explicitly read from Celo
  });

  // Read pool data - always read from Celo
  const { data: poolData, refetch: refetchPoolData, isLoading: isLoadingPoolData, error: poolDataError } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'pools',
    args: currentPoolId ? [currentPoolId] : undefined,
    chainId: TARGET_CHAIN.id, // Explicitly read from Celo
    query: {
      enabled: !!currentPoolId,
    },
  });

  // Read user status - always read from Celo
  const { data: userStatusData, refetch: refetchUserStatus, isLoading: isLoadingUserStatus, error: userStatusError } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'getUserStatus',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN.id, // Explicitly read from Celo
    query: {
      enabled: !!address,
    },
  });

  // DEBUG: Also read activePoolId directly to verify contract state
  const { data: activePoolIdForUser, refetch: refetchActivePoolId } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'activePoolId',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: !!address,
    },
  });

  // DEBUG: Read contract version to verify v3.5.0 is deployed
  const { data: contractVersion } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'version',
    chainId: TARGET_CHAIN.id,
  });

  // Debug: Log activePoolId directly from contract
  useEffect(() => {
    if (address) {
      console.log('📋 CONTRACT VERSION:', contractVersion);
      console.log('   → Expected: "3.9.0" (per-pool slot tracking + lifetime stats)');
      console.log('🔐 Direct activePoolId read for', address, ':', activePoolIdForUser?.toString());
      console.log('   → If activePoolId is NOT 0, then submitScore did NOT reset it');
      if (activePoolIdForUser && BigInt(activePoolIdForUser.toString()) !== BigInt(0)) {
        console.log('🚨 PROBLEM: activePoolId is still set! User cannot join new slot.');
        console.log('   → v3.5.0 should have reset this to 0 after submitScore()');
        console.log('   → Possible causes:');
        console.log('     1. Contract upgrade to v3.5.0 not completed');
        console.log('     2. Score was submitted BEFORE v3.5.0 upgrade');
        console.log('     3. Implementation address mismatch');
      }
    }
  }, [activePoolIdForUser, address, contractVersion]);

  // Read individual players using getPlayer - need to fetch each slot separately
  const playerContracts = currentPoolId && poolPlayerCount > 0
    ? Array.from({ length: poolPlayerCount }, (_, i) => ({
        address: POOL_ADDRESS,
        abi: ColorDropPoolABI.abi,
        functionName: 'getPlayer' as const,
        args: [currentPoolId, i] as const,
        chainId: TARGET_CHAIN.id,
      }))
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: playersData, refetch: refetchPlayers } = useReadContracts({
    contracts: playerContracts as any,
    query: {
      enabled: playerContracts.length > 0,
    },
  });

  // Log any read errors
  useEffect(() => {
    if (poolIdError) {
      console.error('❌ Failed to read currentPoolId:', poolIdError);
    }
    if (poolDataError) {
      console.error('❌ Failed to read pool data:', poolDataError);
    }
    if (userStatusError) {
      console.error('❌ Failed to read user status:', userStatusError);
    }
  }, [poolIdError, poolDataError, userStatusError]);

  // Write contract hook for joining pool
  const {
    writeContract: joinWriteContract,
    data: joinHash,
    isPending: isJoinPending,
    error: joinError
  } = useWriteContract();

  // Write contract hook for submitting score
  const {
    writeContract: scoreWriteContract,
    data: scoreHash,
    isPending: isScorePending,
    error: scoreError
  } = useWriteContract();

  // Wait for join transaction - explicitly specify Celo chain
  const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess, status: joinStatus, error: receiptError } =
    useWaitForTransactionReceipt({
      hash: joinHash,
      chainId: TARGET_CHAIN.id, // Explicitly query on Celo
      confirmations: 1,
      query: {
        refetchInterval: 2000, // Poll every 2 seconds
      },
    });

  // Debug: Log transaction receipt status
  useEffect(() => {
    if (joinHash) {
      console.log('🔄 Transaction receipt status:', {
        joinHash: joinHash.slice(0, 12) + '...',
        joinStatus,
        isJoinConfirming,
        isJoinSuccess,
        receiptError: receiptError?.message || null
      });
    }
  }, [joinHash, joinStatus, isJoinConfirming, isJoinSuccess, receiptError]);

  // Refetch data when transaction succeeds
  useEffect(() => {
    if (isJoinSuccess && joinHash) {
      console.log('✅ Join transaction confirmed! Hash:', joinHash);
      console.log('🔄 Triggering immediate refetch of poolData, userStatus, AND activePoolIdForUser...');
      // CRITICAL FIX: Also refetch activePoolIdForUser to avoid race condition
      // When user joins a pool, their activePoolId changes from 0 to the pool ID
      // We must refetch this BEFORE the game starts so submitScore has the correct pool ID
      Promise.all([
        refetchPoolData(),
        refetchUserStatus(),
        refetchActivePoolId()
      ]).then(() => {
        console.log('✅ All contract data refetch complete after join');
      });
    }
  }, [isJoinSuccess, joinHash, refetchPoolData, refetchUserStatus, refetchActivePoolId]);

  // Wait for score submission transaction
  const { isLoading: isScoreConfirming, isSuccess: isScoreSuccess } =
    useWaitForTransactionReceipt({
      hash: scoreHash,
      chainId: TARGET_CHAIN.id,
    });

  // Debug: Log score submission success and trigger refetch
  useEffect(() => {
    if (isScoreSuccess && scoreHash) {
      console.log('🎉 Score submission confirmed! Hash:', scoreHash);
      console.log('🔄 Triggering immediate refetch of userStatus and activePoolId...');
      // Force refetch user status and activePoolId immediately after score submission
      Promise.all([
        refetchUserStatus(),
        refetchActivePoolId()
      ]).then(() => {
        console.log('✅ userStatus and activePoolId refetch complete');
      });
    }
  }, [isScoreSuccess, scoreHash, refetchUserStatus, refetchActivePoolId]);

  // Update pool data when contract data changes
  useEffect(() => {
    console.log('🔍 Raw poolData from contract:', poolData);
    if (poolData && Array.isArray(poolData) && poolData.length >= 5) {
      // Note: Solidity auto-getter for pools mapping returns:
      // [id, playerCount, isActive, isCompleted, startTime, targetColor]
      // It does NOT return the players array - we need getPlayer() for that
      const [id, playerCount, isActive, isComplete, startTime, targetColor] = poolData;
      const count = Number(playerCount);
      console.log('📊 Parsed pool data:', {
        id: id?.toString(),
        playerCount: count,
        isActive,
        isComplete,
        startTime: Number(startTime),
        targetColor
      });
      // Set player count to trigger the players fetch
      setPoolPlayerCount(count);
      setCurrentPoolData({
        poolId: currentPoolId as bigint,
        playerCount: count,
        players: [], // Will be populated by separate getPlayer calls
        playerSlots: [], // Will be populated by separate getPlayer calls
        isComplete: isComplete as boolean,
        isFinalized: isComplete as boolean, // Using isComplete as isFinalized for now
      });
    }
  }, [poolData, currentPoolId]);

  // Update players array when individual player data is fetched
  useEffect(() => {
    if (playersData && playersData.length > 0 && currentPoolData) {
      const playerAddresses: `0x${string}`[] = [];
      const playerSlots: PlayerSlot[] = [];
      console.log('👥 Raw players data:', playersData);

      for (const playerResult of playersData) {
        if (playerResult.status === 'success' && playerResult.result) {
          // getPlayer returns: (wallet, fid, accuracy, timestamp, hasSubmitted)
          const [wallet, , , , hasSubmitted] = playerResult.result as [`0x${string}`, bigint, number, number, boolean];
          playerAddresses.push(wallet);
          playerSlots.push({ wallet, hasSubmitted });
          console.log('👤 Player:', { wallet, hasSubmitted });
        }
      }

      if (playerAddresses.length > 0) {
        console.log('📋 All player slots:', playerSlots);
        setCurrentPoolData(prev => prev ? {
          ...prev,
          players: playerAddresses,
          playerSlots: playerSlots,
        } : null);
      }
    }
  }, [playersData, currentPoolData?.poolId]);

  // Update user status
  useEffect(() => {
    console.log('📥 Raw userStatusData from contract:', userStatusData);
    if (userStatusData && Array.isArray(userStatusData) && userStatusData.length >= 4) {
      const [isVerified, slotsUsed, slotsAvailable, canJoin] = userStatusData;
      const newStatus = {
        isVerified: isVerified as boolean,
        slotsUsed: Number(slotsUsed),
        slotsAvailable: Number(slotsAvailable),
        canJoin: canJoin as boolean,
      };
      console.log('✨ Parsed userStatus update:', {
        isVerified: newStatus.isVerified,
        slotsUsed: newStatus.slotsUsed,
        slotsAvailable: newStatus.slotsAvailable,
        canJoin: newStatus.canJoin,
        timestamp: new Date().toISOString()
      });
      setUserStatus(newStatus);
    }
  }, [userStatusData]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPoolId();
      refetchPoolData();
      refetchUserStatus();
      if (poolPlayerCount > 0) {
        refetchPlayers();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [refetchPoolId, refetchPoolData, refetchUserStatus, refetchPlayers, poolPlayerCount]);

  // Join pool function
  const joinPool = useCallback(async (fid: bigint) => {
    if (!address) throw new Error('Wallet not connected');

    console.log('💰 Initiating joinPool transaction:', {
      address: POOL_ADDRESS,
      functionName: 'joinPool',
      chain: TARGET_CHAIN.name,
      chainId: TARGET_CHAIN.id,
      connectedChain: chain?.name,
      connectedChainId: chain?.id,
      fid: fid.toString(),
      value: ENTRY_FEE.toString(),
      entryFeeETH: (Number(ENTRY_FEE) / 1e18).toFixed(2) + ' CELO',
    });

    // CRITICAL: Ensure we're on the correct chain before transacting
    // This must complete before sending the transaction
    if (chain?.id !== TARGET_CHAIN.id) {
      console.log('🔄 Chain mismatch detected, forcing switch to Celo...');
      try {
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
        console.log('✅ Chain switched to Celo, proceeding with transaction');
        // Small delay to ensure wallet state is updated
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ User rejected chain switch or switch failed:', error);
        throw new Error(`Please switch to ${TARGET_CHAIN.name} network to continue`);
      }
    }

    joinWriteContract({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'joinPool',
      args: [fid],
      value: ENTRY_FEE,
      chainId: TARGET_CHAIN.id,
    });
  }, [address, chain, joinWriteContract, switchChainAsync]);

  // Submit score function
  const submitScore = useCallback(async (accuracy: number) => {
    if (!address) throw new Error('Wallet not connected');

    // CRITICAL FIX: Use the user's activePoolId instead of currentPoolId
    // When a pool fills up, currentPoolId advances to the next pool,
    // but the user's score should go to the pool they joined (their activePoolId)
    let poolIdToSubmit: bigint | undefined = activePoolIdForUser as bigint | undefined;

    // RACE CONDITION FIX: If activePoolIdForUser is 0, force a refetch and retry
    // This can happen if the game started before the refetch completed after joinPool
    if (!poolIdToSubmit || poolIdToSubmit === BigInt(0)) {
      console.log('⚠️ activePoolIdForUser is 0, attempting forced refetch...');

      // Force refetch and wait for it
      const refetchResult = await refetchActivePoolId();
      const newPoolId = refetchResult.data as bigint | undefined;

      console.log('🔄 Refetch result:', {
        newPoolId: newPoolId?.toString(),
        previousPoolId: (activePoolIdForUser as bigint | undefined)?.toString()
      });

      if (newPoolId && newPoolId !== BigInt(0)) {
        poolIdToSubmit = newPoolId;
        console.log('✅ Got valid poolId after refetch:', poolIdToSubmit.toString());
      } else {
        // Still no valid poolId - this is a real error
        console.error('❌ No active pool for user even after refetch:', {
          activePoolIdForUser: (activePoolIdForUser as bigint | undefined)?.toString(),
          refetchedPoolId: newPoolId?.toString(),
          currentPoolId: currentPoolId?.toString(),
          address
        });
        throw new Error('No active pool for user - you may have already submitted your score');
      }
    }

    // CRITICAL: Ensure we're on the correct chain before transacting
    if (chain?.id !== TARGET_CHAIN.id) {
      console.log('🔄 Chain mismatch detected, forcing switch to Celo...');
      try {
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
        console.log('✅ Chain switched to Celo, proceeding with transaction');
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ User rejected chain switch or switch failed:', error);
        throw new Error(`Please switch to ${TARGET_CHAIN.name} network to continue`);
      }
    }

    // Convert accuracy percentage (0-100) to uint16 with 2 decimal precision
    // Example: 95.67% becomes 9567
    const scoreValue = Math.round(accuracy * 100);

    console.log('📊 Submitting score:', {
      poolId: poolIdToSubmit.toString(),
      currentPoolId: currentPoolId?.toString(),
      activePoolIdForUser: activePoolIdForUser?.toString(),
      accuracy: accuracy,
      scoreValue: scoreValue,
      contractAddress: POOL_ADDRESS,
      chainId: TARGET_CHAIN.id,
      note: 'Using activePoolIdForUser (the pool user joined) instead of currentPoolId'
    });

    try {
      scoreWriteContract({
        address: POOL_ADDRESS,
        abi: ColorDropPoolABI.abi,
        functionName: 'submitScore',
        args: [poolIdToSubmit, scoreValue], // Contract expects: submitScore(uint256 poolId, uint16 accuracy)
        chainId: TARGET_CHAIN.id,
      });
      console.log('📝 Score write contract called successfully');
    } catch (err) {
      console.error('❌ Error calling scoreWriteContract:', err);
      throw err;
    }
  }, [address, chain, currentPoolId, activePoolIdForUser, scoreWriteContract, switchChainAsync, refetchActivePoolId]);

  // Check if slot limit reached
  const hasReachedSlotLimit = useCallback(() => {
    if (!userStatus) return false;
    return !userStatus.canJoin && userStatus.slotsUsed >= userStatus.slotsAvailable;
  }, [userStatus]);

  // Switch to correct chain function (for UI button)
  const switchToCorrectChain = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: TARGET_CHAIN.id });
      console.log('✅ Switched to', TARGET_CHAIN.name);
    } catch (error) {
      console.error('❌ Failed to switch chain:', error);
      throw error;
    }
  }, [switchChainAsync]);

  // Get leaderboard data for a pool
  const getLeaderboard = useCallback(async (poolId: bigint): Promise<PlayerData[]> => {
    if (!currentPoolData) return [];

    const players: PlayerData[] = [];

    try {
      // Fetch all players using multicall
      for (let i = 0; i < currentPoolData.playerCount; i++) {
        // TODO: This should use multicall for better performance
        // For now, we'll return empty array and handle in the component
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }

    return players;
  }, [currentPoolData]);

  return {
    // Pool data
    currentPoolId,
    poolData: currentPoolData,

    // User status
    userStatus,
    hasReachedSlotLimit: hasReachedSlotLimit(),
    activePoolIdForUser, // The pool the user is currently in (for score submission)

    // Chain status
    isWrongChain,
    isSwitchingChain,
    targetChain: TARGET_CHAIN,
    connectedChain: chain,
    switchToCorrectChain,

    // Loading states
    isLoading: isLoadingPoolId || isLoadingPoolData || isLoadingUserStatus,
    isLoadingPoolId,
    isLoadingPoolData,
    isLoadingUserStatus,

    // Read errors
    poolIdError,
    poolDataError,
    userStatusError,

    // Actions
    joinPool,
    submitScore,
    getLeaderboard,

    // Join transaction states
    isJoinPending,
    isJoinConfirming,
    isJoinSuccess,
    joinError,
    joinHash,

    // Score transaction states
    isScorePending,
    isScoreConfirming,
    isScoreSuccess,
    scoreError,

    // Manual refresh
    refetch: () => {
      refetchPoolId();
      refetchPoolData();
      refetchUserStatus();
      refetchPlayers();
      refetchActivePoolId();
    },
  };
}
