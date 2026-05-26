const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY id');
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await pool.query('SELECT * FROM courses WHERE course_code = $1', [code]);
  return rows[0] || null;
}

async function create({ courseCode, courseName, faculty }) {
  const { rows } = await pool.query(
    'INSERT INTO courses (course_code, course_name, faculty) VALUES ($1, $2, $3) RETURNING *',
    [courseCode, courseName, faculty || '']
  );
  return rows[0];
}

async function enroll(userId, courseId, category) {
  category = category || 'learning';
  const { rows } = await pool.query(
    'INSERT INTO enrollments (user_id, course_id, category) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id, category) DO NOTHING RETURNING *',
    [userId, courseId, category]
  );
  return rows[0] || null;
}

async function getUserEnrollments(userId) {
  const { rows } = await pool.query(
    'SELECT c.*, e.category FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.user_id = $1 ORDER BY c.id',
    [userId]
  );
  return rows;
}

module.exports = { findAll, findById, findByCode, create, enroll, getUserEnrollments };
