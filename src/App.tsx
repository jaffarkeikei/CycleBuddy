import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';

// Pages
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import { authService } from './services/auth/authService';

// Test Components
import ContractTest from './tests/ContractTest';
import PasskeyTest from './tests/PasskeyTest';

function App() {
  useEffect(() => {
    // Initialize auth on app load
    const initAuth = async () => {
      await authService.initializeAuth();
    };

    initAuth();
  }, []);

  return (
    <Router>
      <Box minH="100vh" bg="gray.50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<IndexPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App; 