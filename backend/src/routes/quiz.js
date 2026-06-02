const express = require('express');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/quiz/course/:courseId — list quizzes for course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    let query;
    let params;

    if (req.user.role === 'student') {
      // Students see quizzes and their score if they completed it
      query = `
        SELECT q.id, q.course_id, q.title, q.description, q.type, q.time_limit, q.created_at,
               qr.score, qr.max_score AS user_max_score, qr.submitted_at
        FROM quizzes q
        LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.student_id = $2
        WHERE q.course_id = $1
        ORDER BY q.id DESC
      `;
      params = [courseId, req.user.id];
    } else {
      query = `
        SELECT q.id, q.course_id, q.title, q.description, q.type, q.time_limit, q.created_at,
               (SELECT COUNT(*)::int FROM quiz_results WHERE quiz_id = q.id) AS submission_count
        FROM quizzes q
        WHERE q.course_id = $1
        ORDER BY q.id DESC
      `;
      params = [courseId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('List quizzes error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar kuis' });
  }
});

// GET /api/quiz/:id — get quiz with questions
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows: quizRows } = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    if (quizRows.length === 0) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan' });
    }
    const quiz = quizRows[0];

    // Fetch questions
    const { rows: questionRows } = await pool.query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order, id',
      [quiz.id]
    );

    // Strip correct answers for students
    const isStudent = req.user.role === 'student';
    const questions = questionRows.map(q => {
      const { correct_answer, ...publicQuestion } = q;
      return isStudent ? publicQuestion : q;
    });

    res.json({ ...quiz, questions });
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kuis' });
  }
});

// POST /api/quiz — create quiz with questions (lecturer only)
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang dapat membuat kuis' });
    }
    const { course_id, title, description, type, time_limit, questions } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ error: 'course_id dan title wajib diisi' });
    }

    await client.query('BEGIN');

    // Create quiz
    const { rows: quizRows } = await client.query(
      `INSERT INTO quizzes (course_id, title, description, type, time_limit, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_id, title, description || '', type || 'mixed', time_limit || null, req.user.id]
    );
    const quiz = quizRows[0];

    // Insert questions
    const insertedQuestions = [];
    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { question_text, question_type, options, correct_answer, points } = q;
        const { rows: qRows } = await client.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [quiz.id, question_text, question_type, JSON.stringify(options || []), correct_answer || '', points || 10, i]
        );
        insertedQuestions.push(qRows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...quiz, questions: insertedQuestions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create quiz transaction error:', err);
    res.status(500).json({ error: 'Gagal membuat kuis' });
  } finally {
    client.release();
  }
});

// POST /api/quiz/:id/submit — submit answers and auto-grade
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya siswa yang dapat mengerjakan kuis' });
    }
    const { id } = req.params;
    const { answers } = req.body; // format: { questionId: "answer_value" }

    if (!answers) {
      return res.status(400).json({ error: 'Jawaban wajib diisi' });
    }

    // Check duplicate submission
    const { rows: existing } = await pool.query(
      'SELECT id FROM quiz_results WHERE quiz_id = $1 AND student_id = $2',
      [id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Anda sudah mengerjakan kuis ini sebelumnya' });
    }

    // Get all questions with correct answers
    const { rows: questions } = await pool.query(
      'SELECT id, question_type, correct_answer, points FROM quiz_questions WHERE quiz_id = $1',
      [id]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Kuis tidak memiliki pertanyaan' });
    }

    let score = 0;
    let max_score = 0;
    let hasEssay = false;

    questions.forEach(q => {
      max_score += q.points;
      if (q.question_type === 'essay') {
        hasEssay = true;
        return; // Essay is graded manually by lecturer
      }
      const studentAnswer = answers[q.id];
      if (studentAnswer !== undefined && String(studentAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
        score += q.points;
      }
    });

    const { rows } = await pool.query(
      `INSERT INTO quiz_results (quiz_id, student_id, answers, score, max_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.user.id, JSON.stringify(answers), score, max_score]
    );

    res.status(201).json({
      result: rows[0],
      has_essay: hasEssay,
      message: hasEssay 
        ? 'Jawaban berhasil disubmit. Nilai akhir menunggu penilaian pertanyaan essay oleh pengajar.'
        : 'Kuis selesai dikerjakan.'
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Gagal men-submit jawaban kuis' });
  }
});

// GET /api/quiz/:id/results — get quiz results
router.get('/:id/results', authenticate, async (req, res) => {
  try {
    let query;
    let params;
    if (req.user.role === 'lecturer' || req.user.role === 'admin') {
      query = `
        SELECT qr.*, u.username, u.display_name
        FROM quiz_results qr
        JOIN users u ON qr.student_id = u.id
        WHERE qr.quiz_id = $1
        ORDER BY qr.submitted_at DESC
      `;
      params = [req.params.id];
    } else {
      query = `
        SELECT qr.*
        FROM quiz_results qr
        WHERE qr.quiz_id = $1 AND qr.student_id = $2
      `;
      params = [req.params.id, req.user.id];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get quiz results error:', err);
    res.status(500).json({ error: 'Gagal mengambil hasil kuis' });
  }
});

// PUT /api/quiz/results/:id/grade — grade essay questions (lecturer only)
router.put('/results/:id/grade', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya pengajar yang dapat memberikan nilai' });
    }
    const { id } = req.params;
    const { score } = req.body; // new calculated total score or additional points

    if (score === undefined) {
      return res.status(400).json({ error: 'Nilai (score) wajib diisi' });
    }

    const { rows } = await pool.query(
      `UPDATE quiz_results SET score = $1 WHERE id = $2 RETURNING *`,
      [score, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hasil kuis tidak ditemukan' });
    }

    // Optional: sync to Gradebook
    const result = rows[0];
    const { rows: quizRows } = await pool.query('SELECT course_id, title FROM quizzes WHERE id = $1', [result.quiz_id]);
    if (quizRows.length > 0) {
      const { course_id, title } = quizRows[0];
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

      // Convert score out of max_score to standard 100 base if needed, or store direct
      const finalScore = result.max_score > 0 ? (result.score / result.max_score) * 100 : result.score;
      await pool.query(
        `INSERT INTO grades (component_id, student_id, score) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (component_id, student_id) DO UPDATE SET score = EXCLUDED.score`,
        [component_id, result.student_id, Math.round(finalScore * 100) / 100]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Grade essay error:', err);
    res.status(500).json({ error: 'Gagal mengupdate nilai kuis' });
  }
});

module.exports = router;
