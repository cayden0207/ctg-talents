import React, { useState } from 'react';
  CssBaseline,
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ViewKanban as KanbanIcon,
  People as PeopleIcon,
  Inbox as InboxIcon,
  Group as TeamIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;
// ... (keep constants)

const MainLayout = () => {
  // ... (keep existing hooks)
  
  // Breadcrumb Logic
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#ffffff',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ minHeight: 70 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Dynamic Breadcrumbs */}
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
              <MuiLink component={RouterLink} to="/" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
                 CTG Talents
              </MuiLink>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                // Capitalize
                const title = value.charAt(0).toUpperCase() + value.slice(1);

                return last ? (
                  <Typography key={to} color="text.primary" fontWeight="700">
                    {title}
                  </Typography>
                ) : (
                  <MuiLink component={RouterLink} to={to} underline="hover" color="inherit" key={to}>
                    {title}
                  </MuiLink>
                );
              })}
            </Breadcrumbs>
          </Box>

          {/* Quick Actions (Visible on HQ only usually) */}
// ... (keep existing actions)
          {user?.role === 'HQ_ADMIN' && (
             <Button 
               variant="contained" 
               startIcon={<AddIcon />} 
               sx={{ 
                 bgcolor: '#0f172a', 
                 borderRadius: 2, 
                 textTransform: 'none', 
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                 '&:hover': { bgcolor: '#1e293b' }
                }}
               onClick={() => navigate('/hq/pool')} // Quick jump to pool to add
             >
               Add Candidate
             </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: BRAND_COLOR },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', bgcolor: BRAND_COLOR },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 4, // Increased padding for better breathing room
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: '#f1f5f9' // Light slate background
        }}
      >
        <Toolbar sx={{ minHeight: 70 }} /> {/* Spacer matching AppBar height */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;