import { 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Heading,
  Text,
  Flex,
  Divider,
  HStack,
  Badge,
  Box,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  CircularProgress,
  CircularProgressLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { bahamutContractService } from '../../services/bahamut/contractService';

interface Achievement {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  currentProgress: string;
  requiredProgress: string;
  rewardAmount: string;
}

interface ClaimableReward {
  id: string;
  achievementId: string;
  amount: string;
  createdAt: Date;
  claimed: boolean;
}

interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastCheckInTimestamp: number;
  dailyRewardsCount: number;
  totalRewardsCount: number;
}

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsModal = ({ isOpen, onClose }: RewardsModalProps) => {
  const [claiming, setClaiming] = useState(false);
  const [checking, setChecking] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>([]);
  const [totalRewards, setTotalRewards] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [timeUntilNextCheckIn, setTimeUntilNextCheckIn] = useState<number | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadRewardsData();
    }
  }, [isOpen]);

  const loadRewardsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if wallet is connected
      const connected = await bahamutContractService.isWalletConnected();
      setIsWalletConnected(connected);
      
      if (!connected) {
        setIsLoading(false);
        return;
      }
      
      // Initialize contract service if needed
      if (!bahamutContractService.isContractsInitialized()) {
        await bahamutContractService.initialize();
      }
      
      // Get user data in parallel
      const [
        achievementsData, 
        claimableRewardsData, 
        totalRewardsData, 
        tokenBalanceData,
        userStreakData,
        nextCheckInData
      ] = await Promise.all([
        bahamutContractService.getUserAchievements(),
        bahamutContractService.getClaimableRewards(),
        bahamutContractService.getTotalAvailableRewards(),
        bahamutContractService.getTokenBalance(),
        bahamutContractService.getUserStreak(),
        bahamutContractService.getTimeUntilNextCheckIn()
      ]);
      
      setAchievements(achievementsData);
      setClaimableRewards(claimableRewardsData);
      setTotalRewards(totalRewardsData);
      setTokenBalance(tokenBalanceData);
      setUserStreak(userStreakData);
      setTimeUntilNextCheckIn(nextCheckInData);
    } catch (err) {
      console.error('Error loading rewards data:', err);
      setError('Failed to load rewards data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const success = await bahamutContractService.connectWallet();
      if (success) {
        setIsWalletConnected(true);
        loadRewardsData();
      } else {
        setError('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleDailyCheckIn = async () => {
    setChecking(true);
    setError(null);
    
    try {
      const success = await bahamutContractService.dailyCheckIn();
      
      if (success) {
        toast({
          title: 'Daily Check-In Successful',
          description: 'You have successfully checked in and earned rewards!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload rewards data
        await loadRewardsData();
      } else {
        setError('Check-in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during daily check-in:', err);
      
      // Handle specific error messages
      if (err.message && err.message.includes('Cannot check in yet')) {
        setError('Cannot check in yet. Please try again later.');
      } else {
        setError('Failed to check in. Please try again.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleClaimRewards = async () => {
    setClaiming(true);
    setError(null);
    
    try {
      const success = await bahamutContractService.claimAllRewards();
      
      if (success) {
        toast({
          title: 'Rewards Claimed',
          description: `${totalRewards} CSTRK has been added to your wallet!`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload rewards data
        await loadRewardsData();
      } else {
        setError('Failed to claim rewards. Please try again.');
      }
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const formatTimeUntilNextCheckIn = () => {
    if (timeUntilNextCheckIn === null) return 'Loading...';
    if (timeUntilNextCheckIn === 0) return 'Available now';
    
    const hours = Math.floor(timeUntilNextCheckIn / 3600);
    const minutes = Math.floor((timeUntilNextCheckIn % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  const getCompletedAchievements = () => {
    return achievements.filter(achievement => achievement.completed);
  };

  const getInProgressAchievements = () => {
    return achievements.filter(achievement => !achievement.completed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="purple.600" fontSize="2xl">Rewards Program</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <VStack spacing={4} align="center" py={8}>
              <CircularProgress isIndeterminate color="purple.500" />
              <Text>Loading rewards data...</Text>
            </VStack>
          ) : !isWalletConnected ? (
            <VStack spacing={6} align="stretch">
              <Box textAlign="center" py={8}>
                <Heading as="h3" size="md" mb={4}>
                  Connect Your Wallet
                </Heading>
                <Text mb={6}>
                  Connect your Metamask wallet to view and claim your rewards on the Bahamut blockchain.
                </Text>
                <Button
                  colorScheme="purple"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              </Box>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Stat>
                    <StatLabel>Token Balance</StatLabel>
                    <StatNumber>{parseFloat(tokenBalance).toFixed(2)} CSTRK</StatNumber>
                    <StatHelpText>CycleStreak Tokens</StatHelpText>
                  </Stat>
                </GridItem>
                <GridItem>
                  <Stat>
                    <StatLabel>Current Streak</StatLabel>
                    <StatNumber>{userStreak?.currentStreak || 0} days</StatNumber>
                    <StatHelpText>Longest: {userStreak?.longestStreak || 0} days</StatHelpText>
                  </Stat>
                </GridItem>
              </Grid>

              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading as="h3" size="sm">
                    Daily Check-in
                  </Heading>
                  <Text>{formatTimeUntilNextCheckIn()}</Text>
                </Flex>
                <Button
                  colorScheme="green"
                  width="100%"
                  onClick={handleDailyCheckIn}
                  isLoading={checking}
                  loadingText="Checking in..."
                  isDisabled={timeUntilNextCheckIn !== 0}
                >
                  Check-in Today
                </Button>
              </Box>

              <Divider />

              <Box>
                <Heading as="h3" size="sm" mb={3}>
                  Claimable Rewards
                </Heading>
                {claimableRewards.length > 0 ? (
                  <>
                    <Text mb={2}>Available rewards: {parseFloat(totalRewards).toFixed(2)} CSTRK</Text>
                    <Button
                      colorScheme="purple"
                      width="100%"
                      onClick={handleClaimRewards}
                      isLoading={claiming}
                      loadingText="Claiming..."
                    >
                      Claim All Rewards
                    </Button>
                  </>
                ) : (
                  <Text color="gray.600">You have no claimable rewards at this time.</Text>
                )}
              </Box>

              <Divider />

              <Box>
                <Heading as="h3" size="sm" mb={3}>
                  Completed Achievements
                </Heading>
                <HStack spacing={2} flexWrap="wrap">
                  {getCompletedAchievements().length > 0 ? (
                    getCompletedAchievements().map((achievement) => (
                      <Badge 
                        key={achievement.id}
                        colorScheme="green"
                        px={3}
                        py={1}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        {achievement.name}
                      </Badge>
                    ))
                  ) : (
                    <Text color="gray.600">No achievements completed yet.</Text>
                  )}
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Heading as="h3" size="sm" mb={3}>
                  Next Achievements
                </Heading>
                {getInProgressAchievements().length > 0 ? (
                  getInProgressAchievements().slice(0, 3).map((achievement) => (
                    <Flex key={achievement.id} justify="space-between" mb={2}>
                      <Text>{achievement.name}</Text>
                      <Text>
                        {achievement.currentProgress}/{achievement.requiredProgress} 
                        <Text as="span" fontWeight="bold" ml={2}>
                          (+{achievement.rewardAmount} CSTRK)
                        </Text>
                      </Text>
                    </Flex>
                  ))
                ) : (
                  <Text color="gray.600">All achievements completed!</Text>
                )}
              </Box>
              
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RewardsModal; 