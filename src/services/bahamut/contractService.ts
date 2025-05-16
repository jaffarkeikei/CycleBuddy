import { ethers } from 'ethers';

// Hardcoded ABIs instead of importing from JSON files
const CycleStreakTokenABI = [
  // ERC20 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // CycleStreakToken specific functions
  "function addMinter(address minter) external",
  "function removeMinter(address minter) external",
  "function isMinter(address minter) external view returns (bool)",
  "function mint(address to, uint256 amount) external",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MinterAdded(address indexed minter)",
  "event MinterRemoved(address indexed minter)"
];

const DailyRewardsABI = [
  // State variables and query functions
  "function cycleStreakToken() view returns (address)",
  "function minimumCheckInInterval() view returns (uint32)",
  "function maximumCheckInInterval() view returns (uint32)",
  "function baseRewardAmount() view returns (uint256)",
  "function streakBonusMultiplier() view returns (uint256)",
  
  // Action functions
  "function dailyCheckIn() external",
  "function claimReward(bytes32 rewardId) external",
  "function updateProgress(address user, uint32 achievementId, uint32 progressValue) external",
  "function updateRewardParameters(uint32 minInterval, uint32 maxInterval, uint256 baseReward, uint256 bonusMultiplier) external",
  
  // View functions
  "function getAchievements() external view returns (tuple(uint32 id, string name, string description, uint8 achievementType, uint256 rewardAmount, uint32 requiredProgress)[])",
  "function getUserProgress(address user) external view returns (tuple(uint32 achievementId, uint32 currentValue, bool completed, uint64 completedAt)[])",
  "function getUserRewards(address user) external view returns (tuple(bytes32 id, address user, uint32 achievementId, uint256 amount, uint64 createdAt, bool claimed, uint64 claimedAt)[])",
  "function getUserStreak(address user) external view returns (tuple(uint64 lastCheckInTimestamp, uint32 currentStreak, uint32 longestStreak, uint32 dailyRewardsCount, uint32 totalRewardsCount))",
  
  // Events
  "event AchievementCreated(uint32 indexed id, string name, uint256 rewardAmount)",
  "event DailyCheckIn(address indexed user, uint32 currentStreak, uint256 rewardAmount)",
  "event AchievementCompleted(address indexed user, uint32 indexed achievementId)",
  "event RewardClaimed(address indexed user, bytes32 indexed rewardId, uint256 amount)",
  "event RewardParametersUpdated(uint32 minInterval, uint32 maxInterval, uint256 baseReward, uint256 bonusMultiplier)"
];

// Default contract addresses for development
const DEFAULT_ADDRESSES = {
  CycleStreakToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // First contract deployed by hardhat
  DailyRewards: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Second contract deployed by hardhat
  network: 'localhost'
};

// Import contract addresses from deployment
let contractAddresses: { 
  CycleStreakToken: string; 
  DailyRewards: string;
  network: string;
} = {
  CycleStreakToken: '',
  DailyRewards: '',
  network: ''
};

try {
  contractAddresses = require('../../../contracts/bahamut/deployed-addresses.json');
  console.log('Contract addresses loaded:', contractAddresses);
} catch (error) {
  console.warn('Contract addresses not found. Using default development addresses.');
  contractAddresses = DEFAULT_ADDRESSES;
}

/**
 * Service for interacting with Bahamut blockchain contracts
 */
