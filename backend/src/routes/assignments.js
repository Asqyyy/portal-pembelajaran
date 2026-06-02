const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/assignments/:courseId — list assignments (students see own submission status, lecturers see all assignments)
router.get('/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    let query;
    let params;

    if (req.user.role === 'student') {
      // Students see assignments and their own submission details
      query = `
        SELECT a.*, 
               asub.id AS submission_id,
               asub.score,
               asub.feedback,
               asub.submitted_at,
               asub.text_content,
               asub.file_id,
               sf.original_name AS file_name
        FROM assignments a
        LEFT JOIN assignment_submissions asub 
          ON a.id = asub.assignment_id AND asub.student_id = $2
        LEFT JOIN section_files sf ON asub.file_id = sf.id
        WHERE a.course_id = $1
        ORDER BY a.due_date ASC
      `;
      params = [courseId, req.user.id];
    } else {
      // Lecturers see all assignments
      query = `
        SELECT a.*,
               (SELECT COUNT(*)::int FROM assignment_submissions WHERE assignment_id = a.id) AS submission_count
        FROM assignments a
        WHERE a.course_id = $1
        ORDER BY a.due_date ASC
      `;
      params = [courseId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Gagal mengambil data tugas' });
  }
});

// POST /api/assignments — create assignment (lecturer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang dapat membuat tugas' });
    }
    const { course_id, title, description, due_date, max_score } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ error: 'course_id dan title wajib diisi' });
    }

    const { rows } = await pool.query(
      `INSERT INTO assignments (course_id, title, description, due_date, max_score, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_id, title, description || '', due_date || null, max_score || 100, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Gagal membuat tugas' });
  }
});

// POST /api/assignments/:id/submit — submit assignment (student only)
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya siswa yang dapat mengumpulkan tugas' });
    }
    const { id } = req.params;
    const { text_content, file_id } = req.body;

    if (!text_content && !file_id) {
      return res.status(400).json({ error: 'Kumpulan tugas harus berupa teks atau file' });
    }

    // Check if duplicate submission exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Anda sudah mengumpulkan tugas ini sebelumnya' });
    }

    const { rows } = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, file_id, text_content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.id, file_id || null, text_content || null]
    );

    res.status(201).json({ submission: rows[0], message: 'Tugas berhasil dikumpulkan' });
  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ error: 'Gagal mengumpulkan tugas' });
  }
});

// GET /api/assignments/:id/submissions — list submissions for assignment (lecturer only)
router.get('/:id/submissions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT asub.*, u.username, u.display_name, sf.original_name AS file_name
       FROM assignment_submissions asub
       JOIN users u ON asub.student_id = u.id
       LEFT JOIN section_files sf ON asub.file_id = sf.id
       WHERE asub.assignment_id = $1
       ORDER BY asub.submitted_at DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ error: 'Gagal mengambil data pengumpulan' });
  }
});

// PUT /api/assignments/submissions/:id/grade — grade a submission (lecturer only)
router.put('/submissions/:id/grade', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya pengajar yang dapat memberikan nilai.' });
    }
    const { id } = req.params;
    const { score, feedback } = req.body;

    if (score === undefined) {
      return res.status(400).json({ error: 'Nilai (score) wajib diisi' });
    }

    const { rows } = await pool.query(
      `UPDATE assignment_submissions 
       SET score = $1, feedback = $2, graded_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [score, feedback || '', id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pengumpulan tugas tidak ditemukan' });
    }

    // Auto-update or add into general grades table so it syncs to Gradebook
    // Let's find course_id and grade component for assignments
    const sub = rows[0];
    const { rows: assignmentRows } = await pool.query(
      'SELECT course_id, title FROM assignments WHERE id = $1',
      [sub.assignment_id]
    );
    if (assignmentRows.length > 0) {
      const { course_id, title } = assignmentRows[0];
      
      // Upsert a grade component for this assignment
      let { rows: compRows } = await pool.query(
        'SELECT id FROM grade_components WHERE course_id = $1 AND name = $2',
        [course_id, title]
      );
      let component_id;
      if (compRows.length === 0) {
        const { rows: newComp } = await pool.query(
          'INSERT INTO grade_components (course_id, name, weight, max_score) VALUES ($1, $2, 0, 100) RETURNING id',
          [course_id, title]
        );
        component_id = newComp[0].id;
      } else {
        component_id = compRows[0].id;
      }

      // Upsert score in grades table
      await pool.query(
        `INSERT INTO grades (component_id, student_id, score) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (component_id, student_id) DO UPDATE SET score = EXCLUDED.score`,
        [component_id, sub.student_id, score]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ error: 'Gagal memproses penilaian' });
  }
});

module.exports = router;
