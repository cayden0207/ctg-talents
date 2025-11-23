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
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import api from '../../services/api';
import { ALL_STATUSES, statusLabel } from '../../constants/status';
import { SKILL_OPTIONS } from '../../constants/skills';
import CandidateDrawer from '../../components/CandidateDrawer';

const SectionHeader = ({ title }) => (
  <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>
    {title}
  </Typography>
);

export default function HQTalentPool() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [drawer, setDrawer] = useState({ open: false, candidate: null });
  
  // Modal State (Shared for Add/Edit)
  const [modal, setModal] = useState({ open: false, type: 'add', data: null }); 
  const [formData, setFormData] = useState({
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
  
  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '', functionRole: '', resumeUrl: '', tags: [], interviewNotes: '', expectedSalary: '' });
    setModal({ open: true, type: 'add', data: null });
  };

  const handleOpenEdit = (candidate) => {
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      functionRole: candidate.functionRole || '',
      resumeUrl: candidate.resumeUrl || '',
      tags: candidate.tags || [],
      interviewNotes: candidate.interviewNotes || '',
      expectedSalary: candidate.expectedSalary || '',
    });
    setModal({ open: true, type: 'edit', data: candidate });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
      };

      if (modal.type === 'add') {
        await api.post('/candidates', payload);
      } else {
        await api.put(`/candidates/${modal.data.id}`, payload);
      }

      setModal({ open: false, type: 'add', data: null });
      fetchCandidates();
    } catch (err) {
      alert('Error saving candidate');
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, renderCell: p => <b>{p.row.name}</b> },
    { field: 'functionRole', headerName: 'Function', width: 150 },
    { field: 'status', headerName: 'Status', width: 160, renderCell: p => <Chip label={statusLabel(p.row.status)} size="small" /> },
    { field: 'jv', headerName: 'Current JV', width: 180, valueGetter: (value, row) => row?.currentJv?.name || '-' },
    { field: 'action', headerName: 'Actions', width: 140, renderCell: p => (
      <Stack direction="row" spacing={1}>
         <Tooltip title="View Details">
            <IconButton size="small" onClick={() => setDrawer({ open: true, candidate: p.row })}>
              <ViewIcon fontSize="small" />
            </IconButton>
         </Tooltip>
         <Tooltip title="Edit Profile">
            <IconButton size="small" onClick={() => handleOpenEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
         </Tooltip>
      </Stack>
    )},
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Global Talent Pool</Typography>
        <Button variant="contained" onClick={handleOpenAdd}>Add New Candidate</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
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

      {/* Shared Add/Edit Dialog */}
      <Dialog open={modal.open} onClose={() => setModal({ ...modal, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>
          {modal.type === 'add' ? 'Add New Candidate' : 'Edit Candidate Profile'}
        </DialogTitle>
        <DialogContent dividers>
          <SectionHeader title="Basic Information" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Full Name" required fullWidth value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email Address" required fullWidth value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone Number" fullWidth value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Current Role / Function" fullWidth value={formData.functionRole} onChange={(e) => setFormData((prev) => ({ ...prev, functionRole: e.target.value }))} />
            </Grid>
          </Grid>

          <SectionHeader title="Professional Profile" />
          <Grid container spacing={2}>
             <Grid item xs={12}>
              <Autocomplete
                multiple
                options={SKILL_OPTIONS.map((option) => option.title)}
                groupBy={(option) => SKILL_OPTIONS.find(o => o.title === option)?.category}
                value={formData.tags}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, tags: newValue }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Skills & Expertise" placeholder="Select skills (e.g., React, Sales)" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Resume / Portfolio URL" fullWidth value={formData.resumeUrl} onChange={(e) => setFormData((prev) => ({ ...prev, resumeUrl: e.target.value }))} helperText="Link to Google Drive, Dropbox, or LinkedIn" />
            </Grid>
          </Grid>

          <SectionHeader title="HQ Evaluation" />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Interview Notes & Key Strengths" multiline rows={4} fullWidth value={formData.interviewNotes} onChange={(e) => setFormData((prev) => ({ ...prev, interviewNotes: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Salary (Annual)" fullWidth type="number" value={formData.expectedSalary} onChange={(e) => setFormData((prev) => ({ ...prev, expectedSalary: e.target.value }))} InputProps={{ startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography> }} />
            </Grid>
          </Grid>

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModal({ ...modal, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!formData.name || !formData.email}>
            {modal.type === 'add' ? 'Create Profile' : 'Save Changes'}
          </Button>
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
