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
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  useToast,
  Badge,
  IconButton,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaArrowLeft, FaSave, FaPlus, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { CycleDay } from '../components/dashboard/CycleCalendar';

interface LogEntryPageProps {
  initialData?: CycleDay;
  onSave?: (data: CycleDay) => void;
}

const symptoms = [
  { id: 'cramps', label: 'Cramps', group: 'Pain' },
  { id: 'headache', label: 'Headache', group: 'Pain' },
  { id: 'backache', label: 'Backache', group: 'Pain' },
  { id: 'joint_pain', label: 'Joint Pain', group: 'Pain' },
  { id: 'fatigue', label: 'Fatigue', group: 'Energy' },
  { id: 'insomnia', label: 'Insomnia', group: 'Energy' },
  { id: 'bloating', label: 'Bloating', group: 'Physical' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', group: 'Physical' },
  { id: 'acne', label: 'Acne', group: 'Physical' },
  { id: 'nausea', label: 'Nausea', group: 'Physical' },
  { id: 'mood_swings', label: 'Mood Swings', group: 'Emotional' },
  { id: 'irritability', label: 'Irritability', group: 'Emotional' },
  { id: 'anxiety', label: 'Anxiety', group: 'Emotional' },
  { id: 'depression', label: 'Depression', group: 'Emotional' },
  { id: 'food_cravings', label: 'Food Cravings', group: 'Lifestyle' },
  { id: 'increased_appetite', label: 'Increased Appetite', group: 'Lifestyle' },
];

const symptomGroups = [
  'Pain',
  'Energy',
  'Physical',
  'Emotional',
  'Lifestyle',
];

export const LogEntryPage: React.FC<LogEntryPageProps> = ({ initialData, onSave }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Form state
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState<CycleDay['mood']>('Good');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [flow, setFlow] = useState(2); // 1-5 scale
  const [notes, setNotes] = useState('');
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [newCustomSymptom, setNewCustomSymptom] = useState('');
  
  // Animation gradient style
  const animatedGradientStyle = {
    bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
    bgSize: '200% 100%',
    color: 'white',
    _hover: {
      bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
      bgSize: '200% 100%',
    }
  };
  
  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setMood(initialData.mood || 'Good');
      setSelectedSymptoms(initialData.symptoms || []);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);
  
  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  
  const handleAddCustomSymptom = () => {
    if (newCustomSymptom.trim() !== '' && !customSymptoms.includes(newCustomSymptom)) {
      setCustomSymptoms([...customSymptoms, newCustomSymptom]);
      setSelectedSymptoms([...selectedSymptoms, newCustomSymptom]);
      setNewCustomSymptom('');
    }
  };
  
  const handleRemoveCustomSymptom = (symptom: string) => {
    setCustomSymptoms(customSymptoms.filter(s => s !== symptom));
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };
  
  const handleSave = () => {
    // Create the cycle day data object
    const cycleData: CycleDay = {
      date,
      day: initialData?.day || 1, // This would be calculated properly in a real app
      mood,
      symptoms: selectedSymptoms,
      notes,
      phase: initialData?.phase, // This would be calculated properly in a real app
    };
    
    // Call the onSave callback if provided
    if (onSave) {
      onSave(cycleData);
    }
    
    // Show success toast
    toast({
      title: 'Entry Saved',
      description: 'Your cycle data has been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Navigate back to dashboard
    navigate('/dashboard');
  };
  
  // Group symptoms by category
  const getSymptomsByGroup = (group: string) => {
    return symptoms.filter(symptom => symptom.group === group);
  };
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <IconButton
            aria-label="Back to Dashboard"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/dashboard')}
            variant="ghost"
          />
          <Heading size="lg">Log Cycle Entry</Heading>
          <Box width="40px" /> {/* Spacer to center heading */}
        </Flex>
        
        <Card borderRadius="lg" boxShadow="md">
          <CardHeader 
            bgGradient="linear(to-r, #8A2BE2, #D53F8C)" 
            borderTopRadius="lg"
            color="white"
          >
            <Heading size="md">Entry for {format(new Date(date), 'MMMM d, yyyy')}</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>How are you feeling today?</FormLabel>
                <RadioGroup value={mood || 'Good'} onChange={(value) => setMood(value as CycleDay['mood'])}>
                  <HStack spacing={4}>
                    <Radio value="Great" colorScheme="green">
                      Great
                    </Radio>
                    <Radio value="Good" colorScheme="blue">
                      Good
                    </Radio>
                    <Radio value="Fair" colorScheme="yellow">
                      Fair
                    </Radio>
                    <Radio value="Poor" colorScheme="red">
                      Poor
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>
              
              {initialData?.phase === 'menstruation' && (
                <FormControl>
                  <FormLabel>Flow Intensity</FormLabel>
                  <HStack>
                    <Text>Light</Text>
                    <Slider
                      value={flow}
                      min={1}
                      max={5}
                      step={1}
                      onChange={(val) => setFlow(val)}
                      flex={1}
                      colorScheme="pink"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                    <Text>Heavy</Text>
                  </HStack>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Symptoms</FormLabel>
                <VStack align="stretch" spacing={4}>
                  {symptomGroups.map(group => (
                    <Box key={group}>
                      <Text fontWeight="bold" mb={2}>{group}</Text>
                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        {getSymptomsByGroup(group).map(symptom => (
                          <Checkbox
                            key={symptom.id}
                            isChecked={selectedSymptoms.includes(symptom.label)}
                            onChange={() => handleSymptomToggle(symptom.label)}
                            colorScheme="purple"
                          >
                            {symptom.label}
                          </Checkbox>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                  
                  {/* Custom symptoms section */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Custom Symptoms</Text>
                    <HStack>
                      <Input
                        placeholder="Add your own symptom"
                        value={newCustomSymptom}
                        onChange={(e) => setNewCustomSymptom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCustomSymptom.trim() !== '') {
                            handleAddCustomSymptom();
                          }
                        }}
                      />
                      <IconButton
                        aria-label="Add custom symptom"
                        icon={<FaPlus />}
                        onClick={handleAddCustomSymptom}
                        colorScheme="purple"
                        isDisabled={newCustomSymptom.trim() === ''}
                      />
                    </HStack>
                    
                    {customSymptoms.length > 0 && (
                      <HStack mt={2} flexWrap="wrap">
                        {customSymptoms.map(symptom => (
                          <Badge
                            key={symptom}
                            colorScheme="purple"
                            borderRadius="full"
                            py={1}
                            px={2}
                            display="flex"
                            alignItems="center"
                          >
                            {symptom}
                            <IconButton
                              aria-label={`Remove ${symptom}`}
                              icon={<FaTimes />}
                              size="xs"
                              ml={1}
                              variant="ghost"
                              colorScheme="purple"
                              onClick={() => handleRemoveCustomSymptom(symptom)}
                            />
                          </Badge>
                        ))}
                      </HStack>
                    )}
                  </Box>
                </VStack>
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  placeholder="Add any notes for today..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </FormControl>
            </VStack>
          </CardBody>
          <CardFooter>
            <Flex width="100%" justify="space-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button
                leftIcon={<FaSave />}
                sx={animatedGradientStyle}
                onClick={handleSave}
              >
                Save Entry
              </Button>
            </Flex>
          </CardFooter>
        </Card>
      </VStack>
    </Container>
  );
};

export default LogEntryPage; 