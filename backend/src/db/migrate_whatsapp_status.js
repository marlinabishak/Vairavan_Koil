const pool = require('./pool');

async function migrateWhatsappStatus() {
  console.log('Starting migration for WhatsApp Send Status...');

  try {
    console.log('Adding wa_status_en column to bookings...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wa_status_en VARCHAR(20);');

    console.log('Adding wa_error_en column to bookings...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wa_error_en TEXT;');

    console.log('Adding wa_status_ta column to bookings...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wa_status_ta VARCHAR(20);');

    console.log('Adding wa_error_ta column to bookings...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wa_error_ta TEXT;');

    console.log('Creating whatsapp_send_history table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_send_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lang VARCHAR(20) NOT NULL,
        target_date DATE NOT NULL,
        total INT DEFAULT 0,
        sent INT DEFAULT 0,
        failed INT DEFAULT 0,
        triggered_by VARCHAR(60),
        error_details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('Successfully applied WhatsApp Status migration!');
  } catch (err) {
    console.error('Error during migration:', err.stack || err);
  } finally {
    pool.end();
  }
}

migrateWhatsappStatus();
