// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title ColorDropPool
 * @dev Upgradeable tournament-style pool for Color Drop game on Farcaster x Celo
 * @notice 12 players compete @ 0.1 CELO, top 3 win prizes (0.6, 0.3, 0.1 CELO)
 * @custom:security-contact security@colordrop.app
 */
contract ColorDropPool is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // Constants
    uint256 public constant ENTRY_FEE = 0.1 ether; // 0.1 CELO per player
    uint8 public constant POOL_SIZE = 12;
    uint256 public constant PRIZE_1ST = 0.6 ether; // 50% of prize pool
    uint256 public constant PRIZE_2ND = 0.3 ether; // 25% of prize pool
    uint256 public constant PRIZE_3RD = 0.1 ether; // 8.33% of prize pool
    uint256 public constant SYSTEM_FEE = 0.2 ether; // 16.67% of total pool
    uint256 public constant FINALIZATION_TIMEOUT = 2 minutes; // Reduced from 5 minutes

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
    mapping(address => uint8) public playerSlotCount; // Track slots used per player
    mapping(address => bool) public verifiedUsers; // Track SELF-verified users (18+)
    uint256 public currentPoolId;

    // Dual treasury addresses
    address public treasury1;
    address public treasury2;

    // Backend verifier address (for SELF age verification)
    address public verifier;

    // Slot limits
    uint8 public constant UNVERIFIED_SLOT_LIMIT = 4; // Max 4 slots for unverified users
    // Verified users have infinite slots (no limit)

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
    event TreasuryUpdated(address indexed treasury1, address indexed treasury2);
    event UserVerified(address indexed user, bool verified);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // Custom errors (gas efficient)
    error InvalidTreasuryAddress();
    error InvalidVerifierAddress();
    error InvalidFID();
    error AlreadyInActivePool();
    error PoolFull();
    error InvalidEntryFee();
    error InvalidAccuracy();
    error NotInPool();
    error AlreadySubmitted();
    error PoolNotReady();
    error TransferFailed();
    error PoolDoesNotExist();
    error PoolNotActive();
    error SlotLimitExceeded();
    error UnauthorizedVerifier();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract (replaces constructor for upgradeable contracts)
     * @param _treasury1 First treasury wallet address (receives 50% of system fee)
     * @param _treasury2 Second treasury wallet address (receives 50% of system fee)
     * @param _verifier Backend verifier address for SELF age verification
     */
    function initialize(address _treasury1, address _treasury2, address _verifier) public initializer {
        if (_treasury1 == address(0) || _treasury2 == address(0)) {
            revert InvalidTreasuryAddress();
        }
        if (_verifier == address(0)) {
            revert InvalidVerifierAddress();
        }

        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();

        treasury1 = _treasury1;
        treasury2 = _treasury2;
        verifier = _verifier;

        _createNewPool();
    }

    /**
     * @dev Join current pool with 0.1 CELO entry fee
     * @param fid Farcaster ID of the player
     * @notice Unverified users can play max 4 slots, SELF-verified users (18+) have infinite slots
     */
    function joinPool(uint256 fid) external payable nonReentrant whenNotPaused {
        if (msg.value != ENTRY_FEE) revert InvalidEntryFee();
        if (fid == 0) revert InvalidFID();
        if (activePoolId[msg.sender] != 0) revert AlreadyInActivePool();

        // Check slot limits based on verification status
        uint8 currentSlots = playerSlotCount[msg.sender];
        bool isVerified = verifiedUsers[msg.sender];

        if (!isVerified && currentSlots >= UNVERIFIED_SLOT_LIMIT) {
            revert SlotLimitExceeded();
        }

        Pool storage pool = pools[currentPoolId];
        if (pool.playerCount >= POOL_SIZE) revert PoolFull();

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
        playerSlotCount[msg.sender]++; // Increment slot usage

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
        nonReentrant
        whenNotPaused
    {
        if (poolId > currentPoolId) revert PoolDoesNotExist();
        if (accuracy > 10000) revert InvalidAccuracy();
        if (activePoolId[msg.sender] != poolId) revert NotInPool();

        Pool storage pool = pools[poolId];
        if (!pool.isActive || pool.isCompleted) revert PoolNotActive();

        // Find player and update score
        bool found = false;
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (pool.players[i].wallet == msg.sender) {
                if (pool.players[i].hasSubmitted) revert AlreadySubmitted();

                pool.players[i].accuracy = accuracy;
                pool.players[i].timestamp = uint32(block.timestamp);
                pool.players[i].hasSubmitted = true;
                found = true;
                break;
            }
        }

        if (!found) revert NotInPool();

        emit ScoreSubmitted(poolId, msg.sender, accuracy);

        // Check if all players submitted
        _checkPoolCompletion(poolId);
    }

    /**
     * @dev Finalize pool and distribute prizes (callable by anyone after timeout)
     * @param poolId Pool ID to finalize
     */
    function finalizePool(uint256 poolId) external nonReentrant whenNotPaused {
        if (poolId > currentPoolId) revert PoolDoesNotExist();

        Pool storage pool = pools[poolId];
        if (!pool.isActive || pool.isCompleted) revert PoolNotActive();

        // Require all players to have submitted or timeout passed
        bool allSubmitted = true;
        for (uint8 i = 0; i < pool.playerCount; i++) {
            if (!pool.players[i].hasSubmitted) {
                allSubmitted = false;
                break;
            }
        }

        if (!allSubmitted && block.timestamp <= pool.startTime + FINALIZATION_TIMEOUT) {
            revert PoolNotReady();
        }

        _distributePrizes(poolId);
    }

    /**
     * @dev Internal function to create new pool
     */
    function _createNewPool() private {
        currentPoolId++;

        Pool storage newPool = pools[currentPoolId];
        newPool.id = currentPoolId;
        newPool.targetColor = keccak256(abi.encodePacked(block.timestamp, currentPoolId, block.prevrandao));

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
     * @dev Distribute prizes to top 3 players and system fees to dual treasuries
     */
    function _distributePrizes(uint256 poolId) private {
        Pool storage pool = pools[poolId];
        if (pool.isCompleted) revert PoolNotActive();

        pool.isCompleted = true;

        // Find top 3 players
        address[3] memory winners = _getTopThree(poolId);

        // Split system fee 50/50 between treasury wallets
        uint256 feePerTreasury = SYSTEM_FEE / 2;

        _payFee(treasury1, feePerTreasury);
        _payFee(treasury2, feePerTreasury);

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
     * @dev Pay system fee to treasury
     */
    function _payFee(address treasury, uint256 amount) private {
        (bool success, ) = treasury.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit SystemFeePaid(treasury, amount);
    }

    /**
     * @dev Pay prize to winner
     */
    function _payPrize(address winner, uint256 amount) private {
        if (winner == address(0)) return; // Skip if no winner at this position

        (bool success, ) = winner.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PrizePaid(winner, amount);
    }

    /**
     * @dev Get top 3 players by accuracy (with timestamp tiebreaker)
     */
    function _getTopThree(uint256 poolId) private view returns (address[3] memory) {
        Pool storage pool = pools[poolId];
        address[3] memory topPlayers;

        // Simple bubble sort for top 3 (sufficient for 12 players)
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
        revert NotInPool();
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
        if (index >= pools[poolId].playerCount) revert NotInPool();
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
     * @dev Set user verification status (called by backend verifier after SELF validation)
     * @param user Address of the user to verify
     * @param verified Verification status (true if 18+ via SELF)
     */
    function setUserVerification(address user, bool verified) external {
        if (msg.sender != verifier) revert UnauthorizedVerifier();
        verifiedUsers[user] = verified;
        emit UserVerified(user, verified);
    }

    /**
     * @dev Update verifier address (only owner)
     * @param newVerifier New backend verifier address
     */
    function setVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert InvalidVerifierAddress();
        address oldVerifier = verifier;
        verifier = newVerifier;
        emit VerifierUpdated(oldVerifier, newVerifier);
    }

    /**
     * @dev Update treasury addresses (only owner)
     * @param _treasury1 New first treasury address
     * @param _treasury2 New second treasury address
     */
    function setTreasuries(address _treasury1, address _treasury2) external onlyOwner {
        if (_treasury1 == address(0) || _treasury2 == address(0)) {
            revert InvalidTreasuryAddress();
        }
        treasury1 = _treasury1;
        treasury2 = _treasury2;
        emit TreasuryUpdated(_treasury1, _treasury2);
    }

    /**
     * @dev Get user verification status and slot count
     * @param user Address to check
     */
    function getUserStatus(address user) external view returns (
        bool isVerified,
        uint8 slotsUsed,
        uint8 slotsAvailable,
        bool canJoin
    ) {
        isVerified = verifiedUsers[user];
        slotsUsed = playerSlotCount[user];
        slotsAvailable = isVerified ? type(uint8).max : UNVERIFIED_SLOT_LIMIT;
        canJoin = activePoolId[user] == 0 && (isVerified || slotsUsed < UNVERIFIED_SLOT_LIMIT);
    }

    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only if critical bug, contract must be paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Get contract version for upgrade tracking
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }
}
