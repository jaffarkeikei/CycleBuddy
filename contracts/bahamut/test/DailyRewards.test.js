const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DailyRewards", function () {
  let CycleStreakToken, DailyRewards;
  let cycleStreakToken, dailyRewards;
  let owner, user1, user2;
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy token contract
    CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
    cycleStreakToken = await CycleStreakToken.deploy(owner.address);
    await cycleStreakToken.waitForDeployment();
    
    // Deploy rewards contract
    DailyRewards = await ethers.getContractFactory("DailyRewards");
    dailyRewards = await DailyRewards.deploy(await cycleStreakToken.getAddress());
    await dailyRewards.waitForDeployment();
    
    // Add the rewards contract as a minter
    await cycleStreakToken.addMinter(await dailyRewards.getAddress());
  });
  
  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await dailyRewards.cycleStreakToken()).to.equal(await cycleStreakToken.getAddress());
      expect(await dailyRewards.minimumCheckInInterval()).to.equal(20 * 60 * 60); // 20 hours
      expect(await dailyRewards.maximumCheckInInterval()).to.equal(48 * 60 * 60); // 48 hours
    });
    
    it("Should create default achievements", async function () {
      const achievements = await dailyRewards.getAchievements();
      expect(achievements.length).to.be.at.least(6); // At least 6 default achievements
      
      // Check first achievement (First Entry)
      expect(achievements[0].name).to.equal("First Entry");
      expect(achievements[0].requiredProgress).to.equal(1);
    });
  });
  
  describe("Daily Check-in", function () {
    it("Should allow a user to check in for the first time", async function () {
      // First check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Check user's streak
      const streak = await dailyRewards.getUserStreak(user1.address);
      expect(streak.currentStreak).to.equal(1);
      expect(streak.longestStreak).to.equal(1);
      expect(streak.dailyRewardsCount).to.equal(1);
      
      // Check token balance
      const balance = await cycleStreakToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("10")); // 10 tokens with 18 decimals
    });
    
    it("Should prevent checking in too soon", async function () {
      // First check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Try to check in immediately again (should fail)
      await expect(
        dailyRewards.connect(user1).dailyCheckIn()
      ).to.be.revertedWith("Cannot check in yet, try again later");
      
      // Advance time by 19 hours (still too soon)
      await time.increase(19 * 60 * 60);
      
      // Try to check in again (should still fail)
      await expect(
        dailyRewards.connect(user1).dailyCheckIn()
      ).to.be.revertedWith("Cannot check in yet, try again later");
    });
    
    it("Should maintain streak for check-ins within maximum interval", async function () {
      // First check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Advance time by 24 hours
      await time.increase(24 * 60 * 60);
      
      // Second check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Check user's streak
      const streak = await dailyRewards.getUserStreak(user1.address);
      expect(streak.currentStreak).to.equal(2);
      expect(streak.longestStreak).to.equal(2);
      expect(streak.dailyRewardsCount).to.equal(2);
    });
    
    it("Should break streak for check-ins beyond maximum interval", async function () {
      // First check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Advance time by 24 hours
      await time.increase(24 * 60 * 60);
      
      // Second check-in (streak = 2)
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Advance time by 49 hours (more than maximum)
      await time.increase(49 * 60 * 60);
      
      // Third check-in (streak should reset to 1)
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Check user's streak
      const streak = await dailyRewards.getUserStreak(user1.address);
      expect(streak.currentStreak).to.equal(1);
      expect(streak.longestStreak).to.equal(2); // Longest was 2
      expect(streak.dailyRewardsCount).to.equal(3);
    });
  });
  
  describe("Achievements", function () {
    it("Should complete First Entry achievement on first check-in", async function () {
      // First check-in
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Get user's progress
      const progress = await dailyRewards.getUserProgress(user1.address);
      expect(progress[0].completed).to.equal(true);
      
      // Get user's rewards
      const rewards = await dailyRewards.getUserRewards(user1.address);
      expect(rewards.length).to.equal(1);
      expect(rewards[0].achievementId).to.equal(1); // ID for First Entry
      expect(rewards[0].claimed).to.equal(false);
    });
    
    it("Should allow claiming a completed achievement reward", async function () {
      // First check-in to complete First Entry achievement
      await dailyRewards.connect(user1).dailyCheckIn();
      
      // Get user's rewards
      const rewards = await dailyRewards.getUserRewards(user1.address);
      const rewardId = rewards[0].id;
      
      // Claim the reward
      await dailyRewards.connect(user1).claimReward(rewardId);
      
      // Check the reward is now claimed
      const updatedRewards = await dailyRewards.getUserRewards(user1.address);
      expect(updatedRewards[0].claimed).to.equal(true);
      
      // Check token balance (10 from check-in + 10 from achievement)
      const balance = await cycleStreakToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("20"));
    });
    
    it("Should complete 7-day streak achievement", async function () {
      // Complete 7 daily check-ins
      for (let i = 0; i < 7; i++) {
        await dailyRewards.connect(user1).dailyCheckIn();
        
        if (i < 6) {
          // Advance time by 24 hours
          await time.increase(24 * 60 * 60);
        }
      }
      
      // Get user's progress
      const progress = await dailyRewards.getUserProgress(user1.address);
      expect(progress[1].completed).to.equal(true); // Week Warrior achievement
      
      // Get user's rewards
      const rewards = await dailyRewards.getUserRewards(user1.address);
      expect(rewards.length).to.equal(2); // First Entry + Week Warrior
    });
  });
  
  describe("Admin functions", function () {
    it("Should allow owner to update reward parameters", async function () {
      await dailyRewards.updateRewardParameters(
        12 * 60 * 60, // 12 hours min
        72 * 60 * 60, // 72 hours max
        ethers.parseEther("5"), // 5 tokens base reward
        2 // 2% bonus multiplier
      );
      
      expect(await dailyRewards.minimumCheckInInterval()).to.equal(12 * 60 * 60);
      expect(await dailyRewards.maximumCheckInInterval()).to.equal(72 * 60 * 60);
      expect(await dailyRewards.baseRewardAmount()).to.equal(ethers.parseEther("5"));
      expect(await dailyRewards.streakBonusMultiplier()).to.equal(2);
    });
    
    it("Should prevent non-owners from updating reward parameters", async function () {
      await expect(
        dailyRewards.connect(user1).updateRewardParameters(
          12 * 60 * 60,
          72 * 60 * 60,
          ethers.parseEther("5"),
          2
        )
      ).to.be.reverted;
    });
    
    it("Should allow owner to create new achievements", async function () {
      await dailyRewards.createAchievement(
        "Test Achievement",
        "A test achievement",
        5, // Achievement type (SharingKnowledge)
        ethers.parseEther("25"),
        3
      );
      
      const achievements = await dailyRewards.getAchievements();
      const newAchievement = achievements[achievements.length - 1];
      
      expect(newAchievement.name).to.equal("Test Achievement");
      expect(newAchievement.description).to.equal("A test achievement");
      expect(newAchievement.rewardAmount).to.equal(ethers.parseEther("25"));
      expect(newAchievement.requiredProgress).to.equal(3);
    });
  });
}); 