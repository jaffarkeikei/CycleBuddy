import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  useToast,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { CycleCalendar, CycleDay } from '../components/dashboard/CycleCalendar';
import FullCycleCalendar from '../components/dashboard/FullCycleCalendar';

// For the full page calendar, we could extend the CycleCalendar component or create a more detailed version
// Here we're reusing the existing component but we could create a more feature-rich one

const FullCalendarPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData, setCycleData] = useState<CycleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Gradient style for consistent UI
  const cardGradient = useColorModeValue(
    'linear(to-r, #8A2BE2, #D53F8C)',
    'linear(to-r, #8A2BE2, #D53F8C)'
  );
  
  // Load cycle data from wherever it's stored (localStorage, context, API, etc.)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // In a real app, we'd load the data from a service
        // For now, using mock data
        const mockData: CycleDay[] = [
          { day: 1, mood: 'Good', symptoms: ['Cramps', 'Fatigue'], date: '2025-09-01', phase: 'menstruation' },
          { day: 2, mood: 'Fair', symptoms: ['Bloating'], date: '2025-09-02', phase: 'menstruation' },
          { day: 3, mood: 'Great', symptoms: [], date: '2025-09-03', phase: 'menstruation' },
          // Add more mock data as needed
        ];
        
        setCycleData(mockData);
      } catch (error) {
        console.error('Error loading cycle data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cycle data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  // Handle updating cycle data
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
  
  return (
    <Container maxW="container.lg" py={6}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <IconButton
            aria-label="Back to Dashboard"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/dashboard')}
            variant="ghost"
          />
          <Heading size="lg">Cycle Calendar</Heading>
          <Box width="40px" /> {/* Spacer for alignment */}
        </Flex>
        
        <Card borderRadius="lg" boxShadow="md">
          <CardHeader bgGradient={cardGradient} borderTopRadius="lg" color="white">
            <Flex justify="space-between" align="center">
              <Heading size="md">Your Complete Cycle History</Heading>
              <Button 
                colorScheme="whiteAlpha" 
                size="sm"
                leftIcon={<FaPlus />}
                onClick={() => navigate('/log-entry')}
              >
                Add Entry
              </Button>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            {isLoading ? (
              <Flex justify="center" align="center" height="400px">
                <Text>Loading calendar data...</Text>
              </Flex>
            ) : (
              <Box>
                {/* We could implement a more feature-rich calendar here */}
                {/* For now, reusing the existing component but showing more data */}
                <FullCycleCalendar 
                  cycleData={cycleData}
                  onDataUpdate={handleCycleDataUpdate}
                  currentCycleStartDate={cycleData.length > 0 ? cycleData[0].date : format(new Date(), 'yyyy-MM-dd')}
                  cycleLength={28}
                  periodLength={5}
                />
                
                <VStack spacing={4} mt={8}>
                  <Heading size="sm">Cycle Statistics</Heading>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4} width="100%">
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <Text fontWeight="bold">Average Cycle Length</Text>
                      <Text fontSize="xl">28 days</Text>
                    </Box>
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <Text fontWeight="bold">Average Period Length</Text>
                      <Text fontSize="xl">5 days</Text>
                    </Box>
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <Text fontWeight="bold">Most Common Symptoms</Text>
                      <Text fontSize="md">Cramps, Fatigue</Text>
                    </Box>
                  </Grid>
                </VStack>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default FullCalendarPage; 