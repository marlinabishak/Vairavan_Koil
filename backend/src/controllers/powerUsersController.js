const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

const VALID_ROLE_KEYS = ['president', 'treasurer', 'secretary', 'vice_president', 'joint_secretary'];

/**
 * GET /api/power-users
 * Returns list of 5 permanent Power Users
 */
async function getPowerUsers(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, role_key, role_title, name, country_code, phone, place, sort_order, updated_at
       FROM power_users
       ORDER BY sort_order ASC`
    );

    // If table was empty for some reason, ensure default 5 rows
    if (rows.length === 0) {
      const defaultRoles = [
        { key: 'president', title: 'President', sort: 1 },
        { key: 'treasurer', title: 'Treasurer', sort: 2 },
        { key: 'secretary', title: 'Secretary', sort: 3 },
        { key: 'vice_president', title: 'Vice President', sort: 4 },
        { key: 'joint_secretary', title: 'Joint Secretary', sort: 5 }
      ];

      for (const r of defaultRoles) {
        await pool.query(
          `INSERT INTO power_users (id, role_key, role_title, sort_order) VALUES ($1, $2, $3, $4)`,
          [uuidv4(), r.key, r.title, r.sort]
        );
      }

      const { rows: seeded } = await pool.query(
        `SELECT id, role_key, role_title, name, country_code, phone, place, sort_order, updated_at
         FROM power_users
         ORDER BY sort_order ASC`
      );
      return res.json(seeded);
    }

    res.json(rows);
  } catch (err) {
    console.error('Error [powerUsersController.getPowerUsers]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch power users', details: err.message });
  }
}

/**
 * PUT /api/power-users/:role_key
 * Super Admin updates a Power User's details (Name, Phone, Place)
 */
async function updatePowerUser(req, res) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Only Super Admin can modify Power Users.' });
    }

    const { role_key } = req.params;
    const cleanKey = (role_key || '').toLowerCase().trim();

    if (!VALID_ROLE_KEYS.includes(cleanKey)) {
      return res.status(400).json({ error: `Invalid power user role: ${role_key}` });
    }

    const { name, country_code, phone, place } = req.body;

    const cleanName = (name || '').trim();
    const cleanCountryCode = (country_code || '+91').trim();
    const cleanPhone = (phone || '').trim().replace(/[^\d]/g, '');
    const cleanPlace = (place || '').trim();

    // Check existing
    const { rows: existing } = await pool.query(
      `SELECT id, role_key, role_title FROM power_users WHERE role_key = $1`,
      [cleanKey]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Power user role not found' });
    }

    const current = existing[0];

    await pool.query(
      `UPDATE power_users 
       SET name = $1, country_code = $2, phone = $3, place = $4, updated_at = CURRENT_TIMESTAMP
       WHERE role_key = $5`,
      [cleanName, cleanCountryCode, cleanPhone, cleanPlace, cleanKey]
    );

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        req.user?.id || null,
        'Updated Power User',
        `Superadmin updated Power User profile for "${current.role_title}": Name: "${cleanName || 'None'}", Phone: "${cleanCountryCode} ${cleanPhone || 'None'}", Place: "${cleanPlace || 'None'}"`
      ]
    );

    const { rows: updated } = await pool.query(
      `SELECT id, role_key, role_title, name, country_code, phone, place, sort_order, updated_at
       FROM power_users
       WHERE role_key = $1`,
      [cleanKey]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error('Error [powerUsersController.updatePowerUser]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update power user', details: err.message });
  }
}

module.exports = {
  getPowerUsers,
  updatePowerUser
};
