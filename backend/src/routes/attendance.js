const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /api/attendance/generate — generate QR session token (lecturer)
router.post('/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang dapat memulai sesi absensi' });
    }
    const { course_code, duration } = req.body; // duration in seconds
    if (!course_code) {
      return res.status(400).json({ error: 'course_code wajib diisi' });
    }

    // Resolve course_code to course_id
    const { rows: courseRows } = await pool.query('SELECT id FROM courses WHERE course_code = $1', [course_code]);
    if (courseRows.length === 0) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }
    const courseId = courseRows[0].id;

    // Generate random secure token
    const token = crypto.randomBytes(16).toString('hex');
    const seconds = parseInt(duration || 120, 10);
    const expiresAt = new Date(Date.now() + seconds * 1000);

    const { rows } = await pool.query(
      `INSERT INTO attendance_sessions (course_id, token, expires_at, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [courseId, token, expiresAt, req.user.id]
    );

    res.status(201).json({
      session: rows[0],
      duration: seconds,
      message: 'Sesi absensi berhasil dibuat'
    });
  } catch (err) {
    console.error('Generate attendance session error:', err);
    res.status(500).json({ error: 'Gagal membuat sesi absensi' });
  }
});

// POST /api/attendance/record — record attendance (student scan/input)
router.post('/record', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya siswa yang dapat melakukan absensi' });
    }
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token absensi wajib diisi' });
    }

    // Find active session by token
    const { rows: sessionRows } = await pool.query(
      'SELECT * FROM attendance_sessions WHERE token = $1',
      [token]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Sesi absensi tidak ditemukan. Kode salah.' });
    }
    const session = sessionRows[0];

    // Check expiration
    if (new Date() > new Date(session.expires_at)) {
      return res.status(410).json({ error: 'Token sudah kedaluwarsa. Silakan minta pengajar generate kode baru.' });
    }

    // Record student attendance (UNIQUE constraint handles duplicate check)
    const displayName = req.user.display_name || req.user.username;
    try {
      const { rows } = await pool.query(
        `INSERT INTO attendance_records (session_id, student_id, student_name)
         VALUES ($1, $2, $3) RETURNING *`,
        [session.id, req.user.id, displayName]
      );
      res.status(201).json({ message: 'Absensi berhasil dicatat', record: rows[0] });
    } catch (dbErr) {
      if (dbErr.code === '23505') { // unique violation
        return res.status(409).json({ error: 'Kehadiran Anda sudah tercatat untuk sesi ini' });
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('Record attendance error:', err);
    res.status(500).json({ error: 'Gagal mencatat absensi' });
  }
});

// GET /api/attendance/course/:courseCode — get attendance records (lecturer see all, students see own records)
router.get('/course/:courseCode', authenticate, async (req, res) => {
  try {
    const { courseCode } = req.params;

    // Resolve course_code to course_id
    const { rows: courseRows } = await pool.query('SELECT id FROM courses WHERE course_code = $1', [courseCode]);
    if (courseRows.length === 0) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }
    const courseId = courseRows[0].id;

    let query;
    let params;

    if (req.user.role === 'student') {
      // Students see only their own attendance records
      query = `
        SELECT ar.*, asess.expires_at, asess.created_at AS session_created_at
        FROM attendance_records ar
        JOIN attendance_sessions asess ON ar.session_id = asess.id
        WHERE asess.course_id = $1 AND ar.student_id = $2
        ORDER BY ar.recorded_at DESC
      `;
      params = [courseId, req.user.id];
    } else {
      // Lecturers see all records for the course grouped by session
      query = `
        SELECT ar.*, asess.token, asess.created_at AS session_created_at
        FROM attendance_records ar
        JOIN attendance_sessions asess ON ar.session_id = asess.id
        WHERE asess.course_id = $1
        ORDER BY ar.recorded_at DESC
      `;
      params = [courseId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Gagal mengambil data absensi' });
  }
});

module.exports = router;
