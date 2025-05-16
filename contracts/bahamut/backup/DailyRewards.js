// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CycleStreakToken.js";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DailyRewards
 * @dev Contract for tracking daily rewards and minting CycleStreak tokens
 */
contract DailyRewards is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Reference to the CycleStreak token contract
    CycleStreakToken public cycleStreakToken;
    
    // Tracking achievements and their rewards
    enum AchievementType {
        FirstEntry,
        ConsistentTracking7Days,
        ConsistentTracking30Days,
        ConsistentTracking90Days,
        
        // Educational achievements
        CompletedBasicCourse,
        CompletedAdvancedCourse,
        SharingKnowledge,
        
        // Community achievements
        JoinedCommunity,
        HelpedOthers,
        TopContributor
    }
    
    struct Achievement {
        uint32 id;
        string name;
        string description;
        AchievementType achievementType;
        uint256 rewardAmount;
        uint32 requiredProgress;
    }
    
    struct Progress {
        uint32 achievementId;
        uint32 currentValue;
        bool completed;
        uint64 completedAt;
    }
    
    struct UserStreak {
        uint64 lastCheckInTimestamp;
        uint32 currentStreak;
        uint32 longestStreak;
        uint32 dailyRewardsCount;
        uint32 totalRewardsCount;
    }
    
    struct ClaimableReward {
        bytes32 id;
        address user;
        uint32 achievementId;
        uint256 amount;
        uint64 createdAt;
        bool claimed;
        uint64 claimedAt;
    }
    
    // State variables
    mapping(uint32 => Achievement) public achievements;
    mapping(address => mapping(uint32 => Progress)) public userProgress;
    mapping(address => UserStreak) public userStreaks;
    mapping(bytes32 => ClaimableReward) public claimableRewards;
    mapping(address => bytes32[]) public userRewards;
    
    Counters.Counter private _nextAchievementId;
    
    // Configurable parameters
    uint32 public minimumCheckInInterval = 20 hours; // Minimum time between check-ins
    uint32 public maximumCheckInInterval = 48 hours; // Maximum time to maintain streak
    uint256 public baseRewardAmount = 10 * 10**18;  // 10 tokens with 18 decimals
    uint256 public streakBonusMultiplier = 1;        // Bonus multiplier per week of streak
    
    // Events
    event AchievementCreated(uint32 indexed id, string name, uint256 rewardAmount);
    event DailyCheckIn(address indexed user, uint32 currentStreak, uint256 rewardAmount);
    event AchievementCompleted(address indexed user, uint32 indexed achievementId);
    event RewardClaimed(address indexed user, bytes32 indexed rewardId, uint256 amount);
    event RewardParametersUpdated(uint32 minInterval, uint32 maxInterval, uint256 baseReward, uint256 bonusMultiplier);
    
    /**
     * @dev Constructor
     * @param tokenAddress The address of the CycleStreak token contract
     */
    constructor(address tokenAddress) {
        cycleStreakToken = CycleStreakToken(tokenAddress);
        
        // Initialize with ID 1
        _nextAchievementId.increment();
        
        // Add default achievements
        _addDefaultAchievements();
    }
    
    /**
     * @dev Add default achievements
     */
    function _addDefaultAchievements() private {
        // Tracking achievements
        createAchievement(
            "First Entry",
            "Record your first cycle entry",
            AchievementType.FirstEntry,
            10 * 10**18,
            1
        );
        
        createAchievement(
            "Week Warrior",
            "Track consistently for 7 days",
            AchievementType.ConsistentTracking7Days,
            20 * 10**18,
            7
        );
        
        createAchievement(
            "Monthly Master",
            "Track consistently for 30 days",
            AchievementType.ConsistentTracking30Days,
            50 * 10**18,
            30
        );
        
        createAchievement(
            "Cycle Champion",
            "Track consistently for 90 days",
            AchievementType.ConsistentTracking90Days,
            100 * 10**18,
            90
        );
        
        // Educational achievements
        createAchievement(
            "Knowledge Seeker",
            "Complete the basic educational course",
            AchievementType.CompletedBasicCourse,
            30 * 10**18,
            5
        );
        
        // Community achievements
        createAchievement(
            "Community Member",
            "Join the CycleBuddy community",
            AchievementType.JoinedCommunity,
            15 * 10**18,
            1
        );
    }
    
    /**
     * @dev Create a new achievement
     * @param name Achievement name
     * @param description Achievement description
     * @param achievementType Type of achievement
     * @param rewardAmount Amount of tokens to reward
     * @param requiredProgress Progress required to complete achievement
     * @return uint32 ID of the created achievement
     */
    function createAchievement(
        string memory name,
        string memory description,
        AchievementType achievementType,
        uint256 rewardAmount,
        uint32 requiredProgress
    ) public onlyOwner returns (uint32) {
        uint32 id = uint32(_nextAchievementId.current());
        _nextAchievementId.increment();
        
        Achievement memory achievement = Achievement({
            id: id,
            name: name,
            description: description,
            achievementType: achievementType,
            rewardAmount: rewardAmount,
            requiredProgress: requiredProgress
        });
        
        achievements[id] = achievement;
        
        emit AchievementCreated(id, name, rewardAmount);
        
        return id;
    }
    
    /**
     * @dev Check in daily to maintain streak and earn rewards
     * Uses block.timestamp for verification which works well on PoSA chains with ~2s block times
     */
    function dailyCheckIn() external nonReentrant {
        address user = msg.sender;
        UserStreak storage streak = userStreaks[user];
        
        uint64 currentTime = uint64(block.timestamp);
        
        // For first-time users
        if (streak.lastCheckInTimestamp == 0) {
            streak.lastCheckInTimestamp = currentTime;
            streak.currentStreak = 1;
            streak.longestStreak = 1;
            streak.dailyRewardsCount = 1;
            streak.totalRewardsCount += 1;
            
            // Update progress for first entry achievement
            _updateAchievementProgress(user, 1, 1);
            
            // Mint base reward
            _mintReward(user, baseRewardAmount);
            
            emit DailyCheckIn(user, 1, baseRewardAmount);
            return;
        }
        
        // Check if enough time has passed since last check-in
        uint64 timeSinceLastCheckIn = currentTime - streak.lastCheckInTimestamp;
        
        // Prevent checking in too soon
        require(timeSinceLastCheckIn >= minimumCheckInInterval, "Cannot check in yet, try again later");
        
        if (timeSinceLastCheckIn <= maximumCheckInInterval) {
            // Streak continues
            streak.currentStreak += 1;
            
            // Update longest streak if needed
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }
            
            // Check if user has reached streak milestones
            if (streak.currentStreak == 7) {
                _updateAchievementProgress(user, 2, 7); // Week Warrior
            } else if (streak.currentStreak == 30) {
                _updateAchievementProgress(user, 3, 30); // Monthly Master
            } else if (streak.currentStreak == 90) {
                _updateAchievementProgress(user, 4, 90); // Cycle Champion
            }
        } else {
            // Streak broken
            streak.currentStreak = 1;
        }
        
        // Calculate reward with streak bonus
        uint256 weekCount = streak.currentStreak / 7;
        uint256 streakBonus = weekCount * streakBonusMultiplier;
        uint256 rewardAmount = baseRewardAmount + (baseRewardAmount * streakBonus / 100);
        
        // Update streak
        streak.lastCheckInTimestamp = currentTime;
        streak.dailyRewardsCount += 1;
        streak.totalRewardsCount += 1;
        
        // Mint reward tokens
        _mintReward(user, rewardAmount);
        
        emit DailyCheckIn(user, streak.currentStreak, rewardAmount);
    }
    
    // Rest of the contract functions remain the same...
    function _updateAchievementProgress(
        address user,
        uint32 achievementId,
        uint32 progressValue
    ) private {
        // Check if achievement exists
        Achievement storage achievement = achievements[achievementId];
        require(achievement.id == achievementId, "Achievement not found");
        
        // Get progress for this achievement
        Progress storage progress = userProgress[user][achievementId];
        
        // If this is a new progress entry, initialize it
        if (progress.achievementId == 0) {
            progress.achievementId = achievementId;
        }
        
        // Update progress if not already completed
        if (!progress.completed) {
            progress.currentValue += progressValue;
            
            // Check if achievement is now completed
            if (progress.currentValue >= achievement.requiredProgress) {
                progress.completed = true;
                progress.completedAt = uint64(block.timestamp);
                
                // Create a claimable reward
                _createClaimableReward(user, achievementId);
                
                emit AchievementCompleted(user, achievementId);
            }
        }
    }
    
    function updateProgress(
        address user,
        uint32 achievementId,
        uint32 progressValue
    ) external onlyOwner {
        _updateAchievementProgress(user, achievementId, progressValue);
    }
    
    function _createClaimableReward(
        address user,
        uint32 achievementId
    ) private returns (bytes32) {
        // Get the achievement
        Achievement storage achievement = achievements[achievementId];
        require(achievement.id == achievementId, "Achievement not found");
        
        // Create a unique reward ID
        bytes32 rewardId = keccak256(abi.encodePacked(user, achievementId, block.timestamp));
        
        // Create the claimable reward
        ClaimableReward memory reward = ClaimableReward({
            id: rewardId,
            user: user,
            achievementId: achievementId,
            amount: achievement.rewardAmount,
            createdAt: uint64(block.timestamp),
            claimed: false,
            claimedAt: 0
        });
        
        // Store the reward
        claimableRewards[rewardId] = reward;
        
        // Update user's rewards list
        userRewards[user].push(rewardId);
        
        return rewardId;
    }
    
    function claimReward(bytes32 rewardId) external nonReentrant {
        address user = msg.sender;
        
        // Get the reward
        ClaimableReward storage reward = claimableRewards[rewardId];
        require(reward.id == rewardId, "Reward not found");
        
        // Check if user is the reward owner
        require(reward.user == user, "Not your reward to claim");
        
        // Check if already claimed
        require(!reward.claimed, "Reward already claimed");
        
        // Update reward status
        reward.claimed = true;
        reward.claimedAt = uint64(block.timestamp);
        
        // Mint tokens to user
        _mintReward(user, reward.amount);
        
        emit RewardClaimed(user, rewardId, reward.amount);
    }
    
    function _mintReward(address user, uint256 amount) private {
        // Mint tokens using the CycleStreak token contract
        cycleStreakToken.mint(user, amount);
    }
    
    function updateRewardParameters(
        uint32 minInterval,
        uint32 maxInterval,
        uint256 baseReward,
        uint256 bonusMultiplier
    ) external onlyOwner {
        require(minInterval < maxInterval, "Min interval must be less than max interval");
        
        minimumCheckInInterval = minInterval;
        maximumCheckInInterval = maxInterval;
        baseRewardAmount = baseReward;
        streakBonusMultiplier = bonusMultiplier;
        
        emit RewardParametersUpdated(minInterval, maxInterval, baseReward, bonusMultiplier);
    }
    
    function getAchievements() external view returns (Achievement[] memory) {
        uint256 count = _nextAchievementId.current() - 1;
        Achievement[] memory result = new Achievement[](count);
        
        for (uint32 i = 1; i <= uint32(count); i++) {
            result[i-1] = achievements[i];
        }
        
        return result;
    }
    
    function getUserProgress(address user) external view returns (Progress[] memory) {
        uint256 count = _nextAchievementId.current() - 1;
        Progress[] memory result = new Progress[](count);
        
        for (uint32 i = 1; i <= uint32(count); i++) {
            result[i-1] = userProgress[user][i];
        }
        
        return result;
    }
    
    function getUserRewards(address user) external view returns (ClaimableReward[] memory) {
        bytes32[] storage rewardIds = userRewards[user];
        ClaimableReward[] memory result = new ClaimableReward[](rewardIds.length);
        
        for (uint256 i = 0; i < rewardIds.length; i++) {
            result[i] = claimableRewards[rewardIds[i]];
        }
        
        return result;
    }
    
    function getUserStreak(address user) external view returns (UserStreak memory) {
        return userStreaks[user];
    }
} 