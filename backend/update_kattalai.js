const pool = require('./src/db/pool');

async function update() {
  await pool.query("UPDATE kattalai_types SET name_ta = 'உச்சிக்காலம்', name = 'Uchikalam' WHERE name ILIKE '%Uchikala%'");
  await pool.query("UPDATE kattalai_types SET name = 'Arthajamam', name_ta = 'அர்த்தஜாமம்' WHERE name ILIKE '%Arthajama%'");
  console.log('Updated');
  process.exit();
}

update();
