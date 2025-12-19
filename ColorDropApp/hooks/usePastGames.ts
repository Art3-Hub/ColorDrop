'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { celo } from 'wagmi/chains';
import ColorDropPoolABI from '@/contracts/ColorDropPool.json';

const POOL_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET as `0x${string}`;
const TARGET_CHAIN = celo;
const FINALIZATION_TIMEOUT = 2 * 60; // 2 minutes in seconds

export interface Winner {
  address: `0x${string}`;
  fid: bigint;
  accuracy: number; // 0-100 percentage
  prize: number; // in CELO
  rank: 1 | 2 | 3;
  claimed?: boolean;
}

export interface CompletedPool {
  poolId: bigint;
  playerCount: number;
  isCompleted: boolean;
  startTime: number;
  winners: Winner[];
}

// Pool that's full but not yet finalized (needs someone to call finalizePool)
export interface PendingFinalizationPool {
  poolId: bigint;
  playerCount: number;
  startTime: number;
  canFinalize: boolean; // true if timeout has passed
}

export interface UserPrize {
  poolId: bigint;
  rank: number;
  amount: number;
  claimed: boolean;
}

const PRIZE_AMOUNTS = {
  1: 0.45,  // 1st place
  2: 0.225, // 2nd place
  3: 0.075, // 3rd place
};

