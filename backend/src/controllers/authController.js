const pool = require('../db/pool');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';

// Basic login implementation supporting dynamic CSV users and hardcoded staff
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 1. Check Staff Users first
    const staffQuery = `
      SELECT id, name, email as username, role, password_hash 
      FROM users 
      WHERE LOWER(email) = ?
    `;
    const staffRes = await pool.query(staffQuery, [username.toLowerCase()]);
    
    if (staffRes.rows.length > 0) {
      const user = staffRes.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (match) {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role, name: user.name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          }
        });
      }
    }

    // 2. Check Dynamic Users (Kattalaidhars)
    const userQuery = `
      SELECT id, name, code, CONCAT(YEAR(CURRENT_DATE), '-', LPAD(kattalai_month, 2, '0'), '-', LPAD(kattalai_date, 2, '0')) as booking_date_str 
      FROM bookings 
      WHERE UPPER(TRIM(code)) = UPPER(TRIM(?)) AND TRIM(mobile) = TRIM(?)
      LIMIT 1
    `;
    const userRes = await pool.query(userQuery, [username, password]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const token = jwt.sign(
        { id: user.id, username: user.code, role: 'user', name: user.name, booking_date: user.booking_date_str },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.code,
          role: 'user',
          booking_date: user.booking_date_str
        }
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error [authController.js]:', error.stack || error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
