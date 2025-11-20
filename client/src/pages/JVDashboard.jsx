import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, Typography, Box, Tabs, Tab
} from '@mui/material';

const JVDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };

  const handleStatusUpdate = async (id, newStatus, release = false) => {
    try {
      const updateData = { status: newStatus };
      if (release) {
        updateData.currentJvId = null;
        updateData.status = 'AVAILABLE';
      }
      
      await api.put(`/candidates/${id}`, updateData);
      fetchCandidates();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const pendingCandidates = candidates.filter(c => c.status === 'PENDING_ACCEPTANCE');
  const myTeam = candidates.filter(c => c.status !== 'PENDING_ACCEPTANCE' && c.status !== 'AVAILABLE'); 
  // Note: 'AVAILABLE' shouldn't appear here ideally if backend filters correctly, but good to be safe.

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'PENDING_ACCEPTANCE': return 'warning';
      case 'HIRED': return 'primary';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Layout title="JV Partner Portal">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Inbox (${pendingCandidates.length})`} />
          <Tab label={`My Team (${myTeam.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
            <Typography variant="h6" gutterBottom>Candidates Offered</Typography>
            {pendingCandidates.length === 0 ? <Typography color="textSecondary">No pending offers.</Typography> : (
            <TableContainer component={Paper}>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pendingCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.role}</TableCell>
                        <TableCell><Chip label="Pending Review" color="warning" size="small" /></TableCell>
                        <TableCell>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleStatusUpdate(candidate.id, 'HIRED')}
                        >
                            Accept
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => handleStatusUpdate(candidate.id, 'AVAILABLE', true)}
                        >
                            Reject
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
            )}
        </Box>
      )}

      {tabValue === 1 && (
         <Box>
         <Typography variant="h6" gutterBottom>Active Team Members</Typography>
         {myTeam.length === 0 ? <Typography color="textSecondary">No active team members.</Typography> : (
         <TableContainer component={Paper}>
             <Table>
             <TableHead>
                 <TableRow>
                 <TableCell>Name</TableCell>
                 <TableCell>Role</TableCell>
                 <TableCell>Status</TableCell>
                 <TableCell>Actions</TableCell>
                 </TableRow>
             </TableHead>
             <TableBody>
                 {myTeam.map((candidate) => (
                 <TableRow key={candidate.id}>
                     <TableCell>{candidate.name}</TableCell>
                     <TableCell>{candidate.role}</TableCell>
                     <TableCell>
                        <Chip label={candidate.status} color={getStatusColor(candidate.status)} size="small" />
                     </TableCell>
                     <TableCell>
                     <Button 
                         size="small" 
                         color="warning"
                         onClick={() => handleStatusUpdate(candidate.id, 'AVAILABLE', true)}
                     >
                         Release / Fire
                     </Button>
                     </TableCell>
                 </TableRow>
                 ))}
             </TableBody>
             </Table>
         </TableContainer>
         )}
     </Box>
      )}

    </Layout>
  );
};

export default JVDashboard;
