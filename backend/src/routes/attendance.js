const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /api/attendance/generate — generate QR session token (lecturer)
router.post('/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa generate QR session' });
    }
    const { course_code } = req.body;
    if (!course_code) {
      return res.status(400).json({ error: 'course_code wajib diisi' });
    }
    const token = crypto.randomBytes(10).toString('hex'); // 20-char hex
    res.json({ course_code, token, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Generate token error:', err);
    res.status(500).json({ error: 'Gagal generate token QR' });
  }
});

// POST /api/attendance/record — record attendance (student scan QR)
router.post('/record', authenticate, async (req, res) => {
  try {
    const { course_code, token } = req.body;
    if (!course_code || !token) {
      return res.status(400).json({ error: 'course_code dan token wajib diisi' });
    }
    const { rows } = await pool.query(
      `INSERT INTO attendance_records (course_code, student_name, user_id, token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_code, student_name, token) DO NOTHING
       RETURNING *`,
      [course_code, req.user.username, req.user.id, token]
    );
    if (rows.length === 0) {
      return res.status(409).json({ error: 'Absensi sudah tercatat untuk token ini' });
    }
    res.status(201).json({ message: 'Absensi berhasil dicatat', record: rows[0] });
  } catch (err) {
    console.error('Record attendance error:', err);
    res.status(500).json({ error: 'Gagal mencatat absensi' });
  }
});

// GET /api/attendance/course/:courseCode — get attendance list
router.get('/course/:courseCode', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ar.*
       FROM attendance_records ar
       WHERE ar.course_code = $1
       ORDER BY ar.created_at DESC`,
      [req.params.courseCode]
    );
    // Group by token session
    const tokens = {};
    rows.forEach(r => {
      if (!tokens[r.token]) tokens[r.token] = { token: r.token, first_seen: r.created_at, students: [] };
      tokens[r.token].students.push({ student_name: r.student_name, user_id: r.user_id, recorded_at: r.created_at });
    });
    res.json({ course_code: req.params.courseCode, total_records: rows.length, sessions: Object.values(tokens) });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Gagal mengambil data absensi' });
  }
});

module.exports = router;
