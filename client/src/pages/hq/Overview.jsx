import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Stack, 
  Avatar,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Skeleton
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVert, 
  AccessTime, 
  PersonAdd,
  CheckCircle,
  Warning
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
import api from '../../services/api';

// Mock Data for Charts (Usually this comes from an aggregation endpoint)
const MOCK_TREND_DATA = [
  { name: 'Jan', new: 4, hired: 2 },
  { name: 'Feb', new: 7, hired: 3 },
  { name: 'Mar', new: 5, hired: 5 },
  { name: 'Apr', new: 12, hired: 8 },
  { name: 'May', new: 10, hired: 6 },
  { name: 'Jun', new: 18, hired: 12 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, trend, trendValue, icon, color }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 3, 
      height: '100%', 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <Box 
        sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: `${color}15`, // 15% opacity
          color: color,
          display: 'flex'
        }}
      >
        {React.cloneElement(icon, { fontSize: 'small' })}
      </Box>
      {trend && (
        <Chip 
          label={`${trendValue}`} 
          size="small" 
          color={trend === 'up' ? 'success' : 'error'} 
          sx={{ 
            bgcolor: trend === 'up' ? '#ecfdf5' : '#fef2f2',
            color: trend === 'up' ? '#10b981' : '#ef4444',
            fontWeight: 'bold',
            height: 24,
            borderRadius: 1
          }}
          icon={trend === 'up' ? <TrendingUp style={{fontSize: 14}} /> : <TrendingDown style={{fontSize: 14}} />}
        />
      )}
    </Stack>
    
    <Stack spacing={0.5}>
      <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="600">
        {title}
      </Typography>
    </Stack>
  </Paper>
);

const ActivityItem = ({ user, action, target, time, icon, color }) => (
  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
    <ListItemAvatar>
      <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 32, height: 32 }}>
        {icon}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography variant="body2" fontWeight="600">
          {user} <Typography component="span" variant="body2" color="text.secondary">{action}</Typography> {target}
        </Typography>
      }
      secondary={
        <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
          <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">{time}</Typography>
        </Stack>
      }
    />
  </ListItem>
);

export default function HQOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch specific chart data here
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
        <Box mb={4}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={400} />
        </Box>
        <Grid container spacing={3} mb={4}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper sx={{ p: 3, height: 140 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rectangular" width="40%" height={40} sx={{ my: 2 }} />
                <Skeleton variant="text" width="80%" />
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Skeleton variant="text" width="50%" sx={{ mb: 2 }} />
              <Stack spacing={2}>
                 {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" height={60} />)}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Calculate some derived stats
  const totalHeadcount = metrics.headcountByJv.reduce((acc, curr) => acc + curr.count, 0);
  const pendingCount = metrics.recruitmentFunnel.find(f => f.status === 'PENDING_ACCEPTANCE')?.count || 0;
  
  // Prepare Pie Chart Data
  const pieData = metrics.headcountByJv.map(item => ({
    name: item.currentJv?.name || 'Unknown',
    value: item.count
  }));

  return (
    <Box maxWidth="1600px" mx="auto">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" gutterBottom>Dashboard</Typography>
        <Typography color="text.secondary">Welcome back, HQ Administrator. Here's what's happening today.</Typography>
      </Box>

      {/* Top Stats Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Headcount" 
            value={totalHeadcount} 
            trend="up" 
            trendValue="12%" 
            icon={<PersonAdd />} 
            color="#3b82f6" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Pipeline" 
            value={metrics.recruitmentFunnel.reduce((acc, curr) => 
              ['NEW', 'INTERVIEWING', 'READY'].includes(curr.status) ? acc + curr.count : acc, 0)
            }
            trend="up" 
            trendValue="5%" 
            icon={<TrendingUp />} 
            color="#10b981" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Actions" 
            value={pendingCount} 
            trend="down" 
            trendValue="2" 
            icon={<AccessTime />} 
            color="#f59e0b" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Attention Needed" 
            value={metrics.staleCandidates.length} 
            trend="up" 
            trendValue="+3" 
            icon={<Warning />} 
            color="#ef4444" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Chart Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">Recruitment Velocity</Typography>
              <Button size="small" variant="outlined">Last 6 Months</Button>
            </Stack>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <Tooltip />
                <Area type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" name="New Applications" />
                <Area type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" name="Hired" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* JV Distribution */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Headcount Distribution</Typography>
            <Grid container alignItems="center">
              <Grid item xs={12} md={6}>
                 <Box height={250}>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                 </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  {pieData.map((entry, index) => (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" key={entry.name}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 6, bgcolor: COLORS[index % COLORS.length] }} />
                        <Typography variant="body2" fontWeight="500">{entry.name}</Typography>
                      </Stack>
                      <Typography fontWeight="bold">{entry.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Sidebar: Activity Feed */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0, height: 'fit-content', position: 'sticky', top: 100, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
               <Typography variant="subtitle1" fontWeight="bold">Recent Activity</Typography>
            </Box>
            <List sx={{ px: 2 }}>
              <ActivityItem 
                user="HQ Admin" action="interviewed" target="Alice Johnson" 
                time="10 mins ago" icon={<CheckCircle />} color="success" 
              />
              <Divider variant="inset" component="li" />
              <ActivityItem 
                user="JV Partner A" action="rejected" target="Bob Smith" 
                time="2 hours ago" icon={<Warning />} color="error" 
              />
              <Divider variant="inset" component="li" />
               <ActivityItem 
                user="System" action="flagged" target="Candidate #92" 
                time="5 hours ago" icon={<AccessTime />} color="warning" 
              />
              <Divider variant="inset" component="li" />
              <ActivityItem 
                user="HQ Admin" action="added" target="Sarah Williams" 
                time="1 day ago" icon={<PersonAdd />} color="primary" 
              />
            </List>
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
               <Button fullWidth variant="outlined" size="small" sx={{ borderRadius: 2 }}>View Full Log</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
 
