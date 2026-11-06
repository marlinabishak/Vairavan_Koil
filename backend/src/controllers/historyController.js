const pool = require('../db/pool');

// Category mapping helper
function getActionCategory(action) {
  if (!action) return 'general';
  if (action === 'Created Booking') return 'registrations';
  if (action === 'Updated Devotee' || action.includes('Kattalai')) return 'updates';
  if (action.includes('Present') || action.includes('Absent') || action.includes('Attendance')) return 'attendance';
  if (action.includes('WhatsApp')) return 'whatsapp';
  if (action.includes('Printed Labels') || action.includes('Print')) return 'printing';
  if (action.includes('TRANSFER') || action.includes('Edit Request') || action === 'REQUESTED_EDIT') return 'transfers_requests';
  if (action.includes('Staff Profile') || action.includes('Panchangam') || action.includes('User') || action.includes('Power User')) return 'staff';
  return 'general';
}

const categoryConditions = {
  registrations: `h.action IN ('Created Booking')`,
  updates: `(h.action IN ('Updated Devotee') OR h.action LIKE '%Kattalai%')`,
  attendance: `(h.action LIKE '%Present%' OR h.action LIKE '%Absent%' OR h.action LIKE '%Attendance%')`,
  whatsapp: `h.action LIKE '%WhatsApp%'`,
  printing: `(h.action LIKE '%Printed%' OR h.action LIKE '%Print%')`,
  transfers_requests: `(h.action = 'ACCOUNT_TRANSFER' OR h.action LIKE '%Edit Request%' OR h.action = 'REQUESTED_EDIT')`,
  staff: `(h.action LIKE '%Staff Profile%' OR h.action LIKE '%Panchangam%' OR h.action LIKE '%User%' OR h.action LIKE '%Power User%')`
};

