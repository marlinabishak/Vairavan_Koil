const pool = require('./src/db/pool');
pool.query('SELECT name, code, booking_date FROM bookings WHERE name ILIKE $1 OR code ILIKE $2', ['%marlin%', '%246%'])
  .then(res => { console.log(res.rows); process.exit(); })
  .catch(err => { console.error(err); process.exit(1); });

