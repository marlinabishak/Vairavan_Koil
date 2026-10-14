const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('./pool');

const CSV_PATH = path.resolve('C:\\Users\\marlin\\OneDrive\\Desktop\\workss\\vairavan-kovil_figma\\Sep-03-Eng_Database_format.csv');
const CURRENT_YEAR = new Date().getFullYear(); // 2026

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Insert Staff Accounts
    console.log('👤 Inserting staff accounts...');
    await pool.query(`DELETE FROM users`);
    const staffAccounts = [
      { name: 'Super Admin', email: 'superadmin', role: 'superadmin', pass: 'vKoil@Super2026' },
      { name: 'Admin', email: 'admin', role: 'admin', pass: 'vKoil@Admin26' },
      { name: 'Ulthurai', email: 'ulthurai', role: 'ulthurai', pass: 'vKoil@Pooja26' },
      { name: 'Supporter', email: 'supporter', role: 'supporter', pass: 'vKoil@Supp26' },
    ];

    for (const acc of staffAccounts) {
      await pool.query(
        `INSERT INTO users (name, email, role, password_hash) 
         VALUES ($1, $2, $3, crypt($4, gen_salt('bf')))`,
        [acc.name, acc.email, acc.role, acc.pass]
      );
    }

    // 2. Fetch Kattalai Types mapping
    console.log('📌 Fetching Kattalai types...');
    const typesRes = await pool.query('SELECT id, name FROM kattalai_types');
    const typesMap = {};
    for (const t of typesRes.rows) {
      if (t.name.includes('Uchikala')) typesMap['Uchikkalam'] = t.id;
      if (t.name.includes('Arthajama')) typesMap['Arthajamam'] = t.id;
      if (t.name.includes('Archanai')) typesMap['Archanai'] = t.id;
    }

    // 3. Parse CSV and Insert Bookings
    console.log('📄 Parsing CSV and inserting bookings...');
    // We clear old bookings to prevent duplicates during seed
    await pool.query('DELETE FROM bookings');
    
    let count = 0;
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', async (row) => {
        if (!row['Contact Name']) return; // Skip empty rows

        const name = row['Contact Name']?.trim() || '';
        const title = row['Title']?.trim() || null;
        const code = row['Office Code']?.trim() || null;
        const place = row['Place']?.trim() || null;
        const mobile = row['Mobile Number']?.trim() || null;
        const star = row['Star']?.trim() || null;
        const kattalaiTypeStr = row['Kattalai']?.trim();
        let amount = parseFloat(row['Amount']) || 0;

        // Parse date (e.g. 03.Sep.26)
        const dateStr = row['Kattalai Date']?.trim();
        let bookingDate = null;
        if (dateStr) {
          const parts = dateStr.split('.');
          if (parts.length >= 2) {
            const day = parts[0].padStart(2, '0');
            const monthStr = parts[1];
            const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            const month = monthMap[monthStr] || '01';
            // Force current year
            bookingDate = `${CURRENT_YEAR}-${month}-${day}`;
          }
        }

        const typeId = typesMap[kattalaiTypeStr];

        if (name && bookingDate && typeId) {
          // Construct Address
          const permanent_address = [row['Per.Add.1'], row['Per.Add.2'], row['Per.Add.3']].filter(Boolean).join(', ');
          const communication_address = [row['Comm.Add.1'], row['Comm.Add.2'], row['Comm.Add.3']].filter(Boolean).join(', ');
          const whatsapp_number = mobile;

          try {
            await pool.query(
              `INSERT INTO bookings (kattalai_type_id, booking_date, title, name, star, place, code, mobile, whatsapp_number, permanent_address, communication_address, amount)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [typeId, bookingDate, title, name, star, place, code, mobile, whatsapp_number, permanent_address, communication_address, amount]
            );
            count++;
          } catch (err) {
            console.error(`Error inserting row for ${name}: `, err.message);
          }
        }
      })
      .on('end', () => {
        console.log(`✅ Finished parsing CSV. Inserted ${count} bookings.`);
        // Note: Because createReadStream is async with query, some queries might still be flying,
        // but for a small file (~8 valid lines), it will likely finish quickly.
        // A robust script would use promises, but this is a simple one-off seed.
        setTimeout(() => {
          pool.end();
          console.log('Done!');
        }, 2000);
      });

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    await pool.end();
  }
}

seed();