// GET /api/history
async function listHistory(req, res) {
  try {
    const { 
      booking_id, 
      category = 'all', 
      fromDate, 
      toDate, 
      search = '',
      page = 1, 
      limit = 10 
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    const whereClauses = [];
    const params = [];

    // Devotee filtering if booking_id provided, or strictly enforced if caller is a devotee ('user')
    const effectiveBookingId = (req.user && req.user.role === 'user') ? req.user.id : booking_id;

    if (effectiveBookingId) {
      const { rows: bRows } = await pool.query('SELECT code, mobile FROM bookings WHERE id = $1', [effectiveBookingId]);
      if (bRows.length > 0) {
        const { code, mobile } = bRows[0];
        if (code) {
          whereClauses.push(`h.booking_id IN (SELECT id FROM bookings WHERE code = $${params.length + 1})`);
          params.push(code);
        } else if (mobile) {
          whereClauses.push(`h.booking_id IN (SELECT id FROM bookings WHERE mobile = $${params.length + 1})`);
          params.push(mobile);
        } else {
          whereClauses.push(`h.booking_id = $${params.length + 1}`);
          params.push(booking_id);
        }
      } else {
        whereClauses.push(`h.booking_id = $${params.length + 1}`);
        params.push(booking_id);
      }
    }

    // Date range filters
    if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      whereClauses.push(`h.created_at >= $${params.length + 1}`);
      params.push(`${fromDate} 00:00:00`);
    }
    if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      whereClauses.push(`h.created_at <= $${params.length + 1}`);
      params.push(`${toDate} 23:59:59`);
    }

    // Live search filter
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const pIdx = params.length + 1;
      whereClauses.push(`(
        h.action LIKE $${pIdx} OR 
        h.details LIKE $${pIdx} OR 
        u.name LIKE $${pIdx} OR 
        u.email LIKE $${pIdx} OR 
        b.name LIKE $${pIdx} OR 
        b.code LIKE $${pIdx}
      )`);
      params.push(term);
    }

    // Base WHERE clause before category filtering (for counting categories)
    const baseWhereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Calculate category breakdown counts for tabs with current date & search filters applied
    const countSelects = [
      `COUNT(*) as all_count`,
      `SUM(CASE WHEN ${categoryConditions.registrations} THEN 1 ELSE 0 END) as registrations_count`,
      `SUM(CASE WHEN ${categoryConditions.updates} THEN 1 ELSE 0 END) as updates_count`,
      `SUM(CASE WHEN ${categoryConditions.attendance} THEN 1 ELSE 0 END) as attendance_count`,
      `SUM(CASE WHEN ${categoryConditions.whatsapp} THEN 1 ELSE 0 END) as whatsapp_count`,
      `SUM(CASE WHEN ${categoryConditions.printing} THEN 1 ELSE 0 END) as printing_count`,
      `SUM(CASE WHEN ${categoryConditions.transfers_requests} THEN 1 ELSE 0 END) as transfers_requests_count`,
      `SUM(CASE WHEN ${categoryConditions.staff} THEN 1 ELSE 0 END) as staff_count`
    ];

    const countQuery = `
      SELECT ${countSelects.join(', ')}
      FROM history_logs h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN bookings b ON h.booking_id = b.id
      ${baseWhereSql}
    `;
    const { rows: countRows } = await pool.query(countQuery, params);
    const counts = countRows[0] || {};

    const categoryCounts = {
      all: parseInt(counts.all_count || 0, 10),
      registrations: parseInt(counts.registrations_count || 0, 10),
      updates: parseInt(counts.updates_count || 0, 10),
      attendance: parseInt(counts.attendance_count || 0, 10),
      whatsapp: parseInt(counts.whatsapp_count || 0, 10),
      printing: parseInt(counts.printing_count || 0, 10),
      transfers_requests: parseInt(counts.transfers_requests_count || 0, 10),
      staff: parseInt(counts.staff_count || 0, 10)
    };

    // Apply specific category filter if selected
    const queryParams = [...params];
    const categoryWhereClauses = [...whereClauses];

    if (category && category !== 'all' && categoryConditions[category]) {
      categoryWhereClauses.push(categoryConditions[category]);
    }

    const finalWhereSql = categoryWhereClauses.length > 0 ? `WHERE ${categoryWhereClauses.join(' AND ')}` : '';

    // Total count for current category filter
    const total = category === 'all' 
      ? categoryCounts.all 
      : (categoryCounts[category] || 0);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    // Fetch paginated rows with rich user & booking information
    const dataQuery = `
      SELECT 
        h.id,
        h.user_id,
        h.action,
        h.details,
        h.booking_id,
        h.created_at,
        u.name as user_name,
        u.email as user_username,
        u.role as user_role,
        b.name as booking_name,
        b.code as booking_code,
        b.mobile as booking_mobile,
        b.kattalai_date,
        b.kattalai_month,
        CONCAT(YEAR(h.created_at), '-', LPAD(b.kattalai_month, 2, '0'), '-', LPAD(b.kattalai_date, 2, '0')) as booking_date
      FROM history_logs h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN bookings b ON h.booking_id = b.id
      ${finalWhereSql}
      ORDER BY h.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `;

    const { rows } = await pool.query(dataQuery, queryParams);

    const enrichedLogs = rows.map(r => ({
      ...r,
      category: getActionCategory(r.action)
    }));

    res.json({
      logs: enrichedLogs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages
      },
      categoryCounts
    });
  } catch (err) {
    console.error('Error [historyController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

// Helper for English ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// GET /api/history/print-status?target_date=24+Sep+2026
async function getPrintStatus(req, res) {
  try {
    const rawDate = (req.query.target_date || req.query.date || '').trim();
    if (!rawDate) {
      return res.json({ print_count: 0, next_print_number: 1, history: [] });
    }

    const { rows: history } = await pool.query(
      `SELECT id, user_id, user_name, user_role, target_date, list_title, devotee_count, print_number, created_at
       FROM print_records
       WHERE LOWER(TRIM(target_date)) = LOWER(TRIM($1))
       ORDER BY print_number ASC`,
      [rawDate]
    );

    res.json({
      target_date: rawDate,
      print_count: history.length,
      next_print_number: history.length + 1,
      history
    });
  } catch (err) {
    console.error('Error [getPrintStatus]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch print status', details: err.message });
  }
}

// POST /api/history/print-log
async function logPrintRecord(req, res) {
  const { v4: uuidv4 } = require('uuid');
  try {
    const { 
      target_date, 
      list_title = 'Viboothi to be sent to', 
      devotee_count = 0, 
      devotee_names = '' 
    } = req.body;

    const normalizedDate = (target_date || '').trim() || 'General';

    const userId = req.user?.id || req.body.user_id || null;
    const userName = req.user?.name || req.body.user_name || (userId ? 'Staff' : 'Administrator');
    const userRole = req.user?.role || req.body.user_role || 'admin';

    // Query existing prints for this exact target date
    const { rows: previousPrints } = await pool.query(
      `SELECT print_number, user_name, user_role, created_at
       FROM print_records
       WHERE LOWER(TRIM(target_date)) = LOWER(TRIM($1))
       ORDER BY print_number ASC`,
      [normalizedDate]
    );

    const printNumber = previousPrints.length + 1;

    let details = '';
    const devoteesStr = devotee_names ? ` Devotees: ${devotee_names}.` : '';

    if (printNumber === 1) {
      details = `1st time printed by ${userName} [${userRole}] for Date: ${normalizedDate} (${devotee_count} Prasatham letters).${devoteesStr}`;
    } else if (printNumber === 2) {
      const first = previousPrints[0];
      details = `2nd time printed by ${userName} [${userRole}] for Date: ${normalizedDate} (${devotee_count} Prasatham letters). 1st time printed by ${first.user_name} [${first.user_role}].${devoteesStr}`;
    } else {
      const first = previousPrints[0];
      const last = previousPrints[previousPrints.length - 1];
      details = `${getOrdinal(printNumber)} time printed by ${userName} [${userRole}] for Date: ${normalizedDate} (${devotee_count} Prasatham letters). Previously printed ${previousPrints.length} times (1st: ${first.user_name} [${first.user_role}], Last: ${last.user_name} [${last.user_role}]).${devoteesStr}`;
    }

    const recordId = uuidv4();

    // 1. Insert into print_records table
    await pool.query(
      `INSERT INTO print_records (id, user_id, user_name, user_role, target_date, list_title, devotee_count, devotee_names, print_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [recordId, userId, userName, userRole, normalizedDate, list_title, devotee_count, devotee_names || '', printNumber]
    );

    // 2. Insert into history_logs table
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, 'Printed Labels', details]
    );

    res.status(201).json({
      success: true,
      print_number: printNumber,
      ordinal: getOrdinal(printNumber),
      details,
      previous_prints: previousPrints
    });
  } catch (err) {
    console.error('Error [logPrintRecord]:', err.stack || err);
    res.status(500).json({ error: 'Failed to record print log', details: err.message });
  }
}

// POST /api/history
// Body: { user_id, action, details, booking_id }
async function createHistoryLog(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { user_id, action, details, booking_id, target_date, devotee_count, devotee_names, list_title } = req.body;

  // If this is a print action and target_date is provided, delegate to structured print tracking
  if (action === 'Printed Labels' && target_date) {
    return logPrintRecord(req, res);
  }

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
  createHistoryLog,
  getPrintStatus,
  logPrintRecord
};
