import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { testnetChainMetadata } from './config/soroban';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import { DeployContracts } from './pages/DeployContracts';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Services
import { authService } from './services/auth/authService';

// Test Components
import ContractTest from './tests/ContractTest';
import PasskeyTest from './tests/PasskeyTest';

// Advanced Stellar Features Placeholders
const DonationPage = () => <Box p={8}>Donation Feature Page</Box>;
const DataSharingPage = () => <Box p={8}>Data Sharing Feature Page</Box>;
const RewardsPage = () => <Box p={8}>Rewards Feature Page</Box>;
const ZKValidationPage = () => <Box p={8}>Zero-Knowledge Validation Feature Page</Box>;
const DataMarketplacePage = () => <Box p={8}>Data Marketplace Feature Page</Box>;
const HealthAlertsPage = () => <Box p={8}>Health Alerts Feature Page</Box>;

const connectors = [freighter()];

function App() {
  useEffect(() => {
    // Initialize auth on app load
    const initAuth = async () => {
      await authService.initializeAuth();
    };

    initAuth();
  }, []);

  return (
    <SorobanReactProvider
      chains={[testnetChainMetadata]}
      activeChain={testnetChainMetadata}
      connectors={connectors}
    >
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Test routes */}
            <Route path="/test/contract" element={<ContractTest />} />
            <Route path="/test/passkey" element={<PasskeyTest />} />
            
            {/* Contract deployment route */}
            <Route path="/deploy" element={<DeployContracts />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Advanced Stellar Features Routes */}
            <Route path="/features/donate" element={
              <ProtectedRoute>
                <DonationPage />
              </ProtectedRoute>
            } />
            <Route path="/features/share" element={
              <ProtectedRoute>
                <DataSharingPage />
              </ProtectedRoute>
            } />
            <Route path="/features/rewards" element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            } />
            <Route path="/features/validate" element={
              <ProtectedRoute>
                <ZKValidationPage />
              </ProtectedRoute>
            } />
            <Route path="/features/marketplace" element={
              <ProtectedRoute>
                <DataMarketplacePage />
              </ProtectedRoute>
            } />
            <Route path="/features/alerts" element={
              <ProtectedRoute>
                <HealthAlertsPage />
              </ProtectedRoute>
            } />
            
            {/* Redirect to home page by default */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Box>
      </Router>
    </SorobanReactProvider>
  );
}

export default App; 