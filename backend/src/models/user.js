const { pool } = require('../config/db');

async function findByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ username, email, passwordHash, role }) {
  const { rows } = await pool.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
    [username, email, passwordHash, role || 'student']
  );
  return rows[0];
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);
  const setClauses = keys.map((k, i) => k + ' = $' + (i + 2));
  const values = keys.map(k => fields[k]);
  const { rows } = await pool.query(
    'UPDATE users SET ' + setClauses.join(', ') + ' WHERE id = $1 RETURNING id, username, email, role, created_at',
    [id, ...values]
  );
  return rows[0] || null;
}

module.exports = { findByUsername, findByEmail, findById, create, update };
