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

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData] = useState(recentCycleData);
  
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

  // Simulate fetching data
  useEffect(() => {
    // This would be an actual API call in a real application
    const loadData = async () => {
      // Actual data fetching would happen here
    };
    
    loadData();
  }, []);

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" bgGradient={cardGradient} bgClip="text">
            Welcome, {user?.username || 'User'}
          </Heading>
          <Text color="gray.600">Your secure menstrual health companion</Text>
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

      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mb={8}>
        <GridItem colSpan={1}>
          <Card borderRadius="lg" boxShadow="md" height="100%">
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
          <Card borderRadius="lg" boxShadow="md" height="100%">
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
          <Card borderRadius="lg" boxShadow="md" height="100%">
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
      
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4} bgGradient={cardGradient} bgClip="text">
          Secured by Stellar Blockchain
        </Heading>
        <Text mb={6}>
          CycleBuddy leverages the power of Stellar blockchain technology to provide enhanced security and privacy for your health data.
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {blockchainFeatures.map((feature, index) => (
            <Card key={index} borderRadius="lg" boxShadow="md" height="100%">
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
            <Card borderRadius="lg" boxShadow="md" height="100%">
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
    </Container>
  );
};

export default DashboardPage; 