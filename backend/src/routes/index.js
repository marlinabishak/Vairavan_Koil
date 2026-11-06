const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const bookings = require('../controllers/bookingsController');
const kattalaiTypes = require('../controllers/kattalaiTypesController');
const todos = require('../controllers/todosController');
const panchangam = require('../controllers/panchangamController');
const payments = require('../controllers/paymentsController');
const auth = require('../controllers/authController');
const history = require('../controllers/historyController');
const requestsController = require('../controllers/requestsController');
const dropdownController = require('../controllers/dropdownController');
const usersController = require('../controllers/usersController');
const settingsController = require('../controllers/settingsController');
const powerUsersController = require('../controllers/powerUsersController');
const kattalaiDeletionController = require('../controllers/kattalaiDeletionController');
const bugReportsController = require('../controllers/bugReportsController');
const whatsappRoutes = require('./whatsappRoutes');
const authenticateToken = require('../middleware/authMiddleware');

// Rate limiting for auth routes to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 100, // Reasonable threshold preventing accidental IP lockouts
  skip: (req) => process.env.NODE_ENV === 'test' || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// PUBLIC ROUTES
router.post('/auth/login', loginLimiter, auth.login);

router.get('/my-ip', (req, res) => {
  const https = require('https');
  https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => res.type('json').send(data));
  }).on('error', err => res.status(500).json({ error: err.message }));
});

router.get('/diagnose', async (req, res) => {
  const net = require('net');
  const pool = require('../db/pool');
  const host = (process.env.DB_HOST || '').trim();
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  const testTcp = (targetHost) => new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host: targetHost, port, timeout: 5000 });
    socket.on('connect', () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve({ success: true, ms: `${ms}ms` });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'TCP Socket Timeout (5s)' });
    });
    socket.on('error', (err) => {
      resolve({ success: false, error: err.message, code: err.code });
    });
  });

  const tcpPingHost = await testTcp(host);
  const tcpPingDomain = await testTcp('srv443.hstgr.io');

  let dbResult = null;
  try {
    const rows = await pool.query('SELECT 1 as test');
    dbResult = { success: true, rows };
  } catch (err) {
    dbResult = { success: false, error: err.message, code: err.code };
  }

  res.json({
    env: { host, port, user: process.env.DB_USER, database: process.env.DB_NAME },
    tcpToDbHost: tcpPingHost,
    tcpToDomain: tcpPingDomain,
    queryResult: dbResult
  });
});

// Optional authentication middleware to identify devotees vs staff vs public
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) req.user = user;
    next();
  });
};

// Public & semi-public routes
router.get('/kattalai-types', kattalaiTypes.listKattalaiTypes);
router.get('/dropdown-options', dropdownController.getOptions);
router.get('/settings', settingsController.getSettings);
router.get('/bookings/search', optionalAuth, bookings.searchBookings);
router.get('/bookings/code/:code', optionalAuth, bookings.getBookingByCode);
router.get('/bookings', optionalAuth, bookings.listBookings);
router.get('/todos', todos.listTodos); // Needed to render dashboard todo structure
router.post('/bookings', bookings.createBooking); // Needed for public registration

// Razorpay endpoints must be public so devotees can pay during signup
router.post('/payments/razorpay/create-order', payments.createRazorpayOrder);
router.post('/payments/razorpay/verify', payments.verifyRazorpaySignature);

// Panchangam read is public (Tamil calendar almanac)
router.get('/panchangam/:date', panchangam.getPanchangam);

router.get('/history', optionalAuth, history.listHistory);
router.post('/history', optionalAuth, history.createHistoryLog);
router.get('/history/print-status', optionalAuth, history.getPrintStatus);
router.post('/history/print-log', optionalAuth, history.logPrintRecord);

// Bug & Issue Reporting (Available to all roles)
router.post('/bug-reports', optionalAuth, bugReportsController.upload.array('screenshots', 5), bugReportsController.createBugReport);
router.get('/bug-reports', optionalAuth, bugReportsController.listBugReports);

// PROTECTED ROUTES (Require JWT)
router.use(authenticateToken);

// Change password for logged in user (Devotee or Staff)
router.post('/auth/change-password', auth.changePassword);

// Bug status update (Staff only)
router.patch('/bug-reports/:id/status', bugReportsController.updateBugReportStatus);

router.use('/whatsapp', whatsappRoutes);

// Staff User & Role Management (Superadmin only)
router.get('/users', usersController.listUsers);
router.post('/users', usersController.createUser);
router.patch('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deleteUser);

// Power Users Management (Superadmin only)
router.get('/power-users', powerUsersController.getPowerUsers);
router.put('/power-users/:role_key', powerUsersController.updatePowerUser);

// Kattalai Deletion via 3-Party WhatsApp OTP (Superadmin only)
router.post('/kattalai-deletion/initiate', kattalaiDeletionController.initiateDeletion);
router.post('/kattalai-deletion/verify-and-delete', kattalaiDeletionController.verifyAndDelete);

// Dropdown Options
router.get('/dropdown-options', dropdownController.getOptions);
router.post('/dropdown-options', dropdownController.addOption);
router.delete('/dropdown-options/:id', dropdownController.deleteOption);

// Edit Requests
router.get('/edit-requests', requestsController.getRequests);
router.get('/edit-requests/booking/:booking_id', requestsController.getBookingRequest);
router.post('/edit-requests', requestsController.createRequest);
router.patch('/edit-requests/:id/status', requestsController.updateRequestStatus);

// Kattalai types (the columns on the dashboard)
router.post('/kattalai-types', kattalaiTypes.createKattalaiType);
router.put('/kattalai-types/:id', kattalaiTypes.updateKattalaiType);

// Attendance History for Devotees
router.get('/my-attendance', bookings.getMyAttendance);

// System Settings
router.put('/settings', settingsController.updateSetting);

// Bookings (sponsors / pills)
router.get('/bookings/export', bookings.exportBookings);
router.get('/bookings/:id', bookings.getBooking);
router.patch('/bookings/:id', bookings.updateBooking);
router.post('/bookings/:id/transfer', bookings.transferBooking);
router.patch('/bookings/:id/present', bookings.togglePresent);
router.delete('/bookings/:id', bookings.deleteBooking);

// To-do lists
router.get('/todos', todos.listTodos);
router.post('/todos/:listId/items', todos.addTodoItem);
router.patch('/todos/items/:itemId', todos.updateTodoItem);
router.delete('/todos/items/:itemId', todos.deleteTodoItem);

// Panchangam (admin mutations)
router.put('/panchangam/:date', panchangam.upsertPanchangam);
router.post('/panchangam/upload-csv', panchangam.uploadCsv);

// Payments
router.post('/payments', payments.createPayment);
router.get('/payments/booking/:bookingId', payments.getPaymentsForBooking);
router.post('/payments/razorpay/create-order', payments.createRazorpayOrder);
router.post('/payments/razorpay/verify', payments.verifyRazorpaySignature);

module.exports = router;
