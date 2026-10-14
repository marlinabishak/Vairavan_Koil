const pool = require('./pool');

async function migrateIndexes() {
  console.log('Starting index migration for performance scaling...');

  try {
    // 1. Index on bookings(booking_date) - used in fetching daily dashboard
    console.log('Creating index on bookings(booking_date)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);');

    // 2. Index on bookings(code, mobile) - used in Devotee login
    console.log('Creating index on bookings(code, mobile)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_bookings_code_mobile ON bookings(code, mobile);');

    // 3. Index on history_logs(booking_id) - used when viewing history for a specific booking
    console.log('Creating index on history_logs(booking_id)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_history_logs_booking_id ON history_logs(booking_id);');

    // 4. Index on bookings(kattalai_type_id) - used in joins
    console.log('Creating index on bookings(kattalai_type_id)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_bookings_kattalai_type ON bookings(kattalai_type_id);');

    console.log('Successfully created all performance indexes!');
  } catch (err) {
    console.error('Error creating indexes:', err.stack || err);
  } finally {
    pool.end();
  }
}

migrateIndexes();
