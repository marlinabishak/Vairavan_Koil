const pool = require('../db/pool');

// GET /api/edit-requests
async function getRequests(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, b.name as booking_name, b.code as booking_code 
      FROM edit_requests e
      JOIN bookings b ON e.booking_id = b.id
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error [requestsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch edit requests' });
  }
}

// GET /api/edit-requests/booking/:booking_id
async function getBookingRequest(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM edit_requests WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.booking_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Error [requestsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch booking request' });
  }
}

// POST /api/edit-requests
async function createRequest(req, res) {
  const { v4: uuidv4 } = require('uuid');
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    // UPSERT or just insert a new pending request, deleting old ones
    await pool.query('DELETE FROM edit_requests WHERE booking_id = $1', [booking_id]);

    const id = uuidv4();
    await pool.query(
      `INSERT INTO edit_requests (id, booking_id, status) VALUES ($1, $2, 'pending')`,
      [id, booking_id]
    );
    const { rows } = await pool.query('SELECT * FROM edit_requests WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [requestsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to create edit request' });
  }
}

// PATCH /api/edit-requests/:id/status
async function updateRequestStatus(req, res) {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query(
      `UPDATE edit_requests SET status = $1 WHERE id = $2`,
      [status, req.params.id]
    );
    
    const { rows } = await pool.query('SELECT * FROM edit_requests WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [requestsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update request' });
  }
}

module.exports = {
  getRequests,
  getBookingRequest,
  createRequest,
  updateRequestStatus
};
