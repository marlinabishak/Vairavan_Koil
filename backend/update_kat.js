const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/vairavan_kovil' }); 
pool.query("UPDATE bookings SET kat_type = 'Lifetime' WHERE kat_type IS NULL OR kat_type = ''").then(res => { 
  console.log(res.rowCount + ' rows updated'); 
  pool.end(); 
});
