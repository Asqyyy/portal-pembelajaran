const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/gradebook/course/:courseId — get components + grades
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get all grade components
    const { rows: components } = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = $1 ORDER BY id',
      [courseId]
    );

    let gradesQuery;
    let gradesParams;

    if (req.user.role === 'student') {
      // Students only see their own grades
      gradesQuery = `
        SELECT g.*, u.username AS student_name, u.display_name
        FROM grades g
        JOIN users u ON g.student_id = u.id
        JOIN grade_components gc ON g.component_id = gc.id
        WHERE gc.course_id = $1 AND g.student_id = $2
      `;
      gradesParams = [courseId, req.user.id];
    } else {
      // Lecturers see all grades in the course
      gradesQuery = `
        SELECT g.*, u.username AS student_name, u.display_name
        FROM grades g
        JOIN users u ON g.student_id = u.id
        JOIN grade_components gc ON g.component_id = gc.id
        WHERE gc.course_id = $1
        ORDER BY u.username, g.component_id
      `;
      gradesParams = [courseId];
    }

    const { rows: grades } = await pool.query(gradesQuery, gradesParams);
    res.json({ components, grades });
  } catch (err) {
    console.error('Get gradebook error:', err);
    res.status(500).json({ error: 'Gagal mengambil gradebook' });
  }
});

// GET /api/gradebook/:courseId/students — list enrolled students (lecturer only, for dropdown selection)
router.get('/:courseId/students', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { courseId } = req.params;
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.email 
       FROM users u
       JOIN enrollments e ON u.id = e.user_id
       WHERE e.course_id = $1 AND e.category = 'learning'
       ORDER BY u.username`,
      [courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get enrolled students error:', err);
    res.status(500).json({ error: 'Gagal mengambil data siswa terdaftar' });
  }
});

// POST /api/gradebook/component — add component (lecturer)
router.post('/component', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa menambah komponen' });
    }
    const { course_id, name, weight, max_score } = req.body;
    if (!course_id || !name) {
      return res.status(400).json({ error: 'course_id dan name wajib diisi' });
    }
    const { rows } = await pool.query(
      `INSERT INTO grade_components (course_id, name, weight, max_score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, name, parseFloat(weight || 0), parseInt(max_score || 100, 10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add component error:', err);
    res.status(500).json({ error: 'Gagal menambahkan komponen nilai' });
  }
});

// DELETE /api/gradebook/component/:id — delete component (lecturer)
router.delete('/component/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa menghapus komponen' });
    }
    await pool.query('DELETE FROM grade_components WHERE id = $1', [req.params.id]);
    res.json({ message: 'Komponen nilai berhasil dihapus' });
  } catch (err) {
    console.error('Delete component error:', err);
    res.status(500).json({ error: 'Gagal menghapus komponen nilai' });
  }
});

// PUT /api/gradebook/grade — update or insert grade (lecturer)
router.put('/grade', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang bisa mengupdate nilai' });
    }
    const { component_id, student_id, score } = req.body;
    if (!component_id || !student_id || score === undefined) {
      return res.status(400).json({ error: 'component_id, student_id, dan score wajib diisi' });
    }

    const { rows } = await pool.query(
      `INSERT INTO grades (component_id, student_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (component_id, student_id)
       DO UPDATE SET score = EXCLUDED.score
       RETURNING *`,
      [component_id, student_id, parseFloat(score)]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Update grade error:', err);
    res.status(500).json({ error: 'Gagal mengupdate nilai' });
  }
});

// GET /api/gradebook/course/:courseId/summary — calculate weighted scores
router.get('/course/:courseId/summary', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    const { rows: components } = await pool.query(
      'SELECT * FROM grade_components WHERE course_id = $1',
      [courseId]
    );

    let gradesQuery;
    let gradesParams;

    if (req.user.role === 'student') {
      gradesQuery = `
        SELECT g.*, u.username AS student_name, u.display_name
        FROM grades g
        JOIN users u ON g.student_id = u.id
        JOIN grade_components gc ON g.component_id = gc.id
        WHERE gc.course_id = $1 AND g.student_id = $2
      `;
      gradesParams = [courseId, req.user.id];
    } else {
      gradesQuery = `
        SELECT g.*, u.username AS student_name, u.display_name
        FROM grades g
        JOIN users u ON g.student_id = u.id
        JOIN grade_components gc ON g.component_id = gc.id
        WHERE gc.course_id = $1
      `;
      gradesParams = [courseId];
    }

    const { rows: grades } = await pool.query(gradesQuery, gradesParams);

    // Group grades by student
    const studentMap = {};
    grades.forEach(g => {
      const key = g.student_id;
      if (!studentMap[key]) {
        studentMap[key] = {
          student_id: g.student_id,
          student_name: g.student_name,
          display_name: g.display_name,
          compScores: {}
        };
      }
      studentMap[key].compScores[g.component_id] = g.score;
    });

    const summary = Object.values(studentMap).map(student => {
      let weightedTotal = 0;
      const detail = components.map(c => {
        const score = student.compScores[c.id] || 0;
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
        student_id: student.student_id,
        student_name: student.student_name,
        display_name: student.display_name,
        weighted_score: Math.round(weightedTotal * 100) / 100,
        detail
      };
    });

    res.json({ components, summary });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Gagal menghitung summary nilai' });
  }
});

module.exports = router;
