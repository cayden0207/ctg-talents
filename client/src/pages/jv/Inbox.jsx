import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Divider, 
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  CheckCircle as AcceptIcon, 
  Cancel as RejectIcon, 
  Person as PersonIcon,
  Work as WorkIcon,
  AttachFile as FileIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { statusLabel } from '../../constants/status';

const DetailRow = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
      {label.toUpperCase()}
    </Typography>
    <Typography variant="body1">{value || '—'}</Typography>
  </Box>
);

export default function JVInbox() {
  const [inbox, setInbox] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action States
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', data: {} }); // type: 'accept' | 'reject'

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const { data } = await api.get('/inbox');
      setInbox(data);
      // Auto-select first if available and none selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => setSelectedId(id);

  const selectedCandidate = inbox.find(c => c.id === selectedId);

  const handleActionSubmit = async () => {
    const { type, data } = actionDialog;
    try {
      if (type === 'accept') {
        await api.post(`/inbox/${selectedCandidate.id}/accept`, { expectedStartDate: data.date });
      } else {
        await api.post(`/inbox/${selectedCandidate.id}/reject`, { reason: data.reason });
      }
      
      // Success: Refresh and select next
      setActionDialog({ open: false, type: '', data: {} });
      const currentIndex = inbox.findIndex(c => c.id === selectedId);
      const remaining = inbox.filter(c => c.id !== selectedId);
      setInbox(remaining);
      
      if (remaining.length > 0) {
        // Select next available or previous one
        const nextIndex = currentIndex < remaining.length ? currentIndex : remaining.length - 1;
        setSelectedId(remaining[nextIndex].id);
      } else {
        setSelectedId(null);
      }

    } catch (err) {
      alert('Action failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 2 }}>
      {/* Left Pane: List */}
      <Paper sx={{ width: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Inbox</Typography>
          <Typography variant="caption" color="text.secondary">{inbox.length} Pending Recommendations</Typography>
        </Box>
        <List sx={{ overflowY: 'auto', flex: 1, p: 0 }}>
          {inbox.map((item) => (
            <React.Fragment key={item.id}>
              <ListItemButton 
                selected={selectedId === item.id} 
                onClick={() => handleSelect(item.id)}
                sx={{ alignItems: 'flex-start', py: 2 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: selectedId === item.id ? 'primary.main' : 'grey.300' }}>
                    {item.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box component="span" display="flex" justifyContent="space-between">
                      <Typography fontWeight={600} noWrap>{item.name}</Typography>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" color="text.primary" noWrap>{item.functionRole}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.5 }}>
                        {item.statusNote ? `Note: ${item.statusNote}` : 'No HQ notes'}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
              <Divider component="li" />
            </React.Fragment>
          ))}
          {inbox.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">All caught up! 🎉</Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Right Pane: Detail */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
        {selectedCandidate ? (
          <>
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">{selectedCandidate.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Chip icon={<WorkIcon />} label={selectedCandidate.functionRole} size="small" />
                    <Chip label={selectedCandidate.email} size="small" variant="outlined" />
                  </Stack>
                </Box>
                <Box>
                  <Button variant="outlined" startIcon={<FileIcon />} href={selectedCandidate.resumeUrl} target="_blank">
                    View Resume
                  </Button>
                </Box>
              </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ p: 4, overflowY: 'auto', flex: 1 }}>
              <Stack spacing={3} maxWidth="md">
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50', borderColor: 'warning.200' }}>
                  <Typography variant="subtitle2" color="warning.800" gutterBottom>HQ Recommendation Note</Typography>
                  <Typography variant="body2" color="warning.900">
                    {selectedCandidate.statusNote || "No specific notes provided by HQ."}
                  </Typography>
                </Paper>

                <Box>
                  <Typography variant="h6" gutterBottom>Candidate Profile</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <DetailRow label="Function" value={selectedCandidate.functionRole} />
                    <DetailRow label="Expected Salary" value={selectedCandidate.expectedSalary ? `$${selectedCandidate.expectedSalary}` : 'Negotiable'} />
                    <DetailRow label="Tags" value={selectedCandidate.tags?.join(', ')} />
                    <DetailRow label="Phone" value={selectedCandidate.phone} />
                  </Box>
                  <DetailRow label="Interview Feedback" value={selectedCandidate.interviewNotes} />
                </Box>
              </Stack>
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'grey.50' }}>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<RejectIcon />}
                onClick={() => setActionDialog({ open: true, type: 'reject', data: { reason: '' } })}
              >
                Reject Candidate
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<AcceptIcon />}
                onClick={() => setActionDialog({ open: true, type: 'accept', data: { date: '' } })}
              >
                Accept & Onboard
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <Stack alignItems="center" spacing={2}>
              <PersonIcon sx={{ fontSize: 64, opacity: 0.2 }} />
              <Typography>Select a candidate to view details</Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Action Dialogs */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ ...actionDialog, open: false })}>
        <DialogTitle>
          {actionDialog.type === 'accept' ? `Onboard ${selectedCandidate?.name}` : `Reject ${selectedCandidate?.name}`}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 400, mt: 1 }}>
          {actionDialog.type === 'accept' ? (
            <TextField
              label="Expected Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setActionDialog(prev => ({ ...prev, data: { date: e.target.value } }))}
            />
          ) : (
            <TextField
              label="Reason for Rejection"
              multiline
              rows={3}
              fullWidth
              placeholder="e.g., Salary expectation too high"
              onChange={(e) => setActionDialog(prev => ({ ...prev, data: { reason: e.target.value } }))}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ ...actionDialog, open: false })}>Cancel</Button>
          <Button 
            variant="contained" 
            color={actionDialog.type === 'accept' ? 'success' : 'error'}
            disabled={!actionDialog.data.date && !actionDialog.data.reason}
            onClick={handleActionSubmit}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}