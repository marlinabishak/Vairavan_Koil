const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

// Ensure thuritha_kattalai_bookings table exists and system_settings has the fee
async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS thuritha_kattalai_bookings (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        booking_date DATE NOT NULL,
        slot INT NOT NULL DEFAULT 1,
        name VARCHAR(150) NOT NULL,
        place VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        star VARCHAR(80) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 200.00,
        payment_mode VARCHAR(50) DEFAULT 'Online',
        payment_status VARCHAR(30) DEFAULT 'paid',
        is_present TINYINT(1) NOT NULL DEFAULT 0,
        created_by VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_date_slot (booking_date, slot)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('thuritha_kattalai_amount', '200', 'Fee for on-the-day Thuritha Kattalai registrations')
      ON DUPLICATE KEY UPDATE setting_value = IFNULL(setting_value, '200');
    `);

    // Update kattalai_types row for Archanai column to reflect Thuritha Kattalai
    await pool.query(`
      UPDATE kattalai_types 
      SET name = 'Thuritha Kattalai', name_ta = 'துரித கட்டளை' 
      WHERE color_key = 'archanai' OR name = 'Archanai' OR name = 'Thani Archanai';
    `);
  } catch (err) {
    console.warn('[ThurithaKattalai] Table check warning:', err.message);
  }
}

// Run initial check lazily on load
ensureTable().catch(() => {});

// Helper to get active fee
async function getThurithaFee() {
  try {
    const { rows } = await pool.query(`
      SELECT setting_value FROM system_settings 
      WHERE setting_key IN ('thuritha_kattalai_amount', 'thani_archanai_amount', 'archanai_fee')
      ORDER BY FIELD(setting_key, 'thuritha_kattalai_amount', 'thani_archanai_amount', 'archanai_fee')
      LIMIT 1
    `);
    if (rows && rows.length > 0 && rows[0].setting_value) {
      const parsed = parseFloat(rows[0].setting_value);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.warn('[ThurithaKattalai] Failed to fetch fee setting:', e.message);
  }
  return 200.00;
}

// GET /api/thuritha-kattalai
// Optional query: ?date=YYYY-MM-DD or ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
async function listThurithaKattalai(req, res) {
  try {
    const { date, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM thuritha_kattalai_bookings';
    const params = [];

    if (date) {
      query += ' WHERE booking_date = $1';
      params.push(date);
    } else if (fromDate && toDate) {
      query += ' WHERE booking_date >= $1 AND booking_date <= $2';
      params.push(fromDate, toDate);
    }

    query += ' ORDER BY booking_date ASC, slot ASC, created_at ASC';

    const { rows } = await pool.query(query, params);
    const activeFee = await getThurithaFee();

    res.json({
      success: true,
      data: rows,
      fee: activeFee
    });
  } catch (err) {
    console.error('Error [thurithaKattalaiController.listThurithaKattalai]:', err);
    res.status(500).json({ error: 'Failed to fetch Thuritha Kattalai bookings' });
  }
}

// POST /api/thuritha-kattalai
// Payload: { name, place, phone, email, star, booking_date, slot, payment_mode }
async function createThurithaKattalai(req, res) {
  try {
    const {
      name,
      place,
      phone,
      email,
      star,
      booking_date,
      payment_mode = 'Online'
    } = req.body;

    let { slot } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Devotee name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!booking_date) {
      return res.status(400).json({ error: 'Booking date is required' });
    }

    const targetDate = String(booking_date).slice(0, 10);
    const fee = await getThurithaFee();

    // Find taken slots for this date
    const { rows: takenRows } = await pool.query(
      'SELECT slot FROM thuritha_kattalai_bookings WHERE booking_date = $1',
      [targetDate]
    );
    const takenSlots = new Set(takenRows.map(r => parseInt(r.slot, 10)));

    if (slot) {
      slot = parseInt(slot, 10);
      if (takenSlots.has(slot)) {
        return res.status(409).json({ error: `Slot ${slot} is already booked for ${targetDate}` });
      }
    } else {
      // Pick next available slot between 1 and 4
      for (let s = 1; s <= 4; s++) {
        if (!takenSlots.has(s)) {
          slot = s;
          break;
        }
      }
      if (!slot) {
        return res.status(409).json({ error: `All 4 Thuritha Kattalai slots are fully booked for ${targetDate}` });
      }
    }

    const id = uuidv4();
    const createdBy = req.user?.id || null;

    await pool.query(
      `INSERT INTO thuritha_kattalai_bookings 
       (id, booking_date, slot, name, place, phone, email, star, amount, payment_mode, payment_status, is_present, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'paid', 0, $11)`,
      [
        id,
        targetDate,
        slot,
        name.trim(),
        (place || '').trim(),
        phone.trim(),
        (email || '').trim(),
        (star || '').trim(),
        fee,
        payment_mode,
        createdBy
      ]
    );

    // Audit log
    try {
      const staffName = req.user?.name || req.user?.username || 'Devotee Online';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [
          uuidv4(),
          createdBy,
          'Created Booking',
          `New Thuritha Kattalai registered for ${name.trim()} (${phone.trim()}), Date: ${targetDate}, Slot: ${slot}, Amount: ₹${fee}, Mode: ${payment_mode} (By ${staffName}).`
        ]
      );
    } catch (auditErr) {
      console.warn('Thuritha Kattalai audit log warning:', auditErr.message);
    }

    const { rows: inserted } = await pool.query('SELECT * FROM thuritha_kattalai_bookings WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Thuritha Kattalai registered successfully',
      data: inserted[0]
    });
  } catch (err) {
    console.error('Error [thurithaKattalaiController.createThurithaKattalai]:', err);
    res.status(500).json({ error: err.message || 'Failed to create Thuritha Kattalai booking' });
  }
}

// PATCH /api/thuritha-kattalai/:id/present
async function togglePresent(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query('SELECT * FROM thuritha_kattalai_bookings WHERE id = $1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Thuritha Kattalai booking not found' });
    }

    const current = rows[0];
    const newPresent = current.is_present ? 0 : 1;

    await pool.query('UPDATE thuritha_kattalai_bookings SET is_present = $1 WHERE id = $2', [newPresent, id]);

    // Record attendance log in history_logs
    try {
      const staffName = req.user?.name || req.user?.username || 'Staff';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [
          uuidv4(),
          req.user?.id || null,
          newPresent ? 'Marked Present' : 'Marked Absent',
          `${staffName} marked ${current.name} (Thuritha Kattalai, Slot ${current.slot}) as ${newPresent ? 'PRESENT' : 'ABSENT'} for date ${current.booking_date}.`
        ]
      );
    } catch (e) {
      console.warn('Attendance audit log warning:', e.message);
    }

    res.json({
      success: true,
      id,
      is_present: Boolean(newPresent)
    });
  } catch (err) {
    console.error('Error [thurithaKattalaiController.togglePresent]:', err);
    res.status(500).json({ error: 'Failed to toggle attendance' });
  }
}

// PATCH /api/thuritha-kattalai/:id
async function updateThurithaKattalai(req, res) {
  try {
    const { id } = req.params;
    const { name, place, phone, email, star } = req.body;

    const { rows } = await pool.query('SELECT * FROM thuritha_kattalai_bookings WHERE id = $1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Thuritha Kattalai booking not found' });
    }

    await pool.query(
      `UPDATE thuritha_kattalai_bookings 
       SET name = COALESCE($1, name),
           place = COALESCE($2, place),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           star = COALESCE($5, star)
       WHERE id = $6`,
      [name, place, phone, email, star, id]
    );

    const { rows: updated } = await pool.query('SELECT * FROM thuritha_kattalai_bookings WHERE id = $1', [id]);

    res.json({
      success: true,
      data: updated[0]
    });
  } catch (err) {
    console.error('Error [thurithaKattalaiController.updateThurithaKattalai]:', err);
    res.status(500).json({ error: 'Failed to update Thuritha Kattalai booking' });
  }
}

// DELETE /api/thuritha-kattalai/:id
async function deleteThurithaKattalai(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM thuritha_kattalai_bookings WHERE id = $1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Thuritha Kattalai booking not found' });
    }

    await pool.query('DELETE FROM thuritha_kattalai_bookings WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Thuritha Kattalai booking deleted successfully'
    });
  } catch (err) {
    console.error('Error [thurithaKattalaiController.deleteThurithaKattalai]:', err);
    res.status(500).json({ error: 'Failed to delete Thuritha Kattalai booking' });
  }
}

module.exports = {
  ensureTable,
  listThurithaKattalai,
  createThurithaKattalai,
  togglePresent,
  updateThurithaKattalai,
  deleteThurithaKattalai
};
