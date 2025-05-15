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
  Image,
  Stack,
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
  Textarea,
  Select,
  Checkbox,
} from '@chakra-ui/react';
import { useAuthStore } from '../../services/auth/authService';
import { keyframes } from '@emotion/react';

// Create a keyframe animation for the gradient
const animatedGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Mock data
const recentCycleData = [
  { day: 1, mood: 'Good', symptoms: ['Cramps', 'Fatigue'], date: '2025-09-01' },
  { day: 2, mood: 'Fair', symptoms: ['Bloating'], date: '2025-09-02' },
  { day: 3, mood: 'Great', symptoms: [], date: '2025-09-03' },
];

// Information cards data
const infoCards = [
  {
    title: 'Cycle Health Tips',
    content: 'Regular exercise can help reduce menstrual pain and improve mood.',
    emoji: '📈',
  },
  {
    title: 'Did You Know?',
    content: 'The average menstrual cycle is 28 days, but anywhere from 21 to 35 days is considered normal.',
    emoji: '📅',
  },
  {
    title: 'Community Highlight',
    content: 'Join our discussion on natural remedies for menstrual discomfort.',
    emoji: '👥',
  },
];

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
const advancedFeatures = [
  {
    title: 'Donate to Research',
    description: 'Support menstrual health research initiatives using Stellar\'s path payment feature. Donate in any currency, automatically converted to the recipient\'s preferred currency.',
    emoji: '💰',
    modalType: 'donation',
  },
  {
    title: 'Share Health Data',
    description: 'Securely share your health data with medical professionals using time-limited multi-signature authorization that automatically expires.',
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
    title: 'Private Data Validation',
    description: 'Validate health metrics without revealing sensitive data through zero-knowledge proofs on the Stellar network.',
    emoji: '✅',
    modalType: 'zkValidation',
  },
  {
    title: 'Monetize Your Data',
    description: 'Anonymously contribute to research data pools with transparent revenue sharing through Stellar\'s trustless payment system.',
    emoji: '📊',
    modalType: 'dataMarketplace',
  },
  {
    title: 'Health Alerts',
    description: 'Receive automated health alerts for concerning patterns through Stellar Turrets, without compromising your privacy.',
    emoji: '⚠️',
    modalType: 'healthAlerts',
  },
];

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData] = useState(recentCycleData);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeFeature, setActiveFeature] = useState<any>(null);
  
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
  
  // Open feature modal
  const openFeatureModal = (feature: any) => {
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
                <Text>Support menstrual health research initiatives with Stellar's path payment feature.</Text>
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
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button sx={animatedGradientStyle} mr={3}>Donate Now</Button>
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
                <Text>Share your health data securely with time-limited access control.</Text>
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
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button sx={animatedGradientStyle} mr={3}>Create Secure Share</Button>
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
              <VStack spacing={4} align="stretch">
                <Stat>
                  <StatLabel>Available Rewards</StatLabel>
                  <StatNumber>25 XLM</StatNumber>
                  <StatHelpText>Earned from consistent tracking</StatHelpText>
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
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button sx={animatedGradientStyle} mr={3}>Claim Rewards</Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );
      
      case 'zkValidation':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Private Data Validation</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Validate health metrics without revealing sensitive information using zero-knowledge proofs.</Text>
                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Available Validations:</Text>
                  <List spacing={2}>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Cycle Length (Normal Range)</Text>
                        <Badge colorScheme="green">Validated</Badge>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Regular Tracking (Last 30 Days)</Text>
                        <Badge colorScheme="green">Validated</Badge>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Symptom Pattern Analysis</Text>
                        <Button size="xs" sx={animatedGradientStyle}>Validate Now</Button>
                      </HStack>
                    </ListItem>
                  </List>
                </Box>
                <Divider />
                <Text fontWeight="bold">Request New Validation</Text>
                <FormControl>
                  <FormLabel>Validation Type</FormLabel>
                  <Select placeholder="Select validation type">
                    <option value="cycle">Cycle Length Validation</option>
                    <option value="tracking">Tracking Consistency</option>
                    <option value="symptoms">Symptom Pattern Analysis</option>
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button sx={animatedGradientStyle} mr={3}>Create Validation</Button>
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
                <Text>Contribute anonymized data to research pools and earn rewards through Stellar's revenue sharing.</Text>
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
                        <Button sx={animatedGradientStyle}>Contribute Data</Button>
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <Stat mb={4}>
                        <StatLabel>Total Earnings</StatLabel>
                        <StatNumber>12.5 XLM</StatNumber>
                        <StatHelpText>From 3 research contributions</StatHelpText>
                      </Stat>
                      <Button sx={animatedGradientStyle} size="sm">Claim Earnings</Button>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );
        
      case 'healthAlerts':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Health Alerts</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Configure automated health alerts powered by Stellar Turrets that can monitor patterns while preserving privacy.</Text>
                <FormControl>
                  <FormLabel>Alert Types</FormLabel>
                  <VStack align="start">
                    <Checkbox defaultChecked>Irregular Cycle Detection</Checkbox>
                    <Checkbox defaultChecked>Unusual Symptom Patterns</Checkbox>
                    <Checkbox defaultChecked>Medication Reminders</Checkbox>
                    <Checkbox>Health Check Reminders</Checkbox>
                  </VStack>
                </FormControl>
                <FormControl>
                  <FormLabel>Notification Channels</FormLabel>
                  <VStack align="start">
                    <Checkbox defaultChecked>In-App</Checkbox>
                    <Checkbox>Email</Checkbox>
                    <Checkbox>Push Notification</Checkbox>
                  </VStack>
                </FormControl>
                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Active Alerts:</Text>
                  <List spacing={2}>
                    <ListItem>
                      <HStack>
                        <Badge colorScheme="purple">Active</Badge>
                        <Text>Cycle Length Monitoring</Text>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack>
                        <Badge colorScheme="purple">Active</Badge>
                        <Text>Symptom Pattern Analysis</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button sx={animatedGradientStyle} mr={3}>Save Settings</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      default:
        return null;
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
              <MenuItem>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Cycle data cards (now at the top) */}
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mb={8}>
        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Cycle Overview</Heading>
            </CardHeader>
            <CardBody>
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
                mt={2}
                mb={3}
              />
              <Button sx={animatedGradientStyle} size="sm" width="full">
                Log Today
              </Button>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Mood Tracker</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between">
                    <Text fontWeight="semibold">Day {day.day}:</Text>
                    <Badge colorScheme={
                      day.mood === 'Great' ? 'green' : 
                      day.mood === 'Good' ? 'blue' : 
                      day.mood === 'Fair' ? 'yellow' : 'red'
                    }>
                      {day.mood}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
            <CardFooter pt={0}>
              <Text fontSize="sm" color="gray.500">
                Your mood data is securely encrypted
              </Text>
            </CardFooter>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Symptoms</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between" flexWrap="wrap">
                    <Text fontWeight="semibold">Day {day.day}:</Text>
                    <HStack>
                      {day.symptoms.length > 0 ? 
                        day.symptoms.map((symptom, i) => (
                          <Tag key={i} size="sm" colorScheme="pink" borderRadius="full">
                            {symptom}
                          </Tag>
                        )) : 
                        <Tag size="sm" colorScheme="green" borderRadius="full">None</Tag>
                      }
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Advanced Stellar Features (now after the cycle data cards) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={10}>
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
              <Text mb={4}>{feature.description}</Text>
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
      
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4} bgGradient={cardGradient} bgClip="text">
          Secured by Stellar Blockchain
        </Heading>
        <Text mb={6}>
          CycleBuddy leverages the power of Stellar blockchain technology to provide enhanced security and privacy for your health data.
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {blockchainFeatures.map((feature, index) => (
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
                    bg="#D53F8C20"
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
                <Text>{feature.description}</Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Heading as="h2" size="lg" mb={4} bgGradient={cardGradient} bgClip="text">
        Resources & Information
      </Heading>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6}>
        {infoCards.map((card, index) => (
          <GridItem key={index}>
            <Card 
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
                    {card.emoji}
                  </Box>
                  <Heading size="md">{card.title}</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Text>{card.content}</Text>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>

      <Box mt={16} p={6} borderRadius="lg" bg="gray.50" boxShadow="sm">
        <Heading as="h3" size="md" mb={4} textAlign="center">
          Your Data Security
        </Heading>
        <Divider mb={4} />
        <List spacing={3}>
          <ListItem>
            ✓ Secured with Stellar blockchain technology and passkey authentication
          </ListItem>
          <ListItem>
            ✓ Your health data is encrypted and stored securely
          </ListItem>
          <ListItem>
            ✓ Only you have access to your personal information
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
    </Container>
  );
};

export default DashboardPage; 