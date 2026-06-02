const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // default 10MB
  }
});

// POST /api/files/upload — upload file for a course section
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File wajib diunggah' });
    }
    const { section_id } = req.body;
    if (!section_id) {
      // Remove uploaded file if metadata is incomplete
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'section_id wajib disertakan' });
    }

    const { rows } = await pool.query(
      `INSERT INTO section_files (section_id, original_name, stored_name, mime_type, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [section_id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('File upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Gagal mengunggah file: ' + err.message });
  }
});

// GET /api/files/:id — download/serve file
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM section_files WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }
    const fileRecord = rows[0];
    const filePath = path.join(uploadDir, fileRecord.stored_name);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File fisik tidak ditemukan di server' });
    }

    res.download(filePath, fileRecord.original_name);
  } catch (err) {
    console.error('Serve file error:', err);
    res.status(500).json({ error: 'Gagal mengambil file' });
  }
});

// DELETE /api/files/:id — delete file
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM section_files WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }
    const fileRecord = rows[0];

    // Only creator or lecturer/admin can delete
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin' && fileRecord.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin menghapus file ini.' });
    }

    const filePath = path.join(uploadDir, fileRecord.stored_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM section_files WHERE id = $1', [req.params.id]);
    res.json({ message: 'File berhasil dihapus' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Gagal menghapus file' });
  }
});

module.exports = router;
