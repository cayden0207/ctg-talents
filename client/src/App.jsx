import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HQDashboard from './pages/HQDashboard';
import { CssBaseline } from '@mui/material';

import JVDashboard from './pages/JVDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/hq/*" element={
            <ProtectedRoute allowedRoles={['HQ_ADMIN']}>
              <HQDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/jv/*" element={
            <ProtectedRoute allowedRoles={['JV_PARTNER']}>
              <JVDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;