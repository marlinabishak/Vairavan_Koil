const pool = require('./src/db/pool');

async function fixDuplicates() {
  try {
    const { rows } = await pool.query("SELECT id FROM bookings WHERE code = 'U/3/267' AND name = 'Marlin' ORDER BY created_at ASC");
    
    if (rows.length > 1) {
      const idsToDelete = rows.slice(1).map(r => r.id);
      
      console.log("Deleting " + idsToDelete.length + " duplicates");
      
      for (const id of idsToDelete) {
        await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
      }
      
      console.log("Successfully deleted duplicate Marlin bookings!");
    } else {
      console.log("No duplicates found to delete.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDuplicates();
