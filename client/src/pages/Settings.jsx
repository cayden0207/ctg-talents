import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Grid, 
  Switch, 
  FormControlLabel, 
  Divider,
  Avatar,
  Stack,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ProfileTab = ({ user }) => {
  const { showToast } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email
    }
  });

  const onSubmit = async (data) => {
    try {
      await api.put('/me/profile', data);
      showToast('Profile updated successfully', 'success');
      // In a real app, we should reload user context here
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mt: 3 }} component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="row" spacing={3} alignItems="center" mb={4}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
          {user?.name?.[0]}
        </Avatar>
        <Box>
          <Button variant="outlined" component="label" size="small">
            Upload New Picture
            <input hidden accept="image/*" multiple type="file" />
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" mt={1}>
            JPG, GIF or PNG. Max size of 800K
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField label="Full Name" fullWidth {...register('name')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Role" value={user?.role} disabled fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Email Address" fullWidth {...register('email')} />
        </Grid>
      </Grid>
      <Button variant="contained" sx={{ mt: 3 }} type="submit">Save Changes</Button>
    </Box>
  );
};

const SecurityTab = () => {
  const { showToast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      await api.put('/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      showToast('Password changed successfully', 'success');
      reset();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mt: 3 }} component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>Change Password</Typography>
      <Stack spacing={3}>
        <TextField 
          type="password" 
          label="Current Password" 
          fullWidth 
          {...register('currentPassword', { required: true })} 
        />
        <TextField 
          type="password" 
          label="New Password" 
          fullWidth 
          {...register('newPassword', { required: true, minLength: 6 })} 
          helperText={errors.newPassword && "Min 6 chars"}
        />
        <TextField 
          type="password" 
          label="Confirm New Password" 
          fullWidth 
          {...register('confirmPassword', { required: true })} 
        />
        <Box>
          <Button variant="contained" color="primary" type="submit">Update Password</Button>
        </Box>
      </Stack>
    </Box>
  );
};

const NotificationsTab = () => (
  <Box sx={{ maxWidth: 600, mt: 3 }}>
    <Alert severity="info" sx={{ mb: 3 }}>Notification settings are currently managed by your organization admin.</Alert>
    
    <Typography variant="h6" gutterBottom>Email Notifications</Typography>
    <Stack spacing={2}>
      <FormControlLabel control={<Switch defaultChecked disabled />} label="New candidate assigned" />
      <FormControlLabel control={<Switch defaultChecked disabled />} label="Candidate status updates" />
      <FormControlLabel control={<Switch disabled />} label="Weekly summary report" />
    </Stack>
    
    <Divider sx={{ my: 3 }} />
    
    <Typography variant="h6" gutterBottom>System Alerts</Typography>
    <Stack spacing={2}>
      <FormControlLabel control={<Switch defaultChecked />} label="Browser push notifications" />
      <FormControlLabel control={<Switch defaultChecked />} label="Sound alerts" />
    </Stack>
  </Box>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Settings</Typography>
      <Paper sx={{ p: 3, minHeight: 500 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Profile" />
          <Tab label="Security" />
          <Tab label="Notifications" />
        </Tabs>
        
        {tab === 0 && <ProfileTab user={user} />}
        {tab === 1 && <SecurityTab />}
        {tab === 2 && <NotificationsTab />}
      </Paper>
    </Box>
  );
}