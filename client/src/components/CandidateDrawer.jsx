import React from 'react'
import { Drawer, Box, Typography, Divider, Stack, Chip, Link } from '@mui/material'
import { statusLabel } from '../constants/status'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const Field = ({ label, children }) => (
  <Box sx={{ mb: 1.25 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{children || '—'}</Typography>
  </Box>
)

export default function CandidateDrawer({ open, onClose, candidate }) {
  const { data: audit } = useQuery({
    queryKey: ['audit', candidate?.id],
    queryFn: async () => (await api.get(`/candidates/${candidate.id}/audit`)).data,
    enabled: Boolean(open && candidate?.id),
    staleTime: 10_000,
  })
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {candidate?.name || 'Candidate'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {candidate?.email}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={1.5}>
          <Field label="Function">{candidate?.functionRole}</Field>
          <Field label="Status">{candidate && statusLabel(candidate.status)}</Field>
          <Field label="Assigned JV">{candidate?.currentJv?.name || 'HQ Pool'}</Field>
          {candidate?.pendingJv && <Field label="Pending JV">{candidate.pendingJv.name}</Field>}
          <Field label="Resume">
            {candidate?.resumeUrl ? <Link href={candidate.resumeUrl} target="_blank" rel="noreferrer">Open Resume</Link> : '—'}
          </Field>
          <Field label="Tags">
            {(candidate?.tags || []).length ? (
              <Box>
                {candidate.tags.map((t) => (
                  <Chip key={t} size="small" label={t} sx={{ mr: .5, mb: .5 }} />
                ))}
              </Box>
            ) : '—'}
          </Field>
          <Field label="Interview Notes">{candidate?.interviewNotes}</Field>
          {candidate?.performanceRating && (
            <Field label="Performance Rating">{candidate.performanceRating}</Field>
          )}
          {candidate?.statusNote && <Field label="Latest Note">{candidate.statusNote}</Field>}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Activity</Typography>
        <Stack spacing={1} sx={{ maxHeight: 280, overflow: 'auto' }}>
          {(audit || []).map((log) => (
            <Box key={log.id}>
              <Typography variant="body2">{log.action}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleString()} • {log.actor?.email}</Typography>
            </Box>
          ))}
          {(!audit || audit.length === 0) && (
            <Typography variant="caption" color="text.secondary">No recent activity</Typography>
          )}
        </Stack>
      </Box>
    </Drawer>
  )
}
