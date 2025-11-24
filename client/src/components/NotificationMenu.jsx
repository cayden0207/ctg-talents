import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  ListItemIcon,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  PersonAdd, 
  Comment, 
  CheckCircle, 
  Cancel 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const getIcon = (type) => {
  if (type.includes('comment')) return <Comment fontSize="small" color="primary" />;
  if (type.includes('accepted')) return <CheckCircle fontSize="small" color="success" />;
  if (type.includes('rejected')) return <Cancel fontSize="small" color="error" />;
  return <PersonAdd fontSize="small" color="action" />;
};

export default function NotificationMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.readAt).length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleRead = async (notification) => {
    if (!notification.readAt) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, readAt: new Date() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    handleClose();
    
    // Navigate based on context
    // Assuming payload usually has candidateId
    if (notification.payload?.candidateId) {
      // Determine route based on role (logic simplified here, ideally context aware)
      // Since we don't easily know if it's inbox or pool, we might just go to a generic view or let the user find it
      // For now, let's just stay on page or go to inbox if likely JV
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight="bold">Notifications</Typography>
          <Button size="small" onClick={fetchNotifications}>Refresh</Button>
        </Box>
        <List disablePadding>
          {notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">No notifications yet</Typography>
            </Box>
          )}
          {notifications.map((item) => (
            <React.Fragment key={item.id}>
              <ListItem 
                alignItems="flex-start" 
                button 
                onClick={() => handleRead(item)}
                sx={{ bgcolor: item.readAt ? 'transparent' : 'action.hover' }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  {getIcon(item.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: item.readAt ? 400 : 600 }}>
                      {item.type.replace('.', ' ').toUpperCase()}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="caption" display="block" color="text.primary">
                        {item.payload?.candidateName || 'Update'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.payload?.preview || item.payload?.note || new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Menu>
    </>
  );
}
