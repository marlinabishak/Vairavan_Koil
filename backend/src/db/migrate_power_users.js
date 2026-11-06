const pool = require('./pool');
const { v4: uuidv4 } = require('uuid');

async function migratePowerUsers() {
  console.log('--- Migrating Power Users & Kattalai Deletion Requests Tables ---');

  try {
    // 1. Create power_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS power_users (
        id VARCHAR(36) PRIMARY KEY,
        role_key VARCHAR(50) UNIQUE NOT NULL,
        role_title VARCHAR(100) NOT NULL,
        name VARCHAR(150) NOT NULL DEFAULT '',
        country_code VARCHAR(10) NOT NULL DEFAULT '+91',
        phone VARCHAR(25) NOT NULL DEFAULT '',
        place VARCHAR(150) NOT NULL DEFAULT '',
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ power_users table verified/created.');

    // 2. Seed initial 5 permanent roles if not already present
    const defaultRoles = [
      { key: 'president', title: 'President', sort: 1 },
      { key: 'treasurer', title: 'Treasurer', sort: 2 },
      { key: 'secretary', title: 'Secretary', sort: 3 },
      { key: 'vice_president', title: 'Vice President', sort: 4 },
      { key: 'joint_secretary', title: 'Joint Secretary', sort: 5 }
    ];

    for (const r of defaultRoles) {
      const { rows } = await pool.query(`SELECT id FROM power_users WHERE role_key = $1`, [r.key]);
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO power_users (id, role_key, role_title, sort_order) VALUES ($1, $2, $3, $4)`,
          [uuidv4(), r.key, r.title, r.sort]
        );
        console.log(`+ Seeded power user role: ${r.title}`);
      }
    }

    // 3. Create kattalai_deletion_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kattalai_deletion_requests (
        id VARCHAR(36) PRIMARY KEY,
        booking_id VARCHAR(36) NOT NULL,
        booking_name VARCHAR(255) DEFAULT '',
        office_code VARCHAR(50) DEFAULT '',
        requested_by_user_id VARCHAR(36) DEFAULT NULL,
        requested_by_name VARCHAR(150) DEFAULT '',
        president_otp VARCHAR(10) NOT NULL,
        treasurer_otp VARCHAR(10) NOT NULL,
        secretary_otp VARCHAR(10) NOT NULL,
        president_phone VARCHAR(25) DEFAULT '',
        treasurer_phone VARCHAR(25) DEFAULT '',
        secretary_phone VARCHAR(25) DEFAULT '',
        president_name VARCHAR(150) DEFAULT '',
        treasurer_name VARCHAR(150) DEFAULT '',
        secretary_name VARCHAR(150) DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_kdr_booking (booking_id),
        INDEX idx_kdr_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ kattalai_deletion_requests table verified/created.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migratePowerUsers();
