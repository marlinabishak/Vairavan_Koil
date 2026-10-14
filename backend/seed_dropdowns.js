const pool = require('./src/db/pool');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_OPTIONS = {
  title: [
    "Thiru", "Thirumathi", "Selvi", "Selvan"
  ],
  star: [
    "Anusam", "Aswathi", "Avittam", "Ayilyam", "Bharani", "Chithirai",
    "Hastham", "Karthikai", "Keettai", "Magam", "Mirukashirisham",
    "Moolam", "Pooraadam", "Pooram", "Poorattathi", "Poosam",
    "Punarpoosam", "Revathi", "Rohini", "Sadayam", "Swathi",
    "Thiruvathirai", "Thiruvonam", "Uthiradam", "Uthiram", "Uthirattathi", "Visakam"
  ],
  place: [
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
  ],
  kat_type: [
    "Lifetime", "Inheritance"
  ]
};

async function seed() {
  try {
    for (const [category, values] of Object.entries(DEFAULT_OPTIONS)) {
      // Check if category already has entries
      const res = await pool.query('SELECT COUNT(*) as count FROM dropdown_options WHERE category = $1', [category]);
      const count = res.rows[0].count;
      
      if (count == 0) {
        console.log(`Seeding ${category} options...`);
        let order = 1;
        for (const val of values) {
          await pool.query(
            'INSERT INTO dropdown_options (id, category, value, display_order) VALUES ($1, $2, $3, $4)',
            [uuidv4(), category, val, order++]
          );
        }
      } else {
        console.log(`${category} options already seeded. Skipping.`);
      }
    }
    console.log('Dropdown seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding dropdowns:', err);
    process.exit(1);
  }
}

seed();
