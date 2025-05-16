import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Icon,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { FaArrowLeft, FaBell, FaLock, FaUser, FaCog } from 'react-icons/fa';

const SettingsPage = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600');

  const settingsOptions = [
    {
      title: 'Health Alerts',
      description: 'Configure your health alerts preferences',
      icon: FaBell,
      path: '/features/alerts',
    },
    {
      title: 'Account Settings',
      description: 'Manage your account preferences',
      icon: FaUser,
      path: '/account',
      disabled: true,
    },
    {
      title: 'Privacy Settings',
      description: 'Manage your privacy preferences',
      icon: FaLock,
      path: '/privacy',
      disabled: true,
    },
    {
      title: 'General Settings',
      description: 'Configure general application settings',
      icon: FaCog,
      path: '/general',
      disabled: true,
    },
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Heading mb={6}>Settings</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {settingsOptions.map((option, index) => (
          <Card 
            key={index}
            bg={cardBg}
            _hover={!option.disabled ? { bg: cardHoverBg, transform: 'translateY(-4px)', shadow: 'md' } : {}}
            cursor={option.disabled ? 'not-allowed' : 'pointer'}
            onClick={() => !option.disabled && navigate(option.path)}
            opacity={option.disabled ? 0.6 : 1}
            transition="all 0.2s"
          >
            <CardBody>
              <HStack spacing={4}>
                <Icon as={option.icon} boxSize={6} color="purple.500" />
                <VStack align="start">
                  <Heading size="md">{option.title}</Heading>
                  <Text>{option.description}</Text>
                  {option.disabled && <Text fontSize="sm" color="gray.500">(Coming soon)</Text>}
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default SettingsPage; 