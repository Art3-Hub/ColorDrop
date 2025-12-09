'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import ColorDropPoolABI from '@/contracts/ColorDropPool.json';

const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS as `0x${string}`;
const ENTRY_FEE = parseEther(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.3');
const POLL_INTERVAL = 2000; // 2 seconds

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

export function useColorDropPool() {
  const { address } = useAccount();
  const [currentPoolData, setCurrentPoolData] = useState<PoolData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  // Read current pool ID
  const { data: currentPoolId, refetch: refetchPoolId } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'currentPoolId',
  });

  // Read pool data
  const { data: poolData, refetch: refetchPoolData } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'pools',
    args: currentPoolId ? [currentPoolId] : undefined,
    query: {
      enabled: !!currentPoolId,
    },
  });

  // Read user status
  const { data: userStatusData, refetch: refetchUserStatus } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'getUserStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

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
  const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess } =
    useWaitForTransactionReceipt({
      hash: joinHash,
    });

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

    joinWriteContract({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'joinPool',
      args: [fid],
      value: ENTRY_FEE,
    });
  }, [address, joinWriteContract]);

  // Submit score function
  const submitScore = useCallback(async (accuracy: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (!currentPoolId) throw new Error('No active pool');

    // Convert accuracy percentage (0-100) to uint256 with 2 decimal precision
    // Example: 95.67% becomes 9567
    const scoreValue = Math.round(accuracy * 100);

    scoreWriteContract({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'submitScore',
      args: [BigInt(scoreValue)],
    });
  }, [address, currentPoolId, scoreWriteContract]);

  // Check if slot limit reached
  const hasReachedSlotLimit = useCallback(() => {
    if (!userStatus) return false;
    return !userStatus.canJoin && userStatus.slotsUsed >= userStatus.slotsAvailable;
  }, [userStatus]);

  return {
    // Pool data
    currentPoolId,
    poolData: currentPoolData,

    // User status
    userStatus,
    hasReachedSlotLimit: hasReachedSlotLimit(),

    // Actions
    joinPool,
    submitScore,

    // Join transaction states
    isJoinPending,
    isJoinConfirming,
    isJoinSuccess,
    joinError,

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
