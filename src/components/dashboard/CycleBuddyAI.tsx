import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Avatar,
  Flex,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Spinner,
  Button,
  Tooltip,
  Alert,
  AlertIcon,
  useToast,
  Select,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { FaRobot, FaMicrophone, FaPaperPlane, FaVolumeUp, FaStop, FaVolumeMute, FaGoogle, FaCog, FaTimes } from 'react-icons/fa';
import { geminiService } from '../../services/ai/geminiService';
import { googleTTSService } from '../../services/ai/googleTTSService';
import { keyframes } from '@emotion/react';

// Create pulse animation
const pulseAnimation = keyframes`
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(0.98); }
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CycleBuddyAIProps {
  cycleData: any[];
  currentPhase: string;
}

export const CycleBuddyAI: React.FC<CycleBuddyAIProps> = ({ cycleData, currentPhase }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi there! I'm your CycleBuddy AI assistant. How can I help you with your cycle today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  
  // Speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGoogleTTS, setIsGoogleTTS] = useState(true); // Default to Google TTS
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Voice settings and config
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [googleVoices, setGoogleVoices] = useState<string[]>([]);
  const [selectedGoogleVoice, setSelectedGoogleVoice] = useState('en-US-Neural2-F');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize speech API with improved error handling and interruption support
  useEffect(() => {
    // Check for browser support of speech APIs
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    // Firefox uses a different recognition system
    const speechRecognitionSupported = 
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window || 
      (isFirefox && 'SpeechRecognition' in window);
      
    const speechSynthesisSupported = 'speechSynthesis' in window;
    
    if (!speechRecognitionSupported) {
      setPermissionState('unsupported');
      console.warn('Speech recognition is not supported in this browser');
    }
    
    if (!speechSynthesisSupported) {
      console.warn('Speech synthesis is not supported in this browser');
    } else {
      // Set up speech synthesis
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      // Load available voices
      const loadVoices = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          
          // Prefer female voice if available
          const femaleVoice = voices.find(voice => 
            voice.name.includes('female') || 
            voice.name.includes('Samantha') ||
            voice.name.includes('Google UK English Female') ||
            voice.name.includes('Microsoft Zira')
          );
          
          setSelectedVoice(femaleVoice || voices[0]);
          console.log('Voices loaded:', voices.length, 'Selected voice:', femaleVoice?.name || voices[0]?.name);
        }
      };
      
      // Chrome handles voice loading differently than other browsers
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      
      // Initial load of voices
      loadVoices();
    }
    
    // Only set up speech recognition if supported
    if (speechRecognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        
        // Check for microphone permission
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then(permissionStatus => {
              setPermissionState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
              
              permissionStatus.onchange = () => {
                setPermissionState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
              };
            })
            .catch(error => {
              console.warn('Could not query permission state:', error);
              // We'll try to use it anyway and let the browser handle permission requests
            });
        }
        
        // Configure speech recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Variables to track speech activity
        let lastTranscript = '';
        let silenceTimer: number | null = null;
        
        recognition.onresult = (event) => {
          // Get the transcript from the latest result
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          console.log('Speech recognized:', transcript);
          
          setInput(transcript);
          
          // If there's a significant change in transcript and AI is speaking, interrupt
          if (isPlayingAudio && transcript !== lastTranscript) {
            console.log('User interrupted AI speech with voice input');
            stopSpeaking();
          }
          
          lastTranscript = transcript;
          
          // Reset silence timer
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
          }
          
          // Set a timer to detect when the user stops speaking
          silenceTimer = window.setTimeout(() => {
            if (isListening && transcript.trim() && transcript === lastTranscript) {
              console.log('User stopped speaking, processing input');
              
              // If we want to auto-send after silence, uncomment:
              // handleSendMessage();
            }
          }, 2000); // 2 second silence timeout
        };
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
          lastTranscript = '';
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'not-allowed') {
            setPermissionState('denied');
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access in your browser settings.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          } else if (event.error === 'audio-capture') {
            toast({
              title: "No microphone detected",
              description: "Please check your microphone connection.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          
          setIsListening(false);
        };
        
        // Fix for Firefox and continuous recognition
        recognition.onend = () => {
          console.log('Speech recognition ended, isListening:', isListening);
          
          // Clear silence timer if it exists
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
            silenceTimer = null;
          }
          
          if (isListening) {
            // If still in listening state, restart recognition after a short delay
            // The delay helps prevent rapid restart loops in Firefox
            setTimeout(() => {
              try {
                if (isListening) { // Double-check we're still in listening state
                  console.log('Restarting speech recognition');
                  recognition.start();
                }
              } catch (error) {
                console.error('Error restarting speech recognition:', error);
                setIsListening(false);
              }
            }, 300);
          }
        };
        
        setSpeechRecognition(recognition);
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setPermissionState('unsupported');
      }
    }
    
    // Load Google TTS voices
    const loadGoogleVoices = async () => {
      try {
        const voices = await googleTTSService.getVoicesList();
        if (voices.length > 0) {
          setGoogleVoices(voices);
          console.log('Google voices loaded:', voices.length);
        }
      } catch (error) {
        console.error('Error loading Google voices:', error);
      }
    };
    
    loadGoogleVoices();
    
    // Cleanup function
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      if (speechRecognition) {
        try {
          speechRecognition.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    };
  }, [toast]);
  
  // Handle utterance state changes for speech synthesis
  useEffect(() => {
    if (utterance && speechSynthesis) {
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        toast({
          title: "Voice output error",
          description: "There was a problem with the voice output.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      };
    }
  }, [utterance, speechSynthesis, toast]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Improve the stopSpeaking function to reliably stop all audio playback
  const stopSpeaking = () => {
    if (isPlayingAudio || isSpeaking) {
      console.log('Stopping AI speech');
      
      // For browser speech synthesis
      if (speechSynthesis) {
        // In some browsers, cancel() might not work immediately
        // Calling pause() first can help
        speechSynthesis.pause();
        speechSynthesis.cancel();
      }
      
      // If we have an active audio element from Google TTS,
      // we should also stop it (we would need to track this separately)
      
      // Reset audio state
      setIsPlayingAudio(false);
      
      // Don't disable isSpeaking mode to maintain user preference
    }
  };
  
  // Modify the handleSendMessage function
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Stop any ongoing speech when user sends a message
    stopSpeaking();
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show loading
    setIsLoading(true);
    
    try {
      // Get response from Gemini
      const response = await geminiService.chatWithAI(
        userMessage, 
        messages
      );
      
      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Speak the response if enabled
      if (isSpeaking) {
        speakText(response);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = "I'm sorry, I'm having trouble right now. Please try again in a moment.";
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
      
      // Speak the error message if enabled
      if (isSpeaking) {
        speakText(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Improved speakText function for better interruption handling
  const speakText = async (text: string) => {
    // First, ensure any previous speech is stopped
    stopSpeaking();
    
    setIsPlayingAudio(true);
    
    try {
      if (isGoogleTTS) {
        // Try Google TTS first
        const result = await googleTTSService.synthesizeSpeech({
          text,
          voiceName: selectedGoogleVoice
        });
        
        if (result.success && result.audioContent) {
          try {
            await googleTTSService.playAudio(result.audioContent);
          } catch (e) {
            console.error('Error playing Google TTS audio, falling back to browser TTS:', e);
            // If Google TTS audio playback fails, fall back to browser TTS
            speakWithBrowserTTS(text);
            return;
          }
          setIsPlayingAudio(false);
          return;
        }
        
        // If Google TTS fails, fall back to browser TTS
        console.warn('Google TTS failed, falling back to browser TTS');
      }
      
      // Browser TTS fallback
      await speakWithBrowserTTS(text);
      
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      toast({
        title: "Voice output error",
        description: "Could not play voice output. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsPlayingAudio(false);
    }
  };
  
  // Helper function for browser TTS
  const speakWithBrowserTTS = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesis) {
        toast({
          title: "Speech synthesis not available",
          description: "Your browser doesn't support voice output.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsPlayingAudio(false);
        reject(new Error("Speech synthesis not available"));
        return;
      }
      
      // Ensure any previous speech is fully stopped
      speechSynthesis.cancel();
      
      // Create utterance
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if available
      if (selectedVoice) {
        newUtterance.voice = selectedVoice;
      }
      
      // Set properties
      newUtterance.rate = 1;
      newUtterance.pitch = 1;
      newUtterance.volume = 1;
      
      // Handle utterance events
      newUtterance.onend = () => {
        setIsPlayingAudio(false);
        resolve();
      };
      
      newUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlayingAudio(false);
        reject(event);
      };
      
      // Store reference to utterance for event handling
      setUtterance(newUtterance);
      
      // Speak
      speechSynthesis.speak(newUtterance);
    });
  };
  
  // Modify the toggleSpeaking function
  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      // Start speaking - speak the last assistant message
      setIsSpeaking(true);
      
      // Speak the last assistant message if available
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };
  
  const toggleVoiceSettings = () => {
    setShowVoiceSettings(!showVoiceSettings);
  };
  
  const toggleGoogleTTS = () => {
    setIsGoogleTTS(!isGoogleTTS);
  };
  
  // Improved toggleListening function with better Firefox support
  const toggleListening = () => {
    if (!speechRecognition) {
      toast({
        title: "Speech recognition not available",
        description: "Your browser doesn't support voice input or permissions are blocked.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (isListening) {
      // Stop listening
      try {
        speechRecognition.stop();
        setIsListening(false);
        
        // If we have input, send the message
        if (input.trim()) {
          handleSendMessage();
        }
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    } else {
      // Check permission state
      if (permissionState === 'denied') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Stop any ongoing speech immediately
      stopSpeaking();
      
      // Clear input and start listening
      setInput('');
      
      try {
        // In Firefox, we need special handling
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        
        if (isFirefox) {
          // Firefox requires us to handle permissions explicitly
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              // Once we have permission, we can start speech recognition
              try {
                speechRecognition.start();
                setIsListening(true);
                
                toast({
                  title: "Listening...",
                  description: "Speak now. I'm listening.",
                  status: "info",
                  duration: 2000,
                  isClosable: true,
                });
                
                // Clean up the stream since we don't need it anymore
                stream.getTracks().forEach(track => track.stop());
              } catch (err) {
                console.error('Error starting speech recognition in Firefox:', err);
                setIsListening(false);
                throw err;
              }
            })
            .catch(err => {
              console.error('Error getting microphone permission in Firefox:', err);
              setPermissionState('denied');
              toast({
                title: "Microphone access denied",
                description: "Please allow microphone access for voice input to work.",
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            });
        } else {
          // For other browsers, start recognition directly
          speechRecognition.start();
          setIsListening(true);
          
          toast({
            title: "Listening...",
            description: "Speak now. I'm listening.",
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Could not start listening",
          description: "There was a problem starting voice input. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsListening(false);
      }
    }
  };
  
  return (
    <>
      <Tooltip label="Chat with Cycle Buddy AI" placement="right">
        <IconButton
          aria-label="Chat with Cycle Buddy AI"
          icon={<FaRobot />}
          colorScheme="purple"
          borderRadius="full"
          size="lg"
          onClick={onOpen}
          position="fixed"
          bottom="20px"
          left="20px"
          boxShadow="lg"
        />
      </Tooltip>
      
      <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader bg="purple.500" color="white">
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Avatar icon={<FaRobot />} bg="white" color="purple.500" mr={3} />
                <Text>Cycle Buddy AI</Text>
              </Flex>
              <IconButton
                aria-label="Voice settings"
                icon={<FaCog />}
                size="sm"
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={toggleVoiceSettings}
              />
            </Flex>
          </DrawerHeader>
          
          <DrawerBody p={0} display="flex" flexDirection="column">
            {/* Voice Settings Panel */}
            {showVoiceSettings && (
              <Box p={4} bg="gray.50" borderBottomWidth="1px">
                <Flex justify="space-between" align="center" mb={3}>
                  <Heading size="sm">Voice Settings</Heading>
                  <IconButton
                    aria-label="Close settings"
                    icon={<FaTimes />}
                    size="xs"
                    onClick={toggleVoiceSettings}
                  />
                </Flex>
                
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel htmlFor="google-tts" mb="0">
                    <Flex align="center">
                      <FaGoogle color="#4285F4" style={{ marginRight: '8px' }} />
                      <Text>Use Google Natural Voice</Text>
                    </Flex>
                  </FormLabel>
                  <Switch 
                    id="google-tts" 
                    isChecked={isGoogleTTS} 
                    onChange={toggleGoogleTTS} 
                    colorScheme="purple"
                  />
                </FormControl>
                
                {isGoogleTTS ? (
                  <FormControl mb={2}>
                    <FormLabel fontSize="sm">Google Voice</FormLabel>
                    <Select 
                      size="sm"
                      value={selectedGoogleVoice}
                      onChange={(e) => setSelectedGoogleVoice(e.target.value)}
                    >
                      {googleVoices.length > 0 ? (
                        googleVoices.map(voice => (
                          <option key={voice} value={voice}>
                            {voice}
                          </option>
                        ))
                      ) : (
                        <option value="en-US-Neural2-F">en-US-Neural2-F (Default)</option>
                      )}
                    </Select>
                  </FormControl>
                ) : (
                  <FormControl mb={2}>
                    <FormLabel fontSize="sm">Browser Voice</FormLabel>
                    <Select 
                      size="sm"
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const voice = availableVoices.find(v => v.name === e.target.value);
                        if (voice) setSelectedVoice(voice);
                      }}
                    >
                      {availableVoices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                <Box mt={4}>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      speakText("Hello, I'm your Cycle Buddy AI assistant. How can I help you today?");
                    }}
                    leftIcon={<FaVolumeUp />}
                    colorScheme="purple"
                    isDisabled={isPlayingAudio}
                  >
                    Test Voice
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Messages */}
            <VStack 
              spacing={4} 
              p={4} 
              overflowY="auto" 
              flex="1"
              align="stretch"
            >
              {messages.map((message, index) => (
                <Flex
                  key={index}
                  justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                >
                  <Box
                    maxW="80%"
                    bg={message.role === 'user' ? 'purple.500' : 'gray.100'}
                    color={message.role === 'user' ? 'white' : 'black'}
                    p={3}
                    borderRadius="lg"
                  >
                    <Text>{message.content}</Text>
                  </Box>
                </Flex>
              ))}
              {isLoading && (
                <Flex justify="flex-start">
                  <Box bg="gray.100" p={3} borderRadius="lg">
                    <Spinner size="sm" mr={2} />
                    <Text as="span">Thinking...</Text>
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>
            
            {/* Permission alert for microphone access */}
            {permissionState === 'denied' && (
              <Alert status="error" variant="solid">
                <AlertIcon />
                <Text fontSize="sm">
                  Microphone access denied. Please update your browser settings to enable voice input.
                </Text>
              </Alert>
            )}
            
            {/* Voice Status */}
            {(isSpeaking || isPlayingAudio) && (
              <Flex justify="center" py={1} bg="green.50">
                <Badge colorScheme="green" variant="subtle" px={2} py={1}>
                  <Flex align="center">
                    <Box as="span" 
                      width="8px" 
                      height="8px" 
                      borderRadius="full" 
                      bg="green.500" 
                      mr={2}
                      animation={`${pulseAnimation} 1s infinite`}
                    />
                    <Text>Speaking{isGoogleTTS ? ' (Google Voice)' : ''}</Text>
                  </Flex>
                </Badge>
              </Flex>
            )}
            
            {/* Input area */}
            <Box p={4} borderTop="1px solid" borderColor="gray.200">
              <HStack>
                <IconButton
                  aria-label={isSpeaking ? "Turn off voice" : "Turn on voice"}
                  icon={isSpeaking ? <FaVolumeUp /> : <FaVolumeMute />}
                  onClick={toggleSpeaking}
                  colorScheme={isSpeaking ? "green" : "gray"}
                  variant={isSpeaking ? "solid" : "outline"}
                  title={isSpeaking ? "Voice output is on" : "Voice output is off"}
                />
                <Input
                  placeholder="Ask Cycle Buddy AI something..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // If the AI is speaking and user starts typing, interrupt it
                    if (isPlayingAudio && e.target.value.trim() !== input.trim()) {
                      stopSpeaking();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <IconButton
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  icon={isListening ? <FaStop /> : <FaMicrophone />}
                  onClick={toggleListening}
                  colorScheme={isListening ? "red" : "gray"}
                  variant={isListening ? "solid" : "outline"}
                  isDisabled={permissionState === 'unsupported'}
                  title={isListening ? "Stop listening" : "Start voice input"}
                />
                <IconButton
                  aria-label="Send message"
                  icon={<FaPaperPlane />}
                  onClick={handleSendMessage}
                  colorScheme="purple"
                  isDisabled={!input.trim()}
                />
              </HStack>
              
              {/* Voice not supported warning */}
              {permissionState === 'unsupported' && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  Voice input is not supported on this browser.
                </Text>
              )}
              
              {/* Speech feedback */}
              {isListening && (
                <Flex align="center" justify="center" mt={2}>
                  <Box
                    bg="red.100"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    color="red.500"
                    animation={`${pulseAnimation} 1.5s infinite`}
                  >
                    Listening...
                  </Box>
                </Flex>
              )}
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Type definitions for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default CycleBuddyAI; 