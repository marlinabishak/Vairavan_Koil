const pool = require('./pool');

async function migrateThaniArchanai() {
  try {
    console.log('[Migration] Creating thani_archanai_bookings table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS thani_archanai_bookings (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        booking_date DATE NOT NULL,
        slot INT NOT NULL DEFAULT 1,
        name VARCHAR(150) NOT NULL,
        place VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        star VARCHAR(80) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 200.00,
        payment_mode VARCHAR(50) DEFAULT 'Online',
        payment_status VARCHAR(30) DEFAULT 'paid',
        is_present TINYINT(1) NOT NULL DEFAULT 0,
        created_by VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_date_slot (booking_date, slot)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log('[Migration] Adding thani_archanai_amount setting...');
    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('thani_archanai_amount', '200', 'Fee for on-the-day Thani Archanai registrations')
      ON DUPLICATE KEY UPDATE setting_value = IFNULL(setting_value, '200');
    `);

    console.log('[Migration] Updating Archanai kattalai_type name to Thani Archanai...');
    await pool.query(`
      UPDATE kattalai_types 
      SET name = 'Thani Archanai', name_ta = 'தனி அர்ச்சனை' 
      WHERE color_key = 'archanai' OR name = 'Archanai';
    `);

    console.log('✅ [Migration] Thani Archanai migration completed successfully!');
  } catch (err) {
    console.error('❌ [Migration] Error running Thani Archanai migration:', err);
  }
}

if (require.main === module) {
  migrateThaniArchanai().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateThaniArchanai;
