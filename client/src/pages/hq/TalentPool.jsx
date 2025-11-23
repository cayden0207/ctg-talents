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
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';
import { ALL_STATUSES, statusLabel } from '../../constants/status';
import CandidateDrawer from '../../components/CandidateDrawer';

export default function HQTalentPool() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [drawer, setDrawer] = useState({ open: false, candidate: null });

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

  const columns = [
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
        <Button variant="contained">Add New Candidate</Button>
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

      <CandidateDrawer 
        open={drawer.open} 
        candidate={drawer.candidate} 
        onClose={() => setDrawer({ open: false, candidate: null })} 
      />
    </Box>
  );
}