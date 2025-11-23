import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Stack, 
  Chip, 
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import { 
  MoreHoriz, 
  ArrowForward, 
  Send as SendIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import api from '../../services/api';
import CandidateDrawer from '../../components/CandidateDrawer';
import { getNextStatuses, statusLabel } from '../../constants/status';

const COLUMN_CONFIG = [
  { id: 'NEW', title: 'New Applications', color: '#64748b' },
  { id: 'INTERVIEWING', title: 'Interviewing', color: '#f59e0b' },
  { id: 'READY', title: 'Ready for Allocation', color: '#3b82f6' },
  { id: 'PENDING_ACCEPTANCE', title: 'Pending JV Decision', color: '#8b5cf6' },
  { id: 'ONBOARDING', title: 'Onboarding', color: '#10b981' }
];

const CandidateCard = ({ candidate, onOpen, onAllocate, onAdvance }) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        mb: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 3, borderColor: 'primary.main' }
      }}
      onClick={() => onOpen(candidate)}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="subtitle2" fontWeight="600">{candidate.name}</Typography>
          <Typography variant="caption" color="text.secondary">{candidate.functionRole}</Typography>
        </Box>
        {candidate.currentJv && (
          <Chip label={candidate.currentJv.name} size="small" sx={{ fontSize: 10, height: 20 }} />
        )}
      </Stack>
      
      <Box mb={1.5}>
        {(candidate.tags || []).slice(0, 2).map(tag => (
          <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, fontSize: 10, height: 20, bgcolor: 'grey.100' }} />
        ))}
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={1} onClick={e => e.stopPropagation()}>
        {candidate.status === 'READY' && (
          <Button 
            size="small" 
            variant="contained" 
            startIcon={<SendIcon />} 
            onClick={() => onAllocate(candidate)}
            sx={{ fontSize: 11, py: 0.5 }}
          >
            Allocate
          </Button>
        )}
        {candidate.status === 'NEW' && (
           <Button 
             size="small" 
             variant="outlined" 
             endIcon={<ArrowForward />} 
             onClick={() => onAdvance(candidate, 'INTERVIEWING')}
             sx={{ fontSize: 11, py: 0.5 }}
           >
             Interview
           </Button>
        )}
         {candidate.status === 'INTERVIEWING' && (
           <Button 
             size="small" 
             variant="outlined" 
             color="success"
             endIcon={<CheckCircleIcon />} 
             onClick={() => onAdvance(candidate, 'READY')}
             sx={{ fontSize: 11, py: 0.5 }}
           >
             Pass
           </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default function HQPipeline() {
  const [candidates, setCandidates] = useState([]);
  const [jvs, setJvs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [drawer, setDrawer] = useState({ open: false, candidate: null });
  const [allocateState, setAllocateState] = useState({ open: false, candidate: null, targetJvId: '', note: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, jvRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/jvs')
      ]);
      setCandidates(candRes.data);
      setJvs(jvRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocate = async () => {
    if (!allocateState.targetJvId) return;
    try {
      await api.post(`/candidates/${allocateState.candidate.id}/allocate`, {
        targetJvId: allocateState.targetJvId,
        note: allocateState.note,
      });
      setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' });
      fetchData();
    } catch (err) {
      alert('Error allocating');
    }
  };

  const handleAdvance = async (candidate, nextStatus) => {
    try {
      await api.post(`/candidates/${candidate.id}/status`, { nextStatus });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const getColumnCandidates = (status) => candidates.filter(c => c.status === status);

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', overflowX: 'auto', display: 'flex', pb: 2 }}>
      {COLUMN_CONFIG.map(col => {
        const items = getColumnCandidates(col.id);
        return (
          <Paper 
            key={col.id}
            sx={{ 
              minWidth: 320, 
              width: 320, 
              mr: 2, 
              bgcolor: '#f8fafc', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: col.color }}>
                {col.title}
              </Typography>
              <Chip label={items.length} size="small" sx={{ bgcolor: 'white', fontWeight: 'bold' }} />
            </Box>
            
            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
              {items.map(c => (
                <CandidateCard 
                  key={c.id} 
                  candidate={c} 
                  onOpen={(cand) => setDrawer({ open: true, candidate: cand })}
                  onAllocate={(cand) => setAllocateState({ open: true, candidate: cand, targetJvId: '', note: '' })}
                  onAdvance={handleAdvance}
                />
              ))}
              {items.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, fontStyle: 'italic' }}>
                  No candidates
                </Typography>
              )}
            </Box>
          </Paper>
        );
      })}

      {/* Allocation Dialog */}
      <Dialog open={allocateState.open} onClose={() => setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Allocate Candidate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
             Assign <b>{allocateState.candidate?.name}</b> to a Joint Venture.
          </Typography>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Select JV</InputLabel>
            <Select
              label="Select JV"
              value={allocateState.targetJvId}
              onChange={(e) => setAllocateState(prev => ({ ...prev, targetJvId: e.target.value }))}
            >
              {jvs.map(jv => <MenuItem key={jv.id} value={jv.id}>{jv.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Note for JV Partner"
            multiline
            rows={3}
            fullWidth
            margin="normal"
            size="small"
            value={allocateState.note}
            onChange={(e) => setAllocateState(prev => ({ ...prev, note: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocateState({ open: false, candidate: null, targetJvId: '', note: '' })}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate} disabled={!allocateState.targetJvId}>Send</Button>
        </DialogActions>
      </Dialog>

      {/* Drawer */}
      <CandidateDrawer 
        open={drawer.open} 
        candidate={drawer.candidate} 
        onClose={() => setDrawer({ open: false, candidate: null })} 
      />
    </Box>
  );
}