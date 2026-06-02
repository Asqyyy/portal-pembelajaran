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

async function create({ course_code, course_name, description, category, created_by }) {
  const { rows } = await pool.query(
    'INSERT INTO courses (course_code, course_name, description, category, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [course_code, course_name, description || '', category || 'learning', created_by]
  );
  return rows[0];
}

async function update(id, { course_name, description }) {
  const { rows } = await pool.query(
    'UPDATE courses SET course_name = $1, description = $2 WHERE id = $3 RETURNING *',
    [course_name, description, id]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

async function enroll(userId, courseId, category) {
  category = category || 'learning';
  const { rows } = await pool.query(
    'INSERT INTO enrollments (user_id, course_id, category) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO UPDATE SET category = EXCLUDED.category RETURNING *',
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

module.exports = { findAll, findById, findByCode, create, update, remove, enroll, getUserEnrollments };
