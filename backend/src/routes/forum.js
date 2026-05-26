const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/forum/course/:courseId — list threads
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ft.*, COUNT(fr.id)::int AS reply_count
       FROM forum_threads ft
       LEFT JOIN forum_replies fr ON ft.id = fr.thread_id
       WHERE ft.course_id = $1
       GROUP BY ft.id
       ORDER BY ft.type = 'announcement' DESC, ft.created_at DESC`,
      [req.params.courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List threads error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar thread' });
  }
});

// POST /api/forum/thread — create thread
router.post('/thread', authenticate, async (req, res) => {
  try {
    const { course_id, title, content, type } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ error: 'course_id dan title wajib diisi' });
    }
    // Only lecturers can create announcements
    const threadType = type || 'discussion';
    if (threadType === 'announcement' && req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa membuat announcement' });
    }
    const { rows } = await pool.query(
      `INSERT INTO forum_threads (course_id, user_id, title, content, author_name, author_role, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [course_id, req.user.id, title, content || '', req.user.username, req.user.role, threadType]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create thread error:', err);
    res.status(500).json({ error: 'Gagal membuat thread' });
  }
});

// GET /api/forum/thread/:id — get thread + replies
router.get('/thread/:id', authenticate, async (req, res) => {
  try {
    const { rows: threads } = await pool.query(
      'SELECT * FROM forum_threads WHERE id = $1',
      [req.params.id]
    );
    if (threads.length === 0) return res.status(404).json({ error: 'Thread tidak ditemukan' });

    const { rows: replies } = await pool.query(
      'SELECT * FROM forum_replies WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ thread: threads[0], replies });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Gagal mengambil thread' });
  }
});

// POST /api/forum/thread/:id/reply — add reply
router.post('/thread/:id/reply', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content wajib diisi' });

    const { rows: threads } = await pool.query('SELECT id FROM forum_threads WHERE id = $1', [req.params.id]);
    if (threads.length === 0) return res.status(404).json({ error: 'Thread tidak ditemukan' });

    const { rows } = await pool.query(
      `INSERT INTO forum_replies (thread_id, user_id, content, author_name, author_role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, req.user.id, content, req.user.username, req.user.role]
    );

    // Update thread's updated_at
    await pool.query('UPDATE forum_threads SET updated_at = NOW() WHERE id = $1', [req.params.id]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create reply error:', err);
    res.status(500).json({ error: 'Gagal menambahkan balasan' });
  }
});

// PUT /api/forum/thread/:id/verify — mark thread verified (lecturer)
router.put('/thread/:id/verify', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa memverifikasi' });
    }
    const { rows } = await pool.query(
      'UPDATE forum_threads SET is_verified = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Thread tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Verify thread error:', err);
    res.status(500).json({ error: 'Gagal memverifikasi thread' });
  }
});

// PUT /api/forum/reply/:id/verify — mark reply verified (lecturer)
router.put('/reply/:id/verify', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa memverifikasi' });
    }
    const { rows } = await pool.query(
      'UPDATE forum_replies SET is_verified = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reply tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Verify reply error:', err);
    res.status(500).json({ error: 'Gagal memverifikasi reply' });
  }
});

module.exports = router;
