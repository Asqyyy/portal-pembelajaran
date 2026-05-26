const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/gradebook/course/:courseId — get components + grades
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { rows: components } = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id',
      [req.params.courseId]
    );
    const { rows: grades } = await pool.query(
      'SELECT * FROM grades WHERE course_id = $1 ORDER BY student_name, component_id',
      [req.params.courseId]
    );
    res.json({ components, grades });
  } catch (err) {
    console.error('Get gradebook error:', err);
    res.status(500).json({ error: 'Gagal mengambil gradebook' });
  }
});

// POST /api/gradebook/component — add component (lecturer)
router.post('/component', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa menambah komponen' });
    }
    const { course_id, name, weight, max_score } = req.body;
    if (!course_id || !name) {
      return res.status(400).json({ error: 'course_id dan name wajib diisi' });
    }
    const { rows } = await pool.query(
      `INSERT INTO grade_components (course_id, name, weight, max_score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, name, weight || 0, max_score || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add component error:', err);
    res.status(500).json({ error: 'Gagal menambah komponen' });
  }
});

// DELETE /api/gradebook/component/:id — remove component
router.delete('/component/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa menghapus komponen' });
    }
    const { rows } = await pool.query(
      'DELETE FROM grade_components WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Komponen tidak ditemukan' });
    res.json({ message: 'Komponen berhasil dihapus' });
  } catch (err) {
    console.error('Delete component error:', err);
    res.status(500).json({ error: 'Gagal menghapus komponen' });
  }
});

// PUT /api/gradebook/grade — upsert student score
router.put('/grade', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa mengubah nilai' });
    }
    const { component_id, student_name, course_id, score, user_id } = req.body;
    if (!component_id || !student_name || !course_id) {
      return res.status(400).json({ error: 'component_id, student_name, dan course_id wajib diisi' });
    }

    // Try update first
    const updateResult = await pool.query(
      `UPDATE grades SET score = $1, user_id = COALESCE($2, grades.user_id)
       WHERE component_id = $3 AND student_name = $4 AND course_id = $5
       RETURNING *`,
      [score || 0, user_id || null, component_id, student_name, course_id]
    );

    if (updateResult.rows.length > 0) {
      return res.json(updateResult.rows[0]);
    }

    // Insert if no existing row
    const insertResult = await pool.query(
      `INSERT INTO grades (component_id, student_name, course_id, score, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [component_id, student_name, course_id, score || 0, user_id || null]
    );
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error('Update grade error:', err);
    res.status(500).json({ error: 'Gagal mengupdate nilai' });
  }
});

// GET /api/gradebook/course/:courseId/summary — calculated weighted scores
router.get('/course/:courseId/summary', authenticate, async (req, res) => {
  try {
    const { rows: components } = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = $1',
      [req.params.courseId]
    );
    const { rows: grades } = await pool.query(
      'SELECT * FROM grades WHERE course_id = $1',
      [req.params.courseId]
    );

    // Group grades by student
    const studentMap = {};
    grades.forEach(g => {
      if (!studentMap[g.student_name]) studentMap[g.student_name] = {};
      studentMap[g.student_name][g.component_id] = g.score;
    });

    const summary = Object.entries(studentMap).map(([name, compScores]) => {
      let weightedTotal = 0;
      const detail = components.map(c => {
        const score = compScores[c.id] || 0;
        const weighted = (score / c.max_score) * c.weight * 100;
        weightedTotal += weighted;
        return {
          component: c.name,
          score,
          max_score: c.max_score,
          weight: c.weight,
          weighted
        };
      });
      return {
        student_name: name,
        weighted_score: Math.round(weightedTotal * 100) / 100,
        detail
      };
    });

    res.json({ components, summary });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Gagal menghitung summary' });
  }
});

module.exports = router;
