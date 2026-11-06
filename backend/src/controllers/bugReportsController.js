const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');

// Ensure upload destination exists
const uploadDir = path.join(__dirname, '../../uploads/bug_reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    cb(null, `bug_${Date.now()}_${cleanName}${ext}`);
  }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) && (mime.startsWith('image/') || allowed.test(mime))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPG, JPEG, WEBP, GIF) are allowed for bug reports.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // max 5 images
  }
});

// POST /api/bug-reports
async function createBugReport(req, res) {
  try {
    const { title, description, page_url, username: rawUsername, user_role: rawRole } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Bug title/summary is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Bug description/message is required' });
    }

    const userId = req.user?.id || req.body.user_id || null;
    const username = req.user?.name || req.user?.username || rawUsername || 'Anonymous';
    const userRole = req.user?.role || rawRole || 'general';

    // Collect uploaded screenshot relative URLs
    const screenshotUrls = (req.files || []).map(f => `/uploads/bug_reports/${f.filename}`);

    const id = uuidv4();
    await pool.query(
      `INSERT INTO bug_reports (id, user_id, username, user_role, title, description, screenshot_urls, page_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')`,
      [
        id,
        userId,
        username,
        userRole,
        title.trim(),
        description.trim(),
        JSON.stringify(screenshotUrls),
        page_url || ''
      ]
    );

    // Audit log (history_logs user_id only accepts staff users via FK)
    const historyUserId = (userRole && userRole !== 'user' && userRole !== 'general') ? userId : null;
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        historyUserId,
        'Reported Issue/Bug',
        `${username} (${userRole}) reported issue: "${title.trim()}". ${screenshotUrls.length} screenshot(s) attached.`
      ]
    );

    const report = {
      id,
      user_id: userId,
      username,
      user_role: userRole,
      title: title.trim(),
      description: description.trim(),
      screenshot_urls: screenshotUrls,
      page_url: page_url || '',
      status: 'open'
    };

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully! Thank you for helping improve the system.',
      id,
      report,
      screenshot_urls: screenshotUrls
    });
  } catch (err) {
    console.error('Error [createBugReport]:', err.stack || err);
    res.status(500).json({ error: 'Failed to submit bug report', details: err.message });
  }
}

// GET /api/bug-reports
async function listBugReports(req, res) {
  try {
    const { status } = req.query;
    let query = `SELECT * FROM bug_reports`;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` WHERE status = $1`;
    }

    query += ` ORDER BY created_at DESC LIMIT 200`;

    const { rows } = await pool.query(query, params);

    // Parse screenshot_urls
    const reports = rows.map(r => {
      let urls = [];
      try {
        urls = r.screenshot_urls ? JSON.parse(r.screenshot_urls) : [];
      } catch (e) {
        urls = r.screenshot_urls ? [r.screenshot_urls] : [];
      }
      return {
        ...r,
        screenshot_urls: urls
      };
    });

    res.json(reports);
  } catch (err) {
    console.error('Error [listBugReports]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch bug reports', details: err.message });
  }
}

// PATCH /api/bug-reports/:id/status
async function updateBugReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const allowed = ['open', 'in_progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const { rows } = await pool.query(`SELECT id, title, status FROM bug_reports WHERE id = $1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    await pool.query(
      `UPDATE bug_reports 
       SET status = $1, resolution_notes = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [status, resolution_notes || null, id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        req.user?.id || null,
        'Updated Bug Report Status',
        `Bug report "${rows[0].title}" marked as "${status}" by ${req.user?.name || req.user?.username || 'Staff'}.`
      ]
    );

    res.json({ 
      success: true, 
      message: `Bug report status updated to ${status}`,
      status,
      report: { ...rows[0], status, resolution_notes: resolution_notes || null }
    });
  } catch (err) {
    console.error('Error [updateBugReportStatus]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update bug status', details: err.message });
  }
}

module.exports = {
  upload,
  createBugReport,
  listBugReports,
  updateBugReportStatus
};
