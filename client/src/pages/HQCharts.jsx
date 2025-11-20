import React from 'react'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Box, Grid, Paper, Stack, Typography } from '@mui/material'
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const COLORS = ['#4F46E5', '#22C55E', '#F97316', '#06B6D4', '#A855F7', '#EF4444', '#94A3B8']

export default function HQCharts() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => (await api.get('/dashboard/metrics')).data,
    staleTime: 30_000,
  })

  const headcount = (data?.headcountByJv || []).map((d, i) => ({ name: d['currentJv.name'] || 'Unassigned', value: Number(d.count) }))
  const funnel = (data?.recruitmentFunnel || []).map((d) => ({ name: d.status, value: Number(d.count) }))

  return (
    <Layout title="HQ Dashboard">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="subtitle1" gutterBottom>Headcount by JV</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie dataKey="value" data={headcount} cx="50%" cy="50%" outerRadius={110} label>
                  {headcount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="subtitle1" gutterBottom>Recruitment Funnel</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={funnel}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Bar dataKey="value" fill="#4F46E5" />
                <RTooltip />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Stale Updates (&gt; 90 days)</Typography>
            {isLoading ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : (data?.staleCandidates || []).length === 0 ? (
              <Typography color="text.secondary">No stale candidates 🎉</Typography>
            ) : (
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {data.staleCandidates.map((c) => (
                  <Box key={c.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.status} • {c.currentJv?.name || 'HQ Pool'}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  )
}

