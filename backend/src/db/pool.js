const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Vairavan_koil',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000
});

// Wrapper to mimic 'pg' behavior for easier migration
module.exports = {
  query: async (text, params = []) => {
    let finalParams = params;
    let mysqlQuery = text;

    if (params && params.length > 0) {
      const reorderedParams = [];
      const hasDollarParams = /\$\d+/.test(text);

      if (hasDollarParams) {
        mysqlQuery = text.replace(/\$(\d+)/g, (_, num) => {
          const idx = parseInt(num, 10) - 1;
          const val = params[idx];
          reorderedParams.push(val !== undefined ? val : null);
          return '?';
        });
        finalParams = reorderedParams;
      } else {
        finalParams = params.map(val => (val !== undefined ? val : null));
      }
    } else {
      mysqlQuery = text.replace(/\$\d+/g, '?');
    }

    const [rows, fields] = await pool.query(mysqlQuery, finalParams);
    
    // For SELECTs, rows is an array. For INSERT/UPDATE/DELETE, it's an object
    if (Array.isArray(rows)) {
      return { rows, rowCount: rows.length };
    } else {
      return { 
        rows: [], 
        rowCount: rows.affectedRows,
        insertId: rows.insertId
      };
    }
  },
  end: () => pool.end()
};
