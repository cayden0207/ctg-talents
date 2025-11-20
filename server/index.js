const express = require('express');
const cors = require('cors');
const { sequelize, User, JV, Candidate } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001; // 5001 to avoid conflict with standard 5000

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_key_for_demo_only';

// Middleware to verify token
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

// --- ROUTES ---

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, jvId: user.jvId }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, jvId: user.jvId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current User (for auth persistence)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CANDIDATE ROUTES ---

// Get Candidates (Filtered by Role)
app.get('/api/candidates', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'JV_PARTNER') {
      // JV Partners only see their own candidates or candidates offered to them
      whereClause = { currentJvId: req.user.jvId };
      // Ideally, include PENDING_ACCEPTANCE ones too if the logic requires, but for now let's assume simple assignment
    }

    const candidates = await Candidate.findAll({
      where: whereClause,
      include: [{ model: JV }]
    });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Candidate (HQ Only)
app.post('/api/candidates', authenticateToken, async (req, res) => {
  if (req.user.role !== 'HQ_ADMIN') return res.sendStatus(403);
  
  try {
    const candidate = await Candidate.create(req.body);
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Candidate (Status, Assign, etc.)
app.put('/api/candidates/:id', authenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Permission Check (Basic)
    if (req.user.role === 'JV_PARTNER' && candidate.currentJvId !== req.user.jvId) {
        // Allow if status is PENDING_ACCEPTANCE and user belongs to target JV? 
        // For MVP, assuming if it's assigned to JV, they can edit.
        return res.sendStatus(403);
    }

    await candidate.update(req.body);
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- JV ROUTES ---

// Get All JVs (HQ Only - for allocation dropdown)
app.get('/api/jvs', authenticateToken, async (req, res) => {
  if (req.user.role !== 'HQ_ADMIN') return res.sendStatus(403);
  try {
    const jvs = await JV.findAll();
    res.json(jvs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- SEED & START ---

const start = async () => {
  try {
    await sequelize.sync({ force: false }); // Set force: true to reset DB
    
    // Seed Data if empty
    const adminCount = await User.count({ where: { role: 'HQ_ADMIN' } });
    if (adminCount === 0) {
      console.log('Seeding Database...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // HQ Admin
      await User.create({
        email: 'admin@hq.com',
        password: hashedPassword,
        role: 'HQ_ADMIN'
      });

      // JV 1
      const jv1 = await JV.create({ name: 'TechCorp' });
      await User.create({
        email: 'partner@techcorp.com',
        password: hashedPassword,
        role: 'JV_PARTNER',
        jvId: jv1.id
      });

       // JV 2
      const jv2 = await JV.create({ name: 'SalesForce' });
      await User.create({
        email: 'partner@salesforce.com',
        password: hashedPassword,
        role: 'JV_PARTNER',
        jvId: jv2.id
      });

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
