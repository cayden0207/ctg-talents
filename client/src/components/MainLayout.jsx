import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery,
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
const BRAND_COLOR = '#0f172a'; // Dark Slate
const ACCENT_COLOR = '#3b82f6'; // Bright Blue

const MENU_ITEMS = {
  HQ_ADMIN: [
    { text: 'Overview', icon: <DashboardIcon />, path: '/hq/overview' },
    { text: 'Pipeline', icon: <KanbanIcon />, path: '/hq/pipeline' },
    { text: 'Talent Pool', icon: <PeopleIcon />, path: '/hq/pool' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ],
  JV_PARTNER: [
    { text: 'Inbox', icon: <InboxIcon />, path: '/jv/inbox' },
    { text: 'My Team', icon: <TeamIcon />, path: '/jv/team' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ]
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = MENU_ITEMS[user?.role] || [];
  const currentTitle = menu.find(item => item.path === location.pathname)?.text || 'CTG Talents';

  // Breadcrumb Logic
  const pathnames = location.pathname.split('/').filter((x) => x);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: BRAND_COLOR, color: 'white' }}>
      <Toolbar sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 70 }}>
         <Box 
           sx={{ 
             width: 36, 
             height: 36, 
             borderRadius: 2, 
             background: `linear-gradient(135deg, ${ACCENT_COLOR}, #60a5fa)`,
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             color: 'white',
             fontWeight: 'bold',
             fontSize: 20,
             boxShadow: '0 4px 12px rgba(59,130,246,0.5)'
            }}
          >
            C
          </Box>
         <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
            CTG Talents
         </Typography>
      </Toolbar>
      
      <Box sx={{ px: 2, mb: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </Box>

      <List sx={{ flex: 1, px: 2 }}>
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white'
                  },
                  '&.Mui-selected': {
                    bgcolor: ACCENT_COLOR,
                    color: 'white',
                    '&:hover': { bgcolor: ACCENT_COLOR },
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, fontSize: 15 }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 3, 
            bgcolor: 'rgba(255,255,255,0.05)', 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: ACCENT_COLOR, fontSize: 14, fontWeight: 'bold' }}>
            {user?.name?.[0] || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography variant="subtitle2" noWrap fontWeight="600">{user?.name}</Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }} noWrap>
              {user?.role === 'HQ_ADMIN' ? 'HQ Admin' : 'JV Partner'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#ffffff', // White topbar for contrast
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
          {/* Removed per user request */}
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
