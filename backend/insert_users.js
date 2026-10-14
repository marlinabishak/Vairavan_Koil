const pool = require('./src/db/pool');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function insertUsers() {
  const users = [
    { email: 'superadmin', role: 'superadmin', password: 'vKoil@Super2026', name: 'Super Administrator' },
    { email: 'admin', role: 'admin', password: 'vKoil@Admin26', name: 'Administrator' },
    { email: 'ulthurai', role: 'ulthurai', password: 'vKoil@Pooja26', name: 'Ulthurai (Pooja Team)' }
  ];

  try {
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (id, name, email, role, password_hash)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role), name = VALUES(name)`,
        [uuidv4(), u.name, u.email, u.role, hash]
      );
    }
    console.log("Users inserted successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertUsers();
