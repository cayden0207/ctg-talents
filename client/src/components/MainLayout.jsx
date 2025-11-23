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
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ViewKanban as KanbanIcon,
  People as PeopleIcon,
  Inbox as InboxIcon,
  Group as TeamIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

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
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const menu = MENU_ITEMS[user?.role] || [];
  const currentTitle = menu.find(item => item.path === location.pathname)?.text || 'CTG Talents';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
         <Box 
           sx={{ 
             width: 32, 
             height: 32, 
             bgcolor: 'primary.main', 
             borderRadius: 1, 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             color: 'white',
             fontWeight: 'bold'
            }}
          >
            C
          </Box>
         <Typography variant="h6" color="text.primary" fontWeight="bold">
            CTG Talents
         </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 2, py: 2 }}>
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
                  bgcolor: isActive ? 'primary.soft' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.main' },
                    '& .MuiListItemIcon-root': { color: 'inherit' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: 'background.default', 
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            {user?.name?.[0] || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {user?.role === 'HQ_ADMIN' ? 'HQ Admin' : 'JV Partner'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto' }}>
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
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {currentTitle}
          </Typography>
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
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
          p: 3, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: '#f8fafc' // Subtle gray background for dashboard feel
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
