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
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error [createRazorpayOrder]:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
}

async function verifyRazorpaySignature(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id, amount } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    try {
      const id = uuidv4();
      // Payment verified successfully, record the payment in the DB
      await pool.query(
        `INSERT INTO payments (id, booking_id, amount, method, transaction_ref, status, paid_at)
         VALUES ($1,$2,$3,'razorpay',$4,'paid', CURRENT_TIMESTAMP)`,
        [id, booking_id, amount, razorpay_payment_id]
      );
      const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
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
