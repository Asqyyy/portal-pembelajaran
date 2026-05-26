const express = require('express');
const userModel = require('../models/user');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Tidak diizinkan' });
    }
    const allowed = ['username', 'email'];
    const fields = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'Tidak ada field yang diupdate' });
    }
    const user = await userModel.update(req.params.id, fields);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Gagal mengupdate user' });
  }
});

module.exports = router;
