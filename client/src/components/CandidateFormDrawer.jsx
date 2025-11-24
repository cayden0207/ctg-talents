import React, { useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Stack, 
  TextField, 
  Button, 
  Divider,
  Autocomplete,
  Chip,
  InputAdornment
} from '@mui/material';
import { Close, Save, Person, Email, Phone, Work, AttachMoney, Description } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { SKILL_OPTIONS } from '../constants/skills';

const DRAWER_WIDTH = 500;

export default function CandidateFormDrawer({ open, onClose, initialData, onSubmit }) {
  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      functionRole: '',
      resumeUrl: '',
      expectedSalary: '',
      tags: [],
      interviewNotes: ''
    }
  });

  useEffect(() => {
    if (open && initialData) {
      reset({
        ...initialData,
        expectedSalary: initialData.expectedSalary || '',
        tags: initialData.tags || []
      });
    } else if (open && !initialData) {
      reset({
        name: '', email: '', phone: '', functionRole: '', 
        resumeUrl: '', expectedSalary: '', tags: [], interviewNotes: ''
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      expectedSalary: data.expectedSalary ? Number(data.expectedSalary) : undefined
    };
    onSubmit(payload);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: DRAWER_WIDTH } } }}
    >
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
            {initialData ? 'Edit Profile' : 'New Candidate'}
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
          <Stack spacing={4}>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                Essential Info
              </Typography>
              <Stack spacing={3}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Full Name" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Email Address" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
                  )}
                />
                <Stack direction="row" spacing={2}>
                  <Controller
                    name="functionRole"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Role / Function" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Work fontSize="small" /></InputAdornment> }} />
                    )}
                  />
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Phone" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
                    )}
                  />
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                Professional Profile
              </Typography>
              <Stack spacing={3}>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      options={SKILL_OPTIONS.map((o) => o.title)}
                      groupBy={(option) => SKILL_OPTIONS.find(o => o.title === option)?.category}
                      value={value || []}
                      onChange={(_, newValue) => onChange(newValue)}
                      renderInput={(params) => <TextField {...params} label="Skills & Tags" placeholder="Select skills" />}
                      renderTags={(val, getTagProps) => val.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)}
                    />
                  )}
                />
                <Controller
                  name="expectedSalary"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Expected Salary (Annual)" type="number" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney fontSize="small" /></InputAdornment> }} />
                  )}
                />
                <Controller
                  name="resumeUrl"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Resume URL" fullWidth helperText="Link to PDF/Drive" InputProps={{ startAdornment: <InputAdornment position="start"><Description fontSize="small" /></InputAdornment> }} />
                  )}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                HQ Assessment
              </Typography>
              <Controller
                name="interviewNotes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Interview Feedback" multiline rows={4} fullWidth placeholder="Key strengths, weaknesses, and cultural fit notes..." />
                )}
              />
            </Box>

          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} size="large" sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button type="submit" variant="contained" size="large" startIcon={<Save />} sx={{ px: 4 }}>
            Save Candidate
          </Button>
        </Box>

      </Box>
    </Drawer>
  );
}
