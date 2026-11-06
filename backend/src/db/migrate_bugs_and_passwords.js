const pool = require('./pool');
const { v4: uuidv4 } = require('uuid');

async function migrateBugsAndPasswords() {
  console.log('--- Migrating Bug Reports & Devotee Passwords Tables ---');

  try {
    // 1. Create bug_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT NULL,
        username VARCHAR(100) DEFAULT '',
        user_role VARCHAR(50) DEFAULT '',
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        screenshot_urls TEXT DEFAULT NULL,
        page_url VARCHAR(255) DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        resolution_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_bug_status (status),
        INDEX idx_bug_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('✓ bug_reports table verified/created.');

    // 2. Create devotee_passwords table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devotee_passwords (
        id VARCHAR(36) PRIMARY KEY,
        booking_id VARCHAR(64) NOT NULL UNIQUE,
        office_code VARCHAR(50) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_custom_password BOOLEAN NOT NULL DEFAULT TRUE,
        last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_devotee_pw_code (office_code),
        INDEX idx_devotee_pw_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('✓ devotee_passwords table verified/created.');

    console.log('--- Migration completed successfully ---');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateBugsAndPasswords().then(() => process.exit(0));
}

module.exports = migrateBugsAndPasswords;