export function usePastGames(limit: number = 10) {
  const { address } = useAccount();
  const [completedPools, setCompletedPools] = useState<CompletedPool[]>([]);
  const [pendingFinalizationPools, setPendingFinalizationPools] = useState<PendingFinalizationPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim prize write contract
  const {
    writeContract: claimWriteContract,
    data: claimHash,
    isPending: isClaimPending,
    error: claimError,
  } = useWriteContract();

  // Finalize pool write contract
  const {
    writeContract: finalizeWriteContract,
    data: finalizeHash,
    isPending: isFinalizePending,
    error: finalizeError,
  } = useWriteContract();

  // Wait for claim transaction
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
    chainId: TARGET_CHAIN.id,
  });

  // Wait for finalize transaction
  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeSuccess } = useWaitForTransactionReceipt({
    hash: finalizeHash,
    chainId: TARGET_CHAIN.id,
  });

  // Get current pool ID to know the range
  const { data: currentPoolId } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'currentPoolId',
    chainId: TARGET_CHAIN.id,
  });

  // Calculate which pools to fetch (completed pools are poolId < currentPoolId)
  // IMPORTANT: Memoize this to prevent infinite re-renders in useEffect
  const poolIdsToFetch = useMemo(() => {
    if (!currentPoolId) return [];
    return Array.from(
      { length: Math.min(Number(currentPoolId) - 1, limit) },
      (_, i) => BigInt(Number(currentPoolId) - 1 - i)
    ).filter(id => id > BigInt(0));
  }, [currentPoolId, limit]);

  // Create contracts array for batch reading pool data
  // Memoize to prevent unnecessary re-renders
  const poolContracts = useMemo(() =>
    poolIdsToFetch.map(poolId => ({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'getPool' as const,
      args: [poolId] as const,
      chainId: TARGET_CHAIN.id,
    })),
    [poolIdsToFetch]
  );

  // Batch read pool data
  const { data: poolsData, isLoading: isLoadingPools, refetch: refetchPools } = useReadContracts({
    contracts: poolContracts as any,
    query: {
      enabled: poolContracts.length > 0,
    },
  });

  // Create contracts for fetching players of completed pools AND pools needing finalization
  // Memoize to prevent infinite re-renders
  const playerContractsFlat = useMemo(() => {
    const contracts: Array<{
      address: `0x${string}`;
      abi: typeof ColorDropPoolABI.abi;
      functionName: 'getPlayer';
      args: readonly [bigint, number];
      chainId: number;
      poolId: bigint;
      playerIndex: number;
    }> = [];

    if (poolsData) {
      poolsData.forEach((poolResult, poolIndex) => {
        if (poolResult.status === 'success' && poolResult.result) {
          const [, playerCount, isPoolFull, isCompleted] = poolResult.result as [bigint, number, boolean, boolean, number, string];
          const poolId = poolIdsToFetch[poolIndex];

          // Fetch players for completed pools OR full pools that need finalization
          if ((isCompleted || isPoolFull) && playerCount > 0) {
            // Fetch all players for this pool
            for (let i = 0; i < Math.min(playerCount, 9); i++) {
              contracts.push({
                address: POOL_ADDRESS,
                abi: ColorDropPoolABI.abi,
                functionName: 'getPlayer',
                args: [poolId, i] as const,
                chainId: TARGET_CHAIN.id,
                poolId,
                playerIndex: i,
              });
            }
          }
        }
      });
    }

    return contracts;
  }, [poolsData, poolIdsToFetch]);

  // Batch read player data
  const { data: playersData, isLoading: isLoadingPlayers } = useReadContracts({
    contracts: playerContractsFlat.map(({ address, abi, functionName, args, chainId }) => ({
      address,
      abi,
      functionName,
      args,
      chainId,
    })) as any,
    query: {
      enabled: playerContractsFlat.length > 0,
    },
  });

  // Process pools and players data
  useEffect(() => {
    if (!poolsData || isLoadingPools || isLoadingPlayers) {
      return;
    }

    try {
      const pools: CompletedPool[] = [];
      const pendingPools: PendingFinalizationPool[] = [];
      let playerDataIndex = 0;
      const currentTime = Math.floor(Date.now() / 1000);

      poolsData.forEach((poolResult, poolIndex) => {
        if (poolResult.status === 'success' && poolResult.result) {
          const [id, playerCount, isPoolFull, isCompleted, startTime] = poolResult.result as [bigint, number, boolean, boolean, number, string];
          const poolId = poolIdsToFetch[poolIndex];
          const startTimeNum = Number(startTime);

          if (isCompleted) {
            // Collect all players for this completed pool
            const players: Array<{
              address: `0x${string}`;
              fid: bigint;
              accuracy: number;
              timestamp: number;
            }> = [];

            const numPlayers = Math.min(playerCount, 9);
            for (let i = 0; i < numPlayers; i++) {
              if (playersData && playersData[playerDataIndex]) {
                const playerResult = playersData[playerDataIndex];
                if (playerResult.status === 'success' && playerResult.result) {
                  const [wallet, fid, accuracy, timestamp, hasSubmitted] = playerResult.result as [
                    `0x${string}`,
                    bigint,
                    number,
                    number,
                    boolean
                  ];
                  if (hasSubmitted) {
                    players.push({
                      address: wallet,
                      fid,
                      accuracy: accuracy / 100, // Convert from basis points (9580 -> 95.80)
                      timestamp,
                    });
                  }
                }
                playerDataIndex++;
              }
            }

            // Sort players by accuracy (descending) then by timestamp (ascending for tiebreaker)
            players.sort((a, b) => {
              if (b.accuracy !== a.accuracy) {
                return b.accuracy - a.accuracy;
              }
              return a.timestamp - b.timestamp;
            });

            // Get top 3 winners
            const winners: Winner[] = players.slice(0, 3).map((player, index) => ({
              address: player.address,
              fid: player.fid,
              accuracy: player.accuracy,
              prize: PRIZE_AMOUNTS[(index + 1) as 1 | 2 | 3],
              rank: (index + 1) as 1 | 2 | 3,
            }));

            pools.push({
              poolId: id || poolId,
              playerCount,
              isCompleted,
              startTime: startTimeNum,
              winners,
            });
          } else if (isPoolFull && !isCompleted) {
            // Pool is full but not completed - needs finalization
            // Check if timeout has passed
            const canFinalize = currentTime > startTimeNum + FINALIZATION_TIMEOUT;

            pendingPools.push({
              poolId: id || poolId,
              playerCount,
              startTime: startTimeNum,
              canFinalize,
            });

            // Still need to skip player data
            playerDataIndex += Math.min(playerCount, 9);
          } else {
            // Skip non-completed, non-full pools' player data (shouldn't have any)
            // but just in case
          }
        }
      });

      // Sort by pool ID descending (most recent first)
      pools.sort((a, b) => Number(b.poolId) - Number(a.poolId));
      pendingPools.sort((a, b) => Number(b.poolId) - Number(a.poolId));

      setCompletedPools(pools);
      setPendingFinalizationPools(pendingPools);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error processing past games:', err);
      setError('Failed to load past games');
      setIsLoading(false);
    }
  }, [poolsData, playersData, isLoadingPools, isLoadingPlayers, poolIdsToFetch]);

  // Set loading state
  useEffect(() => {
    setIsLoading(isLoadingPools || isLoadingPlayers);
  }, [isLoadingPools, isLoadingPlayers]);

  // Refetch after successful claim
  useEffect(() => {
    if (isClaimSuccess) {
      refetchPools();
    }
  }, [isClaimSuccess, refetchPools]);

  // Refetch after successful finalization
  useEffect(() => {
    if (isFinalizeSuccess) {
      console.log('✅ Finalization successful!');
      refetchPools();
    }
  }, [isFinalizeSuccess, refetchPools]);

  // Log finalize errors (only when error occurs)
  useEffect(() => {
    if (finalizeError) {
      console.error('❌ Finalize error:', finalizeError);
    }
  }, [finalizeError]);

  // Log finalize transaction hash (only when hash is set)
  useEffect(() => {
    if (finalizeHash) {
      console.log('📝 Finalize transaction hash:', finalizeHash);
    }
  }, [finalizeHash]);

  const refetch = useCallback(() => {
    refetchPools();
  }, [refetchPools]);

  // Claim prize function
  const claimPrize = useCallback((poolId: bigint) => {
    claimWriteContract({
      address: POOL_ADDRESS,
      abi: ColorDropPoolABI.abi,
      functionName: 'claimPrize',
      args: [poolId],
      chainId: TARGET_CHAIN.id,
    });
  }, [claimWriteContract]);

  // Finalize pool function - can be called by anyone after timeout
  const finalizePool = useCallback((poolId: bigint) => {
    console.log('🏁 finalizePool called with poolId:', poolId.toString());
    console.log('🏁 POOL_ADDRESS:', POOL_ADDRESS);
    console.log('🏁 TARGET_CHAIN.id:', TARGET_CHAIN.id);

    try {
      finalizeWriteContract({
        address: POOL_ADDRESS,
        abi: ColorDropPoolABI.abi,
        functionName: 'finalizePool',
        args: [poolId],
        chainId: TARGET_CHAIN.id,
      });
      console.log('🏁 finalizeWriteContract called successfully');
    } catch (error) {
      console.error('🏁 finalizeWriteContract error:', error);
    }
  }, [finalizeWriteContract]);

  // Find user's unclaimed prizes - memoized to prevent infinite re-renders
  const userPrizes = useMemo((): UserPrize[] => {
    if (!address) return [];

    const prizes: UserPrize[] = [];
    completedPools.forEach(pool => {
      pool.winners.forEach(winner => {
        if (winner.address.toLowerCase() === address.toLowerCase() && !winner.claimed) {
          prizes.push({
            poolId: pool.poolId,
            rank: winner.rank,
            amount: winner.prize,
            claimed: winner.claimed || false,
          });
        }
      });
    });
    return prizes;
  }, [address, completedPools]);

  return {
    completedPools,
    pendingFinalizationPools,
    userPrizes,
    isLoading,
    error,
    currentPoolId,
    refetch,
    // Claim functions
    claimPrize,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,
    claimError,
    claimHash,
    // Finalize functions
    finalizePool,
    isFinalizePending,
    isFinalizeConfirming,
    isFinalizeSuccess,
    finalizeError,
    finalizeHash,
  };
}
