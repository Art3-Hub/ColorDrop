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
  isClaimable?: boolean; // true if winner is recorded in contract (v3.6.0+)
}

export interface CompletedPool {
  poolId: bigint;
  playerCount: number;
  isCompleted: boolean;
  startTime: number;
  winners: Winner[];
  hasClaimablePrizes: boolean; // true if pool has winners recorded in contract (v3.6.0+)
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
  1: 0.70,  // 1st place (43.75% of 1.6 CELO pool = 7× entry)
  2: 0.50,  // 2nd place (31.25% of pool = 5× entry)
  3: 0.25,  // 3rd place (15.625% of pool = 2.5× entry)
};

export function usePastGames(limit: number = 10) {
  const { address } = useAccount();
  const [completedPools, setCompletedPools] = useState<CompletedPool[]>([]);
  const [pendingFinalizationPools, setPendingFinalizationPools] = useState<PendingFinalizationPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim all prizes state
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimAllProgress, setClaimAllProgress] = useState<{
    current: number;
    total: number;
    currentPoolId: bigint | null;
    claimedPrizes: Array<{ poolId: bigint; rank: number; amount: number }>;
    failedPrizes: Array<{ poolId: bigint; error: string }>;
  } | null>(null);

  // Claim prize write contract
  const {
    writeContract: claimWriteContract,
    writeContractAsync: claimWriteContractAsync,
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
  const { data: currentPoolId, error: currentPoolIdError } = useReadContract({
    address: POOL_ADDRESS,
    abi: ColorDropPoolABI.abi,
    functionName: 'currentPoolId',
    chainId: TARGET_CHAIN.id,
  });

  // DEBUG: Log currentPoolId
  useEffect(() => {
    console.log('📊 [usePastGames] Contract Address:', POOL_ADDRESS);
    console.log('📊 [usePastGames] Current Pool ID:', currentPoolId?.toString());
    if (currentPoolIdError) {
      console.error('📊 [usePastGames] Error fetching currentPoolId:', currentPoolIdError);
    }
  }, [currentPoolId, currentPoolIdError]);

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
  const { data: poolsData, isLoading: isLoadingPools, refetch: refetchPools, error: poolsDataError } = useReadContracts({
    contracts: poolContracts as any,
    query: {
      enabled: poolContracts.length > 0,
      refetchInterval: false, // Don't auto-refetch, we'll handle it manually
    },
  });

  // DEBUG: Log pools data
  useEffect(() => {
    console.log('📊 [usePastGames] Pool IDs to fetch:', poolIdsToFetch.map(id => id.toString()));
    console.log('📊 [usePastGames] Pools Data:', poolsData);
    if (poolsDataError) {
      console.error('📊 [usePastGames] Error fetching pools:', poolsDataError);
    }
    if (poolsData) {
      poolsData.forEach((result, idx) => {
        console.log(`📊 [usePastGames] Pool ${poolIdsToFetch[idx]?.toString()}:`, {
          status: result.status,
          result: result.result,
          error: result.error,
        });
      });
    }
  }, [poolsData, poolsDataError, poolIdsToFetch]);

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
          // v4.0.0 getPool returns: (id, playerCount, isActive, isCompleted, startTime, targetColor)
          const [, playerCount, _isActive, isCompleted] = poolResult.result as [bigint, number, boolean, boolean, number, string];
          const poolId = poolIdsToFetch[poolIndex];
          // Pool is "full" if it has reached max players (9) - check by playerCount
          const isPoolFull = playerCount >= 9;
          void _isActive; // Mark as intentionally unused

          // Fetch players for completed pools OR full pools that need finalization
          if ((isCompleted || isPoolFull) && playerCount > 0) {
            // Fetch all players for this pool
            for (let i = 0; i < Math.min(playerCount, 16); i++) {
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

  // Create contracts for fetching pool winners (to check if prizes are claimable)
  // This verifies if winners are recorded in the contract (v3.6.0+)
  const poolWinnersContracts = useMemo(() => {
    if (!poolsData) return [];

    const contracts: Array<{
      address: `0x${string}`;
      abi: typeof ColorDropPoolABI.abi;
      functionName: 'getPoolWinners';
      args: readonly [bigint];
      chainId: number;
      poolId: bigint;
    }> = [];

    poolsData.forEach((poolResult, poolIndex) => {
      if (poolResult.status === 'success' && poolResult.result) {
        // v4.0.0 getPool returns: (id, playerCount, isActive, isCompleted, startTime, targetColor)
        const [, , , isCompleted] = poolResult.result as [bigint, number, boolean, boolean, number, string];
        const poolId = poolIdsToFetch[poolIndex];

        if (isCompleted) {
          contracts.push({
            address: POOL_ADDRESS,
            abi: ColorDropPoolABI.abi,
            functionName: 'getPoolWinners',
            args: [poolId] as const,
            chainId: TARGET_CHAIN.id,
            poolId,
          });
        }
      }
    });

    return contracts;
  }, [poolsData, poolIdsToFetch]);

  // Batch read pool winners data (v3.6.0+ claimable prizes)
  const { data: poolWinnersData, isLoading: isLoadingWinners, refetch: refetchPoolWinners } = useReadContracts({
    contracts: poolWinnersContracts.map(({ address, abi, functionName, args, chainId }) => ({
      address,
      abi,
      functionName,
      args,
      chainId,
    })) as any,
    query: {
      enabled: poolWinnersContracts.length > 0,
      refetchInterval: false, // Don't auto-refetch, we'll handle it manually
    },
  });

  // Process pools and players data
  useEffect(() => {
    if (!poolsData || isLoadingPools || isLoadingPlayers || isLoadingWinners) {
      return;
    }

    try {
      const pools: CompletedPool[] = [];
      const pendingPools: PendingFinalizationPool[] = [];
      let playerDataIndex = 0;
      let winnersDataIndex = 0;
      const currentTime = Math.floor(Date.now() / 1000);

      // Build a map of pool winners from contract data (v3.6.0+)
      const contractWinnersMap = new Map<string, {
        winners: [`0x${string}`, `0x${string}`, `0x${string}`];
        claimed: [boolean, boolean, boolean];
      }>();

      if (poolWinnersData && poolWinnersContracts) {
        poolWinnersContracts.forEach((contract, index) => {
          if (poolWinnersData[index]?.status === 'success' && poolWinnersData[index]?.result) {
            const [winners, claimed] = poolWinnersData[index].result as [
              [`0x${string}`, `0x${string}`, `0x${string}`],
              [boolean, boolean, boolean]
            ];
            contractWinnersMap.set(contract.poolId.toString(), { winners, claimed });
          }
        });
      }

      poolsData.forEach((poolResult, poolIndex) => {
        if (poolResult.status === 'success' && poolResult.result) {
          // v4.0.0 getPool returns: (id, playerCount, isActive, isCompleted, startTime, targetColor)
          const [id, playerCount, _isActive2, isCompleted, startTime] = poolResult.result as [bigint, number, boolean, boolean, number, string];
          const poolId = poolIdsToFetch[poolIndex];
          const startTimeNum = Number(startTime);
          // Pool is "full" if it has reached max players (9) - check by playerCount
          const isPoolFull = playerCount >= 9;
          void _isActive2; // Mark as intentionally unused

          if (isCompleted) {
            // Collect all players for this completed pool
            const players: Array<{
              address: `0x${string}`;
              fid: bigint;
              accuracy: number;
              timestamp: number;
            }> = [];

            const numPlayers = Math.min(playerCount, 16);
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

            // Check if this pool has winners recorded in contract (v3.6.0+)
            const contractWinners = contractWinnersMap.get(poolId.toString());
            const hasClaimablePrizes = contractWinners
              ? contractWinners.winners.some(w => w !== '0x0000000000000000000000000000000000000000')
              : false;

            // Create a map of player data by address for quick lookup
            const playerDataByAddress = new Map<string, { fid: bigint; accuracy: number }>();
            players.forEach(p => {
              const addrLower = p.address.toLowerCase();
              // If same address appears multiple times, keep the highest accuracy
              const existing = playerDataByAddress.get(addrLower);
              if (!existing || p.accuracy > existing.accuracy) {
                playerDataByAddress.set(addrLower, { fid: p.fid, accuracy: p.accuracy });
              }
            });

            // Build winners list based on CONTRACT data (source of truth for claiming)
            // This ensures the UI shows exactly what the contract says can be claimed
            let winners: Winner[] = [];

            if (hasClaimablePrizes && contractWinners) {
              // Use contract winners directly - these are the addresses that can claim
              for (let i = 0; i < 3; i++) {
                const winnerAddress = contractWinners.winners[i];
                if (winnerAddress && winnerAddress !== '0x0000000000000000000000000000000000000000') {
                  const rank = (i + 1) as 1 | 2 | 3;
                  const winnerAddrLower = winnerAddress.toLowerCase();
                  const playerData = playerDataByAddress.get(winnerAddrLower);

                  winners.push({
                    address: winnerAddress,
                    fid: playerData?.fid || BigInt(0),
                    accuracy: playerData?.accuracy || 0,
                    prize: PRIZE_AMOUNTS[rank],
                    rank,
                    claimed: contractWinners.claimed[i],
                    isClaimable: true, // Contract winners are always claimable (if not claimed)
                  });

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[usePastGames] Pool ${poolId} Winner ${rank}:`, {
                      address: winnerAddress,
                      claimed: contractWinners.claimed[i],
                      accuracy: playerData?.accuracy,
                    });
                  }
                }
              }
            } else {
              // Legacy pool (pre-v3.6.0) - show top 3 by accuracy for display only
              // These pools had prizes auto-distributed, no claiming needed
              players.sort((a, b) => {
                if (b.accuracy !== a.accuracy) {
                  return b.accuracy - a.accuracy;
                }
                return a.timestamp - b.timestamp;
              });

              winners = players.slice(0, 3).map((player, index) => ({
                address: player.address,
                fid: player.fid,
                accuracy: player.accuracy,
                prize: PRIZE_AMOUNTS[(index + 1) as 1 | 2 | 3],
                rank: (index + 1) as 1 | 2 | 3,
                claimed: true, // Legacy pools are considered already distributed
                isClaimable: false,
              }));
            }

            winnersDataIndex++;

            pools.push({
              poolId: id || poolId,
              playerCount,
              isCompleted,
              startTime: startTimeNum,
              winners,
              hasClaimablePrizes,
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
            playerDataIndex += Math.min(playerCount, 16);
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
  }, [poolsData, playersData, poolWinnersData, poolWinnersContracts, isLoadingPools, isLoadingPlayers, isLoadingWinners, poolIdsToFetch]);

  // Set loading state
  useEffect(() => {
    setIsLoading(isLoadingPools || isLoadingPlayers || isLoadingWinners);
  }, [isLoadingPools, isLoadingPlayers, isLoadingWinners]);

  // Refetch after successful claim - refetch all data to update claim status
  useEffect(() => {
    if (isClaimSuccess) {
      console.log('✅ Claim successful! Refetching all data...');
      // Refetch both pools and winners data to update claim status
      refetchPools();
      // Small delay to ensure blockchain state is updated before refetching winners
      setTimeout(() => {
        refetchPoolWinners();
      }, 1000);
    }
  }, [isClaimSuccess, refetchPools, refetchPoolWinners]);

  // Refetch after successful finalization - refetch all data to update pool state
  useEffect(() => {
    if (isFinalizeSuccess) {
      console.log('✅ Finalization successful! Refetching all data...');
      refetchPools();
      // Small delay to ensure blockchain state is updated before refetching winners
      setTimeout(() => {
        refetchPoolWinners();
      }, 1000);
    }
  }, [isFinalizeSuccess, refetchPools, refetchPoolWinners]);

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

  // Comprehensive refetch function that refreshes all data including claim status
  const refetch = useCallback(() => {
    console.log('🔄 Refetching all past games data...');
    refetchPools();
    // Delay winner refetch slightly to ensure pools data is processed first
    setTimeout(() => {
      refetchPoolWinners();
    }, 500);
  }, [refetchPools, refetchPoolWinners]);

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

  // Claim all prizes function - claims multiple prizes sequentially
  const claimAllPrizes = useCallback(async () => {
    if (isClaimingAll) return;
    if (!address) return;

    // Get all unclaimed prizes
    const unclaimedPrizes: Array<{ poolId: bigint; rank: number; amount: number }> = [];
    completedPools.forEach(pool => {
      pool.winners.forEach(winner => {
        if (
          winner.address.toLowerCase() === address.toLowerCase() &&
          !winner.claimed &&
          winner.isClaimable
        ) {
          unclaimedPrizes.push({
            poolId: pool.poolId,
            rank: winner.rank,
            amount: winner.prize,
          });
        }
      });
    });

    if (unclaimedPrizes.length === 0) return;

    setIsClaimingAll(true);
    setClaimAllProgress({
      current: 0,
      total: unclaimedPrizes.length,
      currentPoolId: null,
      claimedPrizes: [],
      failedPrizes: [],
    });

    const claimedPrizes: Array<{ poolId: bigint; rank: number; amount: number }> = [];
    const failedPrizes: Array<{ poolId: bigint; error: string }> = [];

    for (let i = 0; i < unclaimedPrizes.length; i++) {
      const prize = unclaimedPrizes[i];

      setClaimAllProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentPoolId: prize.poolId,
      } : null);

      try {
        // Call contract to claim prize
        await claimWriteContractAsync({
          address: POOL_ADDRESS,
          abi: ColorDropPoolABI.abi,
          functionName: 'claimPrize',
          args: [prize.poolId],
          chainId: TARGET_CHAIN.id,
        });

        // Wait a moment for transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));

        claimedPrizes.push(prize);
        setClaimAllProgress(prev => prev ? {
          ...prev,
          claimedPrizes: [...claimedPrizes],
        } : null);
      } catch (err) {
        console.error(`Failed to claim prize for pool ${prize.poolId}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        failedPrizes.push({ poolId: prize.poolId, error: errorMessage });
        setClaimAllProgress(prev => prev ? {
          ...prev,
          failedPrizes: [...failedPrizes],
        } : null);
      }
    }

    // Update final state
    setClaimAllProgress(prev => prev ? {
      ...prev,
      current: unclaimedPrizes.length,
      currentPoolId: null,
      claimedPrizes,
      failedPrizes,
    } : null);

    setIsClaimingAll(false);

    // Refetch all data to update UI (both pools and winners for claim status)
    console.log('🔄 Refetching all data after claim all...');
    refetchPools();
    setTimeout(() => {
      refetchPoolWinners();
    }, 500);

    return { claimedPrizes, failedPrizes };
  }, [isClaimingAll, address, completedPools, claimWriteContractAsync, refetchPools, refetchPoolWinners]);

  // Reset claim all progress
  const resetClaimAllProgress = useCallback(() => {
    setClaimAllProgress(null);
  }, []);

  // Find user's unclaimed prizes - memoized to prevent infinite re-renders
  // Only includes prizes that are actually claimable (recorded in contract v3.6.0+)
  const userPrizes = useMemo((): UserPrize[] => {
    if (!address) return [];

    const prizes: UserPrize[] = [];
    completedPools.forEach(pool => {
      pool.winners.forEach(winner => {
        // Only show as claimable if:
        // 1. Winner matches current user
        // 2. Prize is not yet claimed
        // 3. Winner is recorded in contract (isClaimable = true)
        if (
          winner.address.toLowerCase() === address.toLowerCase() &&
          !winner.claimed &&
          winner.isClaimable
        ) {
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
    // Claim all functions
    claimAllPrizes,
    isClaimingAll,
    claimAllProgress,
    resetClaimAllProgress,
    // Finalize functions
    finalizePool,
    isFinalizePending,
    isFinalizeConfirming,
    isFinalizeSuccess,
    finalizeError,
    finalizeHash,
  };
}
