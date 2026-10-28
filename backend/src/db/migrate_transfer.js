const pool = require('./pool');

async function migrate() {
  try {
    console.log('Connecting and ensuring system_settings table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(60) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('system_settings table ready.');

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('transfer_base_amount', '3500', 'Default base amount for 1-time account transfer')
      ON DUPLICATE KEY UPDATE setting_key = setting_key
    `);
    console.log('Default transfer_base_amount seeded.');

    const { rows: cols } = await pool.query(`SHOW COLUMNS FROM bookings LIKE 'is_transferred'`);
    if (!cols || cols.length === 0) {
      await pool.query(`
        ALTER TABLE bookings
        ADD COLUMN is_transferred TINYINT(1) DEFAULT 0,
        ADD COLUMN transferred_at TIMESTAMP NULL DEFAULT NULL,
        ADD COLUMN transferred_from_name VARCHAR(160) NULL DEFAULT NULL,
        ADD COLUMN transferred_from_title VARCHAR(40) NULL DEFAULT NULL,
        ADD COLUMN transferred_fee_paid DECIMAL(10,2) DEFAULT 0.00
      `);
      console.log('Added transfer tracking columns to bookings table.');
    } else {
      console.log('Transfer tracking columns already exist in bookings table.');
    }

    const { rows: settings } = await pool.query('SELECT * FROM system_settings');
    console.log('Current system settings:', settings);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
