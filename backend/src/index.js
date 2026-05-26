require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const quizRoutes = require('./routes/quiz');
const forumRoutes = require('./routes/forum');
const gradebookRoutes = require('./routes/gradebook');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static frontend build
app.use(express.static(path.join(__dirname, '../../dist')));

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/gradebook', gradebookRoutes);
app.use('/api/attendance', attendanceRoutes);

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Portal Pembelajaran API running on port ' + PORT);
});
