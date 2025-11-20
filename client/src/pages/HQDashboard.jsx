import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Box,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CandidateDrawer from '../components/CandidateDrawer';
import { ALL_STATUSES, getNextStatuses, statusLabel } from '../constants/status';

const HQDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [jvs, setJvs] = useState([]);
  const [metrics, setMetrics] = useState({ headcountByJv: [], recruitmentFunnel: [], staleCandidates: [] });
  const [filters, setFilters] = useState({ status: '', jvId: '', search: '' });
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    functionRole: '',
    resumeUrl: '',
    tags: '',
    interviewNotes: '',
    expectedSalary: '',
  });

  const [allocateState, setAllocateState] = useState({ open: false, candidate: null, targetJvId: '', note: '' });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const fetchMetadata = async () => {
    try {
      const [jvRes, metricsRes] = await Promise.all([api.get('/jvs'), api.get('/dashboard/metrics')]);
      setJvs(jvRes.data);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error('Unable to fetch metadata', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/candidates', { params: filters });
      setCandidates(data);
    } catch (err) {
      console.error('Unable to fetch candidates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    try {
      await api.post('/candidates', {
        ...newCandidate,
        tags: newCandidate.tags,
        expectedSalary: newCandidate.expectedSalary ? Number(newCandidate.expectedSalary) : undefined,
      });
      setOpenAdd(false);
      setNewCandidate({ name: '', email: '', phone: '', functionRole: '', resumeUrl: '', tags: '', interviewNotes: '', expectedSalary: '' });
      fetchCandidates();
    } catch (err) {
      alert('Error adding candidate');
    }
  };

  const openAllocationDialog = (candidate) => {
    setAllocateState({
      open: true,
      candidate,
      targetJvId: candidate.pendingJvId || candidate.currentJvId || '',
      note: candidate.statusNote || '',
    });
  };

  const handleAllocate = async () => {
    try {
      await api.post(`/candidates/${allocateState.candidate.id}/allocate`, {
        targetJvId: allocateState.targetJvId,
        note: allocateState.note,
      });
      setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' });
      fetchCandidates();
      fetchMetadata();
    } catch (err) {
      alert('Error allocating candidate');
    }
  };

  const handleStatusAdvance = async (candidateId, nextStatus) => {
    try {
      await api.post(`/candidates/${candidateId}/status`, { nextStatus });
      fetchCandidates();
      fetchMetadata();
    } catch (err) {
      alert('Unable to update status');
    }
  };

  const statusColor = useMemo(() => ({
    READY: 'info',
    PENDING_ACCEPTANCE: 'warning',
    ONBOARDING: 'primary',
    PROBATION: 'secondary',
    CONFIRMED: 'success',
    PIP: 'error',
    RESIGNED: 'default',
    TERMINATED: 'default',
    RETURNED: 'default',
    NEW: 'default',
    INTERVIEWING: 'default',
  }), []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const [drawer, setDrawer] = useState({ open: false, candidate: null });

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, renderCell: (p) => (
      <Box>
        <Typography fontWeight={600}>{p.row.name}</Typography>
        <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
      </Box>
    )},
    { field: 'functionRole', headerName: 'Function', width: 160, renderCell: (p) => (
      <Typography variant="body2">{p?.row?.functionRole || '-'}</Typography>
    )},
    { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => (
      <Chip size="small" label={statusLabel(p.row.status)} />
    )},
    { field: 'assignment', headerName: 'Assignment', width: 200, renderCell: (p) => (
      <Box>
        <Typography variant="body2">{p.row.currentJv?.name || 'HQ Pool'}</Typography>
        {p.row.pendingJv && <Typography variant="caption" color="text.secondary">Pending: {p.row.pendingJv.name}</Typography>}
      </Box>
    )},
    { field: 'tags', headerName: 'Tags', width: 180, renderCell: (p) => (
      <Box>
        {(p.row.tags || []).slice(0, 3).map((t) => (
          <Chip key={t} size="small" label={t} sx={{ mr: .5 }} />
        ))}
        {(p.row.tags || []).length > 3 && <Typography variant="caption" color="text.secondary">+{(p.row.tags || []).length - 3}</Typography>}
      </Box>
    )},
    { field: 'actions', headerName: 'Actions', width: 220, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={() => setDrawer({ open: true, candidate: p.row })}>View</Button>
        <Button size="small" onClick={() => openAllocationDialog(p.row)}>Allocate</Button>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Next</InputLabel>
          <Select label="Next" value="" onChange={(e) => handleStatusAdvance(p.row.id, e.target.value)}>
            <MenuItem value="">Select</MenuItem>
            {getNextStatuses(p.row.status).map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
    )},
  ];

  return (
    <Layout title="HQ Command Center">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">JV Headcount</Typography>
          <Divider sx={{ my: 1 }} />
          {metrics.headcountByJv.length === 0 && <Typography>No active employees</Typography>}
          {metrics.headcountByJv.map((row) => {
            const jvName = row['currentJv.name'] || jvs.find((jv) => jv.id === row.currentJvId)?.name || 'Unassigned';
            return (
              <Stack direction="row" justifyContent="space-between" key={row.currentJvId || jvName} sx={{ py: 0.5 }}>
                <Typography>{jvName}</Typography>
                <Typography fontWeight={600}>{row.count}</Typography>
              </Stack>
            );
          })}
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Recruitment Funnel</Typography>
          <Divider sx={{ my: 1 }} />
          {metrics.recruitmentFunnel.map((row) => (
            <Stack direction="row" justifyContent="space-between" key={row.status} sx={{ py: 0.25 }}>
              <Typography>{statusLabel(row.status)}</Typography>
              <Typography fontWeight={600}>{row.count}</Typography>
            </Stack>
          ))}
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Stale Updates (&gt;90d)</Typography>
          <Divider sx={{ my: 1 }} />
          {metrics.staleCandidates.length === 0 && <Typography>No stale candidates 🎉</Typography>}
          {metrics.staleCandidates.map((cand) => (
            <Box key={cand.id} sx={{ mb: 1 }}>
              <Typography fontWeight={600}>{cand.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {statusLabel(cand.status)} • {cand.currentJv?.name || 'HQ Pool'}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {ALL_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>JV</InputLabel>
            <Select
              label="JV"
              value={filters.jvId}
              onChange={(e) => handleFilterChange('jvId', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {jvs.map((jv) => (
                <MenuItem key={jv.id} value={jv.id}>{jv.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setOpenAdd(true)}>Add Candidate</Button>
        </Stack>
      </Paper>

      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={candidates}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </Paper>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Candidate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" fullWidth value={newCandidate.name} onChange={(e) => setNewCandidate((prev) => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" fullWidth value={newCandidate.email} onChange={(e) => setNewCandidate((prev) => ({ ...prev, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth value={newCandidate.phone} onChange={(e) => setNewCandidate((prev) => ({ ...prev, phone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Function" fullWidth value={newCandidate.functionRole} onChange={(e) => setNewCandidate((prev) => ({ ...prev, functionRole: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Resume URL" fullWidth value={newCandidate.resumeUrl} onChange={(e) => setNewCandidate((prev) => ({ ...prev, resumeUrl: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Tags (comma separated)" fullWidth value={newCandidate.tags} onChange={(e) => setNewCandidate((prev) => ({ ...prev, tags: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Interview Notes" multiline rows={3} fullWidth value={newCandidate.interviewNotes} onChange={(e) => setNewCandidate((prev) => ({ ...prev, interviewNotes: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Salary" fullWidth value={newCandidate.expectedSalary} onChange={(e) => setNewCandidate((prev) => ({ ...prev, expectedSalary: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCandidate}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={allocateState.open} onClose={() => setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' })}>
        <DialogTitle>Allocate {allocateState.candidate?.name}</DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Joint Venture</InputLabel>
            <Select
              label="Joint Venture"
              value={allocateState.targetJvId}
              onChange={(e) => setAllocateState((prev) => ({ ...prev, targetJvId: e.target.value }))}
            >
              <MenuItem value="">Select JV</MenuItem>
              {jvs.map((jv) => (
                <MenuItem key={jv.id} value={jv.id}>{jv.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Message"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={allocateState.note}
            onChange={(e) => setAllocateState((prev) => ({ ...prev, note: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' })}>Cancel</Button>
          <Button variant="contained" disabled={!allocateState.targetJvId} onClick={handleAllocate}>Allocate</Button>
        </DialogActions>
      </Dialog>

      <CandidateDrawer open={drawer.open} candidate={drawer.candidate} onClose={() => setDrawer({ open: false, candidate: null })} />
    </Layout>
  );
};

export default HQDashboard;
