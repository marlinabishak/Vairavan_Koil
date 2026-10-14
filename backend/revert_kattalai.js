const pool = require('./src/db/pool');

async function revertDB() {
  try {
    // Revert what the user did with their update_kattalai.js script
    await pool.query("UPDATE kattalai_types SET name = 'Arthajama Kattalai' WHERE name ILIKE '%Arthajama%'");
    await pool.query("UPDATE kattalai_types SET name = 'Uchikala Kattalai' WHERE name ILIKE '%Uchikkala%' OR name ILIKE '%Uchi%'");
    
    console.log("Database values reverted successfully to original formal names.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

revertDB();
