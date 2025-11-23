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
  Stack
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ProfileTab = ({ user }) => (
  <Box sx={{ maxWidth: 600, mt: 3 }}>
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
        <TextField label="Full Name" defaultValue={user?.name} fullWidth />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Role" defaultValue={user?.role} disabled fullWidth />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Email Address" defaultValue={user?.email} fullWidth />
      </Grid>
    </Grid>
    <Button variant="contained" sx={{ mt: 3 }}>Save Changes</Button>
  </Box>
);

const SecurityTab = () => (
  <Box sx={{ maxWidth: 500, mt: 3 }}>
    <Typography variant="h6" gutterBottom>Change Password</Typography>
    <Stack spacing={3}>
      <TextField type="password" label="Current Password" fullWidth />
      <TextField type="password" label="New Password" fullWidth />
      <TextField type="password" label="Confirm New Password" fullWidth />
      <Box>
        <Button variant="contained" color="primary">Update Password</Button>
      </Box>
    </Stack>
  </Box>
);

const NotificationsTab = () => (
  <Box sx={{ maxWidth: 600, mt: 3 }}>
    <Typography variant="h6" gutterBottom>Email Notifications</Typography>
    <Stack spacing={2}>
      <FormControlLabel control={<Switch defaultChecked />} label="New candidate assigned" />
      <FormControlLabel control={<Switch defaultChecked />} label="Candidate status updates" />
      <FormControlLabel control={<Switch />} label="Weekly summary report" />
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
