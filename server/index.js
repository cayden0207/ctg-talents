const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op, fn, col } = require('sequelize');

const {
  sequelize,
  User,
  JV,
  Candidate,
  PerformanceReview,
  Notification,
  AuditLog,
  Comment,
} = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_demo_only';
const ACTIVE_STATUSES = ['ONBOARDING', 'PROBATION', 'CONFIRMED', 'PIP'];
const END_STATUSES = ['RESIGNED', 'TERMINATED', 'RETURNED'];
const STALE_THRESHOLD_DAYS = 90;

const STATUS_TRANSITIONS = {
  NEW: ['INTERVIEWING', 'READY', 'TERMINATED'],
  INTERVIEWING: ['READY', 'TERMINATED'],
  READY: ['PENDING_ACCEPTANCE', 'RETURNED'],
  PENDING_ACCEPTANCE: ['ONBOARDING', 'READY'],
  ONBOARDING: ['PROBATION', 'RETURNED'],
  PROBATION: ['CONFIRMED', 'PIP', 'RESIGNED', 'TERMINATED'],
  CONFIRMED: ['PIP', 'RESIGNED', 'RETURNED'],
  PIP: ['CONFIRMED', 'TERMINATED', 'RESIGNED'],
  RETURNED: ['READY', 'PENDING_ACCEPTANCE'],
  RESIGNED: [],
  TERMINATED: [],
};

const JV_MUTABLE_STATUSES = new Set(['ONBOARDING', 'PROBATION', 'CONFIRMED', 'PIP', 'RESIGNED', 'RETURNED']);

// Helpers
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.sendStatus(403);
  next();
};

const requireJV = (req, res, next) => {
  if (req.user.role !== 'JV_PARTNER') return res.sendStatus(403);
  if (!req.user.jvId) return res.status(400).json({ message: 'JV is not linked to your account' });
  next();
};

const notifyUsers = async (userIds = [], type, payload) => {
  if (!userIds.length) return;
  const rows = userIds.map((userId) => ({ userId, type, payload }));
  await Notification.bulkCreate(rows);
};

const notifyHq = async (type, payload) => {
  const admins = await User.findAll({ where: { role: 'HQ_ADMIN' }, attributes: ['id'] });
  await notifyUsers(admins.map((a) => a.id), type, payload);
};

const notifyJv = async (jvId, type, payload) => {
  if (!jvId) return;
  const partners = await User.findAll({ where: { role: 'JV_PARTNER', jvId }, attributes: ['id'] });
  await notifyUsers(partners.map((p) => p.id), type, payload);
};

const recordAudit = async (actorId, entityType, entityId, action, before, after) => {
  await AuditLog.create({ actorId, entityType, entityId, action, before, after });
};

const markStatus = (candidate, nextStatus, note) => {
  candidate.status = nextStatus;
  candidate.statusNote = note || null;
  candidate.lastStatusUpdate = new Date();
  if (nextStatus === 'RETURNED') {
    candidate.currentJvId = null;
    candidate.pendingJvId = null;
  }
};

const ensureTransition = (current, next) => {
  const allowed = STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    const error = new Error(`Transition ${current} -> ${next} is not allowed`);
    error.statusCode = 400;
    throw error;
  }
};

const candidateVisibleToUser = (candidate, user) => {
  if (!candidate) return false;
  if (user.role === 'HQ_ADMIN') return true;
  return candidate.currentJvId === user.jvId || (candidate.pendingJvId === user.jvId && candidate.status === 'PENDING_ACCEPTANCE');
};

const buildCandidateFilters = (user, query) => {
  const clauses = [];
  if (user.role === 'JV_PARTNER') {
    clauses.push({
      [Op.or]: [
        { currentJvId: user.jvId },
        { pendingJvId: user.jvId, status: 'PENDING_ACCEPTANCE' },
      ],
    });
  } else if (query.jvId) {
    clauses.push({ currentJvId: query.jvId });
  }

  if (query.status) clauses.push({ status: query.status });

  if (query.search) {
    const like = `%${query.search.toLowerCase()}%`;
    clauses.push({
      [Op.or]: [
        sequelize.where(fn('LOWER', col('Candidate.name')), { [Op.like]: like }),
        sequelize.where(fn('LOWER', col('Candidate.email')), { [Op.like]: like }),
        sequelize.where(fn('LOWER', col('Candidate.functionRole')), { [Op.like]: like }),
      ],
    });
  }

  return clauses.length ? { [Op.and]: clauses } : {};
};

