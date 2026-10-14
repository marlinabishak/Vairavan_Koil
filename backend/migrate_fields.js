const pool = require('./src/db/pool');

async function run() {
  try {
    console.log('Adding columns to bookings table...');
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT '91',
      ADD COLUMN IF NOT EXISTS kat_type VARCHAR(50);
    `);
    console.log('✅ Columns added successfully.');

    console.log('Seeding kat_type dropdown options...');
    const types = ['Lifetime', 'Inheritance'];
    for (const t of types) {
      const { rows } = await pool.query('SELECT id FROM dropdown_options WHERE category = $1 AND value = $2', ['kat_type', t]);
      if (rows.length === 0) {
        await pool.query('INSERT INTO dropdown_options (category, value) VALUES ($1, $2)', ['kat_type', t]);
      }
    }
    console.log('✅ Kat Types seeded successfully.');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
