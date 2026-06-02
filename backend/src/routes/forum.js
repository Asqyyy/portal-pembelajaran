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
       ORDER BY ft.is_announcement DESC, ft.created_at DESC`,
      [req.params.courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List threads error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar thread' });
  }
});

// GET /api/forum/thread/:id — get thread details with replies
router.get('/thread/:id', authenticate, async (req, res) => {
  try {
    const { rows: threadRows } = await pool.query(
      'SELECT * FROM forum_threads WHERE id = $1',
      [req.params.id]
    );
    if (threadRows.length === 0) return res.status(404).json({ error: 'Thread tidak ditemukan' });
    const thread = threadRows[0];

    const { rows: replyRows } = await pool.query(
      'SELECT * FROM forum_replies WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...thread, replies: replyRows });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Gagal mengambil detail thread' });
  }
});

// POST /api/forum/thread — create thread
router.post('/thread', authenticate, async (req, res) => {
  try {
    const { course_id, title, content, is_announcement } = req.body;
    if (!course_id || !title || !content) {
      return res.status(400).json({ error: 'course_id, title, dan content wajib diisi' });
    }

    const isAnnouncement = !!is_announcement;
    if (isAnnouncement && req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa membuat pengumuman' });
    }

    const authorName = req.user.display_name || req.user.username;

    const { rows } = await pool.query(
      `INSERT INTO forum_threads (course_id, author_id, author_name, title, content, is_announcement)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_id, req.user.id, authorName, title, content, isAnnouncement]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create thread error:', err);
    res.status(500).json({ error: 'Gagal membuat thread baru' });
  }
});

// POST /api/forum/thread/:id/reply — reply to a thread
router.post('/thread/:id/reply', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Konten reply wajib diisi' });

    const authorName = req.user.display_name || req.user.username;

    const { rows } = await pool.query(
      `INSERT INTO forum_replies (thread_id, author_id, author_name, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, authorName, content]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create reply error:', err);
    res.status(500).json({ error: 'Gagal menambahkan balasan' });
  }
});

// DELETE /api/forum/threads/:id — delete thread
router.delete('/threads/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM forum_threads WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Thread tidak ditemukan' });
    const thread = rows[0];

    // Only creator or lecturer/admin can delete
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin' && thread.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berhak menghapus thread ini.' });
    }

    await pool.query('DELETE FROM forum_threads WHERE id = $1', [req.params.id]);
    res.json({ message: 'Thread berhasil dihapus' });
  } catch (err) {
    console.error('Delete thread error:', err);
    res.status(500).json({ error: 'Gagal menghapus thread' });
  }
});

// DELETE /api/forum/replies/:id — delete reply
router.delete('/replies/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM forum_replies WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Balasan tidak ditemukan' });
    const reply = rows[0];

    // Only creator or lecturer/admin can delete
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin' && reply.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berhak menghapus balasan ini.' });
    }

    await pool.query('DELETE FROM forum_replies WHERE id = $1', [req.params.id]);
    res.json({ message: 'Balasan berhasil dihapus' });
  } catch (err) {
    console.error('Delete reply error:', err);
    res.status(500).json({ error: 'Gagal menghapus balasan' });
  }
});

// PUT /api/forum/thread/:id/verify — mark thread verified (lecturer)
router.put('/thread/:id/verify', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa memverifikasi' });
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
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa memverifikasi' });
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
