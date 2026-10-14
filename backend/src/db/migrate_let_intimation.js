const pool = require('./pool');

async function migrate() {
  console.log('Adding let_intimation column...');
  try {
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS let_intimation INTEGER;');
    console.log('Successfully added let_intimation column!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
