const pool = require('./src/db/pool');
pool.query("SELECT id, name, code, kattalai_date, kattalai_month FROM bookings WHERE code = 'U/3/267'")
.then(r => console.log(r.rows))
.catch(console.error)
.finally(()=>process.exit(0));
