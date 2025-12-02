// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ColorDropPool
 * @dev Tournament-style pool for Color Drop game on Farcaster x Celo
 * @notice 21 players compete, top 3 win prizes (10, 6, 3 CELO)
 */
contract ColorDropPool {
    // Constants
    uint256 public constant ENTRY_FEE = 1 ether; // 1 CELO
    uint8 public constant POOL_SIZE = 21;
    uint256 public constant PRIZE_1ST = 10 ether;
    uint256 public constant PRIZE_2ND = 6 ether;
    uint256 public constant PRIZE_3RD = 3 ether;
    uint256 public constant SYSTEM_FEE = 1 ether;

    // Structs
    struct Player {
        address wallet;
        uint256 fid; // Farcaster ID
        uint16 accuracy; // 0-10000 (basis points, e.g., 9580 = 95.80%)
        uint32 timestamp; // Submission timestamp
        bool hasSubmitted;
    }

    struct Pool {
        uint256 id;
        Player[POOL_SIZE] players;
        uint8 playerCount;
        bool isActive;
        bool isCompleted;
        uint32 startTime;
        bytes32 targetColor; // RGB color hash
    }

    // State variables
    mapping(uint256 => Pool) public pools;
    mapping(address => uint256) public activePoolId; // Track player's active pool
    uint256 public currentPoolId;
    address public treasury;
    address public owner;

    // Events
    event PoolCreated(uint256 indexed poolId, bytes32 targetColor);
    event PlayerJoined(uint256 indexed poolId, address indexed player, uint256 fid);
    event PoolStarted(uint256 indexed poolId, uint32 startTime);
    event ScoreSubmitted(uint256 indexed poolId, address indexed player, uint16 accuracy);
    event PoolCompleted(
        uint256 indexed poolId,
        address indexed first,
        address indexed second,
        address third
    );
    event PrizePaid(address indexed winner, uint256 amount);
    event SystemFeePaid(address indexed treasury, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier poolExists(uint256 poolId) {
        require(poolId <= currentPoolId, "Pool does not exist");
        _;
    }

    modifier poolNotFull(uint256 poolId) {
        require(pools[poolId].playerCount < POOL_SIZE, "Pool is full");
        _;
    }

    modifier poolActive(uint256 poolId) {
        require(pools[poolId].isActive, "Pool not active");
        require(!pools[poolId].isCompleted, "Pool already completed");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        owner = msg.sender;
        treasury = _treasury;
        _createNewPool();
    }

    /**
     * @dev Join current pool with 1 CELO entry fee
     * @param fid Farcaster ID of the player
     */
    function joinPool(uint256 fid) external payable {
        require(msg.value == ENTRY_FEE, "Must pay exactly 1 CELO");
        require(fid > 0, "Invalid FID");
        require(activePoolId[msg.sender] == 0, "Already in active pool");

        Pool storage pool = pools[currentPoolId];
        require(pool.playerCount < POOL_SIZE, "Pool is full");

        // Add player to pool
        pool.players[pool.playerCount] = Player({
            wallet: msg.sender,
            fid: fid,
            accuracy: 0,
            timestamp: 0,
            hasSubmitted: false
        });

        pool.playerCount++;
        activePoolId[msg.sender] = currentPoolId;

        emit PlayerJoined(currentPoolId, msg.sender, fid);

        // Start pool if full
        if (pool.playerCount == POOL_SIZE) {
            pool.isActive = true;
            pool.startTime = uint32(block.timestamp);
            emit PoolStarted(currentPoolId, pool.startTime);

            // Create new pool for next players
            _createNewPool();
        }
    }

    /**
     * @dev Submit accuracy score for current pool
     * @param poolId Pool ID to submit score for
     * @param accuracy Accuracy score (0-10000 basis points)
     */
    function submitScore(uint256 poolId, uint16 accuracy)
        external
        poolExists(poolId)
        poolActive(poolId)
    {
        require(accuracy <= 10000, "Invalid accuracy");
        require(activePoolId[msg.sender] == poolId, "Not in this pool");

        Pool storage pool = pools[poolId];

        // Find player and update score
        bool found = false;
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (pool.players[i].wallet == msg.sender) {
                require(!pool.players[i].hasSubmitted, "Already submitted");

                pool.players[i].accuracy = accuracy;
                pool.players[i].timestamp = uint32(block.timestamp);
                pool.players[i].hasSubmitted = true;
                found = true;
                break;
            }
        }

        require(found, "Player not in pool");

        emit ScoreSubmitted(poolId, msg.sender, accuracy);

        // Check if all players submitted
        _checkPoolCompletion(poolId);
    }

    /**
     * @dev Finalize pool and distribute prizes (called manually or automatically)
     * @param poolId Pool ID to finalize
     */
    function finalizePool(uint256 poolId)
        external
        poolExists(poolId)
        poolActive(poolId)
    {
        Pool storage pool = pools[poolId];

        // Require all players to have submitted or 5 minutes passed
        bool allSubmitted = true;
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (!pool.players[i].hasSubmitted) {
                allSubmitted = false;
                break;
            }
        }

        require(
            allSubmitted || block.timestamp > pool.startTime + 5 minutes,
            "Not ready to finalize"
        );

        _distributePrizes(poolId);
    }

    /**
     * @dev Internal function to create new pool
     */
    function _createNewPool() private {
        currentPoolId++;

        Pool storage newPool = pools[currentPoolId];
        newPool.id = currentPoolId;
        newPool.targetColor = keccak256(abi.encodePacked(block.timestamp, currentPoolId));

        emit PoolCreated(currentPoolId, newPool.targetColor);
    }

    /**
     * @dev Check if pool is ready for completion
     */
    function _checkPoolCompletion(uint256 poolId) private {
        Pool storage pool = pools[poolId];

        bool allSubmitted = true;
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (!pool.players[i].hasSubmitted) {
                allSubmitted = false;
                break;
            }
        }

        if (allSubmitted) {
            _distributePrizes(poolId);
        }
    }

    /**
     * @dev Distribute prizes to top 3 players
     */
    function _distributePrizes(uint256 poolId) private {
        Pool storage pool = pools[poolId];
        require(!pool.isCompleted, "Already completed");

        pool.isCompleted = true;

        // Find top 3 players
        address[3] memory winners = _getTopThree(poolId);

        // Pay system fee
        (bool feeSuccess, ) = treasury.call{value: SYSTEM_FEE}("");
        require(feeSuccess, "Fee transfer failed");
        emit SystemFeePaid(treasury, SYSTEM_FEE);

        // Pay prizes
        _payPrize(winners[0], PRIZE_1ST);
        _payPrize(winners[1], PRIZE_2ND);
        _payPrize(winners[2], PRIZE_3RD);

        // Clear active pool for all players
        for (uint8 i = 0; i < pool.playerCount; i++) {
            delete activePoolId[pool.players[i].wallet];
        }

        emit PoolCompleted(poolId, winners[0], winners[1], winners[2]);
    }

    /**
     * @dev Pay prize to winner
     */
    function _payPrize(address winner, uint256 amount) private {
        require(winner != address(0), "Invalid winner");

        (bool success, ) = winner.call{value: amount}("");
        require(success, "Prize transfer failed");

        emit PrizePaid(winner, amount);
    }

    /**
     * @dev Get top 3 players by accuracy (with timestamp tiebreaker)
     */
    function _getTopThree(uint256 poolId) private view returns (address[3] memory) {
        Pool storage pool = pools[poolId];
        address[3] memory topPlayers;

        // Simple bubble sort for top 3 (sufficient for 21 players)
        for (uint8 i = 0; i < pool.playerCount; i++) {
            for (uint8 j = 0; j < 3; j++) {
                if (topPlayers[j] == address(0)) {
                    topPlayers[j] = pool.players[i].wallet;
                    break;
                }

                // Compare with current top player
                Player storage current = pool.players[i];
                Player storage top = _getPlayer(poolId, topPlayers[j]);

                // Better accuracy or same accuracy but earlier submission
                if (current.accuracy > top.accuracy ||
                    (current.accuracy == top.accuracy && current.timestamp < top.timestamp)) {
                    // Shift down and insert
                    for (uint8 k = 2; k > j; k--) {
                        topPlayers[k] = topPlayers[k-1];
                    }
                    topPlayers[j] = current.wallet;
                    break;
                }
            }
        }

        return topPlayers;
    }

    /**
     * @dev Get player by wallet address
     */
    function _getPlayer(uint256 poolId, address wallet) private view returns (Player storage) {
        Pool storage pool = pools[poolId];
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (pool.players[i].wallet == wallet) {
                return pool.players[i];
            }
        }
        revert("Player not found");
    }

    /**
     * @dev Get pool details
     */
    function getPool(uint256 poolId) external view returns (
        uint256 id,
        uint8 playerCount,
        bool isActive,
        bool isCompleted,
        uint32 startTime,
        bytes32 targetColor
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.id,
            pool.playerCount,
            pool.isActive,
            pool.isCompleted,
            pool.startTime,
            pool.targetColor
        );
    }

    /**
     * @dev Get player in pool by index
     */
    function getPlayer(uint256 poolId, uint8 index) external view returns (
        address wallet,
        uint256 fid,
        uint16 accuracy,
        uint32 timestamp,
        bool hasSubmitted
    ) {
        require(index < pools[poolId].playerCount, "Invalid index");
        Player storage player = pools[poolId].players[index];
        return (
            player.wallet,
            player.fid,
            player.accuracy,
            player.timestamp,
            player.hasSubmitted
        );
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    /**
     * @dev Emergency withdraw (only if critical bug)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
