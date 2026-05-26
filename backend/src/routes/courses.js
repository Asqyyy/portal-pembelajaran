const express = require('express');
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

module.exports = router;
