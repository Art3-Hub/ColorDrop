'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
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
});

export interface PoolData {
  poolId: bigint;
  playerCount: number;
  players: `0x${string}`[];
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

  // Track transaction hash to detect new successful transactions
  const [lastSuccessfulJoinHash, setLastSuccessfulJoinHash] = useState<string | null>(null);

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

  // Wait for join transaction
  const { isLoading: isJoinConfirming, isSuccess: isJoinSuccessRaw } =
    useWaitForTransactionReceipt({
      hash: joinHash,
    });

  // Detect NEW successful transactions (not stale success from previous tx)
  const isJoinSuccess = isJoinSuccessRaw && joinHash && joinHash !== lastSuccessfulJoinHash;

  // Track when a transaction succeeds so we don't re-trigger
  useEffect(() => {
    if (isJoinSuccessRaw && joinHash && joinHash !== lastSuccessfulJoinHash) {
      console.log('✅ Join transaction confirmed! Hash:', joinHash);
      setLastSuccessfulJoinHash(joinHash);
      // Refetch pool data after successful join
      refetchPoolData();
      refetchUserStatus();
    }
  }, [isJoinSuccessRaw, joinHash, lastSuccessfulJoinHash, refetchPoolData, refetchUserStatus]);

  // Wait for score submission transaction
  const { isLoading: isScoreConfirming, isSuccess: isScoreSuccess } =
    useWaitForTransactionReceipt({
      hash: scoreHash,
    });

  // Update pool data when contract data changes
  useEffect(() => {
    if (poolData && Array.isArray(poolData) && poolData.length >= 5) {
      const [players, , playerCount, isComplete, isFinalized] = poolData;
      setCurrentPoolData({
        poolId: currentPoolId as bigint,
        playerCount: Number(playerCount),
        players: players as `0x${string}`[],
        isComplete: isComplete as boolean,
        isFinalized: isFinalized as boolean,
      });
    }
  }, [poolData, currentPoolId]);

  // Update user status
  useEffect(() => {
    if (userStatusData && Array.isArray(userStatusData) && userStatusData.length >= 4) {
      const [isVerified, slotsUsed, slotsAvailable, canJoin] = userStatusData;
      setUserStatus({
        isVerified: isVerified as boolean,
        slotsUsed: Number(slotsUsed),
        slotsAvailable: Number(slotsAvailable),
        canJoin: canJoin as boolean,
      });
    }
  }, [userStatusData]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPoolId();
      refetchPoolData();
      refetchUserStatus();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [refetchPoolId, refetchPoolData, refetchUserStatus]);

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
    if (!currentPoolId) throw new Error('No active pool');

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

    // Convert accuracy percentage (0-100) to uint256 with 2 decimal precision
    // Example: 95.67% becomes 9567
    const scoreValue = Math.round(accuracy * 100);

    scoreWriteContract({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'submitScore',
      args: [BigInt(scoreValue)],
      chainId: TARGET_CHAIN.id,
    });
  }, [address, chain, currentPoolId, scoreWriteContract, switchChainAsync]);

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
    },
  };
}
