const pool = require('../db/pool');

// GET /api/bookings?date=2026-05-12
// Returns bookings grouped-friendly (flat list; frontend groups by kattalai_type_id)
async function listBookings(req, res) {
  try {
    const { date, search } = req.query;
    const targetYear = date ? parseInt(date.split("-")[0], 10) : new Date().getFullYear();
    const params = [];
    const whereClause = [];

    if (date) {
      const parts = date.split('-');
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      params.push(m, d);
      whereClause.push(`b.kattalai_month = $${params.length - 1} AND b.kattalai_date = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const searchIdx = `$${params.length}`;
      whereClause.push(`(
        b.name LIKE ${searchIdx} OR
        b.place LIKE ${searchIdx} OR
        b.mobile LIKE ${searchIdx} OR
        b.code LIKE ${searchIdx} OR
        kt.name LIKE ${searchIdx}
      )`);
    }

    const where = whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT b.*, ybr.present, ybr.let_intimation, ybr.wa_status_en, ybr.wa_status_ta, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta, kt.color_key,
              u_creator.name AS creator_name, u_creator.role AS creator_role,
              u_updater.name AS attendance_marked_by
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${targetYear}
       LEFT JOIN users u_creator ON b.created_by = u_creator.id
       LEFT JOIN users u_updater ON ybr.updated_by = u_updater.id
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       ${where}
       ORDER BY b.kattalai_month, b.kattalai_date, kt.display_order, b.created_at`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// GET /api/bookings/:id
async function getBooking(req, res) {
  try {
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const { rows } = await pool.query(
      `SELECT b.*, ybr.wa_status_en, ybr.wa_error_en, ybr.wa_status_ta, ybr.wa_error_ta, ybr.present, ybr.let_intimation, kt.name AS kattalai_name, kt.color_key
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${targetYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

// POST /api/bookings
async function createBooking(req, res) {
  const { v4: uuidv4 } = require('uuid');
  let {
    kattalai_type_id, kattalai_date, kattalai_month, title, name, star, place, code,
    mobile, whatsapp_number, whatsapp_same_as_mobile, email, 
    per_add_1, per_add_2, per_add_3, comm_add_1, comm_add_2, comm_add_3, comm_add_4, 
    amount, country_code, kat_type, regn_date, let_intimation,
    title_ta, name_ta, star_ta, place_ta
  } = req.body;

  // Auto-resolve kattalai_type_id if default placeholder, missing, or invalid
  if (!kattalai_type_id || kattalai_type_id === 'morning_default' || kattalai_type_id === 'evening_default') {
    let colorKey = 'morning';
    if (code && (code.startsWith('A/') || code.startsWith('AJ/'))) {
      colorKey = 'evening';
    } else if (kattalai_type_id === 'evening_default') {
      colorKey = 'evening';
    }
    const { rows: matchedTypes } = await pool.query(
      `SELECT id FROM kattalai_types WHERE color_key LIKE $1 ORDER BY display_order LIMIT 1`,
      [`%${colorKey}%`]
    );
    if (matchedTypes && matchedTypes.length > 0) {
      kattalai_type_id = matchedTypes[0].id;
    } else {
      const { rows: firstType } = await pool.query(`SELECT id FROM kattalai_types ORDER BY display_order LIMIT 1`);
      if (firstType && firstType.length > 0) kattalai_type_id = firstType[0].id;
    }
  }

  // Verify that the kattalai_type_id actually exists in kattalai_types table
  const { rows: checkType } = await pool.query(`SELECT id FROM kattalai_types WHERE id = $1`, [kattalai_type_id]);
  if (!checkType || checkType.length === 0) {
    let colorKey = (code && (code.startsWith('A/') || code.startsWith('AJ/'))) ? 'evening' : 'morning';
    const { rows: fallbackTypes } = await pool.query(
      `SELECT id FROM kattalai_types WHERE color_key LIKE $1 ORDER BY display_order LIMIT 1`,
      [`%${colorKey}%`]
    );
    if (fallbackTypes && fallbackTypes.length > 0) {
      kattalai_type_id = fallbackTypes[0].id;
    } else {
      const { rows: firstType } = await pool.query(`SELECT id FROM kattalai_types ORDER BY display_order LIMIT 1`);
      if (firstType && firstType.length > 0) kattalai_type_id = firstType[0].id;
    }
  }

  if (!kattalai_type_id || !kattalai_date || !kattalai_month || !name) {
    return res.status(400).json({ error: 'kattalai_type_id, kattalai_date, kattalai_month and name are required' });
  }

  const id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO bookings
        (id, kattalai_type_id, kattalai_date, kattalai_month, title, name, star, place, code, mobile,
         whatsapp_number, whatsapp_same_as_mobile, email, 
         per_add_1, per_add_2, per_add_3, comm_add_1, comm_add_2, comm_add_3, comm_add_4,
         amount, country_code, kat_type, regn_date,
         title_ta, name_ta, star_ta, place_ta, comments, created_by)
       VALUES 
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
      [
        id, kattalai_type_id, kattalai_date, kattalai_month, title || '', name || '', star || '', place || '', code || '', mobile || '',
        whatsapp_number || mobile || '', whatsapp_same_as_mobile ?? true, email || '', 
        per_add_1 || '', per_add_2 || '', per_add_3 || '', comm_add_1 || '', comm_add_2 || '', comm_add_3 || '', comm_add_4 || '',
        amount || 0, country_code || '91', kat_type || '', regn_date || null,
        title_ta || '', name_ta || '', star_ta || '', place_ta || '', req.body.comments || '',
        req.user?.id || req.body.created_by || null
      ]
    );

    // Audit log
    try {
      const { v4: uuidv4 } = require('uuid');
      const creatorId = req.user?.id || req.body.created_by || null;
      const creatorName = req.user?.name || (creatorId ? 'Staff' : 'Devotee / Online Registration');
      const creatorRole = req.user?.role || 'online';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          creatorId,
          'Created Booking',
          `Devotee "${name}" (${code}) registered. Amount: ₹${amount || 0}. Registered by: ${creatorName} (${creatorRole})`,
          id
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for booking creation:', logErr.message);
    }
    
    const { rows } = await pool.query('SELECT b.*, ybr.wa_status_en, ybr.wa_error_en, ybr.wa_status_ta, ybr.wa_error_ta, ybr.present, ybr.let_intimation FROM bookings b LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = YEAR(CURRENT_DATE()) WHERE b.id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
}

// PATCH /api/bookings/:id
async function updateBooking(req, res) {
  const fields = [
    'title', 'name', 'star', 'place', 'code', 'mobile', 'whatsapp_number', 'whatsapp_same_as_mobile',
    'email', 'amount', 'status', 'kattalai_type_id', 'kattalai_date', 'kattalai_month',
    'country_code', 'kat_type', 'regn_date', 'comments',
    'title_ta', 'name_ta', 'star_ta', 'place_ta',
    'per_add_1', 'per_add_2', 'per_add_3', 'comm_add_1', 'comm_add_2', 'comm_add_3', 'comm_add_4'
  ];
  
  const updates = [];
  const values = [];
  let i = 1;

  let isUnlocked = false;
  if (req.body.userRole === 'user') {
    const reqRes = await pool.query(
      `SELECT status FROM edit_requests WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`, 
      [req.params.id]
    );
    if (reqRes.rows.length > 0 && reqRes.rows[0].status === 'approved') {
      isUnlocked = true;
    }
  }

  const restrictedFields = ['mobile', 'per_add_1', 'per_add_2', 'per_add_3', 'title', 'name', 'star', 'place', 'code', 'kattalai_date', 'kattalai_month', 'amount', 'kattalai_type_id', 'title_ta', 'name_ta', 'star_ta', 'place_ta'];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (req.body.userRole === 'user' && !isUnlocked && restrictedFields.includes(f)) {
        continue;
      }
      updates.push(`${f} = $${i++}`);
      values.push(req.body[f]);
    }
  }
  
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.params.id);
  try {
    await pool.query(
      `UPDATE bookings SET ${updates.join(', ')}
       WHERE id = $${i}`,
      values
    );
    
    const { rows } = await pool.query('SELECT b.*, ybr.wa_status_en, ybr.wa_error_en, ybr.wa_status_ta, ybr.wa_error_ta, ybr.present, ybr.let_intimation FROM bookings b LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = YEAR(CURRENT_DATE()) WHERE b.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
}

// PATCH /api/bookings/:id/present
async function togglePresent(req, res) {
  const { present, user_id, user_name, user_role, target_year } = req.body;
    const recordYear = target_year || new Date().getFullYear();
  try {
    const { rows: currentRows } = await pool.query(`SELECT kattalai_month, kattalai_date, name FROM bookings WHERE id = $1`, [req.params.id]);
    if (!currentRows.length) return res.status(404).json({ error: 'Booking not found' });
    
    // Construct the date for the current year
    const today = new Date();
    const bMonth = currentRows[0].kattalai_month;
    const bDate = currentRows[0].kattalai_date;
    const bookingDate = new Date(Date.UTC(today.getFullYear(), bMonth - 1, bDate));
    
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const diffTime = Math.abs(bookingDate - todayUTC);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 5 && user_role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can modify attendance beyond 5 days.' });
    }

    const actualUserId = user_id || req.user?.id || null;
    const staffName = user_name || req.user?.name || user_role || 'Staff';

    await pool.query(
      `INSERT INTO yearly_booking_records (id, booking_id, record_year, present, updated_by) VALUES (UUID(), $1, $2, $3, $4) ON DUPLICATE KEY UPDATE present = VALUES(present), updated_by = VALUES(updated_by)`,
      [req.params.id, recordYear, !!present, actualUserId]
    );

    // Audit log
    try {
      const { v4: uuidv4 } = require('uuid');
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          actualUserId,
          present ? 'Marked Present' : 'Marked Absent',
          `Attendance marked as "${present ? 'Present' : 'Absent'}" for devotee "${currentRows[0]?.name || ''}" (${recordYear}) by ${staffName}`,
          req.params.id
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for attendance toggle:', logErr.message);
    }
    
    const { rows } = await pool.query(
      `SELECT b.*, ybr.present, ybr.let_intimation, ybr.wa_status_en, ybr.wa_status_ta, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta, kt.color_key,
              u_updater.name AS attendance_marked_by
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${recordYear}
       LEFT JOIN users u_updater ON ybr.updated_by = u_updater.id
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to toggle present state' });
  }
}

// DELETE /api/bookings/:id
async function deleteBooking(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Booking not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
}

// GET /api/bookings/export
async function exportBookings(req, res) {
  try {
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : (req.query.date ? parseInt(req.query.date.split('-')[0], 10) : new Date().getFullYear());
    const { rows } = await pool.query(
      `SELECT b.*, ybr.let_intimation, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${targetYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       ORDER BY b.kattalai_month, b.kattalai_date, kt.display_order`
    );

    const headers = [
      'Country Code', 'Mobile Number', 'Contact Name', 'Office Code', 'Place', 'Title',
      'Kattalai', 'Kattalai Date', 'Kattalai Month', 'Pooja\'s Time', 'Star', 'Regn.Date',
      'Per.Add.1', 'Per.Add.2', 'Per.Add.3', 'KAT-TYPE',
      'Comm.Add.1', 'Comm.Add.2', 'Comm.Add.3', 'Comm.Add.4', 'Amount',
      'WhatsApp Number', 'Email', 'Let.Intimation'
    ];

    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const escape = (str) => {
        if (!str && str !== 0) return '""';
        return '"' + String(str).replace(/"/g, '""') + '"';
      };
      
      let poojaTime = '';
      if (row.kattalai_name && row.kattalai_name.toLowerCase().includes('uchi')) poojaTime = '11:30 AM';
      else if (row.kattalai_name && row.kattalai_name.toLowerCase().includes('artha')) poojaTime = '07:30 PM';
      
      const csvCols = [
        row.country_code || '91',
        row.mobile || '',
        row.name || '',
        row.code || '',
        row.place || '',
        row.title || '',
        row.kattalai_name || '',
        row.kattalai_date || '',
        row.kattalai_month || '',
        poojaTime,
        row.star || '',
        row.regn_date || '',
        row.per_add_1 || '', row.per_add_2 || '', row.per_add_3 || '',
        row.kat_type || '',
        row.comm_add_1 || '', row.comm_add_2 || '', row.comm_add_3 || '', row.comm_add_4 || '',
        row.amount || 0,
        row.whatsapp_number || '',
        row.email || '',
        row.let_intimation !== null ? row.let_intimation : ''
      ].map(escape);

      csvRows.push(csvCols.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings_export.csv"');
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to export bookings' });
  }
}

const getMyAttendance = async (req, res) => {
  const { code, year } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const yearCondition = year ? `AND ybr.record_year = ${parseInt(year, 10)}` : '';
    const { rows } = await pool.query(
      `SELECT b.id, b.name, kt.name as kattalai_name, CONCAT(COALESCE(ybr.record_year, YEAR(CURRENT_DATE())), '-', LPAD(b.kattalai_month, 2, '0'), '-', LPAD(b.kattalai_date, 2, '0')) as date_str, ybr.present, ybr.record_year, ybr.updated_at
       FROM bookings b
       JOIN yearly_booking_records ybr ON b.id = ybr.booking_id ${yearCondition}
       LEFT JOIN kattalai_types kt ON b.kattalai_type_id = kt.id
       WHERE b.code = $1 AND ybr.present IS NOT NULL
       ORDER BY ybr.record_year DESC, ybr.updated_at DESC`,
      [code]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [bookingsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
};

// POST /api/bookings/:id/transfer
async function transferBooking(req, res) {
  try {
    const { id } = req.params;
    const {
      title, title_ta, name, name_ta, star, star_ta, place, place_ta,
      mobile, whatsapp_number, email,
      per_add_1, per_add_2, per_add_3,
      comm_add_1, comm_add_2, comm_add_3, comm_add_4,
      payment_method, user_id
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name of son or daughter is required' });
    }

    // 1. Fetch current booking
    const { rows: bRows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (!bRows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const current = bRows[0];

    // 2. Check if already transferred
    if (current.is_transferred || current.transferred_at) {
      const transferDateStr = current.transferred_at 
        ? new Date(current.transferred_at).toISOString().slice(0, 10) 
        : 'previously';
      return res.status(400).json({ 
        error: `This account has already been transferred on ${transferDateStr} (Transferred from: ${current.transferred_from_name || 'Original Sponsor'}). 1-time transfer limit reached.`
      });
    }

    // 3. Check title eligibility
    const rawTitle = (current.title || '').trim().toLowerCase();
    const rawTitleTa = (current.title_ta || '').trim();
    const isEligibleTitle = 
      rawTitle === 'thiru' || 
      rawTitle === 'selvan' || 
      rawTitleTa === 'திரு' || 
      rawTitleTa === 'செல்வன்';

    if (!isEligibleTitle) {
      return res.status(400).json({ 
        error: 'Account transfer is only eligible for bookings under Thiru or Selvan. Accounts under Thirumathi or Selvi cannot be transferred.'
      });
    }

    // 4. Fetch dynamic base transfer amount from system_settings
    let baseTransferAmount = 3500;
    try {
      const { rows: sRows } = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'transfer_base_amount' LIMIT 1"
      );
      if (sRows.length && sRows[0].setting_value) {
        const parsed = parseFloat(sRows[0].setting_value);
        if (!isNaN(parsed) && parsed >= 0) {
          baseTransferAmount = parsed;
        }
      }
    } catch (sErr) {
      console.warn('Could not read transfer_base_amount from settings, using 3500:', sErr.message);
    }

    // 5. Calculate difference amount
    const oldPaidAmount = parseFloat(current.amount || 0);
    const differenceAmount = Math.max(0, baseTransferAmount - oldPaidAmount);

    // 6. Update booking with son/daughter details
    await pool.query(
      `UPDATE bookings SET
        title = $1, title_ta = $2,
        name = $3, name_ta = $4,
        star = $5, star_ta = $6,
        place = $7, place_ta = $8,
        mobile = $9, whatsapp_number = $10,
        email = $11,
        per_add_1 = $12, per_add_2 = $13, per_add_3 = $14,
        comm_add_1 = $15, comm_add_2 = $16, comm_add_3 = $17, comm_add_4 = $18,
        amount = $19,
        is_transferred = 1,
        transferred_at = CURRENT_TIMESTAMP,
        transferred_from_name = $20,
        transferred_from_title = $21,
        transferred_fee_paid = $22
       WHERE id = $23`,
      [
        title || current.title, title_ta || current.title_ta,
        name.trim(), name_ta ? name_ta.trim() : null,
        star || current.star, star_ta || current.star_ta,
        place || current.place, place_ta || current.place_ta,
        mobile || current.mobile, whatsapp_number || current.whatsapp_number,
        email !== undefined ? email : current.email,
        per_add_1 !== undefined ? per_add_1 : current.per_add_1,
        per_add_2 !== undefined ? per_add_2 : current.per_add_2,
        per_add_3 !== undefined ? per_add_3 : current.per_add_3,
        comm_add_1 !== undefined ? comm_add_1 : current.comm_add_1,
        comm_add_2 !== undefined ? comm_add_2 : current.comm_add_2,
        comm_add_3 !== undefined ? comm_add_3 : current.comm_add_3,
        comm_add_4 !== undefined ? comm_add_4 : current.comm_add_4,
        baseTransferAmount,
        current.name,
        current.title,
        differenceAmount,
        id
      ]
    );

    // 7. If difference fee > 0, log payment
    if (differenceAmount > 0) {
      try {
        const { v4: uuidv4 } = require('uuid');
        await pool.query(
          `INSERT INTO payments (id, booking_id, amount, method, status, created_at)
           VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP)`,
          [uuidv4(), id, differenceAmount, payment_method || 'cash']
        );
      } catch (payErr) {
        console.warn('Could not record transfer payment:', payErr.message);
      }
    }

    // 8. Log into history_logs
    try {
      const { v4: uuidv4 } = require('uuid');
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id, created_at)
         VALUES ($1, $2, 'ACCOUNT_TRANSFER', $3, $4, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          user_id || req.user?.id || null,
          `1-time account transfer from ${current.title || ''} ${current.name} to ${title || ''} ${name}. Base rate: ₹${baseTransferAmount}, Previous paid: ₹${oldPaidAmount}, Difference collected: ₹${differenceAmount}.`,
          id
        ]
      );
    } catch (hErr) {
      console.warn('Could not record history log:', hErr.message);
    }

    // Fetch and return the updated booking
    const { rows: updatedRows } = await pool.query(
      `SELECT b.*, kt.name AS kattalai_name, kt.color_key
       FROM bookings b
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE b.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Account transferred successfully',
      differenceAmount,
      baseTransferAmount,
      booking: updatedRows[0]
    });
  } catch (err) {
    console.error('Error [bookingsController.transferBooking]:', err.stack || err);
    res.status(500).json({ error: 'Failed to transfer booking', details: err.message });
  }
}

module.exports = {
  listBookings, getBooking, createBooking, updateBooking, togglePresent, deleteBooking, exportBookings, getMyAttendance, transferBooking
};
