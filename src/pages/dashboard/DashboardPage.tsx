import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useToast,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Tag,
  Badge,
  Progress,
  Divider,
  SimpleGrid,
  useColorModeValue,
  List,
  ListItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { useAuthStore } from '../../services/auth/authService';
import { keyframes } from '@emotion/react';
import { passkeyService } from '../../services/auth/passkeyService';
import { stellarContractService } from '../../services/stellar/contractService';
import { bahamutContractService } from '../../services/bahamut/contractService';
import { 
  FaHome, 
  FaBrain, 
  FaGraduationCap, 
  FaFlask, 
  FaLock, 
  FaCheckCircle, 
  FaCertificate, 
  FaMedal, 
  FaShieldAlt, 
  FaMoneyBillWave, 
  FaChartLine,
  FaUniversity,
  FaClock,
  FaExclamationTriangle,
  FaBell,
  FaInfoCircle,
  FaCheck,
  FaCalendarAlt,
  FaTimes,
  FaSmile, 
  FaMeh, 
  FaFrown, 
  FaRegLightbulb, 
  FaRegChartBar,
  FaHistory,
  FaPlus,
} from 'react-icons/fa';
import { CycleCalendar, CycleDay } from '../../components/dashboard/CycleCalendar';
import { format, subDays, differenceInDays } from 'date-fns';
import { geminiService, TaskAnalysisResult, MoodInsight, DetailedHealthInsight } from '../../services/ai/geminiService';
import CycleBuddyAI from '../../components/dashboard/CycleBuddyAI';

// Create a keyframe animation for the gradient
const animatedGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Mock data
const recentCycleData: CycleDay[] = [
  { day: 1, mood: 'Good', symptoms: ['Cramps', 'Fatigue'], date: '2025-09-01' },
  { day: 2, mood: 'Fair', symptoms: ['Bloating'], date: '2025-09-02' },
  { day: 3, mood: 'Great', symptoms: [], date: '2025-09-03' },
];

// Function to determine phase based on cycle day
const getPhaseFromDay = (day: number): CycleDay['phase'] => {
  if (day <= 5) {
    return 'menstruation';
  } else if (day <= 13) {
    return 'follicular';
  } else if (day <= 15) {
    return 'ovulation';
  } else {
    return 'luteal';
  }
};

// Stellar blockchain features
const blockchainFeatures = [
  { 
    title: 'Passkey Authentication',
    description: 'Your account is secured with Stellar Passkeys, a modern authentication method more secure than passwords.',
    emoji: '🔒'
  },
  { 
    title: 'Encrypted Data Storage',
    description: 'Your health data is encrypted and stored on the Stellar blockchain for maximum privacy and security.',
    emoji: '🔐'
  },
  { 
    title: 'Decentralized Identity',
    description: 'Your identity is protected through Stellar\'s decentralized authentication, giving you full control.',
    emoji: '🛡️'
  },
];

// Advanced Stellar features
const initialAdvancedFeatures = [
  {
    title: 'Donate to Research',
    emoji: '💰',
    modalType: 'donation',
  },
  {
    title: 'Share Data with Physician',
    emoji: '🔄',
    modalType: 'dataSharing',
  },
  {
    title: 'Earn Rewards',
    description: 'Earn rewards for consistent tracking and completing educational modules. Rewards are distributed through Stellar\'s claimable balances.',
    emoji: '🏆',
    modalType: 'rewards',
  },
  {
    title: 'Monetize Your Data',
    emoji: '📊',
    modalType: 'dataMarketplace',
  },
];

// Extract Rewards feature
const rewardsFeature = initialAdvancedFeatures.find(feature => feature.modalType === 'rewards');
const advancedFeatures = initialAdvancedFeatures.filter(feature => feature.modalType !== 'rewards');

// Add this in the advancedFeatures array after the existing items
const breakthroughFeatures = [
  {
    title: 'AI-Powered Health Insights',
    description: 'Get personalized health insights from advanced machine learning algorithms that analyze your encrypted data while maintaining privacy.',
    emoji: '🧠',
    tabValue: 'ai-health-insights',
    color: 'purple',
  },
  {
    title: 'NFT-Based Educational Achievement',
    description: 'Earn verified NFT credentials by completing educational modules on menstrual and reproductive health.',
    emoji: '🎓',
    tabValue: 'nft-education',
    color: 'teal',
  },
  {
    title: 'Research Contribution Marketplace',
    description: 'Contribute anonymized health data to research projects of your choice and receive fair compensation.',
    emoji: '🔬',
    tabValue: 'research-marketplace',
    color: 'blue',
  },
];

// Add mock data for AI-powered task suggestions based on cycle phases
const cyclePhaseTaskRecommendations = {
  menstruation: {
    optimal: ['Rest and recovery', 'Gentle yoga', 'Creative writing', 'Reflection', 'Planning'],
    avoid: ['High-intensity workouts', 'Important meetings', 'Critical decisions']
  },
  follicular: {
    optimal: ['Learning new skills', 'Starting projects', 'Problem solving', 'Social activities', 'Moderate exercise'],
    avoid: ['Repetitive tasks', 'Mundane work']
  },
  ovulation: {
    optimal: ['Presentations', 'Job interviews', 'Networking', 'Important meetings', 'High-intensity workouts'],
    avoid: ['Detailed analytical work', 'Solitary tasks']
  },
  luteal: {
    optimal: ['Detail-oriented work', 'Organization', 'Research', 'Analysis', 'Routine tasks'],
    avoid: ['High-stress situations', 'Major social events']
  }
};

// User tasks with AI-assigned optimal phases
const userTasks: Task[] = [
  { id: 1, title: 'Go to the gym', optimalPhases: ['follicular', 'ovulation'], added: '2025-09-01', completed: false },
  { id: 2, title: 'Weekly team presentation', optimalPhases: ['ovulation'], added: '2025-09-01', completed: false },
  { id: 3, title: 'Organize workspace', optimalPhases: ['luteal'], added: '2025-09-01', completed: true },
  { id: 4, title: 'Learn new programming language', optimalPhases: ['follicular'], added: '2025-09-02', completed: false },
  { id: 5, title: 'Meditation session', optimalPhases: ['menstruation', 'luteal'], added: '2025-09-02', completed: false },
];

// Add mock data for mood trends and historical data
const moodTrendData = [
  { date: '2025-08-25', mood: 'Fair', phase: 'luteal' },
  { date: '2025-08-26', mood: 'Poor', phase: 'luteal' },
  { date: '2025-08-27', mood: 'Fair', phase: 'luteal' },
  { date: '2025-08-28', mood: 'Good', phase: 'menstruation' },
  { date: '2025-08-29', mood: 'Fair', phase: 'menstruation' },
  { date: '2025-08-30', mood: 'Fair', phase: 'menstruation' },
  { date: '2025-08-31', mood: 'Good', phase: 'menstruation' },
  { date: '2025-09-01', mood: 'Good', phase: 'menstruation' },
  { date: '2025-09-02', mood: 'Fair', phase: 'follicular' },
  { date: '2025-09-03', mood: 'Great', phase: 'follicular' },
];

const topSymptoms = [
  { name: 'Cramps', count: 8, phase: 'menstruation' },
  { name: 'Fatigue', count: 7, phases: ['menstruation', 'luteal'] },
  { name: 'Bloating', count: 6, phases: ['luteal', 'menstruation'] },
  { name: 'Headache', count: 4, phase: 'luteal' },
  { name: 'Mood Swings', count: 3, phase: 'luteal' },
];

// Default mood insights (will be replaced by AI-generated insights when available)
const defaultMoodInsights: MoodInsight[] = [
  {
    title: "Energy Correlation",
    text: "Your mood tends to improve 2 days after your period starts. Consider planning social activities during this time.",
    color: "blue"
  },
  {
    title: "Symptom Pattern",
    text: "Headaches most commonly occur 2-3 days before your period. Try preventative measures like staying hydrated.",
    color: "orange"
  },
  {
    title: "Mood Triggers",
    text: "Lower moods correlate with poor sleep the night before. Consider prioritizing sleep during your luteal phase.",
    color: "purple"
  }
];

