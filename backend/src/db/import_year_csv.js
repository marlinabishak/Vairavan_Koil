/**
 * Vairavan Koil - Year & Month Bulk CSV Importer
 * Usage:
 *   Inside backend folder:
 *     node import_year_csv.js "C:\path\to\your_file.csv"          (Cloud Database)
 *     node import_year_csv.js "C:\path\to\your_file.csv" --local  (Local XAMPP Database)
 * 
 *   From project root:
 *     node backend/src/db/import_year_csv.js "C:\path\to\your_file.csv"
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('./pool');
const mysql = require('mysql2/promise');

const UCHIKALA_TYPE_ID = '6ac54970-b720-11f1-a912-40c2ba2be375';
const ARTHAJAMA_TYPE_ID = '6ac58b1d-b720-11f1-a912-40c2ba2be375';

// Simple CSV parser supporting quotes and commas
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim());
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

async function runImport(filePath) {
  if (!filePath || filePath.startsWith('--')) {
    console.error('❌ Please provide the file path:');
    console.error('   node import_year_csv.js "path/to/file.csv"');
    console.error('   node import_year_csv.js "path/to/file.csv" --local  (for XAMPP)');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ File not found: ${resolved}`);
    process.exit(1);
  }

  const isLocal = process.argv.includes('--local');

  console.log(`=======================================================`);
  console.log(`🏛️  VAIRAVAN KOIL: BULK YEAR/MONTH DATA IMPORTER`);
  console.log(`📂  Reading: ${path.basename(resolved)}`);
  console.log(`🎯  Target DB: ${isLocal ? 'Local XAMPP (vairavan_koil)' : 'Cloud Aiven MySQL'}`);
  console.log(`=======================================================`);

  let db;
  let localConn = null;

  if (isLocal) {
    try {
      localConn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'vairavan_koil'
      });
      db = {
        query: async (sql, params) => {
          let text = sql;
          if (params && params.length) {
            text = text.replace(/\$(\d+)/g, '?');
            const [res] = await localConn.execute(text, params);
            return res;
          } else {
            const [res] = await localConn.query(text);
            return res;
          }
        }
      };
    } catch (err) {
      console.error('❌ Failed to connect to local XAMPP MySQL:', err.message);
      console.error('   Please make sure MySQL is started in XAMPP Control Panel.');
      process.exit(1);
    }
  } else {
    db = {
      query: (sql, params) => pool.query(sql, params)
    };
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const { rows } = parseCSV(content);

  console.log(`📊 Found ${rows.length} records in CSV to process...`);

  // Temporarily disable foreign key checks for safe bulk insert
  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    // Skip if row is accidentally another header
    if (r.name === 'name' || r.code === 'code' || r.id === 'id') continue;
    if (!r.name && !r.code) continue;

    // Resolve kattalai_type_id
    let typeId = r.kattalai_type_id;
    if (!typeId || (!typeId.includes('-') && typeId.length < 30)) {
      const codeOrType = (r.code || r.kat_type || r.kattalai_type || '').toUpperCase();
      if (codeOrType.startsWith('U') || codeOrType.includes('UCHI')) {
        typeId = UCHIKALA_TYPE_ID;
      } else {
        typeId = ARTHAJAMA_TYPE_ID;
      }
    }

    const id = r.id && r.id.length > 10 ? r.id : uuidv4();
    const date = parseInt(r.kattalai_date, 10) || null;
    const month = parseInt(r.kattalai_month, 10) || null;
    const title = r.title || 'Thiru';
    const title_ta = r.title_ta || 'திரு';
    const name = r.name || '';
    const name_ta = r.name_ta || '';
    const star = r.star || '';
    const star_ta = r.star_ta || '';
    const place = r.place || '';
    const place_ta = r.place_ta || '';
    const code = r.code || '';
    const mobile = r.mobile || '';
    const whatsapp = r.whatsapp_number || mobile || '';
    const email = r.email || null;
    const amount = parseFloat(r.amount) || 3500.00;
    const status = r.status || 'active';
    const kat_type = r.kat_type || 'Nithiya Kattalai';
    const created_by = (r.created_by && r.created_by.length > 20) ? r.created_by : null;

    try {
      await db.query(`
        INSERT INTO bookings (
          id, kattalai_type_id, kattalai_date, kattalai_month,
          title, title_ta, name, name_ta, star, star_ta,
          place, place_ta, code, mobile, whatsapp_number,
          email, per_add_1, per_add_2, per_add_3,
          amount, kat_type, status, created_by
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21, $22, $23
        )
        ON DUPLICATE KEY UPDATE
          kattalai_type_id = VALUES(kattalai_type_id),
          kattalai_date = VALUES(kattalai_date),
          kattalai_month = VALUES(kattalai_month),
          title = VALUES(title),
          title_ta = VALUES(title_ta),
          name = VALUES(name),
          name_ta = VALUES(name_ta),
          star = VALUES(star),
          star_ta = VALUES(star_ta),
          place = VALUES(place),
          place_ta = VALUES(place_ta),
          mobile = VALUES(mobile),
          whatsapp_number = VALUES(whatsapp_number),
          email = VALUES(email),
          per_add_1 = VALUES(per_add_1),
          per_add_2 = VALUES(per_add_2),
          per_add_3 = VALUES(per_add_3),
          amount = VALUES(amount),
          status = VALUES(status)
      `, [
        id, typeId, date, month,
        title, title_ta, name, name_ta, star, star_ta,
        place, place_ta, code, mobile, whatsapp,
        email, r.per_add_1 || '', r.per_add_2 || '', r.per_add_3 || '',
        amount, kat_type, status, created_by
      ]);
      imported++;
    } catch (err) {
      errors++;
      console.error(`⚠️ Row ${i + 1} (${name} - ${code}):`, err.message);
    }
  }

  // Re-enable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  if (localConn) {
    await localConn.end();
  }

  console.log(`=======================================================`);
  console.log(`✅  IMPORT COMPLETE!`);
  console.log(`   - Target: ${isLocal ? 'Local XAMPP' : 'Cloud Aiven'}`);
  console.log(`   - Successfully Imported/Updated: ${imported} bookings`);
  if (errors > 0) {
    console.log(`   - Errors Encountered: ${errors}`);
  }
  console.log(`=======================================================`);
  process.exit(0);
}

if (require.main === module) {
  // Grab the file path from args (ignore flags like --local)
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targetFile = args[0];
  runImport(targetFile).catch(err => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}

module.exports = runImport;
