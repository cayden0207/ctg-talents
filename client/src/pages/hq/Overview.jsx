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
  IconButton
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  PersonAdd, 
  Work, 
  AccessTime, 
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
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import api from '../../services/api';
import { statusLabel } from '../../constants/status';

// --- Data Utils ---
const COLORS = ['#0f172a', '#3b82f6', '#64748b', '#94a3b8'];
const MOCK_TREND = [
  { name: 'May', new: 12, hired: 5 },
  { name: 'Jun', new: 18, hired: 8 },
  { name: 'Jul', new: 15, hired: 10 },
  { name: 'Aug', new: 22, hired: 12 },
  { name: 'Sep', new: 28, hired: 18 },
  { name: 'Oct', new: 34, hired: 24 },
];

// --- Components ---

const KPICard = ({ title, value, icon, trend, color }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      height: '100%', 
      borderRadius: 3, 
      border: '1px solid', 
      borderColor: 'divider',
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      transition: 'all 0.2s ease-in-out',
      '&:hover': { boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)', borderColor: 'transparent' }
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ mt: 1, color: 'text.primary' }}>
          {value}
        </Typography>
      </Box>
      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, borderRadius: 2 }}>
        {icon}
      </Avatar>
    </Stack>
    <Stack direction="row" alignItems="center" spacing={1} mt={2}>
      <Chip 
        label={trend} 
        size="small" 
        sx={{ 
          bgcolor: trend.startsWith('+') ? '#ecfdf5' : '#fef2f2', 
          color: trend.startsWith('+') ? '#059669' : '#dc2626', 
          fontWeight: 'bold',
          height: 24 
        }} 
      />
      <Typography variant="caption" color="text.secondary">vs last month</Typography>
    </Stack>
  </Paper>
);

const SectionHeader = ({ title, action }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>{title}</Typography>
    {action && <IconButton size="small">{action}</IconButton>}
  </Stack>
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
  const pendingCount = metrics.recruitmentFunnel.find(f => f.status === 'PENDING_ACCEPTANCE')?.count || 0;
  const pipelineCount = metrics.recruitmentFunnel.reduce((acc, curr) => ['NEW', 'INTERVIEWING', 'READY'].includes(curr.status) ? acc + curr.count : acc, 0);

  const pieData = metrics.headcountByJv.map(i => ({ name: i.currentJv?.name || 'Unassigned', value: i.count }));

  return (
    <Box maxWidth="1600px" mx="auto" pb={4}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a' }}>Dashboard</Typography>
        <Typography color="text.secondary">Real-time insight into your talent ecosystem.</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LEVEL 1: KPIs */}
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="Total Headcount" value={totalHeadcount} icon={<Work />} trend="+12%" color="#0f172a" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="Active Pipeline" value={pipelineCount} icon={<PersonAdd />} trend="+5%" color="#3b82f6" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="Pending Actions" value={pendingCount} icon={<AccessTime />} trend="-2%" color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="Stale Candidates" value={metrics.staleCandidates.length} icon={<Warning />} trend="+3%" color="#ef4444" />
        </Grid>

        {/* LEVEL 2: Charts */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <SectionHeader title="Recruitment Trend" action={<ArrowForward />} />
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={MOCK_TREND}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b'}} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={3} fill="url(#colorNew)" />
                <Area type="monotone" dataKey="hired" stroke="#0f172a" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <SectionHeader title="JV Distribution" />
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* LEVEL 3: Detailed Data Table (Filling the void) */}
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>Stale Candidates (Need Attention)</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>CANDIDATE</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>CURRENT STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>JV ASSIGNMENT</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>LAST UPDATE</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.staleCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Good job! No stale candidates found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.staleCandidates.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{row.name[0]}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Chip label={statusLabel(row.status)} size="small" /></TableCell>
                        <TableCell>{row.currentJv?.name || 'Unassigned'}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {new Date(row.lastStatusUpdate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small"><ArrowForward fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
