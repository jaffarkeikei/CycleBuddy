import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Input,
  Select,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Divider,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import { FaArrowLeft, FaBell, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { stellarContractService } from '../../services/stellar/contractService';
import { passkeyService } from '../../services/auth/passkeyService';

// Add type definitions
type AlertSeverity = 'warning' | 'critical' | 'info';

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: AlertSeverity;
  date: string;
}

const HealthAlertsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // Alert configuration state
  const [menstrualIrregularityAlerts, setMenstrualIrregularityAlerts] = useState(true);
  const [symptomPatternAlerts, setSymptomPatternAlerts] = useState(true);
  const [hormonalChangesAlerts, setHormonalChangesAlerts] = useState(false);
  const [fertilityWindowAlerts, setFertilityWindowAlerts] = useState(true);
  const [moodPatternAlerts, setMoodPatternAlerts] = useState(false);
  
  // Alert threshold state
  const [irregularityThreshold, setIrregularityThreshold] = useState(5);
  const [alertMethod, setAlertMethod] = useState('app');
  
  // Sample current alerts for the modal
  const [currentAlerts, setCurrentAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'Menstrual Irregularity',
      message: 'Your cycle length has varied by 7 days over the last 3 cycles.',
      severity: 'warning',
      date: '2025-09-15',
    },
    {
      id: 2,
      type: 'Symptom Pattern',
      message: 'Headache symptoms have increased in frequency and severity.',
      severity: 'info',
      date: '2025-09-12',
    },
    {
      id: 3,
      type: 'Fertility Window',
      message: 'Your fertility window is predicted to start in 2 days.',
      severity: 'info',
      date: '2025-09-08',
    },
  ]);

  useEffect(() => {
    // Load user's alert preferences
    const loadAlertPreferences = async () => {
      try {
        // Fetch real preferences from blockchain/backend in actual implementation
        // const preferences = await stellarContractService.getHealthAlertPreferences();
        // setMenstrualIrregularityAlerts(preferences.menstrualIrregularity);
        // setSymptomPatternAlerts(preferences.symptomPattern);
        // etc...
      } catch (error) {
        console.error('Error loading alert preferences:', error);
      }
    };
    
    loadAlertPreferences();
  }, []);

  const handleSavePreferences = async () => {
    setCurrentAction('saveHealthAlerts');
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Authenticate with passkey before saving
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed. Please try again.");
      }

      // If authentication is successful, proceed to save preferences
      // In a real implementation, this would save to blockchain/backend
      const preferences = {
        menstrualIrregularity: menstrualIrregularityAlerts,
        symptomPattern: symptomPatternAlerts,
        hormonalChanges: hormonalChangesAlerts,
        fertilityWindow: fertilityWindowAlerts,
        moodPattern: moodPatternAlerts,
        irregularityThreshold,
        alertMethod,
      };
      
      // console.log('Saving preferences with Passkey Auth:', preferences); // For debugging
      // Uncomment in actual implementation
      // await stellarContractService.configureHealthAlerts(preferences); 
      // This service call would need to handle the Soroban transaction part.
      
      toast({
        title: 'Preferences Saved',
        description: 'Your health alert preferences have been updated securely.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAuthError(errorMessage);
      toast({
        title: 'Error Saving Preferences',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'warning':
        return 'orange.500';
      case 'critical':
        return 'red.500';
      case 'info':
      default:
        return 'blue.500';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'warning':
        return FaExclamationTriangle;
      case 'critical':
        return FaExclamationTriangle;
      case 'info':
      default:
        return FaInfoCircle;
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          variant="ghost" 
          onClick={() => navigate('/settings')}
        >
          Back to Settings
        </Button>
      </Box>
      
      <HStack mb={6} justify="space-between">
        <Heading>Health Alerts</Heading>
        <Button 
          colorScheme="purple" 
          leftIcon={<FaBell />}
          onClick={onOpen}
        >
          View Current Alerts
        </Button>
      </HStack>
      
      <Text mb={6}>Configure which health alerts you want to receive and how you want to receive them.</Text>
      
      <Card mb={6}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Heading size="md" mb={2}>Alert Types</Heading>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="menstrual-irregularity" mb="0">
                Menstrual Irregularity Alerts
              </FormLabel>
              <Switch 
                id="menstrual-irregularity" 
                isChecked={menstrualIrregularityAlerts}
                onChange={(e) => setMenstrualIrregularityAlerts(e.target.checked)}
                colorScheme="purple"
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="symptom-pattern" mb="0">
                Symptom Pattern Alerts
              </FormLabel>
              <Switch 
                id="symptom-pattern" 
                isChecked={symptomPatternAlerts}
                onChange={(e) => setSymptomPatternAlerts(e.target.checked)}
                colorScheme="purple"
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="hormonal-changes" mb="0">
                Hormonal Changes Alerts
              </FormLabel>
              <Switch 
                id="hormonal-changes" 
                isChecked={hormonalChangesAlerts}
                onChange={(e) => setHormonalChangesAlerts(e.target.checked)}
                colorScheme="purple"
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="fertility-window" mb="0">
                Fertility Window Alerts
              </FormLabel>
              <Switch 
                id="fertility-window" 
                isChecked={fertilityWindowAlerts}
                onChange={(e) => setFertilityWindowAlerts(e.target.checked)}
                colorScheme="purple"
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="mood-pattern" mb="0">
                Mood Pattern Alerts
              </FormLabel>
              <Switch 
                id="mood-pattern" 
                isChecked={moodPatternAlerts}
                onChange={(e) => setMoodPatternAlerts(e.target.checked)}
                colorScheme="purple"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
      
      <Card mb={6}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Heading size="md" mb={2}>Alert Settings</Heading>
            
            <FormControl>
              <FormLabel htmlFor="irregularity-threshold">Irregularity Threshold (days)</FormLabel>
              <Select 
                id="irregularity-threshold" 
                value={irregularityThreshold}
                onChange={(e) => setIrregularityThreshold(Number(e.target.value))}
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
                <option value={10}>10 days</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor="alert-method">Alert Method</FormLabel>
              <Select 
                id="alert-method" 
                value={alertMethod}
                onChange={(e) => setAlertMethod(e.target.value)}
              >
                <option value="app">In-App Notifications</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </Select>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
      
      {authError && currentAction === 'saveHealthAlerts' && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Flex justify="flex-end">
        <Button 
          colorScheme="purple" 
          onClick={handleSavePreferences}
          isLoading={isAuthenticating && currentAction === 'saveHealthAlerts'}
          loadingText="Saving..."
        >
          Save Preferences
        </Button>
      </Flex>
      
      {/* Current Alerts Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Current Health Alerts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentAlerts.length > 0 ? (
              <List spacing={3}>
                {currentAlerts.map((alert) => (
                  <ListItem key={alert.id}>
                    <HStack alignItems="flex-start">
                      <ListIcon 
                        as={getSeverityIcon(alert.severity)} 
                        color={getSeverityColor(alert.severity)} 
                        mt={1} 
                      />
                      <Box>
                        <Text fontWeight="bold">{alert.type}</Text>
                        <Text>{alert.message}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {alert.date}
                        </Text>
                      </Box>
                    </HStack>
                    {alert.id !== currentAlerts.length && <Divider mt={2} />}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Flex direction="column" align="center" justify="center" py={6}>
                <Icon as={FaCheckCircle} boxSize={10} color="green.500" mb={4} />
                <Text>No active health alerts at this time.</Text>
              </Flex>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default HealthAlertsPage; 