import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Text,
  Flex,
  Badge,
  Tooltip,
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
  VStack,
  HStack,
  Checkbox,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
  getDay,
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { CycleDay } from './CycleCalendar';

interface FullCycleCalendarProps {
  cycleData: CycleDay[];
  onDataUpdate: (updatedData: CycleDay) => void;
  currentCycleStartDate: string; // format: 'YYYY-MM-DD'
  cycleLength?: number;
  periodLength?: number;
}

/**
 * Enhanced calendar component showing a full month view
 * with detailed day information and better visualizations.
 */
export const FullCycleCalendar: React.FC<FullCycleCalendarProps> = ({
  cycleData,
  onDataUpdate,
  currentCycleStartDate,
  cycleLength = 28,
  periodLength = 5,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Form state for log entry
  const [mood, setMood] = useState<CycleDay['mood']>('Good');
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  // Common symptoms list
  const commonSymptoms = [
    'Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood Swings', 
    'Breast Tenderness', 'Acne', 'Backache', 'Insomnia', 'Anxiety'
  ];
  
  // Color schemes for different phases
  const phaseColors = {
    menstruation: useColorModeValue('red.100', 'red.700'),
    follicular: useColorModeValue('yellow.100', 'yellow.700'),
    ovulation: useColorModeValue('green.100', 'green.700'),
    luteal: useColorModeValue('purple.100', 'purple.700'),
  };
  
  // Phase descriptions and info
  const phaseInfo = {
    menstruation: {
      name: 'Menstruation Phase',
      description: 'Period flow and possible discomfort',
      recommendations: ['Rest when needed', 'Eat iron-rich foods', 'Stay hydrated'],
      color: 'red',
    },
    follicular: {
      name: 'Follicular Phase',
      description: 'Rising energy levels and improved mood',
      recommendations: ['Start new projects', 'Schedule social activities', 'High-intensity workouts'],
      color: 'yellow',
    },
    ovulation: {
      name: 'Ovulation Phase',
      description: 'Peak energy and fertility',
      recommendations: ['Important meetings/presentations', 'Creative work', 'Networking events'],
      color: 'green',
    },
    luteal: {
      name: 'Luteal Phase',
      description: 'Decreasing energy and possible PMS symptoms',
      recommendations: ['Self-care activities', 'Finish pending tasks', 'Gentle exercise'],
      color: 'purple',
    },
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    
    // Pre-fill form with existing data if available
    const existingData = cycleData.find(data => 
      isSameDay(new Date(data.date), day)
    );
    
    if (existingData) {
      setMood(existingData.mood || 'Good');
      setNotes(existingData.notes || '');
      setSelectedSymptoms(existingData.symptoms || []);
    } else {
      // Reset form
      setMood('Good');
      setNotes('');
      setSelectedSymptoms([]);
    }
    
    onOpen();
  };
  
  const handleSaveEntry = () => {
    if (!selectedDate) return;
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    // Calculate which day of the cycle this is
    const cycleStartDate = new Date(currentCycleStartDate);
    const diffTime = Math.abs(selectedDate.getTime() - cycleStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Create or update cycle day data
    const updatedData: CycleDay = {
      date: formattedDate,
      day: diffDays,
      mood,
      symptoms: selectedSymptoms,
      notes,
      // Determine phase based on cycle day
      phase: getPhaseFromCycleDay(diffDays, cycleLength, periodLength),
    };
    
    onDataUpdate(updatedData);
    onClose();
  };
  
  const getPhaseFromCycleDay = (
    day: number, 
    cycleLength: number, 
    periodLength: number
  ): CycleDay['phase'] => {
    if (day <= periodLength) {
      return 'menstruation';
    } else if (day <= 13) {
      return 'follicular';
    } else if (day <= 15) {
      return 'ovulation';
    } else {
      return 'luteal';
    }
  };
  
  // Get calendar date grid for current month - Full month view
  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const dateFormat = 'd';
    const rows = [];
    
    let days = [];
    let day = startDate;
    let formattedDate = '';
    
    // Create header row with days of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const header = daysOfWeek.map(dayName => (
      <Box key={dayName} textAlign='center' fontWeight='bold' p={2}>
        {dayName}
      </Box>
    ));
    
    rows.push(<Grid templateColumns='repeat(7, 1fr)' gap={0} key='header'>{header}</Grid>);
    
    // Create calendar days
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find data for this day if it exists
        const dayData = cycleData.find(d => isSameDay(new Date(d.date), day));
        
        // Determine phase color
        let phaseColor = 'transparent';
        if (dayData?.phase) {
          phaseColor = phaseColors[dayData.phase];
        }
        
        // Check if day is in current month
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <Box 
            key={day.toString()} 
            bg={phaseColor}
            border='1px solid'
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            borderRadius='md'
            p={2}
            position='relative'
            height='100px' // Taller cells for the full calendar
            overflow='hidden'
            opacity={isCurrentMonth ? 1 : 0.5} // Fade days from other months
            onClick={() => handleDayClick(cloneDay)}
            cursor='pointer'
            _hover={{ 
              borderColor: useColorModeValue('purple.400', 'purple.300'),
              transform: 'scale(1.03)',
              transition: 'all 0.2s',
              zIndex: 1,
            }}
          >
            <Flex direction='column' h='100%'>
              <Flex justify='space-between' align='center'>
                <Text 
                  color={isToday(day) 
                    ? 'white' 
                    : useColorModeValue('gray.800', 'white')
                  }
                  fontWeight={isToday(day) ? 'bold' : 'normal'}
                  bg={isToday(day) ? 'purple.500' : 'transparent'}
                  width='24px'
                  height='24px'
                  borderRadius='full'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  {formattedDate}
                </Text>
                
                {dayData?.phase && (
                  <Badge colorScheme={phaseInfo[dayData.phase].color} size='sm'>
                    {dayData.phase.charAt(0).toUpperCase() + dayData.phase.slice(1)}
                  </Badge>
                )}
              </Flex>
              
              {dayData && (
                <VStack align='start' spacing={1} mt={2} overflow='hidden'>
                  {dayData.day && (
                    <Text fontSize='xs' fontWeight='bold'>
                      Day {dayData.day}
                    </Text>
                  )}
                  
                  {dayData.mood && (
                    <Badge 
                      colorScheme={
                        dayData.mood === 'Great' ? 'green' : 
                        dayData.mood === 'Good' ? 'blue' : 
                        dayData.mood === 'Fair' ? 'yellow' : 'red'
                      }
                      fontSize='xs'
                      variant='solid'
                      width='fit-content'
                    >
                      {dayData.mood}
                    </Badge>
                  )}
                  
                  {dayData.symptoms && dayData.symptoms.length > 0 && (
                    <Tooltip 
                      label={dayData.symptoms.join(', ')} 
                      aria-label='Symptoms'
                      placement='top'
                    >
                      <Text fontSize='xs' noOfLines={1}>
                        {dayData.symptoms.length > 1 
                          ? `${dayData.symptoms[0]}, +${dayData.symptoms.length - 1} more` 
                          : dayData.symptoms[0]}
                      </Text>
                    </Tooltip>
                  )}
                  
                  {dayData.notes && (
                    <Tooltip label={dayData.notes} aria-label='Notes' placement='top'>
                      <Text fontSize='xs' noOfLines={1} color='gray.500'>
                        Notes: {dayData.notes.substring(0, 15)}...
                      </Text>
                    </Tooltip>
                  )}
                </VStack>
              )}
            </Flex>
          </Box>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <Grid templateColumns='repeat(7, 1fr)' gap={1} key={day.toString()}>
          {days}
        </Grid>
      );
      days = [];
    }
    
    return <Box>{rows}</Box>;
  };
  
  // Toggle symptom selection
  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  
  // Get phase display information for the selected date
  const getPhaseInfoForSelectedDate = () => {
    if (!selectedDate) return null;
    
    const cycleStartDate = new Date(currentCycleStartDate);
    const diffTime = Math.abs(selectedDate.getTime() - cycleStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const phase = getPhaseFromCycleDay(diffDays, cycleLength, periodLength);
    
    return phase ? phaseInfo[phase] : null;
  };
  
  const selectedPhaseInfo = getPhaseInfoForSelectedDate();
  
  return (
    <Box>
      {/* Calendar Header */}
      <Flex justify='space-between' align='center' mb={4}>
        <Button 
          onClick={prevMonth}
          leftIcon={<FaChevronLeft />}
          variant='ghost'
        >
          Prev Month
        </Button>
        <Text fontWeight='bold' fontSize='xl'>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <Button 
          onClick={nextMonth}
          rightIcon={<FaChevronRight />}
          variant='ghost'
        >
          Next Month
        </Button>
      </Flex>
      
      {/* Calendar Legend */}
      <Flex justify='center' mb={4}>
        {Object.entries(phaseInfo).map(([phase, info]) => (
          <Flex key={phase} align='center' mx={3}>
            <Box 
              width='15px' 
              height='15px'
              borderRadius='sm'
              bg={phaseColors[phase as keyof typeof phaseColors]}
              mr={1}
            />
            <Text fontSize='sm'>{info.name}</Text>
          </Flex>
        ))}
      </Flex>
      
      {/* Calendar Grid */}
      {renderCalendarGrid()}
      
      {/* Log Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size='lg'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            {selectedPhaseInfo && (
              <Badge colorScheme={selectedPhaseInfo.color} ml={2}>
                {selectedPhaseInfo.name}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align='stretch'>
              {selectedPhaseInfo && (
                <Box p={4} bg={`${selectedPhaseInfo.color}.50`} borderRadius='md'>
                  <Text fontSize='sm' fontWeight='medium' mb={2}>
                    {selectedPhaseInfo.description}
                  </Text>
                  <Text fontSize='sm' fontWeight='bold' mb={1}>Recommendations:</Text>
                  <VStack align='start' spacing={0}>
                    {selectedPhaseInfo.recommendations.map((rec, index) => (
                      <Text key={index} fontSize='sm'>• {rec}</Text>
                    ))}
                  </VStack>
                </Box>
              )}
              
              <FormControl>
                <FormLabel>How are you feeling today?</FormLabel>
                <Select 
                  value={mood || 'Good'} 
                  onChange={(e) => setMood(e.target.value as CycleDay['mood'])}
                >
                  <option value='Great'>Great</option>
                  <option value='Good'>Good</option>
                  <option value='Fair'>Fair</option>
                  <option value='Poor'>Poor</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Symptoms</FormLabel>
                <Grid templateColumns='repeat(2, 1fr)' gap={2}>
                  {commonSymptoms.map(symptom => (
                    <Checkbox 
                      key={symptom}
                      isChecked={selectedSymptoms.includes(symptom)}
                      onChange={() => toggleSymptom(symptom)}
                      colorScheme='purple'
                    >
                      {symptom}
                    </Checkbox>
                  ))}
                </Grid>
                <Input 
                  mt={2}
                  placeholder='Add other symptoms...'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      toggleSymptom(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input 
                  as='textarea'
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add any notes about today...'
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme='purple' 
              onClick={handleSaveEntry}
              bgGradient='linear(to-r, #8A2BE2, #D53F8C)'
              _hover={{ bgGradient: 'linear(to-r, #7A1CD2, #C52F7C)' }}
            >
              Save Entry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FullCycleCalendar; 