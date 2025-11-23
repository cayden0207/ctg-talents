import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Chip, 
  Rating,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { statusLabel } from '../../constants/status';

export default function JVTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, candidate: null });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/team');
      setTeam(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReview = async (data) => {
    try {
      await api.post(`/team/${reviewModal.candidate.id}/reviews`, {
        rating: Number(data.rating),
        summary: data.summary,
        needHqIntervention: data.needHq
      });
      setReviewModal({ open: false, candidate: null });
      reset();
      fetchTeam();
    } catch (err) {
      alert('Error submitting review');
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, renderCell: p => <b>{p.row.name}</b> },
    { field: 'functionRole', headerName: 'Function', width: 150 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: p => <Chip label={statusLabel(p.row.status)} color="primary" variant="outlined" size="small" /> },
    { field: 'performance', headerName: 'Performance', width: 160, renderCell: p => (
      <Rating value={p.row.performanceRating || 0} readOnly size="small" />
    )},
    { field: 'actions', headerName: 'Actions', width: 150, renderCell: p => (
      <Button size="small" variant="contained" onClick={() => setReviewModal({ open: true, candidate: p.row })}>Review</Button>
    )}
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>My Team</Typography>
      
      <Paper sx={{ flex: 1 }}>
        <DataGrid 
          rows={team} 
          columns={columns} 
          loading={loading} 
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={reviewModal.open} onClose={() => setReviewModal({ open: false, candidate: null })}>
        <DialogTitle>Review for {reviewModal.candidate?.name}</DialogTitle>
        <DialogContent>
          <form id="review-form" onSubmit={handleSubmit(onSubmitReview)}>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
              <Box>
                <Typography component="legend">Rating</Typography>
                <Rating defaultValue={3} onChange={(e, v) => {
                  // Manual register hack for Rating component
                  const input = document.createElement('input');
                  input.setAttribute('type', 'hidden');
                  input.setAttribute('name', 'rating');
                  input.setAttribute('value', v);
                  e.target.closest('form').appendChild(input);
                  register('rating').onChange({ target: input });
                }} />
                {/* Hidden input for react-hook-form to bind to if above hack is complex, 
                    simplifying for this demo: assume user selects star and we handle it via state or simple form submit 
                */}
                 <TextField type="number" label="Rating (1-5)" fullWidth {...register('rating', { required: true, min: 1, max: 5 })} size="small" />
              </Box>
              <TextField label="Performance Summary" multiline rows={3} fullWidth {...register('summary')} />
              <FormControlLabel control={<Checkbox {...register('needHq')} />} label="Flag for HQ Intervention" />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewModal({ open: false, candidate: null })}>Cancel</Button>
          <Button type="submit" form="review-form" variant="contained">Submit Review</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}