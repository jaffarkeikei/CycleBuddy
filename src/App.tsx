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

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Services
import { authService } from './services/auth/authService';

// Test Components
import ContractTest from './tests/ContractTest';
import PasskeyTest from './tests/PasskeyTest';

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
          <div>
            <nav className="bg-gray-800 text-white p-4">
              <Link to="/deploy" className="hover:text-gray-300">Deploy Contracts</Link>
            </nav>
          </div>

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Test routes */}
            <Route path="/test/contract" element={<ContractTest />} />
            <Route path="/test/passkey" element={<PasskeyTest />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
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