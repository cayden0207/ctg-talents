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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { 
  TrendingUp, 
  Person, 
  WorkOutline, 
  AssignmentLate, 
  Warning,
  ArrowForward
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

// --- Utils ---
const MOCK_TREND = [
  { name: 'Mon', value: 4 },
  { name: 'Tue', value: 7 },
  { name: 'Wed', value: 5 },
  { name: 'Thu', value: 12 },
  { name: 'Fri', value: 9 },
  { name: 'Sat', value: 6 },
  { name: 'Sun', value: 8 },
];

// Uniform Card Component
const StatCard = ({ title, value, icon, trend, color }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      height: '100%', 
      borderRadius: 2, 
      border: '1px solid', 
      borderColor: 'divider',
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="700" sx={{ color: 'text.primary' }}>
          {value}
        </Typography>
      </Stack>
      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, borderRadius: 2 }}>
        {icon}
      </Avatar>
    </Stack>
    
    <Stack direction="row" alignItems="center" spacing={1} mt={2}>
      <Chip 
        label={trend} 
        size="small" 
        sx={{ 
          height: 24, 
          fontWeight: 'bold',
          bgcolor: trend.startsWith('+') ? '#ecfdf5' : '#fef2f2',
          color: trend.startsWith('+') ? '#10b981' : '#ef4444'
        }} 
      />
      <Typography variant="caption" color="text.secondary">vs last month</Typography>
    </Stack>
  </Paper>
);

export default function HQOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>Dashboard</Typography>
        <Typography color="text.secondary">Key metrics and operational insights.</Typography>
      </Box>

      <Stack spacing={3}>
        
        {/* ROW 1: Uniform KPI Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Total Headcount" value={totalHeadcount} icon={<Person />} trend="+12%" color="#0f172a" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Active Pipeline" value={pipelineCount} icon={<TrendingUp />} trend="+5%" color="#3b82f6" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Pending Actions" value={pendingCount} icon={<AssignmentLate />} trend="-2%" color="#f59e0b" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Stale Candidates" value={metrics.staleCandidates.length} icon={<Warning />} trend="+3%" color="#ef4444" />
          </Grid>
        </Grid>

        {/* ROW 2: Charts (Fixed Height Alignment) */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, height: 400, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Typography variant="h6" fontWeight="bold" mb={3}>Recruitment Velocity</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={MOCK_TREND}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b'}} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, height: 400, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Typography variant="h6" fontWeight="bold" mb={3}>Pipeline Funnel</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={metrics.recruitmentFunnel.filter(f => f.count > 0).slice(0,6)} barSize={24}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="status" type="category" width={120} tick={{fontSize: 11}} tickFormatter={(val) => statusLabel(val)} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* ROW 3: Full Width Table */}
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Needs Attention</Typography>
            <Button endIcon={<ArrowForward />}>View All Candidates</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>CANDIDATE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ASSIGNED TO</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>LAST UPDATE</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.staleCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>All caught up!</TableCell>
                  </TableRow>
                ) : (
                  metrics.staleCandidates.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{row.name[0]}</Avatar>
                          <Typography variant="body2" fontWeight="600">{row.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip label={statusLabel(row.status)} size="small" /></TableCell>
                      <TableCell>{row.currentJv?.name || 'Unassigned'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{new Date(row.lastStatusUpdate).toLocaleDateString()}</TableCell>
                      <TableCell align="right"><Button size="small">Detail</Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Stack>
    </Box>
  );
}
