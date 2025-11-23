import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  TextField, 
  IconButton, 
  Stack, 
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CommentItem = ({ comment, isSelf }) => (
  <Stack direction={isSelf ? 'row-reverse' : 'row'} spacing={2} sx={{ mb: 2 }}>
    <Avatar 
      sx={{ 
        width: 32, 
        height: 32, 
        bgcolor: isSelf ? 'primary.main' : 'secondary.main',
        fontSize: 14
      }}
    >
      {comment.author?.name?.[0] || 'U'}
    </Avatar>
    <Paper 
      sx={{ 
        p: 1.5, 
        bgcolor: isSelf ? 'primary.light' : 'grey.100', 
        color: isSelf ? 'white' : 'text.primary',
        borderRadius: 2,
        maxWidth: '80%',
        position: 'relative'
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {comment.content}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8, fontSize: 10 }}>
        {comment.author?.name} • {new Date(comment.createdAt).toLocaleString()}
      </Typography>
    </Paper>
  </Stack>
);

export default function CommentSection({ candidateId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (candidateId) fetchComments();
  }, [candidateId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/candidates/${candidateId}/comments`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/candidates/${candidateId}/comments`, { content: newComment });
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (err) {
      alert('Failed to send comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Typography variant="caption">Loading comments...</Typography>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">Discussion</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 400, px: 1 }}>
        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, fontStyle: 'italic' }}>
            No comments yet. Start a discussion!
          </Typography>
        )}
        {comments.map(c => (
          <CommentItem key={c.id} comment={c} isSelf={c.authorId === user.id} />
        ))}
        <div ref={endRef} />
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a message..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
        <IconButton type="submit" color="primary" disabled={!newComment.trim() || submitting}>
          {submitting ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}
