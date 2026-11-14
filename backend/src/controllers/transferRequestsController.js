const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

let tableEnsured = false;
async function ensureTransferRequestsTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transfer_requests (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        booking_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) DEFAULT NULL,
        title VARCHAR(40) DEFAULT 'Selvan',
        title_ta VARCHAR(40) DEFAULT NULL,
        name VARCHAR(160) NOT NULL,
        name_ta VARCHAR(160) DEFAULT NULL,
        star VARCHAR(50) DEFAULT NULL,
        star_ta VARCHAR(50) DEFAULT NULL,
        place VARCHAR(100) DEFAULT NULL,
        place_ta VARCHAR(100) DEFAULT NULL,
        country_code VARCHAR(10) DEFAULT '91',
        mobile VARCHAR(30) DEFAULT NULL,
        whatsapp_number VARCHAR(30) DEFAULT NULL,
        email VARCHAR(160) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        payment_method VARCHAR(40) DEFAULT 'cash',
        payment_status VARCHAR(40) DEFAULT 'paid',
        payment_id VARCHAR(100) DEFAULT NULL,
        fee_amount NUMERIC(10,2) DEFAULT 200,
        comments TEXT DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        approved_by_id VARCHAR(36) DEFAULT NULL,
        approved_by_name VARCHAR(160) DEFAULT NULL,
        approved_by_role VARCHAR(40) DEFAULT NULL,
        approved_at TIMESTAMP NULL DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    // Ensure consistent charset & collation with bookings table
    await pool.query(`ALTER TABLE transfer_requests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`).catch(() => {});
    // Ensure new columns exist if table was already created
    await pool.query(`ALTER TABLE transfer_requests ADD COLUMN payment_status VARCHAR(40) DEFAULT 'paid'`).catch(() => {});
    await pool.query(`ALTER TABLE transfer_requests ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL`).catch(() => {});
    await pool.query(`ALTER TABLE transfer_requests ADD COLUMN fee_amount DECIMAL(10,2) DEFAULT 200`).catch(() => {});
    tableEnsured = true;
  } catch (err) {
    console.error('Error ensuring transfer_requests table:', err.message);
  }
}

// GET /api/transfer-requests
async function getTransferRequests(req, res) {
  await ensureTransferRequestsTable();
  try {
    const { status } = req.query;
    let query = `
      SELECT tr.*, 
             b.name AS booking_name, 
             b.title AS booking_title,
             b.code AS booking_code, 
             b.star AS booking_star,
             b.place AS booking_place,
             b.kattalai_date, 
             b.amount AS booking_amount,
             b.is_transferred AS booking_is_transferred,
             b.transferred_at AS booking_transferred_at,
             kt.name AS kattalai_name,
             kt.color_key
      FROM transfer_requests tr
      JOIN bookings b ON tr.booking_id = b.id
      LEFT JOIN kattalai_types kt ON b.kattalai_type_id = kt.id
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` WHERE tr.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY tr.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error [transferRequestsController.getTransferRequests]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch transfer requests' });
  }
}

