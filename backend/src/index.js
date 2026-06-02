require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const filesRoutes = require('./routes/files');
const assignmentsRoutes = require('./routes/assignments');
const quizRoutes = require('./routes/quiz');
const forumRoutes = require('./routes/forum');
const gradebookRoutes = require('./routes/gradebook');
const attendanceRoutes = require('./routes/attendance');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP if frontend is served on different port during dev
}));

// CORS Configuration
app.use(cors());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict limit of 20 requests per 15 minutes for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login/register, silakan coba lagi dalam 15 menit.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Payload size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend build
app.use(express.static(path.join(__dirname, '../../dist')));

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/gradebook', gradebookRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/calendar', calendarRoutes);

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Terjadi kesalahan internal server' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Portal Pembelajaran API running on port ' + PORT);
});
