import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Stack, 
  Avatar,
  Chip,
  Skeleton,
  IconButton,
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { 
  TrendingUp, 
  Person, 
  WorkOutline, 
  AssignmentLate, 
  ArrowForward, 
  MoreHoriz,
  FilterList
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar
} from 'recharts';
import api from '../../services/api';
import { statusLabel } from '../../constants/status';

// --- Styles & Utils ---
const CARD_RADIUS = 4;
const MOCK_DATA = [
  { name: 'Mon', active: 12, hired: 2 },
  { name: 'Tue', active: 19, hired: 4 },
  { name: 'Wed', active: 15, hired: 6 },
  { name: 'Thu', active: 22, hired: 9 },
  { name: 'Fri', active: 30, hired: 14 },
  { name: 'Sat', active: 25, hired: 14 },
  { name: 'Sun', active: 18, hired: 14 },
];

const HeroCard = ({ title, value, trend, subtext }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 4, 
      height: '100%', 
      borderRadius: CARD_RADIUS, 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
      <Person sx={{ fontSize: 180 }} />
    </Box>
    <Box>
      <Typography variant="subtitle2" sx={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
      <Typography variant="h2" fontWeight="800" sx={{ mt: 2, letterSpacing: -1 }}>{value}</Typography>
    </Box>
    <Stack direction="row" alignItems="center" spacing={1} mt={3}>
      <Chip label={trend} size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }} />
      <Typography variant="body2" sx={{ opacity: 0.7 }}>{subtext}</Typography>
    </Stack>
  </Paper>
);

const MiniCard = ({ title, value, icon, color }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2.5, 
      height: '100%', 
      borderRadius: CARD_RADIUS, 
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-2px)', borderColor: color }
    }}
  >
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase' }}>{title}</Typography>
      <Typography variant="h4" fontWeight="700" sx={{ mt: 0.5, color: '#1e293b' }}>{value}</Typography>
    </Box>
    <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, borderRadius: 2 }}>
      {icon}
    </Avatar>
  </Paper>
);

const ActionTable = ({ data }) => (
  <Box>
    {data.map((row, i) => (
      <Box key={row.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, borderBottom: i < data.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: '#f1f5f9', color: '#64748b' }}>{row.name[0]}</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="600">{row.name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.functionRole}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={statusLabel(row.status)} size="small" sx={{ height: 24, fontSize: 11, bgcolor: '#f1f5f9' }} />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
            {new Date(row.lastStatusUpdate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Typography>
        </Stack>
      </Box>
    ))}
    {data.length === 0 && <Typography color="text.secondary" align="center" py={4}>No items requiring attention.</Typography>}
  </Box>
);

export default function HQOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/dashboard/metrics');
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !metrics) return <Skeleton variant="rectangular" height="100vh" />;

  const totalHeadcount = metrics.headcountByJv.reduce((acc, curr) => acc + curr.count, 0);
  const pipelineCount = metrics.recruitmentFunnel.reduce((acc, curr) => ['NEW', 'INTERVIEWING', 'READY'].includes(curr.status) ? acc + curr.count : acc, 0);
  const pendingCount = metrics.recruitmentFunnel.find(f => f.status === 'PENDING_ACCEPTANCE')?.count || 0;

  return (
    <Box maxWidth="1600px" mx="auto" pb={4}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', letterSpacing: -0.5 }}>Dashboard</Typography>
          <Typography color="text.secondary" mt={0.5}>Overview of your recruitment ecosystem</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ borderColor: '#cbd5e1', color: '#64748b' }}>Filter</Button>
          <Button variant="contained" sx={{ bgcolor: '#0f172a', px: 3 }}>Download Report</Button>
        </Stack>
      </Stack>

      {/* Hero & Stats Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4} lg={3}>
          <HeroCard 
            title="Total Headcount" 
            value={totalHeadcount} 
            trend="+12%" 
            subtext="vs. last month" 
          />
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <Grid container spacing={3} height="100%">
            <Grid item xs={12} sm={4}>
              <MiniCard title="Active Pipeline" value={pipelineCount} icon={<TrendingUp />} color="#3b82f6" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MiniCard title="Pending Actions" value={pendingCount} icon={<AssignmentLate />} color="#f59e0b" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MiniCard title="Open Roles" value="8" icon={<WorkOutline />} color="#8b5cf6" />
            </Grid>
            
            {/* Wide Chart inside the grid */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', height: 280 }} elevation={0}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">Activity Trend</Typography>
                  <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ minHeight: 36 }}>
                    <Tab label="Weekly" sx={{ minHeight: 36, py: 0 }} />
                    <Tab label="Monthly" sx={{ minHeight: 36, py: 0 }} />
                  </Tabs>
                </Stack>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={MOCK_DATA}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:12}} />
                    <Tooltip contentStyle={{borderRadius: 8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} fill="url(#colorActive)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Bottom Section: Tables & Insights */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 0, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">Stale Candidates</Typography>
              <Button size="small" endIcon={<ArrowForward />}>View All</Button>
            </Box>
            <Box sx={{ p: 3 }}>
              <ActionTable data={metrics.staleCandidates} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Recruitment Funnel</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={metrics.recruitmentFunnel.filter(f => f.count > 0).slice(0, 5)} barSize={20}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="status" type="category" width={100} tick={{fontSize: 11}} tickFormatter={(val) => statusLabel(val)} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}