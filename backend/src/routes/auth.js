const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, dan password wajib diisi' });
    }
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) return res.status(409).json({ error: 'Username sudah digunakan' });
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'Email sudah digunakan' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ username, email, passwordHash, role: role || 'student' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    const user = await userModel.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Username atau password salah' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Username atau password salah' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...userData } = user;
    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
});

module.exports = router;
