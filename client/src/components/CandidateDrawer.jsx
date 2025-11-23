import React, { useState } from 'react'
import { Drawer, Box, Typography, Divider, Stack, Chip, Link, Tabs, Tab, Paper } from '@mui/material'
import { statusLabel } from '../constants/status'
import { useQuery } from '@tanstack/react-query'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import CommentSection from './CommentSection'
import { calculateRadarData } from '../constants/skills'

const Field = ({ label, children }) => (
  <Box sx={{ mb: 1.25 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{children || '—'}</Typography>
  </Box>
)

export default function CandidateDrawer({ open, onClose, candidate }) {
  const [tab, setTab] = useState(0);

  const { data: audit } = useQuery({
    queryKey: ['audit', candidate?.id],
    queryFn: async () => (await api.get(`/candidates/${candidate.id}/audit`)).data,
    enabled: Boolean(open && candidate?.id && tab === 1),
    staleTime: 10_000,
  })

  const radarData = candidate ? calculateRadarData(candidate.tags) : [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 450 } }}>
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {candidate?.name || 'Candidate'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {candidate?.email}
          </Typography>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="Details" />
            <Tab label="Activity" />
            <Tab label="Comments" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {tab === 0 && (
            <Stack spacing={1.5}>
              {/* Radar Chart Section */}
              {radarData.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1, mb: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'center' }}>
                  <Box width="100%" height={200}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <Radar name="Skills" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              )}

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
          )}

          {tab === 1 && (
            <Stack spacing={1}>
              {(audit || []).map((log) => (
                <Box key={log.id} sx={{ mb: 1 }}>
                  <Typography variant="body2">{log.action}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleString()} • {log.actor?.email}</Typography>
                </Box>
              ))}
              {(!audit || audit.length === 0) && (
                <Typography variant="caption" color="text.secondary">No recent activity</Typography>
              )}
            </Stack>
          )}

          {tab === 2 && candidate && (
            <CommentSection candidateId={candidate.id} />
          )}
        </Box>
      </Box>
    </Drawer>
  )
}
