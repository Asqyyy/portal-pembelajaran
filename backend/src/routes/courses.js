const express = require('express');
const { pool } = require('../config/db');
const courseModel = require('../models/course');
const { authenticate, optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    let courses = await courseModel.findAll();
    if (req.user) {
      const enrolledSet = new Set();
      const enrollments = await courseModel.getUserEnrollments(req.user.id);
      enrollments.forEach(e => enrolledSet.add(e.id));
      courses = courses.map(c => ({ ...c, enrolled: enrolledSet.has(c.id) }));
    }
    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Gagal mengambil data courses' });
  }
});

router.get('/user/enrollments', authenticate, async (req, res) => {
  try {
    const courses = await courseModel.getUserEnrollments(req.user.id);
    res.json(courses);
  } catch (err) {
    console.error('Get enrollments error:', err);
    res.status(500).json({ error: 'Gagal mengambil data enrollments' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course tidak ditemukan' });
    res.json(course);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: 'Gagal mengambil data course' });
  }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course tidak ditemukan' });
    const category = req.body.category || 'learning';
    await courseModel.enroll(req.user.id, course.id, category);
    res.json({ message: 'Berhasil enroll course', course });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: 'Gagal enroll course' });
  }
});

// Create Course (lecturer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya pengajar yang dapat membuat kelas.' });
    }
    const { course_code, course_name, description, category } = req.body;
    if (!course_code || !course_name) {
      return res.status(400).json({ error: 'Kode kelas dan nama kelas wajib diisi' });
    }
    const existing = await courseModel.findByCode(course_code);
    if (existing) {
      return res.status(409).json({ error: 'Kode kelas sudah digunakan' });
    }
    const course = await courseModel.create({
      course_code,
      course_name,
      description,
      category,
      created_by: req.user.id
    });
    res.status(201).json(course);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Gagal membuat course' });
  }
});

// Update Course (lecturer/admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course tidak ditemukan' });
    if (req.user.role !== 'admin' && course.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Hanya pembuat kelas yang dapat mengedit.' });
    }
    const { course_name, description } = req.body;
    if (!course_name) {
      return res.status(400).json({ error: 'Nama kelas wajib diisi' });
    }
    const updated = await courseModel.update(req.params.id, { course_name, description });
    res.json(updated);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: 'Gagal mengupdate course' });
  }
});

// Delete Course (creator or admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course tidak ditemukan' });
    if (req.user.role !== 'admin' && course.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Hanya pembuat kelas atau admin yang dapat menghapus.' });
    }
    await courseModel.remove(req.params.id);
    res.json({ message: 'Course berhasil dihapus' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: 'Gagal menghapus course' });
  }
});

// --- SECTIONS ---

// GET /api/courses/:id/sections — get all sections with their files
router.get('/:id/sections', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cs.*, COALESCE(
        json_agg(
          json_build_object(
            'id', sf.id,
            'original_name', sf.original_name,
            'stored_name', sf.stored_name,
            'mime_type', sf.mime_type,
            'size_bytes', sf.size_bytes,
            'uploaded_at', sf.uploaded_at
          )
        ) FILTER (WHERE sf.id IS NOT NULL),
        '[]'::json
      ) AS files
      FROM course_sections cs
      LEFT JOIN section_files sf ON cs.id = sf.section_id
      WHERE cs.course_id = $1
      GROUP BY cs.id
      ORDER BY cs.sort_order, cs.id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get sections error:', err);
    res.status(500).json({ error: 'Gagal mengambil data materi' });
  }
});

// POST /api/courses/:id/sections — add section (lecturer only)
router.post('/:id/sections', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya pengajar yang dapat menambahkan materi.' });
    }
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Judul materi wajib diisi' });
    
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM course_sections WHERE course_id = $1',
      [req.params.id]
    );
    const sort_order = countRows[0].count;

    const { rows } = await pool.query(
      'INSERT INTO course_sections (course_id, title, content, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, title, content || '', sort_order]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add section error:', err);
    res.status(500).json({ error: 'Gagal menambahkan materi' });
  }
});

// PUT /api/courses/:id/sections/:sectionId — update section
router.put('/:id/sections/:sectionId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Judul materi wajib diisi' });

    const { rows } = await pool.query(
      'UPDATE course_sections SET title = $1, content = $2 WHERE id = $3 AND course_id = $4 RETURNING *',
      [title, content, req.params.sectionId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Materi tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update section error:', err);
    res.status(500).json({ error: 'Gagal mengupdate materi' });
  }
});

// DELETE /api/courses/:id/sections/:sectionId — delete section
router.delete('/:id/sections/:sectionId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { rows } = await pool.query(
      'DELETE FROM course_sections WHERE id = $1 AND course_id = $2 RETURNING *',
      [req.params.sectionId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Materi tidak ditemukan' });
    res.json({ message: 'Materi berhasil dihapus' });
  } catch (err) {
    console.error('Delete section error:', err);
    res.status(500).json({ error: 'Gagal menghapus materi' });
  }
});

module.exports = router;