const includeCandidateRelations = [
  { model: JV, as: 'currentJv', attributes: ['id', 'name'] },
  { model: JV, as: 'pendingJv', attributes: ['id', 'name'] },
];

// Auth routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, jvId: user.jvId }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, jvId: user.jvId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/me/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.sendStatus(404);
    
    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, jvId: user.jvId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate Pool
app.get('/api/candidates', authenticateToken, async (req, res) => {
  try {
    const where = buildCandidateFilters(req.user, req.query);

    // Optional server-side pagination and sorting (non-breaking)
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 0, 100);
    const sortField = req.query.sortField;
    const sortDir = req.query.sortDir === 'desc' ? 'DESC' : 'ASC';

    const findOptions = {
      where,
      include: includeCandidateRelations,
      order: sortField ? [[sortField, sortDir]] : [['updatedAt', 'DESC']],
    };
    if (pageSize > 0) {
      findOptions.limit = pageSize;
      findOptions.offset = (page - 1) * pageSize;
      const { rows, count } = await Candidate.findAndCountAll(findOptions);
      res.set('x-total-count', String(count));
      return res.json(rows);
    }

    const candidates = await Candidate.findAll(findOptions);
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates', authenticateToken, requireRole('HQ_ADMIN'), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (typeof payload.tags === 'string') {
      payload.tags = payload.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    payload.tags = payload.tags || [];
    payload.lastStatusUpdate = new Date();
    const candidate = await Candidate.create(payload);
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'CREATE', null, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/candidates/:id', authenticateToken, requireRole('HQ_ADMIN'), async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    const before = candidate.toJSON();
    const payload = { ...req.body };
    if (payload.tags && typeof payload.tags === 'string') {
      payload.tags = payload.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    await candidate.update(payload);
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'UPDATE', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocation
app.post('/api/candidates/:id/allocate', authenticateToken, requireRole('HQ_ADMIN'), async (req, res) => {
  try {
    const { targetJvId, note } = req.body;
    if (!targetJvId) return res.status(400).json({ message: 'targetJvId is required' });
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    const targetJv = await JV.findByPk(targetJvId);
    if (!targetJv) return res.status(404).json({ message: 'Target JV not found' });
    if (!['READY', 'RETURNED'].includes(candidate.status)) {
      return res.status(400).json({ message: 'Candidate must be READY or RETURNED to allocate' });
    }

    const before = candidate.toJSON();
    candidate.pendingJvId = targetJvId;
    markStatus(candidate, 'PENDING_ACCEPTANCE', note);
    await candidate.save();

    await notifyJv(targetJvId, 'candidate.allocated', {
      candidateId: candidate.id,
      candidateName: candidate.name,
      note,
    });
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'ALLOCATE', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/candidates/:id/status', authenticateToken, requireRole('HQ_ADMIN'), async (req, res) => {
  try {
    const { nextStatus, note } = req.body;
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    ensureTransition(candidate.status, nextStatus);
    const before = candidate.toJSON();
    markStatus(candidate, nextStatus, note);
    await candidate.save();
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'STATUS_CHANGE', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// JV Inbox & Team
app.get('/api/inbox', authenticateToken, requireJV, async (req, res) => {
  try {
    const data = await Candidate.findAll({
      where: { pendingJvId: req.user.jvId, status: 'PENDING_ACCEPTANCE' },
      include: includeCandidateRelations,
      order: [['updatedAt', 'DESC']],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inbox/:id/accept', authenticateToken, requireJV, async (req, res) => {
  try {
    const { expectedStartDate } = req.body;
    if (!expectedStartDate) return res.status(400).json({ message: 'expectedStartDate is required' });
    const candidate = await Candidate.findOne({
      where: { id: req.params.id, pendingJvId: req.user.jvId, status: 'PENDING_ACCEPTANCE' },
    });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found in your inbox' });

    const before = candidate.toJSON();
    candidate.currentJvId = req.user.jvId;
    candidate.pendingJvId = null;
    candidate.expectedStartDate = expectedStartDate || candidate.expectedStartDate;
    markStatus(candidate, 'ONBOARDING', 'Accepted by JV');
    await candidate.save();

    await notifyHq('candidate.accepted', {
      candidateId: candidate.id,
      candidateName: candidate.name,
      jvId: req.user.jvId,
    });
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'JV_ACCEPT', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inbox/:id/reject', authenticateToken, requireJV, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
    const candidate = await Candidate.findOne({
      where: { id: req.params.id, pendingJvId: req.user.jvId, status: 'PENDING_ACCEPTANCE' },
    });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found in your inbox' });

    const before = candidate.toJSON();
    candidate.pendingJvId = null;
    markStatus(candidate, 'READY', reason);
    await candidate.save();

    await notifyHq('candidate.rejected', {
      candidateId: candidate.id,
      candidateName: candidate.name,
      reason,
      jvId: req.user.jvId,
    });
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'JV_REJECT', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team', authenticateToken, requireJV, async (req, res) => {
  try {
    const team = await Candidate.findAll({
      where: { currentJvId: req.user.jvId, status: { [Op.notIn]: END_STATUSES } },
      include: includeCandidateRelations,
      order: [['updatedAt', 'DESC']],
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team/:id/status', authenticateToken, requireJV, async (req, res) => {
  try {
    const { nextStatus, note } = req.body;
    const candidate = await Candidate.findOne({ where: { id: req.params.id, currentJvId: req.user.jvId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found in your team' });
    if (!JV_MUTABLE_STATUSES.has(nextStatus)) {
      return res.status(400).json({ message: 'Status cannot be updated by JV' });
    }
    ensureTransition(candidate.status, nextStatus);
    const before = candidate.toJSON();
    markStatus(candidate, nextStatus, note);
    if (['RESIGNED', 'TERMINATED', 'RETURNED'].includes(nextStatus)) {
      candidate.currentJvId = nextStatus === 'RETURNED' ? null : candidate.currentJvId;
      if (nextStatus === 'RETURNED') {
        candidate.pendingJvId = null;
      }
    }
    await candidate.save();

    if (nextStatus === 'RESIGNED' || nextStatus === 'TERMINATED') {
      await notifyHq('candidate.offboarded', {
        candidateId: candidate.id,
        candidateName: candidate.name,
        status: nextStatus,
        jvId: req.user.jvId,
      });
    } else if (nextStatus === 'RETURNED') {
      await notifyHq('candidate.returned', {
        candidateId: candidate.id,
        candidateName: candidate.name,
        jvId: req.user.jvId,
      });
    }
    await recordAudit(req.user.id, 'Candidate', candidate.id, 'JV_STATUS', before, candidate.toJSON());
    res.json(candidate);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/team/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, summary, needHqIntervention, reviewDate } = req.body;
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidateVisibleToUser(candidate, req.user)) return res.sendStatus(403);

    const review = await PerformanceReview.create({
      candidateId: candidate.id,
      reviewerId: req.user.id,
      rating: numericRating,
      summary,
      needHqIntervention: Boolean(needHqIntervention),
      reviewDate: reviewDate || new Date().toISOString().slice(0, 10),
    });

    const aggregate = await PerformanceReview.findOne({
      where: { candidateId: candidate.id },
      attributes: [[fn('AVG', col('rating')), 'avgRating']],
      raw: true,
    });
    candidate.performanceRating = Math.round(parseFloat(aggregate.avgRating || review.rating));
    candidate.performanceNotes = summary;
    await candidate.save();

    if (needHqIntervention) {
      await notifyHq('performance.alert', {
        candidateId: candidate.id,
        candidateName: candidate.name,
        rating,
        summary,
      });
    }

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidates/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidateVisibleToUser(candidate, req.user)) return res.sendStatus(403);
    const reviews = await PerformanceReview.findAll({
      where: { candidateId: candidate.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'email'] }],
      order: [['reviewDate', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments
app.get('/api/candidates/:id/comments', authenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidateVisibleToUser(candidate, req.user)) return res.sendStatus(403);
    
    const comments = await Comment.findAll({
      where: { candidateId: candidate.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'email', 'name', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidateVisibleToUser(candidate, req.user)) return res.sendStatus(403);
    
    const comment = await Comment.create({
      candidateId: candidate.id,
      authorId: req.user.id,
      content
    });
    
    // Return with author info for immediate display
    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'email', 'name', 'role'] }]
    });
    
    res.json(fullComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit logs per candidate
app.get('/api/candidates/:id/audit', authenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidateVisibleToUser(candidate, req.user)) return res.sendStatus(403);
    const entries = await AuditLog.findAll({
      where: { entityType: 'Candidate', entityId: candidate.id },
      include: [{ model: User, as: 'actor', attributes: ['id', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard metrics
app.get('/api/dashboard/metrics', authenticateToken, requireRole('HQ_ADMIN'), async (req, res) => {
  try {
    const [byJv, funnel, stale] = await Promise.all([
      Candidate.findAll({
        attributes: ['currentJvId', [fn('COUNT', col('Candidate.id')), 'count']],
        where: {
          currentJvId: { [Op.ne]: null },
          status: { [Op.notIn]: END_STATUSES },
        },
        include: [{ model: JV, as: 'currentJv', attributes: ['id', 'name'] }],
        group: ['Candidate.currentJvId', 'currentJv.id'],
        raw: true,
      }),
      Promise.all(
        ['NEW', 'INTERVIEWING', 'READY', 'PENDING_ACCEPTANCE', ...ACTIVE_STATUSES, ...END_STATUSES].map(async (status) => ({
          status,
          count: await Candidate.count({ where: { status } }),
        }))
      ),
      Candidate.findAll({
        where: {
          status: { [Op.notIn]: END_STATUSES },
          lastStatusUpdate: { [Op.lt]: new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) },
        },
        include: includeCandidateRelations,
        order: [['lastStatusUpdate', 'ASC']],
        limit: 15,
      }),
    ]);

    res.json({
      headcountByJv: byJv,
      recruitmentFunnel: funnel,
      staleCandidates: stale,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.readAt = null;
    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 25,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.readAt = new Date();
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JV directory
app.get('/api/jvs', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'HQ_ADMIN' ? {} : { where: { id: req.user.jvId } };
    const jvs = await JV.findAll(query);
    res.json(jvs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bootstrap & seed
const start = async () => {
  try {
    await sequelize.sync({ alter: true });

    const adminCount = await User.count({ where: { role: 'HQ_ADMIN' } });
    if (adminCount === 0) {
      console.log('Seeding Database...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      await User.create({
        email: 'admin@hq.com',
        password: hashedPassword,
        role: 'HQ_ADMIN',
      });

      const jv1 = await JV.create({ name: 'TechCorp' });
      await User.create({
        email: 'partner@techcorp.com',
        password: hashedPassword,
        role: 'JV_PARTNER',
        jvId: jv1.id,
      });

      const jv2 = await JV.create({ name: 'SalesForce' });
      await User.create({
        email: 'partner@salesforce.com',
        password: hashedPassword,
        role: 'JV_PARTNER',
        jvId: jv2.id,
      });

      await Candidate.bulkCreate([
        {
          name: 'Alice Wong',
          email: 'alice@example.com',
          functionRole: 'Product Manager',
          status: 'READY',
          tags: ['Product', 'SaaS'],
          interviewNotes: 'Strong cross-functional experience',
          lastStatusUpdate: new Date(),
        },
        {
          name: 'Ben Tan',
          email: 'ben@example.com',
          functionRole: 'Sales Lead',
          status: 'INTERVIEWING',
          tags: ['Sales', 'APAC'],
          interviewNotes: 'Need comp alignment',
          lastStatusUpdate: new Date(),
        },
      ]);

      console.log('Database seeded!');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

start();
