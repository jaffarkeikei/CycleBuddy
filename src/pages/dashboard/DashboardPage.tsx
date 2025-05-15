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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar
} from '@chakra-ui/react';
import { useAuthStore } from '../../services/auth/authService';

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
  },
  {
    title: 'Did You Know?',
    content: 'The average menstrual cycle is 28 days, but anywhere from 21 to 35 days is considered normal.',
  },
  {
    title: 'Community Highlight',
    content: 'Join our discussion on natural remedies for menstrual discomfort.',
  },
];

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData, setCycleData] = useState(recentCycleData);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    // This would be an actual API call in a real application
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">Welcome, {user?.username || 'User'}</Heading>
        <HStack>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label='User menu'
              icon={<Avatar size="sm" name={user?.username || 'User'} />}
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
          <Card>
            <CardHeader>
              <Heading size="md">Cycle Overview</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Current Cycle Day</StatLabel>
                <StatNumber>Day {cycleData[0].day}</StatNumber>
                <StatHelpText>Started {cycleData[0].date}</StatHelpText>
              </Stat>
              <Button colorScheme="teal" size="sm" mt={4}>
                Log Today
              </Button>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card>
            <CardHeader>
              <Heading size="md">Mood Tracker</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between">
                    <Text>Day {day.day}:</Text>
                    <Text fontWeight="bold">{day.mood}</Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card>
            <CardHeader>
              <Heading size="md">Symptoms</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between">
                    <Text>Day {day.day}:</Text>
                    <Text>{day.symptoms.length > 0 ? day.symptoms.join(', ') : 'None'}</Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Heading as="h2" size="lg" mb={4}>Resources & Information</Heading>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6}>
        {infoCards.map((card, index) => (
          <GridItem key={index}>
            <Card>
              <CardHeader>
                <Heading size="md">{card.title}</Heading>
              </CardHeader>
              <CardBody>
                <Text>{card.content}</Text>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>

      <Box textAlign="center" mt={16}>
        <Text color="gray.500">
          Secured with Stellar blockchain technology and passkey authentication.
        </Text>
        <Text color="gray.500" fontSize="sm" mt={2}>
          Your data is encrypted and stored securely. Only you have access to it.
        </Text>
      </Box>
    </Container>
  );
};

export default DashboardPage; 