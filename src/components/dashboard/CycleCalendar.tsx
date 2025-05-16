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
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
  addDays,
  isToday,
  subDays,
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';

export type CycleDay = {
  date: string; // format: 'YYYY-MM-DD'
  day: number;
  mood?: 'Great' | 'Good' | 'Fair' | 'Poor';
  symptoms?: string[];
  notes?: string;
  phase?: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
};

interface CycleCalendarProps {
  cycleData: CycleDay[];
  onDataUpdate: (updatedData: CycleDay) => void;
  currentCycleStartDate: string; // format: 'YYYY-MM-DD'
  cycleLength?: number;
  periodLength?: number;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  cycleData,
  onDataUpdate,
  currentCycleStartDate,
  cycleLength = 28,
  periodLength = 5,
}) => {
  // Instead of tracking a month, we'll track the start date of our two-week view
  const [viewStartDate, setViewStartDate] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Form state for log entry
  const [mood, setMood] = useState<CycleDay['mood']>('Good');
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  // Common symptoms list
  const commonSymptoms = [
    'Cramps', 'Bloating', 'Headache', 'Fatigue', 
    'Mood Swings', 'Breast Tenderness', 'Acne', 'Backache'
  ];
  
  // Color schemes for different phases
  const phaseColors = {
    menstruation: useColorModeValue('red.100', 'red.700'),
    follicular: useColorModeValue('yellow.100', 'yellow.700'),
    ovulation: useColorModeValue('green.100', 'green.700'),
    luteal: useColorModeValue('purple.100', 'purple.700'),
  };
  
  const nextPeriod = () => {
    setViewStartDate(addDays(viewStartDate, 14)); // Move forward two weeks
  };

  const prevPeriod = () => {
    setViewStartDate(subDays(viewStartDate, 14)); // Move back two weeks
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
  
  // Get calendar date grid for current two-week period
  const renderCalendarGrid = () => {
    // Start with the beginning of the current view period
    const startDate = viewStartDate;
    // End with the end of the second week
    const endDate = addDays(endOfWeek(viewStartDate), 7);
    
    const dateFormat = 'd';
    const rows = [];
    
    let days = [];
    let day = startDate;
    let formattedDate = '';
    
    // Create header row with days of week - using shorter abbreviations
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const header = daysOfWeek.map((dayName, index) => (
      <Box key={`${dayName}-${index}`} textAlign='center' fontWeight='semibold' p={1} fontSize="xs">
        {dayName}
      </Box>
    ));
    
    rows.push(<Grid templateColumns='repeat(7, 1fr)' gap={0} key='header'>{header}</Grid>);
    
    // Create calendar days - just two weeks with more compact display
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
        
        days.push(
          <Box 
            key={day.toString()} 
            bg={phaseColor}
            border='1px solid'
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            borderRadius='md'
            p={1}
            position='relative'
            height='40px' // Smaller height for more compact display
            overflow='hidden'
            onClick={() => handleDayClick(cloneDay)}
            cursor='pointer'
            _hover={{ 
              borderColor: useColorModeValue('purple.400', 'purple.300'),
              transform: 'scale(1.03)',
              transition: 'all 0.2s',
            }}
          >
            <Flex justify="space-between" align="center">
              <Text 
                color={isToday(day) 
                  ? 'white' 
                  : useColorModeValue('gray.800', 'white')
                }
                fontWeight={isToday(day) ? 'bold' : 'normal'}
                bg={isToday(day) ? 'purple.500' : 'transparent'}
                width='18px' // Smaller dimensions
                height='18px' // Smaller dimensions
                borderRadius='full'
                display='flex'
                alignItems='center'
                justifyContent='center'
                fontSize='2xs' // Smaller font
              >
                {formattedDate}
              </Text>
              
              {dayData && (
                <Badge 
                  colorScheme={
                    dayData.mood === 'Great' ? 'green' : 
                    dayData.mood === 'Good' ? 'blue' : 
                    dayData.mood === 'Fair' ? 'yellow' : 'red'
                  }
                  fontSize='2xs'
                  variant='solid'
                  borderRadius='sm'
                  px={1}
                  py={0}
                  height='12px' // Fixed small height
                  minWidth='unset'
                >
                  {dayData.day}
                </Badge>
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
  
  // Get phase display information
  const getPhaseInfo = () => {
    if (!selectedDate) return null;
    
    const cycleStartDate = new Date(currentCycleStartDate);
    const diffTime = Math.abs(selectedDate.getTime() - cycleStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const phase = getPhaseFromCycleDay(diffDays, cycleLength, periodLength);
    
    const phaseInfo = {
      menstruation: {
        name: 'Menstruation Phase',
        description: 'Period flow and possible discomfort',
        color: 'red',
      },
      follicular: {
        name: 'Follicular Phase',
        description: 'Rising energy levels and improved mood',
        color: 'yellow',
      },
      ovulation: {
        name: 'Ovulation Phase',
        description: 'Peak energy and fertility',
        color: 'green',
      },
      luteal: {
        name: 'Luteal Phase',
        description: 'Decreasing energy and possible PMS symptoms',
        color: 'purple',
      },
    };
    
    return phase ? phaseInfo[phase] : null;
  };
  
  const phaseInfo = getPhaseInfo();
  
  return (
    <Box>
      {/* Calendar Header */}
      <Flex justify='space-between' align='center' mb={4}>
        <Button 
          onClick={prevPeriod}
          leftIcon={<FaChevronLeft />}
          variant='ghost'
          size='sm'
        >
          Prev
        </Button>
        <Text fontWeight='bold' fontSize='lg'>
          {format(viewStartDate, 'MMM d')} - {format(addDays(endOfWeek(viewStartDate), 7), 'MMM d')}
        </Text>
        <Button 
          onClick={nextPeriod}
          rightIcon={<FaChevronRight />}
          variant='ghost'
          size='sm'
        >
          Next
        </Button>
      </Flex>
      
      {/* Calendar Grid */}
      {renderCalendarGrid()}
      
      {/* Log Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size='lg'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            {phaseInfo && (
              <Badge colorScheme={phaseInfo.color} ml={2}>
                {phaseInfo.name}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align='stretch'>
              {phaseInfo && (
                <Text fontSize='sm' color='gray.500'>
                  {phaseInfo.description}
                </Text>
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