// Helper function to get emoji for mood
const getMoodEmoji = (mood: string) => {
  switch (mood) {
    case 'Great': return { icon: FaSmile, color: 'green.500' };
    case 'Good': return { icon: FaSmile, color: 'blue.500' };
    case 'Fair': return { icon: FaMeh, color: 'yellow.500' };
    case 'Poor': return { icon: FaFrown, color: 'red.500' };
    default: return { icon: FaSmile, color: 'blue.500' };
  }
};

interface Task {
  id: number;
  title: string;
  optimalPhases: string[];
  added: string;
  completed: boolean;
  analysis?: TaskAnalysisResult;
}

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData, setCycleData] = useState<CycleDay[]>(recentCycleData.map(data => ({
    ...data,
    phase: getPhaseFromDay(data.day)
  })));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeFeature, setActiveFeature] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBahamutConnected, setIsBahamutConnected] = useState(false);
  const [cycleStreakBalance, setCycleStreakBalance] = useState('0');
  const [isLoadingStreakBalance, setIsLoadingStreakBalance] = useState(false);
  const [userStreak, setUserStreak] = useState<{
    currentStreak: number;
    longestStreak: number;
    lastCheckInTimestamp: number;
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>(userTasks);
  const [newTask, setNewTask] = useState('');
  const [isAnalyzingTask, setIsAnalyzingTask] = useState(false);
  const [trackerTabIndex, setTrackerTabIndex] = useState(0);
  
  // Add state for AI-generated insights
  const [moodInsights, setMoodInsights] = useState<MoodInsight[]>(defaultMoodInsights);
  const [commonPattern, setCommonPattern] = useState<string>(`Based on your history, <b>Fatigue</b> and <b>Headaches</b> are common during your current phase. Consider extra rest and hydration.`);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Add state for detailed health insights
  const [detailedInsights, setDetailedInsights] = useState<DetailedHealthInsight[]>([]);
  const [isLoadingDetailedInsights, setIsLoadingDetailedInsights] = useState(false);
  
  // Animated card style
  const cardGradient = useColorModeValue(
    'linear(to-r, #8A2BE2, #D53F8C)',
    'linear(to-r, #8A2BE2, #D53F8C)'
  );
  
  // Button style
  const animatedGradientStyle = {
    bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
    bgSize: '200% 100%',
    animation: `${animatedGradient} 3s ease infinite`,
    color: 'white',
    _hover: {
      bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
      bgSize: '200% 100%',
      animation: `${animatedGradient} 2s ease infinite`,
    }
  };

  // Load user data including XLM balance
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingBalance(true);
        const balance = await stellarContractService.getXLMBalance();
        setXlmBalance(balance);
      } catch (error) {
        console.error('Error loading XLM balance:', error);
        // Use a fallback balance
        setXlmBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    loadData();
  }, []);
  
  // Check Bahamut wallet connection and load data
  useEffect(() => {
    const checkBahamutConnection = async () => {
      try {
        setIsLoadingStreakBalance(true);
        const isConnected = await bahamutContractService.isWalletConnected();
        setIsBahamutConnected(isConnected);
        
        if (isConnected) {
          // Load token balance
          const balance = await bahamutContractService.getTokenBalance();
          setCycleStreakBalance(balance);
          
          // Load user streak
          const streak = await bahamutContractService.getUserStreak();
          if (streak) {
            setUserStreak(streak);
          }
        }
      } catch (error) {
        console.error('Error checking Bahamut connection:', error);
      } finally {
        setIsLoadingStreakBalance(false);
      }
    };
    
    checkBahamutConnection();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Open feature modal or navigate to settings page
  const openFeatureModal = (feature: any) => {
    // If this feature is settings, navigate directly
    if (feature.modalType === 'settings') {
      navigate('/settings');
      return;
    }
    
    // Otherwise open the modal
    setActiveFeature(feature);
    onOpen();
  };

  // Simulate fetching data
  useEffect(() => {
    // This would be an actual API call in a real application
    const loadData = async () => {
      // Actual data fetching would happen here
    };
    
    loadData();
  }, []);
  
  const handleDonate = async () => {
    setCurrentAction('donate');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed for donation");
      }
      
      // Get values from form
      const initiativeSelect = document.querySelector('select[placeholder="Select initiative"]') as HTMLSelectElement;
      const amountInput = document.querySelector('input[placeholder="Amount"]') as HTMLInputElement;
      const currencySelect = document.querySelector('select[placeholder="Select currency"]') as HTMLSelectElement;
      
      const initiativeId = initiativeSelect?.value || 'research1';
      const amount = amountInput?.value ? parseFloat(amountInput.value) : 10;
      const currency = currencySelect?.value || 'XLM';
      
      // Use the Stellar-specific donation implementation
      const success = await stellarContractService.makeDonation(amount, initiativeId, currency);
      
      if (success) {

        localStorage.setItem('total', (parseFloat(localStorage.getItem('total') || '0') - amount).toString());

        toast({
          title: 'Donation Successful',
          description: 'Thank you for your contribution!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        
        // Refresh the XLM balance
        const balance = await stellarContractService.getXLMBalance();
        setXlmBalance(balance);
      } else {
        throw new Error("Failed to complete donation");
      }
    } catch (error) {
      console.error('Error during donation authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleConnectBahamut = async () => {
    try {
      const success = await bahamutContractService.connectWallet();
      if (success) {
        setIsBahamutConnected(true);
        
        // Load token balance
        const balance = await bahamutContractService.getTokenBalance();
        setCycleStreakBalance(balance);
        
        // Load user streak
        const streak = await bahamutContractService.getUserStreak();
        if (streak) {
          setUserStreak(streak);
        }
        
        toast({
          title: 'Wallet Connected',
          description: 'Your MetaMask wallet is now connected to Bahamut network.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Failed to connect to MetaMask. Please make sure it is installed and unlocked.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error connecting to Bahamut:', error);
      toast({
        title: 'Connection Error',
        description: 'An error occurred while connecting to Bahamut network.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleDailyCheckIn = async () => {
    setCurrentAction('dailyCheckIn');
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      if (!isBahamutConnected) {
        await handleConnectBahamut();
      }
      
      const success = await bahamutContractService.dailyCheckIn();
      
      if (success) {
        toast({
          title: 'Daily Check-In Successful',
          description: 'You have successfully checked in and earned rewards!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh balances and streak
        const balance = await bahamutContractService.getTokenBalance();
        setCycleStreakBalance(balance);
        
        const streak = await bahamutContractService.getUserStreak();
        if (streak) {
          setUserStreak(streak);
        }
        
        onClose();
      } else {
        throw new Error("Failed to check in");
      }
    } catch (error) {
      console.error('Error during daily check-in:', error);
      setAuthError(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleClaimRewards = async () => {
    setCurrentAction('claimRewards');
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Check if we're using Bahamut or Stellar
      if (isBahamutConnected) {
        // Use Bahamut rewards claiming
        const success = await bahamutContractService.claimAllRewards();
        
        if (success) {
          toast({
            title: 'Rewards Claimed',
            description: 'Your CycleStreak tokens have been added to your wallet!',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Refresh the CSTRK balance
          const balance = await bahamutContractService.getTokenBalance();
          setCycleStreakBalance(balance);
          
          onClose();
        } else {
          throw new Error("Failed to claim rewards");
        }
      } else {
        // Use Stellar for older implementation (legacy support)
        const authResult = await passkeyService.authenticateWithPasskey();
        
        if (!authResult.success) {
          throw new Error("Authentication failed");
        }
        
        // Use the Stellar-specific rewards claiming implementation
        const success = await stellarContractService.claimRewards();
        
        if (success) {
          toast({
            title: 'Rewards Claimed',
            description: `25 XLM has been added to your wallet!`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Refresh the XLM balance
          const balance = await stellarContractService.getXLMBalance();
          setXlmBalance(balance);
          
          onClose();
        } else {
          throw new Error("Failed to claim rewards");
        }
      }
    } catch (error) {
      console.error('Error during rewards claiming:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to claim rewards');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleCreateSecureShare = async () => {
    setCurrentAction('dataSharing');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed for data sharing");
      }
      
      // Get values from form
      const recipientInput = document.querySelector('input[placeholder="Healthcare provider\'s Stellar address or email"]') as HTMLInputElement;
      const dataCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      const durationSelect = document.querySelector('select[placeholder="Select duration"]') as HTMLSelectElement;
      
      const recipientAddress = recipientInput?.value || 'example@healthcare.org';
      const dataTypes = Array.from(dataCheckboxes).map(cb => cb.parentElement?.textContent?.trim() || '');
      
      // Convert duration to hours
      let durationHours = 24; // default
      if (durationSelect?.value === '1week') {
        durationHours = 24 * 7;
      } else if (durationSelect?.value === '1month') {
        durationHours = 24 * 30;
      }
      
      // Use the Stellar-specific data sharing implementation
      const success = await stellarContractService.shareHealthData(recipientAddress, dataTypes, durationHours);
      
      if (success) {
        toast({
          title: 'Secure Share Created',
          description: 'Your health data has been securely shared.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to share data");
      }
    } catch (error) {
      console.error('Error during data sharing authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleValidationAction = async (actionName: string) => {
    setCurrentAction(actionName);
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error(`Authentication failed for ${actionName}`);
      }
      
      let validationType = '';
      if (actionName === 'zk-validate-symptom') {
        validationType = 'symptoms';
      } else if (actionName === 'zk-create-validation') {
        // Get the selected validation type
        const validationSelect = document.querySelector('select[placeholder="Select validation type"]') as HTMLSelectElement;
        validationType = validationSelect?.value || 'cycle';
      }
      
      // Use the Stellar-specific ZK validation implementation
      const success = await stellarContractService.validateDataWithZKP(validationType);
      
      if (success) {
        toast({
          title: 'Validation Processed',
          description: `Your request for ${actionName.replace('zk-', '')} has been processed.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to process validation");
      }
    } catch (error) {
      console.error(`Error during ${actionName} authentication:`, error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleDataMarketplaceAction = async (actionName: string) => {
    setCurrentAction(actionName);
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error(`Authentication failed for ${actionName}`);
      }
      
      let success = false;
      
      if (actionName === 'market-contribute') {
        // Get the selected pool and data types
        const poolSelect = document.querySelector('select[placeholder="Select research pool"]') as HTMLSelectElement;
        const poolId = poolSelect?.value || 'cycle';
        const dataTypes = [poolId]; // In a real app, we'd have specific data types
        
        // Use the Stellar-specific data contribution implementation
        success = await stellarContractService.contributeDataToMarketplace(poolId, dataTypes);
      } else if (actionName === 'market-claim') {
        // Use the Stellar-specific earnings claiming implementation
        success = await stellarContractService.claimDataMarketplaceEarnings();
        
        if (success) {
          // Refresh the XLM balance
          const balance = await stellarContractService.getXLMBalance();
          setXlmBalance(balance);
        }
      }
      
      if (success) {
        let title = 'Action Processed';
        let description = `Your request for ${actionName.replace('market-', '')} has been processed.`;
        
        if (actionName === 'market-contribute') {
          title = 'Data Contribution Successful';
          description = 'Your anonymized data has been contributed.';
        } else if (actionName === 'market-claim') {
          title = 'Earnings Claimed';
          description = 'Your earnings have been added to your wallet.';
        }
        
        toast({
          title,
          description,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error(`Failed to process ${actionName}`);
      }
    } catch (error) {
      console.error(`Error during ${actionName} authentication:`, error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  // Health alerts configuration moved to HealthAlertsPage

  // Function to handle updates to cycle data
  const handleCycleDataUpdate = (updatedData: CycleDay) => {
    // Check if we're updating an existing entry or adding a new one
    const existingIndex = cycleData.findIndex(data => data.date === updatedData.date);
    
    if (existingIndex >= 0) {
      // Update existing entry
      const updatedCycleData = [...cycleData];
      updatedCycleData[existingIndex] = updatedData;
      setCycleData(updatedCycleData);
    } else {
      // Add new entry
      setCycleData([...cycleData, updatedData]);
    }
    
    toast({
      title: 'Cycle data saved',
      description: 'Your entry has been recorded successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Get current phase based on cycle data
  const getCurrentPhase = () => {
    if (!cycleData || cycleData.length === 0) return 'follicular';
    return cycleData[0].phase || 'follicular';
  };
  
  const currentPhase = getCurrentPhase();
  
  // Load AI-generated insights when component mounts or currentPhase changes
  useEffect(() => {
    const loadHealthInsights = async () => {
      setIsLoadingInsights(true);
      try {
        const insights = await geminiService.generateHealthInsights(cycleData, currentPhase);
        setMoodInsights(insights.moodInsights);
        setCommonPattern(insights.commonPatterns);
      } catch (error) {
        console.error('Error loading health insights:', error);
        // Fallback to defaults is handled by the service
      } finally {
        setIsLoadingInsights(false);
      }
    };
    
    loadHealthInsights();
  }, [cycleData, currentPhase]);
  
  // Function to handle adding a new task
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    
    setIsAnalyzingTask(true);
    
    try {
      // Use Gemini to analyze the task
      const analysis = await geminiService.analyzeTask(newTask);
      
      const newTaskObj: Task = {
        id: tasks.length + 1,
        title: newTask,
        optimalPhases: analysis.optimalPhases,
        added: format(new Date(), 'yyyy-MM-dd'),
        completed: false,
        analysis: analysis,
      };
      
      setTasks([...tasks, newTaskObj]);
      setNewTask('');
      
      toast({
        title: 'Task Added',
        description: `Task analyzed and optimized for ${analysis.optimalPhases.join(', ')} phase(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error analyzing task:', error);
      toast({
        title: 'Task Analysis Error',
        description: 'Could not analyze task with AI. Added with default settings.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      
      // Fallback to basic task addition
      const newTaskObj: Task = {
        id: tasks.length + 1,
        title: newTask,
        optimalPhases: [currentPhase],
        added: format(new Date(), 'yyyy-MM-dd'),
        completed: false,
      };
      
      setTasks([...tasks, newTaskObj]);
      setNewTask('');
    } finally {
      setIsAnalyzingTask(false);
    }
  };
  
  const toggleTaskComplete = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Modal content based on feature type
  const renderModalContent = () => {
    if (!activeFeature) return null;
    
    switch (activeFeature.modalType) {
      case 'donation':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Donate to Research</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Support menstrual health research initiatives. Donate in any currency, automatically converted to the recipient's preferred currency.</Text>
                <FormControl>
                  <FormLabel>Initiative</FormLabel>
                  <Select placeholder="Select initiative">
                    <option value="research1">Women's Health Research Fund</option>
                    <option value="research2">Menstrual Equity Initiative</option>
                    <option value="research3">Global Period Poverty Program</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Donation Amount</FormLabel>
                  <Input type="number" placeholder="Amount" />
                </FormControl>
                <FormControl>
                  <FormLabel>Donation Currency</FormLabel>
                  <Select placeholder="Select currency">
                    <option value="xlm">XLM (Stellar Lumens)</option>
                    <option value="usdc">USDC</option>
                    <option value="btc">BTC</option>
                  </Select>
                </FormControl>
                {authError && currentAction === 'donate' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3} 
                onClick={handleDonate}
                isLoading={isAuthenticating && currentAction === 'donate'}
                loadingText="Authenticating..."
              >
                Donate Now
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      case 'dataSharing':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Share Health Data</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Securely share your health data with medical professionals using time-limited multi-signature authorization that automatically expires.</Text>
                <FormControl>
                  <FormLabel>Share With</FormLabel>
                  <Input placeholder="Healthcare provider's Stellar address or email" />
                </FormControl>
                <FormControl>
                  <FormLabel>Data to Share</FormLabel>
                  <VStack align="start">
                    <Checkbox>Cycle Data</Checkbox>
                    <Checkbox>Symptom History</Checkbox>
                    <Checkbox>Medication Records</Checkbox>
                  </VStack>
                </FormControl>
                <FormControl>
                  <FormLabel>Access Duration</FormLabel>
                  <Select placeholder="Select duration">
                    <option value="1day">24 hours</option>
                    <option value="1week">1 week</option>
                    <option value="1month">1 month</option>
                  </Select>
                </FormControl>
                {authError && currentAction === 'dataSharing' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3} 
                onClick={handleCreateSecureShare}
                isLoading={isAuthenticating && currentAction === 'dataSharing'}
                loadingText="Authenticating..."
              >
                Create Secure Share
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      case 'rewards':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Rewards Program</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Tabs variant="soft-rounded" colorScheme="purple" mb={4}>
                <TabList>
                  <Tab>Bahamut Rewards</Tab>
                  <Tab>Stellar Rewards</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      {!isBahamutConnected ? (
                        <Box textAlign="center" py={4}>
                          <Text mb={4}>Connect your MetaMask wallet to access the new daily rewards system on Bahamut blockchain.</Text>
                          <Button 
                            colorScheme="blue" 
                            onClick={handleConnectBahamut}
                            mb={4}
                          >
                            Connect MetaMask
                          </Button>
                        </Box>
                      ) : (
                        <>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel>CSTRK Balance</StatLabel>
                              <StatNumber>{parseFloat(cycleStreakBalance).toFixed(2)}</StatNumber>
                              <StatHelpText>CycleStreak Tokens</StatHelpText>
                            </Stat>
                            <Stat>
                              <StatLabel>Current Streak</StatLabel>
                              <StatNumber>{userStreak?.currentStreak || 0} days</StatNumber>
                              <StatHelpText>Longest: {userStreak?.longestStreak || 0} days</StatHelpText>
                            </Stat>
                          </SimpleGrid>
                          
                          <Box>
                            <Button
                              colorScheme="green"
                              width="100%"
                              onClick={handleDailyCheckIn}
                              isLoading={isAuthenticating && currentAction === 'dailyCheckIn'}
                              loadingText="Checking in..."
                              mb={4}
                            >
                              Daily Check-in
                            </Button>
                          </Box>
                          
                          <Divider />
                          
                          <Text fontWeight="bold" mb={2}>Achievements & Rewards</Text>
                          <Button
                            colorScheme="purple"
                            width="100%"
                            onClick={handleClaimRewards}
                            isLoading={isAuthenticating && currentAction === 'claimRewards'}
                            loadingText="Claiming..."
                          >
                            Claim All Rewards
                          </Button>
                        </>
                      )}
                      
                      {authError && (currentAction === 'dailyCheckIn' || currentAction === 'claimRewards') && (
                        <Alert status="error" borderRadius="md" mt={4}>
                          <AlertIcon />
                          <AlertDescription>{authError}</AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Stat>
                        <StatLabel>Available Rewards</StatLabel>
                        <StatNumber>25 XLM</StatNumber>
                        <StatHelpText>Earned from consistent tracking (Legacy)</StatHelpText>
                      </Stat>
                      <Divider />
                      <Text fontWeight="bold">Completed Achievements</Text>
                      <HStack>
                        <Badge colorScheme="green">First Entry</Badge>
                        <Badge colorScheme="purple">7-Day Streak</Badge>
                        <Badge colorScheme="blue">Educational Quiz</Badge>
                      </HStack>
                      <Divider />
                      <Text fontWeight="bold">Next Achievements</Text>
                      <VStack align="start">
                        <HStack>
                          <Text>30-Day Tracking Streak</Text>
                          <Progress value={70} size="sm" colorScheme="purple" borderRadius="full" flex="1" />
                          <Text>+50 XLM</Text>
                        </HStack>
                        <HStack>
                          <Text>Complete Health Course</Text>
                          <Progress value={40} size="sm" colorScheme="purple" borderRadius="full" flex="1" />
                          <Text>+30 XLM</Text>
                        </HStack>
                      </VStack>
                      
                      <Text fontSize="sm" color="orange.500" mt={2}>
                        Note: We are transitioning to our new rewards system on Bahamut. Please switch to the Bahamut Rewards tab.
                      </Text>
                      
                      {authError && currentAction === 'claimRewards' && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          <AlertDescription>{authError}</AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );

      case 'dataMarketplace':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Data Marketplace</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Contribute anonymized data to research pools and earn rewards through Stellar's trustless revenue sharing.</Text>
                <Tabs variant="soft-rounded" colorScheme="purple" isFitted>
                  <TabList>
                    <Tab>Contribute Data</Tab>
                    <Tab>Your Earnings</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Research Pool</FormLabel>
                          <Select placeholder="Select research pool">
                            <option value="cycle">Menstrual Cycle Research</option>
                            <option value="symptoms">Symptom Correlation Study</option>
                            <option value="wellness">Wellness & Lifestyle Impact</option>
                          </Select>
                        </FormControl>
                        <Text fontSize="sm">
                          By contributing, you'll share anonymized data with researchers while maintaining privacy through zero-knowledge proofs.
                        </Text>
                        <Button 
                          sx={animatedGradientStyle}
                          onClick={() => handleDataMarketplaceAction('market-contribute')}
                          isLoading={isAuthenticating && currentAction === 'market-contribute'}
                          loadingText="Authenticating..."
                        >
                          Contribute Data
                        </Button>
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <Stat mb={4}>
                        <StatLabel>Total Earnings</StatLabel>
                        <StatNumber>12.5 XLM</StatNumber>
                        <StatHelpText>From 3 research contributions</StatHelpText>
                      </Stat>
                      <Button 
                        sx={animatedGradientStyle} 
                        size="sm"
                        onClick={() => handleDataMarketplaceAction('market-claim')}
                        isLoading={isAuthenticating && currentAction === 'market-claim'}
                        loadingText="Authenticating..."
                      >
                        Claim Earnings
                      </Button>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                {authError && currentAction?.startsWith('market-') && (
                  <Alert status="error" borderRadius="md" mt={4}>
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );
        
      case 'settings':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Manage your application settings, including health alerts preferences.</Text>
                <Text>Click the button below to navigate to the Settings page.</Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3}
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
              >
                Go to Settings
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      default:
        return null;
    }
  };

  // Add a new function to generate detailed insights
  const handleGenerateDetailedInsights = async () => {
    setIsLoadingDetailedInsights(true);
    try {
      const insights = await geminiService.generateDetailedHealthInsights(cycleData);
      setDetailedInsights(insights);
      toast({
        title: 'Insights Generated',
        description: 'New health insights have been generated based on your data.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating detailed health insights:', error);
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate insights. Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDetailedInsights(false);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" bgGradient={cardGradient} bgClip="text">
            Welcome, {user?.username || 'User'}
          </Heading>
          <Text color="gray.600">your secure menstrual health companion</Text>
        </Box>
        <HStack>
          <Button 
            leftIcon={<Box fontSize="xl">{rewardsFeature?.emoji || '🏆'}</Box>}
            colorScheme="purple"
            size="sm"
            onClick={() => openFeatureModal(rewardsFeature)}
            mr={2}
          >
            Earn Rewards
          </Button>
          <Stat textAlign="right" mr={4}>
            <StatLabel>Wallet Balance</StatLabel>
            <StatNumber fontSize="lg">
              {isLoadingBalance ? (
                <Spinner size="sm" color="purple.500" mr={2} />
              ) : (
                `${xlmBalance?.toFixed(2) || '0.00'} XLM`
              )}
            </StatNumber>
          </Stat>
          <Badge colorScheme="purple" fontSize="0.8em" p={2} borderRadius="full">
            Secured with Stellar Blockchain
          </Badge>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label='User menu'
              icon={<Avatar size="sm" name={user?.username || 'User'} bg="#D53F8C" />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* Navigation Bar */}
      <Box
        py={2}
        px={0}
        mb={8}
        bg="gray.100"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <HStack spacing={4} justify="center">
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'dashboard' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'dashboard' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('dashboard')}
          >
            <Icon as={FaHome} mr={2} />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'ai-health-insights' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'ai-health-insights' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('ai-health-insights')}
          >
            <Icon as={FaBrain} mr={2} />
            AI Health Insights
          </Button>
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'nft-education' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'nft-education' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('nft-education')}
          >
            <Icon as={FaGraduationCap} mr={2} />
            NFT Education
          </Button>
        </HStack>
      </Box>

      {/* Main content based on tab */}
      {activeTab === 'dashboard' && (
      <>
      {/* Cycle data cards */}
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={8} mb={6}>
        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="460px" /* Increased height to fit full calendar */
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
            display="flex"
            flexDirection="column"
          >
            <CardHeader 
              bgGradient={cardGradient} 
              borderTopRadius="lg"
              pb={3} /* Consistent padding */
            >
              <Heading size="md" color="white">Cycle Overview</Heading>
            </CardHeader>
            <CardBody 
              overflowY="auto" /* Make content scrollable */
              flexGrow={1} /* Fill available space */
              p={4} /* Consistent padding */
            >
              <VStack spacing={3} align="stretch">
              <Stat>
                <StatLabel>Current Cycle Day</StatLabel>
                <StatNumber>Day {cycleData[0].day}</StatNumber>
                <StatHelpText>Started {cycleData[0].date}</StatHelpText>
              </Stat>
              <Progress 
                value={cycleData[0].day * 3.5} 
                size="sm" 
                colorScheme="purple" 
                borderRadius="full"
                  mt={0}
                  mb={0}
              />
                <Button 
                  sx={animatedGradientStyle} 
                  size="sm" 
                  width="full"
                  mb={2}
                  onClick={() => {
                    const today = new Date();
                    const formattedToday = format(today, 'yyyy-MM-dd');
                    const existingEntry = cycleData.find(d => d.date === formattedToday);
                    if (!existingEntry) {
                      handleCycleDataUpdate({
                        date: formattedToday,
                        day: cycleData[0].day + Math.floor((today.getTime() - new Date(cycleData[0].date).getTime()) / (1000 * 60 * 60 * 24)),
                        mood: 'Good',
                        symptoms: [],
                        phase: 'menstruation', // This will be calculated properly in the calendar component
                      });
                    }
                    navigate('/log-entry');
                  }}
                >
                Log Today
              </Button>
                
                {/* Calendar Component */}
                <Box mt={1} width="100%" overflowX="auto">
                  <CycleCalendar 
                    cycleData={cycleData}
                    onDataUpdate={handleCycleDataUpdate}
                    currentCycleStartDate={cycleData[0].date}
                    cycleLength={28}
                    periodLength={5}
                  />
                </Box>
                
                {/* Full Calendar Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  width="full"
                  mt={2}
                  leftIcon={<FaCalendarAlt />}
                  onClick={() => navigate('/full-calendar')}
                >
                  View Full Calendar
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="460px"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
            display="flex"
            flexDirection="column"
          >
            <CardHeader 
              bgGradient={cardGradient} 
              borderTopRadius="lg"
              pb={3}
            >
              <Heading size="md" color="white">Productivity & Cycle Sync</Heading>
            </CardHeader>
            <CardBody 
              overflowY="auto"
              flexGrow={1}
              p={4}
            >
              <VStack spacing={4} align="stretch">
                {/* Tasks Section - Now at the top */}
                <Box>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Your Tasks</Heading>
                    <Badge 
                      colorScheme={currentPhase === 'menstruation' ? 'red' : 
                                currentPhase === 'follicular' ? 'yellow' : 
                                currentPhase === 'ovulation' ? 'green' : 'purple'} 
                      variant="subtle"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
                    </Badge>
                  </Flex>
                  
                  {/* Task Lists by Phase with color coding */}
                  <VStack align="stretch" spacing={3}>
                    {/* Optimal tasks for current phase */}
                    {tasks.filter(task => task.optimalPhases.includes(currentPhase) && !task.completed).length > 0 && (
                <Box>
                        <Flex align="center" mb={2}>
                          <Box width="8px" height="8px" borderRadius="full" bg="green.400" mr={2}></Box>
                          <Text fontSize="sm" fontWeight="medium" color="green.600">Optimal For Now</Text>
                        </Flex>
                        <VStack align="stretch" spacing={1}>
                          {tasks.filter(task => task.optimalPhases.includes(currentPhase) && !task.completed)
                            .map(task => (
                              <Flex 
                                key={task.id} 
                                align="center" 
                                p={2} 
                                bg="green.50" 
                                borderRadius="md"
                                borderLeft="4px solid"
                                borderLeftColor="green.400"
                              >
                                <Checkbox 
                                  isChecked={task.completed}
                                  onChange={() => toggleTaskComplete(task.id)}
                                  mr={3}
                                  colorScheme="green"
                                />
                                <Text flex={1} fontSize="md">{task.title}</Text>
                              </Flex>
                            ))}
                        </VStack>
                </Box>
                    )}
                    
                    {/* Tasks for other phases - grouped by phase */}
                    {(() => {
                      const renderedIds = new Set<number>();
                      return ['follicular', 'ovulation', 'luteal', 'menstruation']
                        .filter(phase => phase !== currentPhase)
                        .map(phase => {
                          const phaseTasks = tasks.filter(task => 
                            task.optimalPhases.includes(phase) && 
                            !task.optimalPhases.includes(currentPhase) &&
                            !task.completed &&
                            !renderedIds.has(task.id)
                          );
                          phaseTasks.forEach(task => renderedIds.add(task.id));
 
                          if (phaseTasks.length === 0) return null;
 
                          const phaseColors = {
                             menstruation: { bg: 'red.50', border: 'red.400', text: 'red.600' },
                             follicular: { bg: 'yellow.50', border: 'yellow.400', text: 'yellow.700' },
                             ovulation: { bg: 'green.50', border: 'green.400', text: 'green.600' },
                             luteal: { bg: 'purple.50', border: 'purple.400', text: 'purple.600' }
                           };
 
                          const color = phaseColors[phase as keyof typeof phaseColors];
 
                          return (
                             <Box key={phase}>
                               <Flex align="center" mb={2}>
                                 <Box width="8px" height="8px" borderRadius="full" bg={color.border} mr={2}></Box>
                                 <Text fontSize="sm" fontWeight="medium" color={color.text}>
                                   For {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                                 </Text>
                               </Flex>
                               <VStack align="stretch" spacing={1}>
                                 {phaseTasks.map(task => (
                                   <Flex 
                                     key={task.id} 
                                     align="center" 
                                     p={2} 
                                     bg={color.bg} 
                                     borderRadius="md"
                                     borderLeft="4px solid"
                                     borderLeftColor={color.border}
                                   >
                                     <Checkbox 
                                       isChecked={task.completed}
                                       onChange={() => toggleTaskComplete(task.id)}
                                       mr={3}
                                       colorScheme={
                                         phase === 'menstruation' ? 'red' : 
                                         phase === 'follicular' ? 'yellow' : 
                                         phase === 'ovulation' ? 'green' : 'purple'
                                       }
                                     />
                                     <Box flex={1}>
                                       <Text fontSize="md">{task.title}</Text>
                                       {task.analysis && (
                                         <Tooltip
                                           label={
                                             <VStack align="start" spacing={1} p={2}>
                                               <Text fontWeight="bold">AI Analysis:</Text>
                                               <Text fontSize="sm">{task.analysis.reasoning}</Text>
                                               <Text fontSize="sm">Energy Level: {task.analysis.energyLevel}</Text>
                                               {task.analysis.recommendations.map((rec, idx) => (
                                                 <Text key={idx} fontSize="sm">• {rec}</Text>
                                               ))}
                                             </VStack>
                                           }
                                           placement="auto"
                                           hasArrow
                                           gutter={10}
                                           closeOnClick={false}
                                           openDelay={50}
                                           closeDelay={50}
                                         >
                                           <Box as="span" display="inline-block" tabIndex={0}>
                                             <Icon 
                                               as={FaBrain} 
                                               color={task.analysis.energyLevel === 'high' ? 'green.500' : task.analysis.energyLevel === 'low' ? 'red.500' : `${color.border}`} 
                                               ml={2} 
                                               boxSize={4}
                                               cursor="help" 
                                               verticalAlign="middle"
                                             />
                                           </Box>
                                         </Tooltip>
                                       )}
                                     </Box>
                                   </Flex>
                                 ))}
                               </VStack>
                             </Box>
                          );
                        });
                    })()}
                    
                    {/* Completed tasks at bottom */}
                    {tasks.filter(task => task.completed).length > 0 && (
                <Box>
                        <Flex align="center" mb={2}>
                          <Box width="8px" height="8px" borderRadius="full" bg="gray.300" mr={2}></Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500">Completed</Text>
                        </Flex>
                        <VStack align="stretch" spacing={1}>
                          {tasks.filter(task => task.completed)
                            .slice(0, 2) // Show just the last 2 completed tasks
                            .map(task => (
                              <Flex 
                                key={task.id} 
                                align="center" 
                                p={2} 
                                bg="gray.50" 
                                borderRadius="md"
                                borderLeft="4px solid"
                                borderLeftColor="gray.300"
                                opacity={0.7}
                              >
                                <Checkbox 
                                  isChecked={task.completed}
                                  onChange={() => toggleTaskComplete(task.id)}
                                  mr={3}
                                  colorScheme="gray"
                                />
                                <Text flex={1} fontSize="md" textDecoration="line-through">{task.title}</Text>
                              </Flex>
                            ))}
                          {tasks.filter(task => task.completed).length > 2 && (
                            <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                              + {tasks.filter(task => task.completed).length - 2} more completed
                            </Text>
                          )}
                        </VStack>
                </Box>
                    )}
                    
                    {/* Empty state */}
                    {tasks.filter(task => !task.completed).length === 0 && (
                      <Box py={6} textAlign="center">
                        <Text fontSize="sm" color="gray.500" mb={2}>No active tasks</Text>
                        <Text fontSize="xs" color="gray.400">Add a task to get started!</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
                
                <Divider />
                
                {/* Phase Information - Now in the middle */}
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={3}>Phase Recommendations</Text>
                  <Flex justify="space-between" gap={2} mb={2}>
                    {cyclePhaseTaskRecommendations[currentPhase as keyof typeof cyclePhaseTaskRecommendations]
                      .optimal.slice(0, 3).map((task, idx) => (
                        <Box key={idx} p={3} borderRadius="md" bg="purple.50" flex="1" textAlign="center">
                          <Flex align="center" justify="center" mb={1}>
                            <Icon as={FaCheck} color="green.500" mr={1} />
                            <Text fontSize="sm" fontWeight="medium">{task}</Text>
                          </Flex>
                </Box>
                      ))}
                  </Flex>
                  
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    {currentPhase === 'menstruation' ? 'Focus on rest and gentle activities.' : 
                     currentPhase === 'follicular' ? 'Great time for learning and starting new projects.' : 
                     currentPhase === 'ovulation' ? 'Peak energy for social interaction and performance.' : 
                     'Excellent for detailed work and organizing.'}
                  </Text>
                </Box>
                
                <Divider />
                
                {/* Add Task Section - Now at bottom */}
                <Flex align="center" mt={2}>
                  <Input 
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                    }}
                    mr={2}
                  />
                  <Button 
                    colorScheme="purple" 
                    onClick={handleAddTask}
                    isLoading={isAnalyzingTask}
                    loadingText="Analyzing"
                  >
                    Add
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="460px"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
            display="flex"
            flexDirection="column"
          >
            <CardHeader 
              bgGradient={cardGradient} 
              borderTopRadius="lg"
              pb={3}
            >
              <Heading size="md" color="white">Mood & Symptom Tracker</Heading>
            </CardHeader>
            <CardBody 
              overflowY="auto"
              flexGrow={1}
              p={4}
            >
              <VStack align="stretch" spacing={4}>
                <Tabs 
                  variant="soft-rounded" 
                  colorScheme="purple" 
                  size="sm"
                  index={trackerTabIndex}
                  onChange={(index) => setTrackerTabIndex(index)}
                >
                  <TabList>
                    <Tab>Today</Tab>
                    <Tab>History</Tab>
                    <Tab>Insights</Tab>
                  </TabList>
                  
                  <TabPanels mt={2}>
                    {/* Today Tab */}
                    <TabPanel p={0}>
                      <VStack align="stretch" spacing={4}>
                        {/* Current Day Overview */}
                        <Box>
                          <Flex align="center" justify="space-between" mb={2}>
                            <Heading size="sm">Day {cycleData[0].day}: {format(new Date(cycleData[0].date), 'MMM d')}</Heading>
                            <Badge 
                              colorScheme={
                                cycleData[0].mood === 'Great' ? 'green' : 
                                cycleData[0].mood === 'Good' ? 'blue' : 
                                cycleData[0].mood === 'Fair' ? 'yellow' : 'red'
                              }
                              px={2}
                              py={1}
                              borderRadius="full"
                              display="flex"
                              alignItems="center"
                            >
                              <Icon 
                                as={getMoodEmoji(cycleData[0].mood || 'Good').icon} 
                                mr={1} 
                              />
                              {cycleData[0].mood}
                            </Badge>
                          </Flex>
                          
                          <Text fontSize="sm" mb={3}>
                            You're in your <Badge colorScheme={
                              cycleData[0].phase === 'menstruation' ? 'red' : 
                              cycleData[0].phase === 'follicular' ? 'yellow' : 
                              cycleData[0].phase === 'ovulation' ? 'green' : 'purple'
                            }>{cycleData[0].phase}</Badge> phase. 
                            {cycleData[0].phase === 'menstruation' 
                              ? ' Focus on self-care and rest.'
                              : cycleData[0].phase === 'follicular'
                              ? ' Your energy is building.' 
                              : cycleData[0].phase === 'ovulation'
                              ? ' Peak confidence and energy.'
                              : ' Your body is preparing for your next cycle.'}
                          </Text>
                          
                          {cycleData[0].symptoms && cycleData[0].symptoms.length > 0 ? (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb={1}>Today's Symptoms:</Text>
                              <Flex flexWrap="wrap" gap={2}>
                                {cycleData[0].symptoms?.map((symptom, i) => (
                                  <Tag key={i} colorScheme="pink" borderRadius="full" size="sm">
                                    {symptom}
                                  </Tag>
                                ))}
                              </Flex>
                            </Box>
                          ) : (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb={1}>No symptoms recorded today</Text>
                              <Button 
                                size="xs" 
                                leftIcon={<FaPlus />} 
                                colorScheme="purple" 
                                variant="outline"
                                onClick={() => navigate('/log-entry')}
                              >
                                Add symptoms
                              </Button>
                            </Box>
                          )}
                        </Box>
                        
                        {/* Mood Chart */}
                        <Box pt={2}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontSize="sm" fontWeight="medium">Recent Mood Trend</Text>
                            <IconButton 
                              aria-label="View all history" 
                              icon={<FaHistory />} 
                              size="xs" 
                              variant="ghost"
                              onClick={() => setTrackerTabIndex(1)} // Switch to History tab
                            />
                          </Flex>
                          <Box position="relative" height="60px" bg="gray.50" borderRadius="md" p={2}>
                            <Flex height="100%" align="flex-end">
                              {moodTrendData.slice(-7).map((day, i) => {
                                const { icon: MoodIcon, color } = getMoodEmoji(day.mood);
                                const heightMap = { 'Great': '100%', 'Good': '75%', 'Fair': '50%', 'Poor': '25%' };
                                const height = heightMap[day.mood as keyof typeof heightMap] || '50%';
                                const isToday = i === moodTrendData.slice(-7).length - 1;
                                
                                return (
                                  <Tooltip key={i} label={`${format(new Date(day.date), 'MMM d')}: ${day.mood}`}>
                                    <Box 
                                      flex="1"
                                      height={height}
                                      mx={0.5}
                                      bg={color}
                                      borderRadius="sm"
                                      opacity={isToday ? 1 : 0.7}
                                      _hover={{ opacity: 1 }}
                                      transition="all 0.2s"
                                      position="relative"
                                    >
                                      {isToday && (
                                        <Box 
                                          position="absolute" 
                                          top="-18px" 
                                          left="50%" 
                                          transform="translateX(-50%)"
                                        >
                                          <Icon as={MoodIcon} color={color} />
                                        </Box>
                                      )}
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Flex>
                          </Box>
                        </Box>
                        
                        {/* Common Patterns */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>Common Patterns</Text>
                          <Card variant="outline" size="sm">
                            <CardBody py={2} px={3} position="relative">
                              {isLoadingInsights && (
                                <Spinner
                                  size="xs"
                                  position="absolute"
                                  right="8px"
                                  top="8px"
                                  color="purple.500"
                                />
                              )}
                              <Text fontSize="xs" dangerouslySetInnerHTML={{ __html: commonPattern }} />
                            </CardBody>
                          </Card>
                        </Box>
                        
                        {/* Quick Actions */}
                        <Flex gap={2} justify="center" pt={1}>
                          <Button 
                            size="sm" 
                            leftIcon={<FaPlus />} 
                            colorScheme="purple" 
                            variant="solid"
                            onClick={() => navigate('/log-entry')}
                          >
                            Log Today
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => setTrackerTabIndex(2)} // Switch to Insights tab
                          >
                            View Insights
                          </Button>
                        </Flex>
                      </VStack>
                    </TabPanel>
                    
                    {/* History Tab */}
                    <TabPanel p={0}>
                      <VStack align="stretch" spacing={3}>
                        {/* Last 3 days summary */}
                        <Box borderRadius="md" overflow="hidden">
                {cycleData.map((day, index) => (
                            <Box 
                              key={index}
                              p={3}
                              borderBottom={index < cycleData.length - 1 ? "1px solid" : "none"}
                              borderColor="gray.100"
                              transition="background-color 0.2s"
                              _hover={{ bg: 'gray.50' }}
                            >
                              <Flex justify="space-between" align="center" mb={1}>
                                <HStack>
                                  <Text fontWeight="medium">Day {day.day}</Text>
                                  <Text fontSize="sm" color="gray.500">{format(new Date(day.date), 'MMM d')}</Text>
                                </HStack>
                                <Badge 
                                  colorScheme={
                        day.mood === 'Great' ? 'green' : 
                        day.mood === 'Good' ? 'blue' : 
                        day.mood === 'Fair' ? 'yellow' : 'red'
                                  }
                                >
                        {day.mood}
                      </Badge>
                              </Flex>
                              
                              <HStack spacing={2} flexWrap="wrap" mb={1}>
                                <Text fontSize="xs" color="gray.600" fontWeight="medium">Phase:</Text>
                                <Badge size="sm" colorScheme={
                                  day.phase === 'menstruation' ? 'red' : 
                                  day.phase === 'follicular' ? 'yellow' : 
                                  day.phase === 'ovulation' ? 'green' : 'purple'
                                } variant="subtle">
                                  {day.phase}
                      </Badge>
                    </HStack>
                              
                    <HStack spacing={2} flexWrap="wrap">
                                <Text fontSize="xs" color="gray.600" fontWeight="medium">Symptoms:</Text>
                                {(day.symptoms?.length ?? 0) > 0 ? 
                                  day.symptoms?.map((symptom, i) => (
                                    <Tag key={i} size="sm" colorScheme="pink" borderRadius="full" variant="subtle">
                            {symptom}
                          </Tag>
                        )) : 
                                  <Text fontSize="xs" color="gray.400">None recorded</Text>
                      }
                    </HStack>
                  </Box>
                ))}
                        </Box>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          width="full" 
                          leftIcon={<FaHistory />}
                          onClick={() => navigate('/full-calendar')}
                        >
                          View Full History
                        </Button>
              </VStack>
                    </TabPanel>
                    
                    {/* Insights Tab */}
                    <TabPanel p={0}>
                      <VStack align="stretch" spacing={4}>
                        {/* Top Symptoms */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>Your Top Symptoms</Text>
                          <VStack align="stretch" spacing={2}>
                            {topSymptoms.map((symptom, i) => (
                              <Flex key={i} align="center" justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                <HStack>
                                  <Text>{symptom.name}</Text>
                                  <Badge colorScheme="pink" variant="subtle">{symptom.count} times</Badge>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  Most common in: <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                                    {typeof symptom.phase === 'string' 
                                      ? symptom.phase 
                                      : symptom.phases?.join(', ')}
                                  </Badge>
                                </Text>
                              </Flex>
                            ))}
                          </VStack>
                        </Box>
                        
                        {/* Personalized Insights */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>Personalized Insights</Text>
                          {isLoadingInsights ? (
                            <Flex justify="center" py={4}>
                              <Spinner color="purple.500" />
                            </Flex>
                          ) : (
                            <VStack align="stretch" spacing={2}>
                              {moodInsights.map((insight, i) => (
                                <Card key={i} variant="outline" size="sm">
                                  <CardBody>
                                    <Flex>
                                      <Box mr={3}>
                                        <Icon 
                                          as={
                                            insight.color === "blue" ? FaChartLine :
                                            insight.color === "orange" ? FaRegLightbulb :
                                            insight.color === "green" ? FaCheckCircle :
                                            FaRegChartBar
                                          } 
                                          boxSize={5} 
                                          color={`${insight.color}.500`} 
                                        />
                                      </Box>
                                      <Box>
                                        <Text fontSize="sm" fontWeight="medium">{insight.title}</Text>
                                        <Text fontSize="xs" color="gray.600">{insight.text}</Text>
                                      </Box>
                                    </Flex>
            </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          )}
                        </Box>
                        
                        <Button 
                          size="sm" 
                          colorScheme="purple" 
                          leftIcon={<FaRegLightbulb />}
                          onClick={() => setActiveTab('ai-health-insights')}
                        >
                          Get More Insights
                        </Button>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            </CardBody>
            <CardFooter pt={0} px={4} pb={3}>
              <Text fontSize="sm" color="gray.500">
                Your data is securely encrypted and used to provide personalized insights
              </Text>
            </CardFooter>
          </Card>
        </GridItem>
      </Grid>

      {/* Advanced Stellar Features (now after the cycle data cards) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={8}>
        {advancedFeatures.map((feature, index) => (
          <Card 
            key={index} 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%" 
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader>
              <HStack>
                <Box
                  bg="#8A2BE220"
                  p={2}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xl"
                >
                  {feature.emoji}
                </Box>
                <Heading size="md">{feature.title}</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Text mb={0}>{feature.description}</Text>
              <Button 
                size="sm" 
                onClick={() => openFeatureModal(feature)}
                sx={animatedGradientStyle}
              >
                Explore
              </Button>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Box mt={10} p={6} borderRadius="lg" bg="gray.50" boxShadow="sm" textAlign="center">
        <Heading as="h3" size="md" mb={4}>
          Your Data Security
        </Heading>
        <Divider mb={4} />
        <List spacing={3}>
          <ListItem textAlign="center">
             Secured with Stellar blockchain technology and passkey authentication
          </ListItem>
          <ListItem textAlign="center">
             You own your data, your decision to sell it, your money
          </ListItem>
        </List>
      </Box>
      
      {/* Feature Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          {renderModalContent()}
        </ModalContent>
      </Modal>

      {/* Breakthrough Features Section */}
      </>
      )}

      {/* AI Health Insights Tab */}
      {activeTab === 'ai-health-insights' && (
        <Box>
          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="xl">AI-Powered Health Insights</Heading>
              <HStack spacing={4}>
                <Box width="250px">
                  <Select
                    placeholder="Select AI model"
                    defaultValue="symptom-correlation"
                  >
                    <option value="symptom-correlation">Symptom Correlation Engine (v2.0)</option>
                    <option value="cycle-analyzer">Cycle Pattern Analyzer (v1.2)</option>
                  </Select>
                </Box>
                <Button
                  colorScheme="purple"
                  leftIcon={<FaBrain />}
                  onClick={handleGenerateDetailedInsights}
                  isLoading={isLoadingDetailedInsights}
                  loadingText="Generating"
                >
                  Generate Insights
                </Button>
              </HStack>
            </Flex>
            
            <Text color="gray.600" mb={6}>
              Leverage machine learning algorithms running on Stellar Turrets to analyze your encrypted health data and identify patterns that might indicate health issues, all while ensuring your data remains private.
            </Text>
            
            <HStack mb={6}>
              <Tag colorScheme="green" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaLock} mr={2} />
                Privacy Preserving
              </Tag>
              <Tag colorScheme="blue" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaBrain} mr={2} />
                Federated Learning
              </Tag>
              <Tag colorScheme="purple" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaCheckCircle} mr={2} />
                Secure Computation
              </Tag>
            </HStack>
          </Box>

          {/* Loading state */}
          {isLoadingDetailedInsights && (
            <Flex justify="center" py={10}>
              <VStack>
                <Spinner size="xl" color="purple.500" thickness="4px" speed="0.65s" />
                <Text mt={4} color="gray.600">Analyzing your health data...</Text>
              </VStack>
            </Flex>
          )}

          {/* Insights cards */}
          {!isLoadingDetailedInsights && (
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              {detailedInsights.map((insight, index) => (
                <Card key={index} borderRadius="md" overflow="hidden">
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">{insight.title}</Heading>
                      <Badge 
                        colorScheme={
                          insight.category === "INFORMATIONAL" ? "blue" :
                          insight.category === "ADVISORY" ? "yellow" : "red"
                        }
                      >
                        {insight.category}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <Text>{insight.description}</Text>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <Flex width="100%" justify="space-between" align="center">
                      <HStack>
                        <Icon 
                          as={
                            insight.category === "INFORMATIONAL" ? FaInfoCircle :
                            insight.category === "ADVISORY" ? FaExclamationTriangle : FaBell
                          } 
                          color={
                            insight.category === "INFORMATIONAL" ? "blue.500" :
                            insight.category === "ADVISORY" ? "yellow.500" : "red.500"
                          } 
                        />
                        <Text fontSize="sm">Confidence: {insight.confidence}%</Text>
                      </HStack>
                      <Badge 
                        colorScheme={insight.verified ? "green" : "gray"}
                      >
                        {insight.verified ? "VERIFIED" : "UNVERIFIED"}
                      </Badge>
                    </Flex>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Show initial cards if no insights generated yet */}
              {detailedInsights.length === 0 && (
                <>
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Cycle Regularity Improving</Heading>
                  <Badge colorScheme="blue">INFORMATIONAL</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>Your cycle has shown improved regularity over the past 3 months.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaInfoCircle} color="blue.500" />
                    <Text fontSize="sm">Confidence: 85%</Text>
                  </HStack>
                  <Badge colorScheme="gray">UNVERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
            
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Potential Symptom Pattern</Heading>
                  <Badge colorScheme="yellow">ADVISORY</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>We've detected a pattern between certain foods and increased cramps.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaExclamationTriangle} color="yellow.500" />
                    <Text fontSize="sm">Confidence: 70%</Text>
                  </HStack>
                  <Badge colorScheme="gray">UNVERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
            
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Unusual Cycle Length</Heading>
                  <Badge colorScheme="red">ALERT</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>Your last cycle was significantly longer than your average. This could be due to stress, diet changes, or other factors.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaBell} color="red.500" />
                    <Text fontSize="sm">Confidence: 90%</Text>
                  </HStack>
                  <Badge colorScheme="green">VERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
                </>
              )}
          </Grid>
          )}
        </Box>
      )}

      {/* NFT Education Tab */}
      {activeTab === 'nft-education' && (
        <Box>
          <Box mb={8}>
            <Heading size="xl" mb={4}>NFT-Based Educational Achievement</Heading>
            <Text color="gray.600" mb={6}>
              Complete educational modules on menstrual and reproductive health to earn unique Stellar-based NFTs. 
              These NFTs serve as proof of your health knowledge and can unlock benefits from partner organizations.
            </Text>
            
            <HStack mb={6}>
              <Tag colorScheme="green" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaGraduationCap} mr={2} />
                Learn-to-Earn
              </Tag>
              <Tag colorScheme="blue" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaCertificate} mr={2} />
                Verifiable Knowledge
              </Tag>
              <Tag colorScheme="purple" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaMedal} mr={2} />
                Partner Benefits
              </Tag>
            </HStack>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="purple" mb={8}>
            <TabList>
              <Tab>Available Modules</Tab>
              <Tab>My Progress</Tab>
              <Tab>My NFT Collection</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Understanding Your Cycle Basics</Heading>
                        <Badge colorScheme="green">LEVEL 1</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Learn the fundamentals of menstrual health and cycle tracking.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Cycle Phases</Tag>
                        <Tag size="sm">Tracking Basics</Tag>
                        <Tag size="sm">Period Symptoms</Tag>
                      </HStack>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="green" leftIcon={<FaCheck />}>
                        Completed
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Nutrition and Your Cycle</Heading>
                        <Badge colorScheme="blue">LEVEL 2</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Explore how nutrition impacts your menstrual health and overall wellbeing.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Nutrition</Tag>
                        <Tag size="sm">Hormonal Balance</Tag>
                        <Tag size="sm">Diet Tips</Tag>
                      </HStack>
                      <Box mt={3}>
                        <Text fontSize="sm" mb={1}>Your Progress</Text>
                        <Progress value={60} colorScheme="purple" hasStripe size="sm" />
                      </Box>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="blue" leftIcon={<FaGraduationCap />}>
                        Continue
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Advanced Hormonal Health</Heading>
                        <Badge colorScheme="purple">LEVEL 3</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Dive deep into hormonal influences on your cycle and overall health.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Hormones</Tag>
                        <Tag size="sm">Endocrine System</Tag>
                        <Tag size="sm">Hormonal Disorders</Tag>
                      </HStack>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="purple" leftIcon={<FaGraduationCap />}>
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                </Grid>
              </TabPanel>
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Card>
                    <CardBody>
                      <Grid templateColumns="1fr 2fr 1fr" gap={6} alignItems="center">
                        <Flex direction="column">
                          <Heading size="md">Nutrition and Your Cycle</Heading>
                          <Badge colorScheme="blue" width="fit-content" mt={1}>Level 2</Badge>
                          <Text fontSize="sm" mt={2}>Started: 2023-08-15</Text>
                        </Flex>
                        <Box>
                          <Text mb={1}>Progress: 60%</Text>
                          <Progress value={60} colorScheme="purple" hasStripe size="md" />
                        </Box>
                        <Flex justify="flex-end">
                          <Button colorScheme="blue">Continue</Button>
                        </Flex>
                      </Grid>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              <TabPanel px={0}>
                <Box textAlign="center" p={8}>
                  <Icon as={FaCertificate} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No NFTs Earned Yet</Heading>
                  <Text>Complete educational modules to earn NFT credentials.</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {/* Feature Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          {renderModalContent()}
        </ModalContent>
      </Modal>

      {/* CycleBuddy AI Assistant */}
      <CycleBuddyAI cycleData={cycleData} currentPhase={currentPhase} />
    </Container>
  );
};

export default DashboardPage; 