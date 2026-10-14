const pool = require('./src/db/pool');

async function fix() {
  try {
    await pool.query(
      `UPDATE bookings 
       SET per_add_1 = 'KKDi', per_add_2 = '', per_add_3 = '', 
           comm_add_1 = 'KKDi', comm_add_2 = '', comm_add_3 = '', comm_add_4 = ''
       WHERE code = 'U/3/267'`
    );
    console.log("Updated address to KKDi!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
