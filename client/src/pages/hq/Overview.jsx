import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Stack, 
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Skeleton,
  IconButton
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  AccessTime, 
  PersonAdd,
  CheckCircle,
  Warning,
  ArrowForward,
  Add as AddIcon,
  MoreHoriz
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MOCK_TREND_DATA = [
  { name: 'Jan', new: 4, hired: 2 },
  { name: 'Feb', new: 7, hired: 3 },
  { name: 'Mar', new: 5, hired: 5 },
  { name: 'Apr', new: 12, hired: 8 },
  { name: 'May', new: 10, hired: 6 },
  { name: 'Jun', new: 18, hired: 12 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const CompactStatCard = ({ title, value, trend, trendValue, icon, color }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 2, 
      height: '100%', 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 3,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.2s',
      '&:hover': { borderColor: color, boxShadow: `0 4px 12px ${color}20` }
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
          {value}
        </Typography>
      </Stack>
      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 40, height: 40 }}>
        {React.cloneElement(icon, { fontSize: 'small' })}
      </Avatar>
    </Stack>
    
    <Stack direction="row" alignItems="center" spacing={1} mt={1}>
      <Chip 
        label={trendValue} 
        size="small" 
        sx={{ 
          height: 20, 
          fontSize: '0.7rem', 
          fontWeight: 'bold',
          bgcolor: trend === 'up' ? '#ecfdf5' : '#fef2f2',
          color: trend === 'up' ? '#10b981' : '#ef4444'
        }} 
      />
      <Typography variant="caption" color="text.secondary">vs last month</Typography>
    </Stack>
  </Paper>
);

const ActivityItem = ({ user, action, target, time, color }) => (
  <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
    <ListItemAvatar sx={{ minWidth: 40 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, mt: 1 }} />
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography variant="body2" fontWeight="500" lineHeight={1.4}>
          <b>{user}</b> {action} <b>{target}</b>
        </Typography>
      }
      secondary={
        <Typography variant="caption" color="text.secondary">{time}</Typography>
      }
    />
  </ListItem>
);

export default function HQOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/dashboard/metrics');
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <Box maxWidth="1600px" mx="auto">
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
          <Grid item xs={12} md={9}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={3}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
        </Grid>
      </Box>
    );
  }

  const totalHeadcount = metrics.headcountByJv.reduce((acc, curr) => acc + curr.count, 0);
  const pendingCount = metrics.recruitmentFunnel.find(f => f.status === 'PENDING_ACCEPTANCE')?.count || 0;
  const activePipeline = metrics.recruitmentFunnel.reduce((acc, curr) => ['NEW', 'INTERVIEWING', 'READY'].includes(curr.status) ? acc + curr.count : acc, 0);

  return (
    <Box maxWidth="1600px" mx="auto">
      {/* Bento Grid Layout */}
      <Grid container spacing={3}>
        
        {/* Left Main Column */}
        <Grid item xs={12} md={9}>
          <Stack spacing={3}>
            
            {/* 1. Stats Ribbon */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <CompactStatCard title="Total Staff" value={totalHeadcount} trend="up" trendValue="+12%" icon={<PersonAdd />} color="#3b82f6" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CompactStatCard title="Pipeline" value={activePipeline} trend="up" trendValue="+5%" icon={<TrendingUp />} color="#10b981" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CompactStatCard title="Pending" value={pendingCount} trend="down" trendValue="-2" icon={<AccessTime />} color="#f59e0b" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CompactStatCard title="Attention" value={metrics.staleCandidates.length} trend="up" trendValue="+3" icon={<Warning />} color="#ef4444" />
              </Grid>
            </Grid>

            {/* 2. Main Chart */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">Recruitment Velocity</Typography>
                  <Typography variant="body2" color="text.secondary">New candidates vs. Hired over time</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />}>View Report</Button>
              </Stack>
              <Box height={320}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={3} fill="url(#colorNew)" />
                    <Area type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={3} fill="url(#colorHired)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* 3. Secondary Charts Row */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>JV Distribution</Typography>
                  <Box height={200} display="flex" alignItems="center">
                    <Box flex={1} height="100%">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={metrics.headcountByJv.map(i => ({ name: i.currentJv?.name || 'U', value: i.count }))} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                            {metrics.headcountByJv.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Stack spacing={1} sx={{ minWidth: 120 }}>
                      {metrics.headcountByJv.map((item, i) => (
                        <Stack direction="row" alignItems="center" spacing={1} key={i}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                          <Typography variant="caption" color="text.secondary" noWrap>{item.currentJv?.name}</Typography>
                          <Typography variant="caption" fontWeight="bold">{item.count}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Quick Stats</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justify="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="600">Interview Pass Rate</Typography>
                        <Typography variant="caption" fontWeight="bold">68%</Typography>
                      </Stack>
                      <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                        <Box sx={{ height: '100%', width: '68%', bgcolor: '#3b82f6', borderRadius: 3 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Stack direction="row" justify="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="600">Offer Acceptance</Typography>
                        <Typography variant="caption" fontWeight="bold">92%</Typography>
                      </Stack>
                      <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                        <Box sx={{ height: '100%', width: '92%', bgcolor: '#10b981', borderRadius: 3 }} />
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

          </Stack>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={3}>
          <Box position="sticky" top={88}>
            <Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: '#1e293b', color: 'white', borderRadius: 3, backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#60a5fa' }}><AddIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">New Candidate</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Add to talent pool</Typography>
                </Box>
              </Stack>
              <Button variant="contained" fullWidth size="small" onClick={() => navigate('/hq/pool')} sx={{ bgcolor: '#3b82f6' }}>Create Profile</Button>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold">Recent Activity</Typography>
                <IconButton size="small"><MoreHoriz fontSize="small" /></IconButton>
              </Box>
              <List disablePadding sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <ActivityItem user="HQ Admin" action="interviewed" target="Alice Johnson" time="10m ago" color="#10b981" />
                <Divider component="li" />
                <ActivityItem user="JV Partner" action="rejected" target="Bob Smith" time="2h ago" color="#ef4444" />
                <Divider component="li" />
                <ActivityItem user="System" action="flagged" target="Candidate #92" time="5h ago" color="#f59e0b" />
                <Divider component="li" />
                <ActivityItem user="HQ Admin" action="added" target="Sarah Williams" time="1d ago" color="#3b82f6" />
              </List>
            </Paper>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}