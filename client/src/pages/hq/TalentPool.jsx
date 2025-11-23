import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Stack,
  Button, 
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';
import { ALL_STATUSES, statusLabel } from '../../constants/status';
import { SKILL_OPTIONS } from '../../constants/skills';
import CandidateDrawer from '../../components/CandidateDrawer';

export default function HQTalentPool() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [drawer, setDrawer] = useState({ open: false, candidate: null });
  
  // Add Modal State
  const [openAdd, setOpenAdd] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    functionRole: '',
    resumeUrl: '',
    tags: [],
    interviewNotes: '',
    expectedSalary: '',
  });

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/candidates', { params: filters });
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCandidate = async () => {
    try {
      await api.post('/candidates', {
        ...newCandidate,
        tags: newCandidate.tags, // Already an array
        expectedSalary: newCandidate.expectedSalary ? Number(newCandidate.expectedSalary) : undefined,
      });
      setOpenAdd(false);
      setNewCandidate({ name: '', email: '', phone: '', functionRole: '', resumeUrl: '', tags: [], interviewNotes: '', expectedSalary: '' });
      fetchCandidates();
    } catch (err) {
      alert('Error adding candidate');
    }
  };

  const columns = [
// ... (keep existing columns)
    { field: 'name', headerName: 'Name', flex: 1, renderCell: p => <b>{p.row.name}</b> },
    { field: 'functionRole', headerName: 'Function', width: 150 },
    { field: 'status', headerName: 'Status', width: 160, renderCell: p => <Chip label={statusLabel(p.row.status)} size="small" /> },
    { field: 'jv', headerName: 'Current JV', width: 180, valueGetter: (value, row) => row?.currentJv?.name || '-' }, // Fixed: V7 signature

    { field: 'action', headerName: 'Action', width: 100, renderCell: p => (
      <Button size="small" onClick={() => setDrawer({ open: true, candidate: p.row })}>View</Button>
    )}
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Global Talent Pool</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>Add New Candidate</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        {/* ... existing filters ... */}
        <Stack direction="row" spacing={2}>
          <TextField 
            size="small" 
            label="Search Name/Email" 
            sx={{ width: 300 }} 
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select 
              label="Status" 
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {ALL_STATUSES.map(s => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper sx={{ flex: 1 }}>
        <DataGrid 
          rows={candidates} 
          columns={columns} 
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Add Candidate Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Candidate</DialogTitle>
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
              <TextField label="Function / Role" fullWidth value={newCandidate.functionRole} onChange={(e) => setNewCandidate((prev) => ({ ...prev, functionRole: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Resume URL (Google Drive / Dropbox)" fullWidth value={newCandidate.resumeUrl} onChange={(e) => setNewCandidate((prev) => ({ ...prev, resumeUrl: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={SKILL_OPTIONS.map((option) => option.title)}
                groupBy={(option) => SKILL_OPTIONS.find(o => o.title === option)?.category}
                value={newCandidate.tags}
                onChange={(event, newValue) => {
                  setNewCandidate((prev) => ({ ...prev, tags: newValue }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Skills & Tags" placeholder="Select skills" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Interview Notes & Key Strengths" multiline rows={3} fullWidth value={newCandidate.interviewNotes} onChange={(e) => setNewCandidate((prev) => ({ ...prev, interviewNotes: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Salary (Annual)" fullWidth type="number" value={newCandidate.expectedSalary} onChange={(e) => setNewCandidate((prev) => ({ ...prev, expectedSalary: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCandidate} disabled={!newCandidate.name || !newCandidate.email}>Save Profile</Button>
        </DialogActions>
      </Dialog>

      <CandidateDrawer 
        open={drawer.open} 
        candidate={drawer.candidate} 
        onClose={() => setDrawer({ open: false, candidate: null })} 
      />
    </Box>
  );
}