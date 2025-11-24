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
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Visibility as ViewIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../services/api';
import { ALL_STATUSES, statusLabel } from '../../constants/status';
import CandidateDrawer from '../../components/CandidateDrawer';
import CandidateFormDrawer from '../../components/CandidateFormDrawer';
import { useToast } from '../../context/ToastContext';

export default function HQTalentPool() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  
  // Drawers State
  const [viewDrawer, setViewDrawer] = useState({ open: false, candidate: null });
  const [formDrawer, setFormDrawer] = useState({ open: false, type: 'add', data: null });

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
  
  const handleOpenAdd = () => setFormDrawer({ open: true, type: 'add', data: null });
  
  const handleOpenEdit = (candidate) => setFormDrawer({ open: true, type: 'edit', data: candidate });

  const handleFormSubmit = async (payload) => {
    try {
      if (formDrawer.type === 'add') {
        await api.post('/candidates', payload);
        showToast('Candidate created successfully', 'success');
      } else {
        await api.put(`/candidates/${formDrawer.data.id}`, payload);
        showToast('Candidate updated successfully', 'success');
      }
      setFormDrawer({ ...formDrawer, open: false });
      fetchCandidates();
    } catch (err) {
      showToast('Error saving candidate', 'error');
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, renderCell: p => <b>{p.row.name}</b> },
    { field: 'functionRole', headerName: 'Function', width: 150 },
    { field: 'status', headerName: 'Status', width: 160, renderCell: p => <Chip label={statusLabel(p.row.status)} size="small" /> },
    { field: 'jv', headerName: 'Current JV', width: 180, valueGetter: (value, row) => row?.currentJv?.name || '-' },
    { field: 'action', headerName: 'Actions', width: 120, renderCell: p => (
      <Stack direction="row" spacing={1}>
         <Tooltip title="View">
            <IconButton size="small" onClick={() => setViewDrawer({ open: true, candidate: p.row })}>
              <ViewIcon fontSize="small" />
            </IconButton>
         </Tooltip>
         <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
         </Tooltip>
      </Stack>
    )},
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>Global Talent Pool</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ px: 3 }}>
          New Candidate
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
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

      <Paper sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
        <DataGrid 
          rows={candidates} 
          columns={columns} 
          loading={loading}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Paper>

      {/* View Drawer */}
      <CandidateDrawer 
        open={viewDrawer.open} 
        candidate={viewDrawer.candidate} 
        onClose={() => setViewDrawer({ open: false, candidate: null })} 
      />

      {/* Add/Edit Form Drawer */}
      <CandidateFormDrawer
        open={formDrawer.open}
        initialData={formDrawer.data}
        onClose={() => setFormDrawer({ ...formDrawer, open: false })}
        onSubmit={handleFormSubmit}
      />
    </Box>
  );
}