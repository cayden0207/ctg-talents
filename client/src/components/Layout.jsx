import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Badge,
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import InboxIcon from '@mui/icons-material/Inbox';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DoneIcon from '@mui/icons-material/DoneAll';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Layout = ({ children, title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const drawerWidth = 240;

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Unable to mark notification as read', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'HQ_ADMIN') {
      return [
        { label: 'Talent Pool', to: '/hq', icon: <GroupIcon fontSize="small" /> },
        { label: 'Dashboard', to: '/hq/dashboard', icon: <DashboardIcon fontSize="small" /> },
      ];
    }
    return [
      { label: 'Inbox', to: '/jv', icon: <InboxIcon fontSize="small" /> },
      { label: 'My Team', to: '/jv/team', icon: <ChecklistIcon fontSize="small" /> },
    ];
  }, [user]);

  return (
    <Box sx={{ display: 'flex', flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {user && (
            <IconButton color="inherit" edge="start" sx={{ mr: 1, display: { md: 'none' } }} onClick={() => setNavOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title || 'CTG Talents'}
          </Typography>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {user?.email} ({user?.role})
          </Typography>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => setNotifOpen(true)} sx={{ mr: 1 }}>
              <Badge color="error" badgeContent={unreadCount} max={9}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      {user && (
        <>
          {/* Permanent drawer (mdUp) */}
          <MuiDrawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
            open
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {navItems.map((item) => (
                  <ListItem key={item.to} disablePadding>
                    <NavLink
                      to={item.to}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 16px',
                        textDecoration: 'none',
                        color: isActive ? '#1976d2' : 'inherit',
                        fontWeight: isActive ? 600 : 400,
                      })}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  </ListItem>
                ))}
              </List>
            </Box>
          </MuiDrawer>

          {/* Temporary drawer (xsOnly) */}
          <MuiDrawer
            variant="temporary"
            open={navOpen}
            onClose={() => setNavOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ display: { xs: 'block', md: 'none' }, [`& .MuiDrawer-paper`]: { width: drawerWidth } }}
          >
            <Toolbar />
            <List>
              {navItems.map((item) => (
                <ListItem key={item.to} disablePadding onClick={() => setNavOpen(false)}>
                  <NavLink
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '10px 16px',
                      textDecoration: 'none',
                      color: isActive ? '#1976d2' : 'inherit',
                      fontWeight: isActive ? 600 : 400,
                    })}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </ListItem>
              ))}
            </List>
          </MuiDrawer>
        </>
      )}

      <Container maxWidth="lg" sx={{ mt: 10, mb: 4, ml: { md: `${drawerWidth}px` } }}>
        {children}
      </Container>
      <MuiDrawer anchor="right" open={notifOpen} onClose={() => setNotifOpen(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : (
            <List>
              {notifications.length === 0 && (
                <ListItem>
                  <ListItemText primary="No notifications" />
                </ListItem>
              )}
              {notifications.map((notif) => {
                let payload = notif.payload || {};
                if (typeof payload === 'string') {
                  try {
                    payload = JSON.parse(payload);
                  } catch (e) {
                    payload = {};
                  }
                }
                return (
                  <ListItem
                    key={notif.id}
                    secondaryAction={
                      !notif.readAt && (
                        <Tooltip title="Mark as read">
                          <IconButton edge="end" onClick={() => markNotificationRead(notif.id)}>
                            <DoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemText
                      primary={notif.type}
                      secondary={
                        <>
                          <Typography variant="body2">{payload.candidateName || payload.message || 'Update'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notif.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </MuiDrawer>
    </Box>
  );
};

export default Layout;
