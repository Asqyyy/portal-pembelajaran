const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/calendar/:courseId — get all events (including auto-generated deadlines)
router.get('/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1. Get manually created calendar events
    const { rows: customEvents } = await pool.query(
      'SELECT id, course_id, title, description, event_date, event_type, color, created_by FROM calendar_events WHERE course_id = $1',
      [courseId]
    );

    // 2. Get assignments deadlines to auto-generate events
    const { rows: assignmentDeadlines } = await pool.query(
      "SELECT id, course_id, title, description, due_date::date AS event_date, 'assignment' AS event_type, '#f56565' AS color FROM assignments WHERE course_id = $1 AND due_date IS NOT NULL",
      [courseId]
    );

    // Combine and format dates as YYYY-MM-DD
    const allEvents = [];
    
    customEvents.forEach(e => {
      const dateStr = new Date(e.event_date).toISOString().split('T')[0];
      allEvents.push({
        id: 'custom-' + e.id,
        rawId: e.id,
        courseId: e.course_id,
        title: e.title,
        description: e.description,
        date: dateStr,
        type: e.event_type,
        color: e.color,
        createdBy: e.created_by
      });
    });

    assignmentDeadlines.forEach(a => {
      const dateStr = new Date(a.event_date).toISOString().split('T')[0];
      allEvents.push({
        id: 'assignment-' + a.id,
        rawId: a.id,
        courseId: a.course_id,
        title: 'Tugas: ' + a.title,
        description: a.description || 'Deadline Pengumpulan Tugas',
        date: dateStr,
        type: 'deadline',
        color: '#f56565',
        createdBy: null
      });
    });

    res.json(allEvents);
  } catch (err) {
    console.error('Get calendar events error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kalender' });
  }
});

// POST /api/calendar — create event (lecturer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang dapat membuat event baru' });
    }
    const { course_id, title, description, event_date, event_type, color } = req.body;
    if (!course_id || !title || !event_date) {
      return res.status(400).json({ error: 'course_id, title, dan event_date wajib diisi' });
    }

    const { rows } = await pool.query(
      `INSERT INTO calendar_events (course_id, title, description, event_date, event_type, color, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [course_id, title, description || '', event_date, event_type || 'general', color || '#667eea', req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create calendar event error:', err);
    res.status(500).json({ error: 'Gagal membuat event kalender' });
  }
});

// DELETE /api/calendar/:id — delete event (lecturer/creator only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { id } = req.params;

    // Verify it is a custom event (cannot delete assignment deadline events directly from calendar)
    if (id.startsWith('assignment-')) {
      return res.status(400).json({ error: 'Tidak dapat menghapus deadline tugas langsung dari kalender. Silakan hapus tugas terkait.' });
    }

    const rawId = id.startsWith('custom-') ? id.split('-')[1] : id;

    const { rows } = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [rawId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    const event = rows[0];
    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk menghapus event ini.' });
    }

    await pool.query('DELETE FROM calendar_events WHERE id = $1', [rawId]);
    res.json({ message: 'Event kalender berhasil dihapus' });
  } catch (err) {
    console.error('Delete calendar event error:', err);
    res.status(500).json({ error: 'Gagal menghapus event kalender' });
  }
});

module.exports = router;
