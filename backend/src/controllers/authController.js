const pool = require('../db/pool');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';

// Helper to clean and normalize phone strings for safe comparison
function normalizePhone(str) {
  if (!str) return '';
  return String(str).replace(/[^0-9]/g, '');
}

function phonesMatch(provided, stored) {
  const p1 = normalizePhone(provided);
  const p2 = normalizePhone(stored);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  // Match last 10 digits (ignoring 91 or +91 prefixes)
  return p1.slice(-10) === p2.slice(-10);
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const rawUsername = String(username).trim();
  const rawPassword = String(password).trim();

  try {
    // 1. Check Staff Users first (Email or Username matching in `users` table)
    const staffQuery = `
      SELECT id, name, email as username, role, password_hash 
      FROM users 
      WHERE LOWER(email) = $1
    `;
    const { rows: staffRows } = await pool.query(staffQuery, [rawUsername.toLowerCase()]);
    
    if (staffRows.length > 0) {
      const staff = staffRows[0];
      const match = await bcrypt.compare(rawPassword, staff.password_hash);
      if (match) {
        const token = jwt.sign(
          { id: staff.id, username: staff.username, role: staff.role, name: staff.name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Audit log login
        try {
          await pool.query(
            `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
            [uuidv4(), staff.id, 'Staff Login', `Staff user "${staff.name}" (${staff.role}) signed in.`]
          );
        } catch (e) {
          console.error('Failed to write staff login log:', e.message);
        }

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: staff.id,
            name: staff.name,
            username: staff.username,
            role: staff.role
          }
        });
      }
    }

    // 2. Check Devotees (Kattalaidhars)
    // Supports login via:
    // - Office Code (e.g. U/3/267, u 3 267, u3267)
    // - Registered Email address
    const cleanCode = rawUsername.toLowerCase().replace(/[\s\-_/]/g, '');
    const isEmail = rawUsername.includes('@');

    const devoteeQuery = `
      SELECT b.id, b.name, b.code, b.email, b.mobile, b.whatsapp_number,
             dp.password_hash, dp.is_custom_password,
             CONCAT(YEAR(CURRENT_DATE), '-', LPAD(b.kattalai_month, 2, '0'), '-', LPAD(b.kattalai_date, 2, '0')) as booking_date_str 
      FROM bookings b
      LEFT JOIN devotee_passwords dp ON dp.booking_id = b.id
      WHERE (
        (b.email IS NOT NULL AND LOWER(TRIM(b.email)) = LOWER($1))
        OR LOWER(b.code) = LOWER($2)
        OR REPLACE(REPLACE(REPLACE(LOWER(b.code), ' ', ''), '-', ''), '/', '') = $3
        OR LOWER(REPLACE(REPLACE(b.code, ' ', ''), '-', '')) = $4
      )
      LIMIT 10
    `;

    const { rows: devoteeRows } = await pool.query(devoteeQuery, [
      rawUsername,
      rawUsername,
      cleanCode,
      rawUsername.toLowerCase().replace(/[\s\-]/g, '')
    ]);

    for (const devotee of devoteeRows) {
      let passwordValid = false;

      if (devotee.password_hash) {
        // Devotee has set a custom password -> verify using bcrypt
        passwordValid = await bcrypt.compare(rawPassword, devotee.password_hash);
      } else {
        // Devotee has not set a custom password -> fallback to default mobile number
        passwordValid = phonesMatch(rawPassword, devotee.mobile) || phonesMatch(rawPassword, devotee.whatsapp_number);
      }

      if (passwordValid) {
        const token = jwt.sign(
          {
            id: devotee.id,
            username: devotee.code,
            email: devotee.email || '',
            role: 'user',
            name: devotee.name,
            booking_date: devotee.booking_date_str
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Audit log login
        try {
          await pool.query(
            `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
            [
              uuidv4(),
              null,
              'User Login',
              `Devotee "${devotee.name}" (Office Code: ${devotee.code}) signed in via ${isEmail ? 'email' : 'office code'}.`
            ]
          );
        } catch (e) {
          console.error('Failed to write devotee login log:', e.message);
        }

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: devotee.id,
            name: devotee.name,
            username: devotee.code,
            email: devotee.email || '',
            role: 'user',
            booking_date: devotee.booking_date_str
          }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid username, office code, email, or password.' });
  } catch (error) {
    console.error('Login error [authController.js]:', error.stack || error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// POST /api/auth/change-password
// Allows logged-in Devotees or Staff to change their password securely
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to change password' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // 1. If Devotee / User role
    if (userRole === 'user') {
      const { rows: devoteeRows } = await pool.query(
        `SELECT id, name, code, email, mobile, whatsapp_number FROM bookings WHERE id = $1`,
        [userId]
      );

      if (!devoteeRows.length) {
        return res.status(404).json({ error: 'Devotee record not found' });
      }
      const devotee = devoteeRows[0];

      // Check current password
      const { rows: pwRows } = await pool.query(
        `SELECT password_hash FROM devotee_passwords WHERE booking_id = $1 LIMIT 1`,
        [devotee.id]
      );

      let currentMatches = false;
      if (pwRows.length > 0 && pwRows[0].password_hash) {
        currentMatches = await bcrypt.compare(currentPassword, pwRows[0].password_hash);
      } else {
        // Fallback to initial mobile number
        currentMatches = phonesMatch(currentPassword, devotee.mobile) || phonesMatch(currentPassword, devotee.whatsapp_number);
      }

      if (!currentMatches) {
        return res.status(401).json({ error: 'Current password is incorrect. If you have not changed it before, enter your registered mobile number.' });
      }

      // Hash new password using bcrypt
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Upsert into devotee_passwords
      await pool.query(
        `INSERT INTO devotee_passwords (id, booking_id, office_code, email, password_hash, is_custom_password, last_changed_at)
         VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE 
           password_hash = VALUES(password_hash),
           is_custom_password = TRUE,
           email = VALUES(email),
           office_code = VALUES(office_code),
           last_changed_at = CURRENT_TIMESTAMP`,
        [uuidv4(), devotee.id, devotee.code, devotee.email || null, newPasswordHash]
      );

      // Audit log
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [
          uuidv4(),
          null,
          'Changed Password',
          `Devotee "${devotee.name}" (Office Code: ${devotee.code}) changed their account password.`
        ]
      );

      return res.json({
        success: true,
        message: 'Password changed successfully! You can now use your new password for all future sign-ins.'
      });
    }

    // 2. If Staff role (superadmin, admin, ulthurai)
    const { rows: staffRows } = await pool.query(
      `SELECT id, name, email, password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (!staffRows.length) {
      return res.status(404).json({ error: 'Staff account not found' });
    }
    const staff = staffRows[0];

    const currentMatches = await bcrypt.compare(currentPassword, staff.password_hash);
    if (!currentMatches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newPasswordHash, staff.id]);

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        staff.id,
        'Changed Password',
        `Staff user "${staff.name}" (${req.user?.role}) updated their account password.`
      ]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (err) {
    console.error('Error [changePassword]:', err.stack || err);
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
};
