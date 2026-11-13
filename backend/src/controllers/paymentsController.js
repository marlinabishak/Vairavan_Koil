const pool = require('../db/pool');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// POST /api/payments  Body: { booking_id, amount, method, transaction_ref }
// This backs the "Pay Now" button in the booking modal.
async function createPayment(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { booking_id, amount, method, transaction_ref } = req.body;
  if (!booking_id || !amount) {
    return res.status(400).json({ error: 'booking_id and amount are required' });
  }
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO payments (id, booking_id, amount, method, transaction_ref, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,'paid', CURRENT_TIMESTAMP)`,
      [id, booking_id, amount, method || 'cash', transaction_ref || null]
    );
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);

    // Record audit log in history_logs for Finance & Treasury tab
    try {
      const { rows: bRows } = await pool.query('SELECT name, code FROM bookings WHERE id = $1', [booking_id]);
      const bName = bRows[0]?.name || 'Devotee';
      const bCode = bRows[0]?.code ? ` (Office Code: ${bRows[0].code})` : '';
      let staffUserId = null;
      if (req.user && req.user.role !== 'user' && req.user.id) {
        const { rows: uRows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
        if (uRows.length > 0) staffUserId = req.user.id;
      }
      await pool.query(
        `INSERT INTO history_logs (id, user_id, booking_id, action, details) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          staffUserId,
          booking_id,
          'Recorded Payment',
          `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded via ${(method || 'cash').toUpperCase()}${transaction_ref ? ` (Ref: ${transaction_ref})` : ''} for devotee "${bName}"${bCode}.`
        ]
      );
    } catch (logErr) {
      console.warn('Payment audit log warning:', logErr.message);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [paymentsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
}

// GET /api/payments/booking/:bookingId
async function getPaymentsForBooking(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [req.params.bookingId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [paymentsController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

async function createRazorpayOrder(req, res) {
  const { booking_id, amount } = req.body;
  if (!booking_id || !amount) {
    return res.status(400).json({ error: 'booking_id and amount are required' });
  }

  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_${booking_id}`,
  };

  try {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id') {
      return res.json({
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `receipt_${booking_id}`,
        status: "created",
        is_mock: true
      });
    }
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.warn('Razorpay order fallback to mock order:', err.message);
    res.json({
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${booking_id}`,
      status: "created",
      is_mock: true
    });
  }
}

async function verifyRazorpaySignature(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id, amount } = req.body;

  const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update((razorpay_order_id || '') + "|" + (razorpay_payment_id || ''))
    .digest('hex');

  if (isMock || expectedSignature === razorpay_signature) {
    try {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO payments (id, booking_id, amount, method, transaction_ref, status, paid_at)
         VALUES ($1,$2,$3,$4,$5,'paid', CURRENT_TIMESTAMP)`,
        [id, booking_id, amount, isMock ? 'mock_online' : 'razorpay', razorpay_payment_id || `pay_${Date.now()}`]
      );
      const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);

      // Record audit log in history_logs for Finance & Treasury tab
      try {
        const { rows: bRows } = await pool.query('SELECT name, code FROM bookings WHERE id = $1', [booking_id]);
        const bName = bRows[0]?.name || 'Devotee';
        const bCode = bRows[0]?.code ? ` (Office Code: ${bRows[0].code})` : '';
        let staffUserId = null;
        if (req.user && req.user.role !== 'user' && req.user.id) {
          const { rows: uRows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
          if (uRows.length > 0) staffUserId = req.user.id;
        }
        await pool.query(
          `INSERT INTO history_logs (id, user_id, booking_id, action, details) VALUES ($1, $2, $3, $4, $5)`,
          [
            uuidv4(),
            staffUserId,
            booking_id,
            'Recorded Payment',
            `Online Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} successfully verified via RAZORPAY (Payment ID: ${razorpay_payment_id}) for devotee "${bName}"${bCode}.`
          ]
        );
      } catch (logErr) {
        console.warn('Online payment audit log warning:', logErr.message);
      }

      return res.json({ success: true, payment: rows[0] });
    } catch (err) {
      console.error('Error [verifyRazorpaySignature]:', err);
      return res.status(500).json({ error: 'Payment verified but failed to record in DB' });
    }
  } else {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }
}

module.exports = { createPayment, getPaymentsForBooking, createRazorpayOrder, verifyRazorpaySignature };
