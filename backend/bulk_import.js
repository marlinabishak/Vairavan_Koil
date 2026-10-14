const fs = require('fs');
const pool = require('./src/db/pool');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Basic CSV parser to handle quotes correctly
function parseCsvLine(text) {
  const result = [];
  let inQuotes = false;
  let currentVal = '';
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  result.push(currentVal);
  return result;
}

async function run() {
  try {
    // Put your 2000-user CSV file here:
    const csvFilePath = 'import_data.csv'; 
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: CSV file not found at ${csvFilePath}. Please place your CSV file in the backend folder and name it 'import_data.csv'.`);
      return;
    }

    const content = fs.readFileSync(csvFilePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    
    // First row is the Header, skip it
    const dataLines = lines.slice(1);
    
    // Fetch kattalai types from DB dynamically to map IDs
    const { rows: types } = await pool.query('SELECT * FROM kattalai_types');
    const typeMap = {};
    for (const t of types) {
      // Create a fuzzy matching map
      const normalized = t.name.toLowerCase().replace(/[^a-z]/g, '');
      typeMap[normalized] = t.id;
    }

    let successCount = 0;
    let failCount = 0;

    for (const line of dataLines) {
      const cols = parseCsvLine(line.trim());
      
      // Expected exactly 24 columns based on the Export format
      if (cols.length < 24) {
        console.log(`Skipping invalid line (less than 24 columns): ${cols[2]}`);
        failCount++;
        continue;
      }
      
      // Mapping the 24 columns
      const countryCode = cols[0] || '91';
      const mobile = cols[1] || '';
      const name = cols[2] || '';
      const code = cols[3] || '';
      const place = cols[4] || '';
      const title = cols[5] || '';
      const kattalaiStr = cols[6] || '';
      const kDate = parseInt(cols[7], 10);
      const kMonth = parseInt(cols[8], 10);
      // skip cols[9] (Pooja's time - derived)
      const star = cols[10] || '';
      const regnDate = cols[11] || null;
      
      const perAdd1 = cols[12] || '';
      const perAdd2 = cols[13] || '';
      const perAdd3 = cols[14] || '';
      
      const katType = cols[15] || '';
      
      const commAdd1 = cols[16] || '';
      const commAdd2 = cols[17] || '';
      const commAdd3 = cols[18] || '';
      const commAdd4 = cols[19] || '';
      
      const amount = parseFloat(cols[20]) || 0;
      const whatsapp = cols[21] || mobile;
      const email = cols[22] || '';
      const letIntimation = cols[23] || 0;
      
      // Find the correct Kattalai UUID based on the text
      const searchKey = kattalaiStr.toLowerCase().replace(/[^a-z]/g, '');
      const typeId = typeMap[searchKey] || typeMap['uchikalakattalai']; // Default fallback
      
      if (!typeId || !name || isNaN(kDate) || isNaN(kMonth)) {
        console.log(`Skipping row missing required data (Name: ${name}, Date: ${kDate}/${kMonth})`);
        failCount++;
        continue;
      }

      const id = uuidv4();

      try {
        await pool.query(
          `INSERT INTO bookings
            (id, kattalai_type_id, kattalai_date, kattalai_month, title, name, star, place, code, mobile,
             whatsapp_number, whatsapp_same_as_mobile, email, 
             per_add_1, per_add_2, per_add_3, comm_add_1, comm_add_2, comm_add_3, comm_add_4,
             amount, country_code, kat_type, regn_date, let_intimation)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            id, typeId, kDate, kMonth, title, name, star, place, code, mobile,
            whatsapp, true, email,
            perAdd1, perAdd2, perAdd3, commAdd1, commAdd2, commAdd3, commAdd4,
            amount, countryCode, katType, regnDate, letIntimation
          ]
        );
        successCount++;
      } catch (err) {
        console.error(`Failed to insert ${name}: ${err.message}`);
        failCount++;
      }
    }
    
    console.log(`\nImport Complete!`);
    console.log(`Successfully Imported: ${successCount} devotees`);
    console.log(`Failed / Skipped: ${failCount} rows`);
    
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    pool.end();
  }
}

run();
