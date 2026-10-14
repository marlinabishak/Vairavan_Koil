const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// GET /api/users - List all staff users (Superadmin only)
async function listUsers(req, res) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email as username, role, created_at 
       FROM users 
       ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [usersController.listUsers]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
}

// POST /api/users - Create new staff user with role (Superadmin only)
async function createUser(req, res) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
    }

    const { name, username, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }
    
    const validRoles = ['superadmin', 'admin', 'ulthurai'];
    const assignedRole = role?.toLowerCase()?.trim();
    if (!validRoles.includes(assignedRole)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles are: ${validRoles.join(', ')}` });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = $1`,
      [cleanUsername]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: `Username "${cleanUsername}" is already taken. Please choose another.` });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const newId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
      [newId, name.trim(), cleanUsername, passwordHash, assignedRole]
    );

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        req.user?.id || null,
        'Created Staff Profile',
        `Superadmin created profile "${name.trim()}" (Username: ${cleanUsername}) with role "${assignedRole}"`
      ]
    );

    res.status(201).json({
      id: newId,
      name: name.trim(),
      username: cleanUsername,
      role: assignedRole,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error [usersController.createUser]:', err.stack || err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
}

// PATCH /api/users/:id - Update user details, role, or reset password (Superadmin only)
async function updateUser(req, res) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
    }

    const { id } = req.params;
    const { name, role, password } = req.body;

    const { rows: existing } = await pool.query(`SELECT id, name, email as username, role FROM users WHERE id = $1`, [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const current = existing[0];

    const updates = [];
    const values = [];
    let idx = 1;

    if (name && name.trim()) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }

    if (role) {
      const validRoles = ['superadmin', 'admin', 'ulthurai'];
      const assignedRole = role.toLowerCase().trim();
      if (!validRoles.includes(assignedRole)) {
        return res.status(400).json({ error: `Invalid role. Allowed roles are: ${validRoles.join(', ')}` });
      }
      // If updating superadmin's own role, prevent locking themselves out
      if (id === req.user.id && assignedRole !== 'superadmin') {
        return res.status(400).json({ error: 'You cannot change your own superadmin role' });
      }
      updates.push(`role = $${idx++}`);
      values.push(assignedRole);
    }

    if (password && password.trim()) {
      if (password.trim().length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long' });
      }
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    values.push(id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        req.user?.id || null,
        'Updated Staff Profile',
        `Superadmin updated profile for "${current.name}" (${current.username}). Changes: ${updates.map(u => u.split(' =')[0]).join(', ')}`
      ]
    );

    const { rows: updated } = await pool.query(
      `SELECT id, name, email as username, role, created_at FROM users WHERE id = $1`,
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Error [usersController.updateUser]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
}

// DELETE /api/users/:id - Delete staff user (Superadmin only)
async function deleteUser(req, res) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
    }

    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own active superadmin profile' });
    }

    const { rows: existing } = await pool.query(`SELECT id, name, email as username, role FROM users WHERE id = $1`, [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const current = existing[0];

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    // Audit log
    await pool.query(
      `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        req.user?.id || null,
        'Deleted Staff Profile',
        `Superadmin deleted profile for "${current.name}" (${current.username}, role: ${current.role})`
      ]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Error [usersController.deleteUser]:', err.stack || err);
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};
