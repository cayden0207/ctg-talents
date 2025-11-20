import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, Grid, Typography
} from '@mui/material';

const HQDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [jvs, setJvs] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', role: 'Developer', status: 'AVAILABLE' });
  
  // Allocation State
  const [openAllocate, setOpenAllocate] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJvId, setSelectedJvId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [candRes, jvRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/jvs')
      ]);
      setCandidates(candRes.data);
      setJvs(jvRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const handleAddCandidate = async () => {
    try {
      await api.post('/candidates', newCandidate);
      setOpenAdd(false);
      setNewCandidate({ name: '', email: '', role: 'Developer', status: 'AVAILABLE' });
      fetchData();
    } catch (err) {
      alert('Error adding candidate');
    }
  };

  const openAllocationDialog = (candidate) => {
    setSelectedCandidate(candidate);
    setSelectedJvId(candidate.currentJvId || '');
    setOpenAllocate(true);
  };

  const handleAllocate = async () => {
    try {
      await api.put(`/candidates/${selectedCandidate.id}`, {
        currentJvId: selectedJvId,
        status: 'PENDING_ACCEPTANCE' // Auto-set status to pending when assigned
      });
      setOpenAllocate(false);
      fetchData();
    } catch (err) {
      alert('Error allocating candidate');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'PENDING_ACCEPTANCE': return 'warning';
      case 'HIRED': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Layout title="HQ Dashboard">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Candidate Pool</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>Add Candidate</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Assignment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>{candidate.name}</TableCell>
                <TableCell>{candidate.role}</TableCell>
                <TableCell>
                  <Chip label={candidate.status} color={getStatusColor(candidate.status)} size="small" />
                </TableCell>
                <TableCell>
                  {candidate.JV ? candidate.JV.name : 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openAllocationDialog(candidate)}>
                    Allocate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Candidate Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add New Candidate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newCandidate.name}
            onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={newCandidate.email}
            onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Role"
            fullWidth
            value={newCandidate.role}
            onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddCandidate} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Allocation Dialog */}
      <Dialog open={openAllocate} onClose={() => setOpenAllocate(false)}>
        <DialogTitle>Allocate Candidate: {selectedCandidate?.name}</DialogTitle>
        <DialogContent sx={{ minWidth: 300, mt: 1 }}>
           <FormControl fullWidth margin="dense">
            <InputLabel>Select JV</InputLabel>
            <Select
              value={selectedJvId}
              label="Select JV"
              onChange={(e) => setSelectedJvId(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {jvs.map((jv) => (
                <MenuItem key={jv.id} value={jv.id}>{jv.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAllocate(false)}>Cancel</Button>
          <Button onClick={handleAllocate} variant="contained">Confirm Allocation</Button>
        </DialogActions>
      </Dialog>

    </Layout>
  );
};

export default HQDashboard;