// GET /api/transfer-requests/booking/:booking_id
async function getBookingTransferRequest(req, res) {
  await ensureTransferRequestsTable();
  try {
    const { rows } = await pool.query(
      `SELECT * FROM transfer_requests WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.booking_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Error [transferRequestsController.getBookingTransferRequest]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch booking transfer request' });
  }
}

// POST /api/transfer-requests
async function createTransferRequest(req, res) {
  await ensureTransferRequestsTable();
  try {
    const {
      booking_id,
      title = 'Selvan',
      title_ta = '',
      name,
      name_ta = '',
      star = '',
      star_ta = '',
      place = '',
      place_ta = '',
      country_code = '91',
      mobile = '',
      whatsapp_number = '',
      email = '',
      address = '',
      payment_method = 'cash',
      payment_status = 'paid',
      payment_id = null,
      fee_amount = 200,
      comments = '',
      execute_now = false
    } = req.body;

    const effectiveFee = parseFloat(fee_amount) || 200;
    const effectivePayStatus = payment_status || 'paid';
    const effectivePayId = payment_id || null;

    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Child's name is required" });
    }

    let cleanMobile = (mobile || '').replace(/\D/g, '');
    if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) cleanMobile = cleanMobile.slice(2);
    else if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) cleanMobile = cleanMobile.slice(1);
    if (!cleanMobile) {
      return res.status(400).json({ error: 'Mobile number for child is required' });
    }
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        error: `Invalid Mobile Number: India (+91) mobile number must be exactly 10 digits (received ${cleanMobile.length} digits).`
      });
    }

    if (whatsapp_number && String(whatsapp_number).trim()) {
      let cleanWa = String(whatsapp_number).replace(/\D/g, '');
      const cc = String(country_code || '91').replace(/\D/g, '');
      if (cc === '91') {
        if (cleanWa.length === 12 && cleanWa.startsWith('91')) cleanWa = cleanWa.slice(2);
        else if (cleanWa.length === 11 && cleanWa.startsWith('0')) cleanWa = cleanWa.slice(1);
        if (cleanWa.length !== 10) {
          return res.status(400).json({
            error: `Invalid WhatsApp Number: India (+91) WhatsApp number must be exactly 10 digits (received ${cleanWa.length} digits).`
          });
        }
      } else if (cleanWa.length < 6 || cleanWa.length > 15) {
        return res.status(400).json({
          error: `Invalid WhatsApp Number: Foreign WhatsApp number must be between 6 and 15 digits (received ${cleanWa.length} digits).`
        });
      }
    }

    if (email && String(email).trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(email).trim())) {
        return res.status(400).json({ error: 'Invalid Email Address format.' });
      }
    }

    // 1. Verify existing booking
    const { rows: bRows } = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [booking_id]
    );
    if (!bRows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const current = bRows[0];

    // 2. Check 1-time transfer rule
    if (current.is_transferred || current.transferred_at) {
      const transferDateStr = current.transferred_at 
        ? new Date(current.transferred_at).toISOString().slice(0, 10) 
        : 'Record';
      return res.status(400).json({
        error: `This account has already been transferred on ${transferDateStr} (Transferred from: ${current.transferred_from_name || 'Original Sponsor'}). 1-time transfer limit reached.`
      });
    }

    // 3. Lineage eligibility: Thiru / Selvan
    const rawTitle = (current.title || '').trim().toLowerCase();
    const rawTitleTa = (current.title_ta || '').trim();
    const isMaleTitle = rawTitle === 'thiru' || rawTitle === 'selvan' || rawTitleTa === 'திரு' || rawTitleTa === 'செல்வன்';
    if (!isMaleTitle) {
      return res.status(400).json({
        error: 'Account transfer is only eligible for bookings under Thiru or Selvan. Accounts under Thirumathi or Selvi cannot be transferred.'
      });
    }

    const isAdminOrSuper = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    // If Admin/Superadmin chose to execute directly
    if (isAdminOrSuper && execute_now) {
      const countryCodeVal = String(country_code || '91').replace(/\D/g, '');
      
      // Update booking directly
      await pool.query(
        `UPDATE bookings SET
          title = $1, title_ta = $2,
          name = $3, name_ta = $4,
          star = $5, star_ta = $6,
          place = $7, place_ta = $8,
          mobile = $9, whatsapp_number = $10,
          country_code = $11,
          email = $12,
          per_add_1 = $13, per_add_2 = $14, per_add_3 = $15,
          comm_add_1 = $16, comm_add_2 = $17, comm_add_3 = $18, comm_add_4 = $19,
          amount = $20,
          kat_type = 'Inheritance',
          is_transferred = 1,
          transferred_at = CURRENT_TIMESTAMP,
          transferred_from_name = $21,
          transferred_from_title = $22,
          transferred_fee_paid = 0
         WHERE id = $23`,
        [
          title || current.title, title_ta || current.title_ta,
          name.trim(), name_ta ? name_ta.trim() : null,
          star || current.star, star_ta || current.star_ta,
          place || current.place, place_ta || current.place_ta,
          mobile || current.mobile, whatsapp_number || current.whatsapp_number,
          countryCodeVal,
          email !== undefined ? email : current.email,
          address || current.per_add_1, current.per_add_2, current.per_add_3,
          address || current.comm_add_1, current.comm_add_2, current.comm_add_3, current.comm_add_4,
          current.amount,
          current.name,
          current.title,
          booking_id
        ]
      );

      // Record approved request entry
      const requestId = uuidv4();
      await pool.query(
        `INSERT INTO transfer_requests (
          id, booking_id, user_id, title, title_ta, name, name_ta,
          star, star_ta, place, place_ta, country_code, mobile,
          whatsapp_number, email, address, payment_method, payment_status, payment_id, fee_amount, comments,
          status, approved_by_id, approved_by_name, approved_by_role, approved_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21,
          'approved', $22, $23, $24, CURRENT_TIMESTAMP
        )`,
        [
          requestId, booking_id, req.user?.id || null,
          title, title_ta, name.trim(), name_ta ? name_ta.trim() : null,
          star, star_ta, place, place_ta, countryCodeVal, mobile,
          whatsapp_number, email, address, payment_method, effectivePayStatus, effectivePayId, effectiveFee, comments,
          req.user?.id || null, req.user?.name || 'Administrator', req.user?.role || 'admin'
        ]
      );

      // Audit log
      try {
        await pool.query(
          `INSERT INTO history_logs (id, user_id, action, details, booking_id, created_at)
           VALUES ($1, $2, 'ACCOUNT_TRANSFER', $3, $4, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            req.user?.id || null,
            `1-time account transfer for devotee "${current.name}" (${current.code}) to "${title || ''} ${name.trim()}" was executed and APPROVED by ${req.user?.name || 'Administrator'} [${req.user?.role || 'admin'}]. Payment: ₹${effectiveFee} (${(payment_method || 'Cash').toUpperCase()}).`,
            booking_id
          ]
        );
      } catch (logErr) {
        console.error('Audit log failed for transfer execution:', logErr.message);
      }

      const { rows: updatedRows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
      return res.status(200).json({
        success: true,
        message: 'Account transferred and approved successfully by administration.',
        booking: updatedRows[0]
      });
    }

    // Otherwise, create a pending transfer request (Devotee or Admin draft)
    // Check if an existing pending request exists; if so, replace/update it
    await pool.query(
      `DELETE FROM transfer_requests WHERE booking_id = $1 AND status = 'pending'`,
      [booking_id]
    );

    const requestId = uuidv4();
    await pool.query(
      `INSERT INTO transfer_requests (
        id, booking_id, user_id, title, title_ta, name, name_ta,
        star, star_ta, place, place_ta, country_code, mobile,
        whatsapp_number, email, address, payment_method, payment_status, payment_id, fee_amount, comments, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, 'pending'
      )`,
      [
        requestId, booking_id, req.user?.id || null,
        title, title_ta, name.trim(), name_ta ? name_ta.trim() : null,
        star, star_ta, place, place_ta, country_code || '91', mobile,
        whatsapp_number, email, address, payment_method || 'cash', effectivePayStatus, effectivePayId, effectiveFee, comments
      ]
    );

    // Audit log
    try {
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id, created_at)
         VALUES ($1, $2, 'REQUESTED_TRANSFER', $3, $4, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          req.user?.id || null,
          `Devotee "${current.name}" (${current.code}) submitted an account transfer request to "${title || 'Selvan'} ${name.trim()}" (Payment: ₹${effectiveFee} via ${(payment_method || 'UPI').toUpperCase()}${effectivePayId ? `, Ref: ${effectivePayId}` : ''}).`,
          booking_id
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for transfer request:', logErr.message);
    }

    const { rows: newReqRows } = await pool.query(
      `SELECT * FROM transfer_requests WHERE id = $1`,
      [requestId]
    );

    res.status(201).json({
      success: true,
      message: 'Account transfer request submitted successfully. Pending temple administration approval.',
      request: newReqRows[0]
    });
  } catch (err) {
    console.error('Error [transferRequestsController.createTransferRequest]:', err.stack || err);
    res.status(500).json({ error: 'Failed to submit account transfer request', details: err.message });
  }
}