export class BahamutContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private cycleStreakToken: ethers.Contract | null = null;
  private dailyRewards: ethers.Contract | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if MetaMask is available
      if (!this.isMetaMaskAvailable()) {
        console.warn('MetaMask is not available. Some features will be limited.');
        return false;
      }

      // Get provider and signer
      // @ts-ignore - TS doesn't know about window.ethereum
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Initialize contract instances
      if (contractAddresses.CycleStreakToken && contractAddresses.DailyRewards) {
        this.cycleStreakToken = new ethers.Contract(
          contractAddresses.CycleStreakToken,
          CycleStreakTokenABI,
          this.signer
        );
        
        this.dailyRewards = new ethers.Contract(
          contractAddresses.DailyRewards,
          DailyRewardsABI,
          this.signer
        );
        
        this.isInitialized = true;
        return true;
      } else {
        console.error('Contract addresses not set. Cannot initialize contracts.');
        return false;
      }
    } catch (error: unknown) {
      console.error('Error initializing Bahamut contract service:', error);
      return false;
    }
  }

  /**
   * Check if MetaMask is available
   */
  private isMetaMaskAvailable(): boolean {
    // @ts-ignore - TS doesn't know about window.ethereum
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  }

  /**
   * Connect to MetaMask wallet
   */
  public async connectWallet(): Promise<boolean> {
    try {
      if (!this.isMetaMaskAvailable()) {
        console.warn('MetaMask is not available');
        return false;
      }

      // Request account access
      // @ts-ignore - TS doesn't know about window.ethereum
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize if not already
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return true;
    } catch (error: unknown) {
      console.error('Error connecting to wallet:', error);
      return false;
    }
  }

  /**
   * Check if wallet is connected
   */
  public async isWalletConnected(): Promise<boolean> {
    try {
      if (!this.provider) {
        return false;
      }
      
      const accounts = await this.provider.listAccounts();
      return accounts.length > 0;
    } catch (error: unknown) {
      console.error('Error checking if wallet is connected:', error);
      return false;
    }
  }

  /**
   * Get the user's wallet address
   */
  public async getUserAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        return null;
      }
      
      return await this.signer.getAddress();
    } catch (error: unknown) {
      console.error('Error getting user address:', error);
      return null;
    }
  }

  /**
   * Check if the contracts are initialized
   */
  public isContractsInitialized(): boolean {
    return this.isInitialized && 
           this.cycleStreakToken !== null && 
           this.dailyRewards !== null;
  }

  /**
   * Get token balance
   */
  public async getTokenBalance(): Promise<string> {
    try {
      if (!this.cycleStreakToken || !this.signer) {
        await this.initialize();
        if (!this.cycleStreakToken || !this.signer) {
          return '0';
        }
      }
      
      const address = await this.signer.getAddress();
      const balance = await this.cycleStreakToken.balanceOf(address);
      
      // Convert from wei to tokens (18 decimals)
      return ethers.utils.formatUnits(balance, 18);
    } catch (error: unknown) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  /**
   * Perform daily check-in
   */
  public async dailyCheckIn(): Promise<boolean> {
    try {
      if (!this.dailyRewards) {
        await this.initialize();
        if (!this.dailyRewards) {
          throw new Error('Daily rewards contract not initialized');
        }
      }
      
      // Call the dailyCheckIn function
      const tx = await this.dailyRewards.dailyCheckIn();
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error: unknown) {
      console.error('Error performing daily check-in:', error);
      
      // Check if it's the "Cannot check in yet" error
      if (error instanceof Error && error.message.includes('Cannot check in yet')) {
        throw new Error('Cannot check in yet, try again later');
      }
      
      return false;
    }
  }

  /**
   * Get user's streak info
   */
  public async getUserStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastCheckInTimestamp: number;
    dailyRewardsCount: number;
    totalRewardsCount: number;
  } | null> {
    try {
      if (!this.dailyRewards || !this.signer) {
        await this.initialize();
        if (!this.dailyRewards || !this.signer) {
          return null;
        }
      }
      
      const address = await this.signer.getAddress();
      const streak = await this.dailyRewards.getUserStreak(address);
      
      return {
        currentStreak: streak.currentStreak.toNumber(),
        longestStreak: streak.longestStreak.toNumber(),
        lastCheckInTimestamp: streak.lastCheckInTimestamp.toNumber() * 1000, // Convert to milliseconds
        dailyRewardsCount: streak.dailyRewardsCount.toNumber(),
        totalRewardsCount: streak.totalRewardsCount.toNumber()
      };
    } catch (error: unknown) {
      console.error('Error getting user streak:', error);
      return null;
    }
  }

  /**
   * Get time until next check-in
   */
  public async getTimeUntilNextCheckIn(): Promise<number | null> {
    try {
      if (!this.dailyRewards || !this.signer) {
        await this.initialize();
        if (!this.dailyRewards || !this.signer) {
          return null;
        }
      }
      
      const address = await this.signer.getAddress();
      const streak = await this.dailyRewards.getUserStreak(address);
      const minimumInterval = await this.dailyRewards.minimumCheckInInterval();
      
      // If user has never checked in, they can check in immediately
      if (streak.lastCheckInTimestamp.toNumber() === 0) {
        return 0;
      }
      
      const lastCheckIn = streak.lastCheckInTimestamp.toNumber();
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const timeElapsed = currentTime - lastCheckIn;
      const requiredInterval = minimumInterval.toNumber();
      
      if (timeElapsed >= requiredInterval) {
        return 0; // Can check in now
      }
      
      return requiredInterval - timeElapsed; // Seconds until next check-in
    } catch (error: unknown) {
      console.error('Error getting time until next check-in:', error);
      return null;
    }
  }

  /**
   * Get all user achievements
   */
  public async getUserAchievements(): Promise<any[]> {
    try {
      if (!this.dailyRewards || !this.signer) {
        await this.initialize();
        if (!this.dailyRewards || !this.signer) {
          return [];
        }
      }
      
      const address = await this.signer.getAddress();
      
      // Get all achievements
      const achievements = await this.dailyRewards.getAchievements();
      
      // Get user's progress for all achievements
      const progress = await this.dailyRewards.getUserProgress(address);
      
      // Combine the data
      return achievements.map((achievement: any, index: number) => {
        const userProgress = progress[index];
        
        return {
          id: achievement.id.toString(),
          name: achievement.name,
          description: achievement.description,
          achievementType: achievement.achievementType,
          rewardAmount: ethers.utils.formatUnits(achievement.rewardAmount, 18),
          requiredProgress: achievement.requiredProgress.toString(),
          currentProgress: userProgress.currentValue.toString(),
          completed: userProgress.completed,
          completedAt: userProgress.completedAt.toNumber() > 0 
            ? new Date(userProgress.completedAt.toNumber() * 1000) 
            : null
        };
      });
    } catch (error: unknown) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Get user's claimable rewards
   */
  public async getClaimableRewards(): Promise<any[]> {
    try {
      if (!this.dailyRewards || !this.signer) {
        await this.initialize();
        if (!this.dailyRewards || !this.signer) {
          return [];
        }
      }
      
      const address = await this.signer.getAddress();
      const rewards = await this.dailyRewards.getUserRewards(address);
      
      // Filter unclaimed rewards
      const unclaimedRewards = rewards.filter((reward: any) => !reward.claimed);
      
      return unclaimedRewards.map((reward: any) => ({
        id: reward.id,
        achievementId: reward.achievementId.toString(),
        amount: ethers.utils.formatUnits(reward.amount, 18),
        createdAt: new Date(reward.createdAt.toNumber() * 1000),
        claimed: reward.claimed
      }));
    } catch (error: unknown) {
      console.error('Error getting claimable rewards:', error);
      return [];
    }
  }

  /**
   * Claim a reward
   */
  public async claimReward(rewardId: string): Promise<boolean> {
    try {
      if (!this.dailyRewards) {
        await this.initialize();
        if (!this.dailyRewards) {
          throw new Error('Daily rewards contract not initialized');
        }
      }
      
      // Call the claimReward function
      const tx = await this.dailyRewards.claimReward(rewardId);
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error: unknown) {
      console.error('Error claiming reward:', error);
      return false;
    }
  }

  /**
   * Claim all available rewards
   */
  public async claimAllRewards(): Promise<boolean> {
    try {
      const unclaimedRewards = await this.getClaimableRewards();
      
      if (unclaimedRewards.length === 0) {
        return true; // Nothing to claim
      }
      
      // Claim each reward
      for (const reward of unclaimedRewards) {
        await this.claimReward(reward.id);
      }
      
      return true;
    } catch (error: unknown) {
      console.error('Error claiming all rewards:', error);
      return false;
    }
  }

  /**
   * Calculate total available rewards (unclaimed + current streak bonus)
   */
  public async getTotalAvailableRewards(): Promise<string> {
    try {
      // Get unclaimed rewards
      const unclaimedRewards = await this.getClaimableRewards();
      let totalAmount = ethers.BigNumber.from(0);
      
      // Sum up all unclaimed rewards
      for (const reward of unclaimedRewards) {
        totalAmount = totalAmount.add(
          ethers.utils.parseUnits(reward.amount, 18)
        );
      }
      
      // Format to string with 18 decimals
      return ethers.utils.formatUnits(totalAmount, 18);
    } catch (error: unknown) {
      console.error('Error calculating total available rewards:', error);
      return '0';
    }
  }
}

// Export a singleton instance
export const bahamutContractService = new BahamutContractService(); 