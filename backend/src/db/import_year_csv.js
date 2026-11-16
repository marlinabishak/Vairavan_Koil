/**
 * Vairavan Koil - Comprehensive Bulk CSV Importer (All Columns & Address Support)
 * Usage:
 *   Inside backend folder:
 *     node import_year_csv.js "../Book4.csv" --local   (Imports to local XAMPP)
 *     node import_year_csv.js "../Book4.csv"           (Imports to Cloud Aiven MySQL)
 * 
 *   From project root:
 *     node backend/import_year_csv.js "Book4.csv" --local
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('./pool');
const mysql = require('mysql2/promise');

const UCHIKALA_TYPE_ID = '6ac54970-b720-11f1-a912-40c2ba2be375';
const ARTHAJAMA_TYPE_ID = '6ac58b1d-b720-11f1-a912-40c2ba2be375';

function cleanVal(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || s.toUpperCase() === 'NULL' || s.toLowerCase() === 'undefined') return null;
  return s;
}

// Robust CSV parser supporting quoted strings containing commas
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
    console.error('   node import_year_csv.js "path/to/file.csv" --local  (for local XAMPP)');
    console.error('   node import_year_csv.js "path/to/file.csv"          (for Cloud Aiven)');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ File not found: ${resolved}`);
    process.exit(1);
  }

  const isLocal = process.argv.includes('--local');

  console.log(`=======================================================`);
  console.log(`🏛️  VAIRAVAN KOIL: COMPREHENSIVE DATA IMPORTER`);
  console.log(`📂  File: ${path.basename(resolved)}`);
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
        query: async (sql, params = []) => {
          const [res] = await localConn.query(sql, params);
          return res;
        }
      };
    } catch (err) {
      console.error('❌ Failed to connect to local XAMPP MySQL:', err.message);
      console.error('   Please make sure Apache & MySQL are running in XAMPP Control Panel.');
      process.exit(1);
    }
  } else {
    db = {
      query: async (sql, params = []) => {
        let text = sql;
        // pool.js expects $1, $2 style parameters
        let pIndex = 1;
        text = text.replace(/\?/g, () => `$${pIndex++}`);
        const res = await pool.query(text, params);
        return res.rows || res;
      }
    };
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const { headers, rows } = parseCSV(content);

  console.log(`📊 Total rows found in CSV: ${rows.length}`);

  // Temporarily disable foreign keys for safe batch operation
  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  let updatedCount = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    // Skip if row is accidentally header text
    if (r.name === 'name' || r.code === 'code' || r.id === 'id') {
      skippedCount++;
      continue;
    }

    const code = cleanVal(r.code);
    const name = cleanVal(r.name);
    if (!name && !code) {
      skippedCount++;
      continue;
    }

    const id = cleanVal(r.id);
    const date = parseInt(r.kattalai_date, 10) || null;
    const month = parseInt(r.kattalai_month, 10) || null;

    // Resolve kattalai_type_id
    let typeId = cleanVal(r.kattalai_type_id);
    if (!typeId || typeId.length < 30) {
      const codeCheck = (code || cleanVal(r.kat_type) || '').toUpperCase();
      if (codeCheck.startsWith('U') || codeCheck.includes('UCHI')) {
        typeId = UCHIKALA_TYPE_ID;
      } else {
        typeId = ARTHAJAMA_TYPE_ID;
      }
    }

    const title = cleanVal(r.title) || 'Thiru';
    const title_ta = cleanVal(r.title_ta) || (title === 'Thirumathi' ? 'திருமதி' : (title === 'Selvi' ? 'செல்வி' : (title === 'Selvan' ? 'செல்வன்' : 'திரு')));
    const name_ta = cleanVal(r.name_ta);
    const star = cleanVal(r.star);
    const star_ta = cleanVal(r.star_ta);
    const place = cleanVal(r.place);
    const place_ta = cleanVal(r.place_ta);
    const mobile = cleanVal(r.mobile);
    const whatsapp = cleanVal(r.whatsapp_number) || mobile;
    const whatsapp_same_as_mobile = (r.whatsapp_same_as_mobile === '0' || r.whatsapp_same_as_mobile === 0) ? 0 : 1;
    const email = cleanVal(r.email);

    // Complete Permanent & Communication Addresses
    const per_add_1 = cleanVal(r.per_add_1);
    const per_add_2 = cleanVal(r.per_add_2);
    const per_add_3 = cleanVal(r.per_add_3);

    const comm_add_1 = cleanVal(r.comm_add_1);
    const comm_add_2 = cleanVal(r.comm_add_2);
    const comm_add_3 = cleanVal(r.comm_add_3);
    const comm_add_4 = cleanVal(r.comm_add_4);

    const amount = parseFloat(r.amount) || 0.00;
    const country_code = cleanVal(r.country_code) || '91';
    const kat_type = cleanVal(r.kat_type) || 'Nithiya Kattalai';
    const regn_date = cleanVal(r.regn_date);
    const status = cleanVal(r.status) || 'booked';
    const comments = cleanVal(r.comments);
    const is_transferred = (r.is_transferred === '1' || r.is_transferred === 1) ? 1 : 0;
    const transferred_at = cleanVal(r.transferred_at);
    const transferred_from_name = cleanVal(r.transferred_from_name);
    const transferred_from_title = cleanVal(r.transferred_from_title);
    const transferred_fee_paid = parseFloat(r.transferred_fee_paid) || 0.00;
    const created_by = (cleanVal(r.created_by) && cleanVal(r.created_by).length > 20) ? cleanVal(r.created_by) : null;

    try {
      // Find if this record already exists in the database
      let matchId = null;
      if (id) {
        const rowsFound = await db.query('SELECT id FROM bookings WHERE id = ?', [id]);
        if (rowsFound && rowsFound.length > 0) matchId = rowsFound[0].id;
      }
      if (!matchId && code) {
        const rowsFound = await db.query('SELECT id FROM bookings WHERE code = ? LIMIT 1', [code]);
        if (rowsFound && rowsFound.length > 0) matchId = rowsFound[0].id;
      }
      if (!matchId && month && date && code) {
        const rowsFound = await db.query('SELECT id FROM bookings WHERE kattalai_month = ? AND kattalai_date = ? AND code = ? LIMIT 1', [month, date, code]);
        if (rowsFound && rowsFound.length > 0) matchId = rowsFound[0].id;
      }

      if (matchId) {
        // UPDATE existing record with ALL fields (including all permanent & communication addresses)
        await db.query(`
          UPDATE bookings SET
            kattalai_type_id = ?,
            kattalai_date = ?,
            kattalai_month = ?,
            title = ?,
            title_ta = ?,
            name = ?,
            name_ta = ?,
            star = ?,
            star_ta = ?,
            place = ?,
            place_ta = ?,
            code = ?,
            mobile = ?,
            whatsapp_number = ?,
            whatsapp_same_as_mobile = ?,
            email = ?,
            per_add_1 = ?,
            per_add_2 = ?,
            per_add_3 = ?,
            comm_add_1 = ?,
            comm_add_2 = ?,
            comm_add_3 = ?,
            comm_add_4 = ?,
            amount = ?,
            country_code = ?,
            kat_type = ?,
            regn_date = ?,
            status = ?,
            comments = ?,
            is_transferred = ?,
            transferred_at = ?,
            transferred_from_name = ?,
            transferred_from_title = ?,
            transferred_fee_paid = ?
          WHERE id = ?
        `, [
          typeId, date, month,
          title, title_ta, name, name_ta, star, star_ta,
          place, place_ta, code, mobile, whatsapp,
          whatsapp_same_as_mobile, email,
          per_add_1, per_add_2, per_add_3,
          comm_add_1, comm_add_2, comm_add_3, comm_add_4,
          amount, country_code, kat_type, regn_date,
          status, comments, is_transferred, transferred_at,
          transferred_from_name, transferred_from_title, transferred_fee_paid,
          matchId
        ]);
        updatedCount++;
      } else {
        // INSERT new record with ALL fields
        const newId = id || uuidv4();
        await db.query(`
          INSERT INTO bookings (
            id, kattalai_type_id, kattalai_date, kattalai_month,
            title, title_ta, name, name_ta, star, star_ta,
            place, place_ta, code, mobile, whatsapp_number,
            whatsapp_same_as_mobile, email,
            per_add_1, per_add_2, per_add_3,
            comm_add_1, comm_add_2, comm_add_3, comm_add_4,
            amount, country_code, kat_type, regn_date,
            status, comments, is_transferred, transferred_at,
            transferred_from_name, transferred_from_title, transferred_fee_paid,
            created_by
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?
          )
        `, [
          newId, typeId, date, month,
          title, title_ta, name, name_ta, star, star_ta,
          place, place_ta, code, mobile, whatsapp,
          whatsapp_same_as_mobile, email,
          per_add_1, per_add_2, per_add_3,
          comm_add_1, comm_add_2, comm_add_3, comm_add_4,
          amount, country_code, kat_type, regn_date,
          status, comments, is_transferred, transferred_at,
          transferred_from_name, transferred_from_title, transferred_fee_paid,
          created_by
        ]);
        insertedCount++;
      }
    } catch (err) {
      errorCount++;
      console.error(`⚠️ Error on row ${i + 1} (${code} - ${name}):`, err.message);
    }
  }

  // Re-enable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  if (localConn) {
    await localConn.end();
  }

  console.log(`=======================================================`);
  console.log(`✅  IMPORT COMPLETED SUCCESSFULLY!`);
  console.log(`   - Updated Existing Records: ${updatedCount}`);
  console.log(`   - Inserted New Records:     ${insertedCount}`);
  if (skippedCount > 0) {
    console.log(`   - Skipped (Headers/Empty):  ${skippedCount}`);
  }
  if (errorCount > 0) {
    console.log(`   - Errors Encountered:       ${errorCount}`);
  }
  console.log(`=======================================================`);
  process.exit(0);
}

if (require.main === module) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targetFile = args[0];
  runImport(targetFile).catch(err => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}

module.exports = runImport;