// POST /api/transfer-requests/:id/approve
async function approveTransferRequest(req, res) {
  await ensureTransferRequestsTable();
  try {
    const { id } = req.params;
    const { rows: reqRows } = await pool.query(
      `SELECT * FROM transfer_requests WHERE id = $1`,
      [id]
    );
    if (!reqRows.length) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }
    const transferReq = reqRows[0];
    if (transferReq.status === 'approved') {
      return res.status(400).json({ error: 'This transfer request has already been approved' });
    }

    // Fetch existing booking
    const { rows: bRows } = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [transferReq.booking_id]
    );
    if (!bRows.length) {
      return res.status(404).json({ error: 'Associated booking not found' });
    }
    const current = bRows[0];

    const staffName = req.user?.name || 'Administrator';
    const staffRole = req.user?.role || 'admin';
    const staffId = req.user?.id || null;
    const countryCodeVal = String(transferReq.country_code || '91').replace(/\D/g, '');

    // 1. Update the booking with new successor details
    await pool.query(
      `UPDATE bookings SET
        title = $1, title_ta = $2,
        name = $3, name_ta = $4,
        star = $5, star_ta = $6,
        place = $7, place_ta = $8,
        mobile = $9, whatsapp_number = $10,
        country_code = $11,
        email = $12,
        per_add_1 = $13, per_add_2 = $14, per_add_3 = $15,
        comm_add_1 = $16, comm_add_2 = $17, comm_add_3 = $18, comm_add_4 = $19,
        amount = $20,
        kat_type = 'Inheritance',
        is_transferred = 1,
        transferred_at = CURRENT_TIMESTAMP,
        transferred_from_name = $21,
        transferred_from_title = $22,
        transferred_fee_paid = $24
       WHERE id = $23`,
      [
        transferReq.title || current.title, transferReq.title_ta || current.title_ta,
        transferReq.name.trim(), transferReq.name_ta ? transferReq.name_ta.trim() : null,
        transferReq.star || current.star, transferReq.star_ta || current.star_ta,
        transferReq.place || current.place, transferReq.place_ta || current.place_ta,
        transferReq.mobile || current.mobile, transferReq.whatsapp_number || current.whatsapp_number,
        countryCodeVal,
        transferReq.email !== undefined ? transferReq.email : current.email,
        transferReq.address || current.per_add_1, current.per_add_2, current.per_add_3,
        transferReq.address || current.comm_add_1, current.comm_add_2, current.comm_add_3, current.comm_add_4,
        current.amount,
        current.name,
        current.title,
        transferReq.booking_id,
        transferReq.fee_amount || 200
      ]
    );

    // 2. Mark transfer_requests as approved
    await pool.query(
      `UPDATE transfer_requests SET
        status = 'approved',
        approved_by_id = $1,
        approved_by_name = $2,
        approved_by_role = $3,
        approved_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [staffId, staffName, staffRole, id]
    );

    // 3. Log into history_logs
    try {
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id, created_at)
         VALUES ($1, $2, 'ACCOUNT_TRANSFER', $3, $4, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          staffId,
          `Account transfer for devotee "${current.name}" (${current.code}) to "${transferReq.title || ''} ${transferReq.name}" was APPROVED by ${staffName} [${staffRole}]. Fee: ₹${transferReq.fee_amount || 200} (${(transferReq.payment_method || 'Cash').toUpperCase()}).`,
          transferReq.booking_id
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for transfer approval:', logErr.message);
    }

    const { rows: updatedReq } = await pool.query('SELECT * FROM transfer_requests WHERE id = $1', [id]);
    const { rows: updatedBooking } = await pool.query('SELECT * FROM bookings WHERE id = $1', [transferReq.booking_id]);

    res.json({
      success: true,
      message: `Account transfer approved successfully by ${staffName}`,
      request: updatedReq[0],
      booking: updatedBooking[0]
    });
  } catch (err) {
    console.error('Error [transferRequestsController.approveTransferRequest]:', err.stack || err);
    res.status(500).json({ error: 'Failed to approve transfer request', details: err.message });
  }
}

// POST /api/transfer-requests/:id/reject
async function rejectTransferRequest(req, res) {
  await ensureTransferRequestsTable();
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const { rows: reqRows } = await pool.query(
      `SELECT * FROM transfer_requests WHERE id = $1`,
      [id]
    );
    if (!reqRows.length) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }
    const transferReq = reqRows[0];

    const staffName = req.user?.name || 'Administrator';
    const staffRole = req.user?.role || 'admin';
    const staffId = req.user?.id || null;

    await pool.query(
      `UPDATE transfer_requests SET
        status = 'rejected',
        rejection_reason = $1,
        approved_by_id = $2,
        approved_by_name = $3,
        approved_by_role = $4,
        approved_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [reason, staffId, staffName, staffRole, id]
    );

    // Audit log
    try {
      const { rows: bRows } = await pool.query('SELECT name, code FROM bookings WHERE id = $1', [transferReq.booking_id]);
      const bName = bRows[0]?.name || '';
      const bCode = bRows[0]?.code || '';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id, created_at)
         VALUES ($1, $2, 'Rejected Transfer Request', $3, $4, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          staffId,
          `Account transfer request for devotee "${bName}" (${bCode}) to "${transferReq.title || ''} ${transferReq.name}" was REJECTED by ${staffName} [${staffRole}]. Reason: ${reason || 'Not specified'}.`,
          transferReq.booking_id
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for transfer rejection:', logErr.message);
    }

    const { rows: updatedReq } = await pool.query('SELECT * FROM transfer_requests WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Account transfer request rejected',
      request: updatedReq[0]
    });
  } catch (err) {
    console.error('Error [transferRequestsController.rejectTransferRequest]:', err.stack || err);
    res.status(500).json({ error: 'Failed to reject transfer request', details: err.message });
  }
}

module.exports = {
  getTransferRequests,
  getBookingTransferRequest,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest
};
