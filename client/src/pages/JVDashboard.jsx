import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Paper,
  Button,
  Chip,
  Typography,
  Box,
  Tabs,
  Tab,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Rating,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { JV_MUTABLE_STATUSES, getNextStatuses, statusLabel } from '../constants/status';

const JVDashboard = () => {
  const [inbox, setInbox] = useState([]);
  const [team, setTeam] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = location.pathname.includes('/jv/team') ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const [acceptModal, setAcceptModal] = useState({ open: false, candidate: null, expectedStartDate: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, candidate: null, reason: '' });
  const [reviewModal, setReviewModal] = useState({ open: false, candidate: null, rating: 3, summary: '', needHq: false });
  const [historyModal, setHistoryModal] = useState({ open: false, candidate: null, records: [], loading: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inboxRes, teamRes] = await Promise.all([api.get('/inbox'), api.get('/team')]);
      setInbox(inboxRes.data);
      setTeam(teamRes.data);
    } catch (err) {
      console.error('Error fetching JV data', err);
    } finally {
      setLoading(false);
    }
  };

  const openAccept = (candidate) => setAcceptModal({ open: true, candidate, expectedStartDate: candidate.expectedStartDate || '' });
  const openReject = (candidate) => setRejectModal({ open: true, candidate, reason: '' });

  const handleAccept = async () => {
    try {
      await api.post(`/inbox/${acceptModal.candidate.id}/accept`, { expectedStartDate: acceptModal.expectedStartDate });
      setAcceptModal({ open: false, candidate: null, expectedStartDate: '' });
      fetchData();
    } catch (err) {
      alert('Unable to accept candidate');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/inbox/${rejectModal.candidate.id}/reject`, { reason: rejectModal.reason });
      setRejectModal({ open: false, candidate: null, reason: '' });
      fetchData();
    } catch (err) {
      alert('Unable to reject candidate');
    }
  };

  const handleStatusChange = async (candidateId, nextStatus, note = '') => {
    try {
      await api.post(`/team/${candidateId}/status`, { nextStatus, note });
      fetchData();
    } catch (err) {
      alert('Unable to update status');
    }
  };

  const ReviewSchema = z.object({ rating: z.number().min(1).max(5), summary: z.string().optional(), needHq: z.boolean().optional() })
  const { register, handleSubmit, reset, formState } = useForm({ resolver: zodResolver(ReviewSchema), defaultValues: { rating: 3, summary: '', needHq: false } })
  const onSubmitReview = async (values) => {
    try {
      await api.post(`/team/${reviewModal.candidate.id}/reviews`, {
        rating: Number(values.rating),
        summary: values.summary,
        needHqIntervention: Boolean(values.needHq),
      });
      setReviewModal({ open: false, candidate: null, rating: 3, summary: '', needHq: false })
      reset()
      fetchData()
    } catch (err) {
      alert('Unable to submit review')
    }
  }

  const openReviewHistory = async (candidate) => {
    try {
      setHistoryModal({ open: true, candidate, records: [], loading: true });
      const { data } = await api.get(`/candidates/${candidate.id}/reviews`);
      setHistoryModal({ open: true, candidate, records: data, loading: false });
    } catch (err) {
      alert('Unable to load reviews');
      setHistoryModal({ open: false, candidate: null, records: [], loading: false });
    }
  };

  const statusColor = useMemo(() => ({
    PENDING_ACCEPTANCE: 'warning',
    ONBOARDING: 'primary',
    PROBATION: 'secondary',
    CONFIRMED: 'success',
    PIP: 'error',
    RESIGNED: 'default',
    RETURNED: 'default',
  }), []);

  const allowedNextStatuses = (status) => getNextStatuses(status).filter((s) => JV_MUTABLE_STATUSES.includes(s));

  return (
    <Layout title="JV Partner Portal">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); navigate(v === 0 ? '/jv' : '/jv/team'); }}>
          <Tab label={`Inbox (${inbox.length})`} />
          <Tab label={`My Team (${team.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>New Recommendations</Typography>
          <Paper sx={{ height: 420 }}>
            <DataGrid
              rows={inbox}
              getRowId={(r) => r.id}
              loading={loading}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, renderCell: (p) => (
                  <Box>
                    <Typography fontWeight={600}>{p.row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
                  </Box>
                )},
                { field: 'functionRole', headerName: 'Role', width: 160, renderCell: (p) => <Typography variant="body2">{p.row.functionRole || '-'}</Typography> },
                { field: 'statusNote', headerName: 'Note', flex: 1, renderCell: (p) => <Typography variant="body2">{p.row.statusNote || '—'}</Typography> },
                { field: 'actions', headerName: 'Actions', width: 220, sortable: false, renderCell: (p) => (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => openAccept(p.row)}>Accept</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => openReject(p.row)}>Reject</Button>
                  </Stack>
                )},
              ]}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              disableRowSelectionOnClick
            />
          </Paper>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>My Team</Typography>
          <Paper sx={{ height: 480 }}>
            <DataGrid
              rows={team}
              getRowId={(r) => r.id}
              loading={loading}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, renderCell: (p) => (
                  <Box>
                    <Typography fontWeight={600}>{p.row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
                  </Box>
                )},
                { field: 'functionRole', headerName: 'Role', width: 160, renderCell: (p) => <Typography variant="body2">{p.row.functionRole || '-'}</Typography> },
                { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => (
                  <Chip label={statusLabel(p.row.status)} size="small" color={statusColor[p.row.status] || 'default'} />
                )},
                { field: 'performance', headerName: 'Performance', width: 160, renderCell: (p) => (
                  p.row.performanceRating ? (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Rating name="read-only" size="small" value={p.row.performanceRating} readOnly />
                      <Typography variant="caption">({p.row.performanceRating})</Typography>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No reviews</Typography>
                  )
                )},
                { field: 'next', headerName: 'Next', width: 220, renderCell: (p) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Next</InputLabel>
                    <Select label="Next" value="" onChange={(e) => e.target.value && handleStatusChange(p.row.id, e.target.value)}>
                      <MenuItem value="">Select</MenuItem>
                      {allowedNextStatuses(p.row.status).map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
                    </Select>
                  </FormControl>
                )},
                { field: 'actions', headerName: 'Actions', width: 220, renderCell: (p) => (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => setReviewModal({ open: true, candidate: p.row, rating: 3, summary: '', needHq: false })}>Add Review</Button>
                    <Button size="small" onClick={() => openReviewHistory(p.row)}>View Reviews</Button>
                  </Stack>
                )},
              ]}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              disableRowSelectionOnClick
            />
          </Paper>
        </Box>
      )}

      <Dialog open={acceptModal.open} onClose={() => setAcceptModal({ open: false, candidate: null, expectedStartDate: '' })}>
        <DialogTitle>Accept {acceptModal.candidate?.name}</DialogTitle>
        <DialogContent>
          <TextField
            type="date"
            margin="dense"
            label="Expected Start Date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={acceptModal.expectedStartDate}
            onChange={(e) => setAcceptModal((prev) => ({ ...prev, expectedStartDate: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptModal({ open: false, candidate: null, expectedStartDate: '' })}>Cancel</Button>
          <Button variant="contained" disabled={!acceptModal.expectedStartDate} onClick={handleAccept}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectModal.open} onClose={() => setRejectModal({ open: false, candidate: null, reason: '' })}>
        <DialogTitle>Reject {rejectModal.candidate?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectModal({ open: false, candidate: null, reason: '' })}>Cancel</Button>
          <Button variant="contained" color="error" disabled={!rejectModal.reason} onClick={handleReject}>Reject</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reviewModal.open} onClose={() => setReviewModal({ open: false, candidate: null, rating: 3, summary: '', needHq: false })}>
        <DialogTitle>Performance Review — {reviewModal.candidate?.name}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmitReview)}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" gutterBottom>Rating</Typography>
                <Rating defaultValue={3} {...register('rating', { valueAsNumber: true })} onChange={(_, v) => v && (document.querySelector('input[name="rating"]').value = v)} />
              </Box>
              <TextField label="Summary" multiline rows={4} fullWidth {...register('summary')} />
              <FormControlLabel control={<Checkbox {...register('needHq')} />} label="Need HQ intervention" />
              <DialogActions sx={{ px: 0 }}>
                <Button onClick={() => setReviewModal({ open: false, candidate: null, rating: 3, summary: '', needHq: false })}>Cancel</Button>
                <Button variant="contained" type="submit" disabled={formState.isSubmitting}>Submit</Button>
              </DialogActions>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyModal.open} onClose={() => setHistoryModal({ open: false, candidate: null, records: [], loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Reviews — {historyModal.candidate?.name}</DialogTitle>
        <DialogContent dividers>
          {historyModal.loading ? (
            <CircularProgress size={20} />
          ) : historyModal.records.length === 0 ? (
            <Typography color="text.secondary">No reviews yet.</Typography>
          ) : (
            historyModal.records.map((review) => (
              <Box key={review.id} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating value={review.rating} size="small" readOnly />
                  <Typography variant="caption" color="text.secondary">{review.reviewDate}</Typography>
                </Stack>
                <Typography variant="body2">{review.summary}</Typography>
                <Typography variant="caption" color="text.secondary">Reviewer: {review.reviewer?.email}</Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModal({ open: false, candidate: null, records: [], loading: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default JVDashboard;
