import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';

// HQ Pages
import HQOverview from './pages/hq/Overview';
import HQPipeline from './pages/hq/Pipeline';
import HQTalentPool from './pages/hq/TalentPool';

// JV Pages
import JVInbox from './pages/jv/Inbox';
import JVTeam from './pages/jv/Team';

// Create a modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Modern blue (Tailwind-ish)
      light: '#60a5fa',
      contrastText: '#fff',
    },
    secondary: {
      main: '#475569', // Slate
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    }
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }, // Remove dark mode gradient overlay
      },
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Main Layout Routes */}
            <Route element={<MainLayout />}>
              
              {/* HQ Routes */}
              <Route path="/hq/overview" element={
                <ProtectedRoute allowedRoles={['HQ_ADMIN']}>
                  <HQOverview />
                </ProtectedRoute>
              } />
              <Route path="/hq/pipeline" element={
                <ProtectedRoute allowedRoles={['HQ_ADMIN']}>
                  <HQPipeline />
                </ProtectedRoute>
              } />
              <Route path="/hq/pool" element={
                <ProtectedRoute allowedRoles={['HQ_ADMIN']}>
                  <HQTalentPool />
                </ProtectedRoute>
              } />
              
              {/* JV Routes */}
              <Route path="/jv/inbox" element={
                <ProtectedRoute allowedRoles={['JV_PARTNER']}>
                  <JVInbox />
                </ProtectedRoute>
              } />
              <Route path="/jv/team" element={
                <ProtectedRoute allowedRoles={['JV_PARTNER']}>
                  <JVTeam />
                </ProtectedRoute>
              } />
            </Route>

            {/* Redirects */}
            <Route path="/hq" element={<Navigate to="/hq/overview" />} />
            <Route path="/jv" element={<Navigate to="/jv/inbox" />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;