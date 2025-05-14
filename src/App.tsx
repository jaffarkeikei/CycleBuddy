import { Box, Container, Heading, Text } from '@chakra-ui/react'

function App() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box textAlign="center" py={10}>
        <Heading as="h1" size="2xl" mb={4}>
          CycleBuddy
        </Heading>
        <Text fontSize="xl" color="gray.600">
          A Web3-powered menstrual health companion that puts privacy and education first.
        </Text>
      </Box>
    </Container>
  )
}

export default App 