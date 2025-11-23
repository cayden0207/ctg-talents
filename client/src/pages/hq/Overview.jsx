import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Stack, 
  LinearProgress, 
  Chip, 
  Avatar,
  Divider,
  Button
} from '@mui/material';
import { 
  People as PeopleIcon, 
  TrendingUp as TrendingIcon, 
  AssignmentInd as AssignmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { statusLabel } from '../../constants/status';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, subtext }) => (
  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
          {title.toUpperCase()}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      </Box>
      <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
        {icon}
      </Avatar>
    </Box>
    {subtext && (
      <Typography variant="caption" color="text.secondary">
        {subtext}
      </Typography>
    )}
  </Paper>
);

const FunnelBar = ({ label, count, total, color }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight="500">{label}</Typography>
        <Typography variant="body2" color="text.secondary">{count}</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percent} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: 'grey.100',
          '& .MuiLinearProgress-bar': { bgcolor: color }
        }} 
      />
    </Box>
  );
};

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
    return <Box>Loading stats...</Box>;
  }

  // Derived stats
  const totalHeadcount = metrics.headcountByJv.reduce((acc, curr) => acc + curr.count, 0);
  const pendingCount = metrics.recruitmentFunnel.find(f => f.status === 'PENDING_ACCEPTANCE')?.count || 0;
  const readyCount = metrics.recruitmentFunnel.find(f => f.status === 'READY')?.count || 0;

  const maxFunnel = Math.max(...metrics.recruitmentFunnel.map(f => f.count), 1);

  return (
    <Box maxWidth="1600px" mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Command Center</Typography>
        <Button variant="contained" onClick={() => navigate('/hq/pool')}>Add Candidate</Button>
      </Stack>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Headcount" 
            value={totalHeadcount} 
            icon={<PeopleIcon />} 
            color="primary" 
            subtext="Active across all JVs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Ready to Allocate" 
            value={readyCount} 
            icon={<AssignmentIcon />} 
            color="info" 
            subtext="Candidates waiting in pool"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Acceptance" 
            value={pendingCount} 
            icon={<TrendingIcon />} 
            color="warning" 
            subtext="Awaiting JV response"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Stale Candidates" 
            value={metrics.staleCandidates.length} 
            icon={<WarningIcon />} 
            color="error" 
            subtext="> 90 days without update"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recruitment Pipeline</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Live snapshot of candidate distribution
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom color="primary.main">PRE-HIRE</Typography>
                <FunnelBar label="New Applications" count={metrics.recruitmentFunnel.find(f => f.status === 'NEW')?.count || 0} total={maxFunnel} color="#94a3b8" />
                <FunnelBar label="Interviewing" count={metrics.recruitmentFunnel.find(f => f.status === 'INTERVIEWING')?.count || 0} total={maxFunnel} color="#64748b" />
                <FunnelBar label="Ready for Allocation" count={metrics.recruitmentFunnel.find(f => f.status === 'READY')?.count || 0} total={maxFunnel} color="#3b82f6" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom color="success.main">POST-HIRE</Typography>
                <FunnelBar label="Onboarding" count={metrics.recruitmentFunnel.find(f => f.status === 'ONBOARDING')?.count || 0} total={maxFunnel} color="#8b5cf6" />
                <FunnelBar label="Probation" count={metrics.recruitmentFunnel.find(f => f.status === 'PROBATION')?.count || 0} total={maxFunnel} color="#ec4899" />
                <FunnelBar label="Active Employees" count={metrics.recruitmentFunnel.find(f => f.status === 'CONFIRMED')?.count || 0} total={maxFunnel} color="#10b981" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Headcount by JV</Typography>
            <Stack spacing={2} mt={2}>
              {metrics.headcountByJv.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'grey.200', color: 'text.primary' }}>
                      {item.currentJv?.name?.[0] || 'U'}
                    </Avatar>
                    <Typography variant="body2" fontWeight="500">
                      {item.currentJv?.name || 'Unassigned'}
                    </Typography>
                  </Box>
                  <Chip label={item.count} size="small" />
                </Box>
              ))}
              {metrics.headcountByJv.length === 0 && (
                <Typography color="text.secondary" align="center">No active placements</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}