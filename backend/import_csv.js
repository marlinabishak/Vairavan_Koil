const fs = require('fs');
const pool = require('./src/db/pool');
require('dotenv').config();

// Basic CSV parser to handle quotes
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
    // Make sure to replace this path with the actual path to your new 28-column CSV file
    const csvFilePath = 'c:/Users/marlin/OneDrive/Desktop/workss/vairavan-kovil_figma/sep20_backup_Final_DB_VK_2026.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: CSV file not found at ${csvFilePath}`);
      return;
    }

    const content = fs.readFileSync(csvFilePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().replace(/,/g, '').length > 0);
    
    // First row is header, skip it
    const dataLines = lines.slice(1);
    
    // Get kattalai types to map IDs
    const { rows: types } = await pool.query('SELECT * FROM kattalai_types');
    const uchikalaId = types.find(t => t.name.includes('Uchikal'))?.id || types.find(t => t.name.includes('Uchikala'))?.id;
    const arthajamaId = types.find(t => t.name.includes('Arthaja'))?.id;

    for (const line of dataLines) {
      const cols = parseCsvLine(line.trim());
      
      // We expect around 28 columns now
      if (cols.length < 28) continue;
      
      const countryCode = cols[0];
      const mobile = cols[1];
      const nameEn = cols[2];
      const nameTa = cols[3];
      const code = cols[4];
      const placeEn = cols[5];
      const placeTa = cols[6];
      const titleEn = cols[7];
      const titleTa = cols[8];
      const kattalai = cols[9] || '';
      
      const kDay = parseInt(cols[10], 10);
      const kMonth = parseInt(cols[11], 10);
      // skip 12: Pooja's Time (deduced from Kattalai Name)
      const starEn = cols[13];
      const starTa = cols[14];
      const regnDate = cols[15];
      
      const perAdd1 = cols[16];
      const perAdd2 = cols[17];
      const perAdd3 = cols[18];
      
      const katType = cols[19];
      
      const commAdd1 = cols[20];
      const commAdd2 = cols[21];
      const commAdd3 = cols[22];
      const commAdd4 = cols[23];
      
      const amount = parseFloat(cols[24]) || 0;
      const whatsapp = cols[25];
      const email = cols[26];
      const letIntimation = cols[27] ? cols[27].trim() : null;
      
      let typeId = null;
      if (kattalai.toLowerCase().includes('uchi') || (code && code.startsWith('U/'))) typeId = uchikalaId;
      else if (kattalai.toLowerCase().includes('artha') || (code && code.startsWith('A/'))) typeId = arthajamaId;
      
      if (nameEn && code && typeId && !isNaN(kDay) && !isNaN(kMonth)) {
        // check if exists
        const { rows } = await pool.query('SELECT id FROM bookings WHERE code = ?', [code]);
        if (rows.length === 0) {
          await pool.query(`
            INSERT INTO bookings (
              kattalai_type_id, kattalai_date, kattalai_month, 
              title, title_ta, name, name_ta, star, star_ta, place, place_ta, code, 
              country_code, mobile, whatsapp_number, email, 
              per_add_1, per_add_2, per_add_3, 
              comm_add_1, comm_add_2, comm_add_3, comm_add_4, 
              amount, let_intimation, kat_type, regn_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            typeId, kDay, kMonth, 
            titleEn, titleTa, nameEn, nameTa, starEn, starTa, placeEn, placeTa, code, 
            countryCode || '91', mobile || null, whatsapp || null, email || null, 
            perAdd1, perAdd2, perAdd3, 
            commAdd1, commAdd2, commAdd3, commAdd4, 
            amount, letIntimation, katType, regnDate
          ]);
          console.log(`✅ Imported ${code} - ${nameEn}`);
        } else {
          // Update it
          await pool.query(`
            UPDATE bookings 
            SET title = ?, title_ta = ?, name = ?, name_ta = ?, star = ?, star_ta = ?, place = ?, place_ta = ?, 
                country_code = ?, mobile = ?, whatsapp_number = ?, email = ?, 
                per_add_1 = ?, per_add_2 = ?, per_add_3 = ?, comm_add_1 = ?, comm_add_2 = ?, comm_add_3 = ?, comm_add_4 = ?, 
                amount = ?, kattalai_date = ?, kattalai_month = ?, kattalai_type_id = ?, let_intimation = ?, kat_type = ?, regn_date = ?
            WHERE code = ?
          `, [
            titleEn, titleTa, nameEn, nameTa, starEn, starTa, placeEn, placeTa, 
            countryCode || '91', mobile || null, whatsapp || null, email || null, 
            perAdd1, perAdd2, perAdd3, commAdd1, commAdd2, commAdd3, commAdd4, 
            amount, kDay, kMonth, typeId, letIntimation, katType, regnDate, 
            code
          ]);
          console.log(`🔄 Updated ${code} - ${nameEn}`);
        }
      } else {
        console.log(`Skipped ${code}: name=${!!nameEn}, typeId=${!!typeId} (${kattalai}), date=${kDay}/${kMonth}`);
      }
    }
    
    console.log('Import completed.');
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await pool.end();
  }
}

run();
