const pool = require('./pool');

async function migrateTamilFields() {
  console.log('Starting migration for Tamil fields...');

  try {
    console.log('Adding title_ta column...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS title_ta VARCHAR(40);');

    console.log('Adding name_ta column...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS name_ta VARCHAR(160);');

    console.log('Adding star_ta column...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS star_ta VARCHAR(60);');

    console.log('Adding place_ta column...');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS place_ta VARCHAR(120);');

    console.log('Successfully added all Tamil fields!');
  } catch (err) {
    console.error('Error during migration:', err.stack || err);
  } finally {
    pool.end();
  }
}

migrateTamilFields();
