const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vairavan',
});

const TITLE_OPTIONS = [
  "Thiru", "Thirumathi", "Selvi", "Selvan"
];

const STAR_OPTIONS = [
  "Anusam", "Aswathi", "Avittam", "Ayilyam", "Bharani", "Chithirai",
  "Hastham", "Karthikai", "Keettai", "Magam", "Mirukashirisham",
  "Moolam", "Pooraadam", "Pooram", "Poorattathi", "Poosam",
  "Punarpoosam", "Revathi", "Rohini", "Sadayam", "Swathi",
  "Thiruvathirai", "Thiruvonam", "Uthiradam", "Uthiram", "Uthirattathi", "Visakam"
];

const PLACE_OPTIONS = [
  "A THEKKUR", "A.MUTHUPPATTINAM", "AAVNIPPATTI", "ALAVAKOTTAI", "ARANMANAI SIRUVAYAL",
  "ARAVAYAL", "ARIMALAM", "ARIYAGUDI", "ATHANGUDI", "CHENNAI", "CHOKALINGAM PUDUR",
  "COIMBATORE", "DEVAKOTTAI", "K.ALAGAPURI", "KADIAPATTI", "KALAYAR MANGALAM",
  "KALLAL", "KANADUKATHAN", "KANDANUR", "KANDARAMANIKKAM", "KANDAVARAYANPATTI",
  "KARAIKUDI", "KARUNGKULAM", "KEELASEVALPATTI", "KO.ALAGAPURI", "KONAPET",
  "KOPPANA PATTI", "KOTHAMANGALAM", "KOTTAIYUR", "KULIPIRAI", "KURUVIKONDANPATTI",
  "MAKIBALANPATTI", "MANAKIRI", "MATHAGU PATTI", "MELAI SIVAPURI", "MUTHU PATTINAM.K",
  "NACHANDU PATTI", "NACHIAPURAM", "NATARAJAPURAM", "NATTARASAN KOTTAI", "NEMATHANPATTI",
  "NERKUPPAI", "ONASIRUVAYAL", "OOKUR", "P.ALAGAPURI", "PAGANERY", "PALAVANGUDI",
  "PALLATHUR", "PANAGUDI", "PATTAMANGALAM", "PON PUDUPATTI", "POOLANKURICHI",
  "PUDUVAYAL", "RAMACHANDRA PURAM", "RAYAVARAM", "SIRAVAYAL", "SIRUKUDALPATTI",
  "SIVUR", "THENIPATTI", "V.LAKSHMIPURAM", "VALAYAPATTI", "VENTHAN PATTI",
  "VETRIYUR", "VIRACHILAI", "VIRAMATHI", "VISWANATHA PURAM.K"
];

async function migrate() {
  try {
    console.log('Creating dropdown_options table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dropdown_options (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category     VARCHAR(30) NOT NULL,
        value        VARCHAR(160) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON dropdown_options(category);
    `);

    console.log('Seeding data...');
    // Clear existing to avoid duplicates if run multiple times during dev
    await pool.query('DELETE FROM dropdown_options');

    let order = 1;
    for (const title of TITLE_OPTIONS) {
      await pool.query('INSERT INTO dropdown_options (category, value, display_order) VALUES ($1, $2, $3)', ['title', title, order++]);
    }
    
    order = 1;
    for (const star of STAR_OPTIONS) {
      await pool.query('INSERT INTO dropdown_options (category, value, display_order) VALUES ($1, $2, $3)', ['star', star, order++]);
    }
    
    order = 1;
    for (const place of PLACE_OPTIONS) {
      await pool.query('INSERT INTO dropdown_options (category, value, display_order) VALUES ($1, $2, $3)', ['place', place, order++]);
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
