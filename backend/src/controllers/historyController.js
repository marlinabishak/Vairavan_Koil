const pool = require('../db/pool');

// GET /api/history
async function listHistory(req, res) {
  try {
    const { booking_id } = req.query;
    let whereClause = '';
    const params = [];

    if (booking_id) {
      // Find the code and mobile for this booking
      const { rows: bRows } = await pool.query('SELECT code, mobile FROM bookings WHERE id = $1', [booking_id]);
      if (bRows.length > 0) {
        const { code, mobile } = bRows[0];
        
        if (code) {
          whereClause = `WHERE h.booking_id IN (SELECT id FROM bookings WHERE code = $1)`;
          params.push(code);
        } else if (mobile) {
          whereClause = `WHERE h.booking_id IN (SELECT id FROM bookings WHERE mobile = $1)`;
          params.push(mobile);
        } else {
          whereClause = 'WHERE h.booking_id = $1';
          params.push(booking_id);
        }
      } else {
        whereClause = 'WHERE h.booking_id = $1';
        params.push(booking_id);
      }
    }

    const { rows } = await pool.query(`
      SELECT h.*, u.name as user_name, u.role as user_role, b.name as booking_name, CONCAT(YEAR(h.created_at), '-', LPAD(b.kattalai_month, 2, '0'), '-', LPAD(b.kattalai_date, 2, '0')) as booking_date
      FROM history_logs h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN bookings b ON h.booking_id = b.id
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT 100
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('Error [historyController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

// POST /api/history
// Body: { user_id, action, details, booking_id }
async function createHistoryLog(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { user_id, action, details, booking_id } = req.body;
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, $2, $3, $4, $5)`,
      [id, user_id, action, details, booking_id || null]
    );
    const { rows } = await pool.query('SELECT * FROM history_logs WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [historyController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to create history log' });
  }
}

module.exports = {
  listHistory,
  createHistoryLog
};
