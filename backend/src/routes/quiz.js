const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /api/quiz — create quiz (lecturer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ error: 'Hanya dosen yang bisa membuat quiz' });
    }
    const { course_id, title, description, type, questions } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ error: 'course_id dan title wajib diisi' });
    }
    const { rows } = await pool.query(
      `INSERT INTO quizzes (course_id, title, description, type, questions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_id, title, description || '', type || 'multiple_choice', JSON.stringify(questions || []), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Gagal membuat quiz' });
  }
});

// GET /api/quiz/course/:courseId — list quizzes for course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.course_id, q.title, q.description, q.type, q.created_by, q.created_at,
              u.username AS creator_name
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.course_id = $1
       ORDER BY q.created_at DESC`,
      [req.params.courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List quizzes error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar quiz' });
  }
});

// GET /api/quiz/:id — get quiz detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.*, u.username AS creator_name
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Quiz tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Gagal mengambil quiz' });
  }
});

// POST /api/quiz/:id/submit — submit answers, auto-grade MC+TF
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { rows: quizRows } = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz tidak ditemukan' });

    const quiz = quizRows[0];
    const questions = quiz.questions || [];
    const userAnswers = req.body.answers || [];

    let score = 0;
    const total = questions.length;

    questions.forEach((q, i) => {
      const userAns = userAnswers[i];
      if (q.type === 'multiple_choice') {
        if (userAns !== undefined && userAns === q.correct_answer) score++;
      } else if (q.type === 'true_false') {
        if (userAns !== undefined && userAns === q.correct_answer) score++;
      }
      // essay: no auto-grading
    });

    const { rows: resultRows } = await pool.query(
      `INSERT INTO quiz_results (quiz_id, user_id, score, total, answers)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [quiz.id, req.user.id, score, total, JSON.stringify(userAnswers)]
    );
    res.status(201).json({ result: resultRows[0], message: 'Quiz berhasil disubmit' });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Gagal submit quiz' });
  }
});

// GET /api/quiz/:id/results — get results (lecturer sees all, student sees own)
router.get('/:id/results', authenticate, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'lecturer') {
      query = `SELECT qr.*, u.username, u.role
               FROM quiz_results qr
               JOIN users u ON qr.user_id = u.id
               WHERE qr.quiz_id = $1
               ORDER BY qr.completed_at DESC`;
      params = [req.params.id];
    } else {
      query = `SELECT qr.*
               FROM quiz_results qr
               WHERE qr.quiz_id = $1 AND qr.user_id = $2
               ORDER BY qr.completed_at DESC`;
      params = [req.params.id, req.user.id];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Gagal mengambil hasil quiz' });
  }
});

module.exports = router;
