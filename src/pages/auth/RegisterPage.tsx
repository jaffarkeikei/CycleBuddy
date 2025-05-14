import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Link,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { Logo } from '../../components/common/Logo';
import { useAuthStore } from '../../services/auth/authService';
import { passkeyService } from '../../services/auth/passkeyService';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<'parent' | 'teen'>('teen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [longOperation, setLongOperation] = useState(false);
  const { register, error } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // Add a timeout effect to detect long-running operations
  useEffect(() => {
    let timeoutId: number;
    
    if (isSubmitting) {
      timeoutId = window.setTimeout(() => {
        setLongOperation(true);
      }, 5000); // Show "taking longer than expected" after 5 seconds
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isSubmitting]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLongOperation(false);

    try {
      // Check if WebAuthn is supported
      if (!passkeyService.isSupported()) {
        toast({
          title: 'Error',
          description: 'Your browser does not support passkeys. Please use a modern browser.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Starting registration process from UI...');
      
      // Register with the specified user type and display name
      const success = await register(username, displayName || username, userType);

      console.log('Registration process completed with result:', success);
      
      if (success) {
        toast({
          title: 'Registration successful',
          description: 'Your account has been created successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect to the dashboard
        navigate(`/dashboard`);
      } else {
        toast({
          title: 'Registration failed',
          description: error || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Caught error during registration:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setLongOperation(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Flex direction="column" align="center">
          <Logo size="lg" mb={4} />
          <Heading size="xl" mb={2}>Create Account</Heading>
          <Text color="gray.600">Know your body, Own your cycle</Text>
        </Flex>

        {longOperation && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Taking longer than expected</AlertTitle>
              <AlertDescription>
                The registration process is taking longer than expected. This might be due to network issues or browser permissions.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleRegister}>
            <VStack spacing={6}>
              <FormControl id="username" isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </FormControl>

              <FormControl id="displayName">
                <FormLabel>Display Name</FormLabel>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you want to be called (optional)"
                />
              </FormControl>

              <FormControl id="userType" isRequired>
                <FormLabel>I am a</FormLabel>
                <RadioGroup onChange={(value) => setUserType(value as 'parent' | 'teen')} value={userType}>
                  <Stack direction="row" spacing={5}>
                    <Radio value="teen" colorScheme="teal">Teen</Radio>
                    <Radio value="parent" colorScheme="teal">Parent</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="teal"
                size="lg"
                width="full"
                isLoading={isSubmitting}
                loadingText={longOperation ? "Still working..." : "Creating Account"}
                mt={4}
              >
                Create Account with Passkey
              </Button>
              
              <Text fontSize="sm" color="gray.600" textAlign="center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </VStack>
          </form>
        </Box>

        <HStack pt={4}>
          <Text>Already have an account?</Text>
          <Link as={RouterLink} to="/login" color="teal.500">
            Sign in
          </Link>
        </HStack>
      </VStack>
    </Container>
  );
};

export default RegisterPage; 