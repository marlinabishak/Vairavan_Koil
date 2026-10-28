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
const whatsappRoutes = require('./whatsappRoutes');
const authenticateToken = require('../middleware/authMiddleware');

// Rate limiting for auth routes to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
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

// Public routes for Signup page
router.get('/kattalai-types', kattalaiTypes.listKattalaiTypes);
router.get('/dropdown-options', dropdownController.getOptions);
router.get('/bookings', bookings.listBookings); // Needed to check slot availability
router.post('/bookings', bookings.createBooking); // Needed for public registration

// Razorpay endpoints must be public so devotees can pay during signup
router.post('/payments/razorpay/create-order', payments.createRazorpayOrder);
router.post('/payments/razorpay/verify', payments.verifyRazorpaySignature);

// PROTECTED ROUTES (Require JWT)
router.use(authenticateToken);

router.use('/whatsapp', whatsappRoutes);

// Staff User & Role Management (Superadmin only)
router.get('/users', usersController.listUsers);
router.post('/users', usersController.createUser);
router.patch('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deleteUser);

// Dropdown Options
router.get('/dropdown-options', dropdownController.getOptions);
router.post('/dropdown-options', dropdownController.addOption);
router.delete('/dropdown-options/:id', dropdownController.deleteOption);

// Edit Requests
router.get('/edit-requests', requestsController.getRequests);
router.get('/edit-requests/booking/:booking_id', requestsController.getBookingRequest);
router.post('/edit-requests', requestsController.createRequest);
router.patch('/edit-requests/:id/status', requestsController.updateRequestStatus);

// History
router.get('/history', history.listHistory);
router.post('/history', history.createHistoryLog);

// Kattalai types (the columns on the dashboard)
router.post('/kattalai-types', kattalaiTypes.createKattalaiType);
router.put('/kattalai-types/:id', kattalaiTypes.updateKattalaiType);

// Attendance History for Devotees
router.get('/my-attendance', bookings.getMyAttendance);

// Bookings (sponsors / pills)
router.get('/bookings/export', bookings.exportBookings);
router.get('/bookings/:id', bookings.getBooking);
router.patch('/bookings/:id', bookings.updateBooking);
router.patch('/bookings/:id/present', bookings.togglePresent);
router.delete('/bookings/:id', bookings.deleteBooking);

// To-do lists
router.get('/todos', todos.listTodos);
router.post('/todos/:listId/items', todos.addTodoItem);
router.patch('/todos/items/:itemId', todos.updateTodoItem);
router.delete('/todos/items/:itemId', todos.deleteTodoItem);

// Panchangam
router.get('/panchangam/:date', panchangam.getPanchangam);
router.put('/panchangam/:date', panchangam.upsertPanchangam);

// Payments
router.post('/payments', payments.createPayment);
router.get('/payments/booking/:bookingId', payments.getPaymentsForBooking);
router.post('/payments/razorpay/create-order', payments.createRazorpayOrder);
router.post('/payments/razorpay/verify', payments.verifyRazorpaySignature);

module.exports = router;
