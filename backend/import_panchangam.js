const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('./src/db/pool');
require('dotenv').config();

function normalizeDate(raw) {
  if (!raw) return null;
  const str = String(raw).replace(/^\uFEFF/, '').trim();
  
  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return null;
}

function normalizeTiming(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '-') return null;
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      JSON.parse(str);
      return str;
    } catch (e) {
      // not valid JSON, proceed to parse
    }
  }
  const ranges = str.split(',').map(s => s.trim()).filter(Boolean);
  const parsed = ranges.map(range => {
    const dashIdx = range.indexOf('-');
    if (dashIdx !== -1) {
      return {
        start: range.slice(0, dashIdx).trim(),
        end: range.slice(dashIdx + 1).trim()
      };
    }
    return { start: range, end: '' };
  });
  return JSON.stringify(parsed);
}

function normalizeHeaderKey(key) {
  if (!key) return '';
  return key.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_:-]+/g, '');
}

function healRowValues(rawValues) {
  if (!rawValues || rawValues.length <= 17) {
    return rawValues;
  }
  
  // Clone and trim each value
  const values = rawValues.map(v => (v !== undefined && v !== null ? String(v).trim() : ''));
  
  // Strip trailing empty cells if the row has more than 17 cells
  while (values.length > 17 && values[values.length - 1] === '') {
    values.pop();
  }
  
  if (values.length <= 17) {
    return values;
  }
  
  // The first 12 columns are strictly fixed:
  // [0] date, [1..4] 4 timings, [5..11] 7 astro fields
  const fixedFirst12 = values.slice(0, 12);
  
  // The last 3 columns are strictly fixed:
  // [end - 3] tamil_month
  // [end - 2] tamil_year
  // [end - 1] tamil_day_number
  const lastCol = values[values.length - 1];
  const secondLastCol = values[values.length - 2];
  const thirdLastCol = values[values.length - 3];
  
  // The middle slice contains special_note and worship_note split by unquoted commas
  const middleSlice = values.slice(12, values.length - 3);
  let specialNote = '';
  let worshipNote = '';
  
  if (middleSlice.length === 1) {
    specialNote = middleSlice[0];
  } else if (middleSlice.length === 2) {
    specialNote = middleSlice[0];
    worshipNote = middleSlice[1];
  } else {
    // Multi-part split due to unquoted commas (e.g. "பிரம்மா, விஷ்ணு, சிவனை நினைத்து வழிபடுதல்.")
    // Column 13 (middleSlice[0]) is special_note, and the rest (middleSlice[1..n]) forms the worship_note
    specialNote = middleSlice[0];
    worshipNote = middleSlice.slice(1).filter(Boolean).join(', ');
  }
  
  // Clean surrounding quotes if unquoted CSV split left stray quotes
  const cleanQuotes = (str) => String(str || '').replace(/^"+|"+$/g, '').trim();
  
  return [
    ...fixedFirst12,
    cleanQuotes(specialNote),
    cleanQuotes(worshipNote),
    cleanQuotes(thirdLastCol),
    cleanQuotes(secondLastCol),
    cleanQuotes(lastCol)
  ];
}

async function importPanchangamFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  console.log(`\n📅 Reading Panchangam CSV from: ${resolvedPath}`);
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(resolvedPath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${rows.length} rows from CSV. Starting database upsert...`);

  let successCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const keys = Object.keys(raw);
    const rawValues = Object.values(raw).map(v => (v !== undefined && v !== null ? String(v).trim() : ''));

    let dateVal, nallaNeram, yamagandam, kuligai, rahuKalam;
    let thithi, thithiTime, natchathiram, yogam;
    let chandrashtamam, kulam, parigaram, specialNote, worshipNote;
    let tamilMonth, tamilYear, tamilDayNumber;

    if (rawValues.length > 17) {
      // Auto-healing parser: automatically stitch back middle fields split by unquoted commas
      const healed = healRowValues(rawValues);
      dateVal = normalizeDate(healed[0]);
      nallaNeram = normalizeTiming(healed[1]);
      yamagandam = normalizeTiming(healed[2]);
      kuligai = normalizeTiming(healed[3]);
      rahuKalam = normalizeTiming(healed[4]);
      thithi = healed[5] || '';
      thithiTime = healed[6] || '';
      natchathiram = healed[7] || '';
      yogam = healed[8] || '';
      chandrashtamam = healed[9] || '';
      kulam = healed[10] || '';
      parigaram = healed[11] || '';
      specialNote = healed[12] || '';
      worshipNote = healed[13] || '';
      tamilMonth = healed[14] || '';
      tamilYear = healed[15] || '';
      tamilDayNumber = healed[16] ? parseInt(healed[16], 10) || null : null;
    } else {
      // Standard header-mapped extraction
      const getVal = (...aliases) => {
        for (const alias of aliases) {
          const normAlias = normalizeHeaderKey(alias);
          for (const k of keys) {
            if (normalizeHeaderKey(k) === normAlias) {
              return raw[k];
            }
          }
        }
        return null;
      };

      dateVal = normalizeDate(getVal('date', 'panch_date', 'தேதி') || raw[keys[0]]);
      nallaNeram = normalizeTiming(getVal('nalla_neram', 'nallaneram', 'நல்ல நேரம்', 'நல்லநேரம்') || raw[keys[1]]);
      yamagandam = normalizeTiming(getVal('yamagandam', 'எமகண்டம்') || raw[keys[2]]);
      kuligai = normalizeTiming(getVal('kuligai', 'குளிகை') || raw[keys[3]]);
      rahuKalam = normalizeTiming(getVal('rahu_kalam', 'rahukalam', 'rahu', 'ராகு', 'ராகுகாலம்') || raw[keys[4]]);
      thithi = (getVal('thithi', 'திதி') || raw[keys[5]] || '').trim();
      thithiTime = (getVal('thithi_time', 'thithitime', 'திதி நேரம்', 'திதிநேரம்') || raw[keys[6]] || '').trim();
      natchathiram = (getVal('natchathiram', 'star', 'நட்சத்திரம்') || raw[keys[7]] || '').trim();
      yogam = (getVal('yogam', 'யோகம்') || raw[keys[8]] || '').trim();
      chandrashtamam = (getVal('chandrashtamam', 'சந்திராஷ்டமம்') || raw[keys[9]] || '').trim();
      kulam = (getVal('kulam', 'குளம்', 'சூலம்') || raw[keys[10]] || '').trim();
      parigaram = (getVal('parigaram', 'பரிகாரம்') || raw[keys[11]] || '').trim();
      specialNote = (getVal('special_note', 'specialnote', 'special', 'சிறப்பு', 'சிறப்புகுறிப்பு') || raw[keys[12]] || '').trim();
      worshipNote = (getVal('worship_note', 'worshipnote', 'worship', 'வழிபாடு') || raw[keys[13]] || '').trim();

      // Last 3 columns: tamil_month, tamil_year, tamil_day_number
      tamilMonth = (getVal('tamil_month', 'tamilmonth', 'month', 'தமிழ் மாதம்', 'மாதம்') || raw[keys[keys.length - 3]] || raw[keys[14]] || '').trim();
      tamilYear = (getVal('tamil_year', 'tamilyear', 'year', 'தமிழ் வருடம்', 'வருடம்') || raw[keys[keys.length - 2]] || raw[keys[15]] || '').trim();
      const tamilDayNumberRaw = (getVal('tamil_day_number', 'tamildaynumber', 'day', 'tamil_day', 'தமிழ் தேதி', 'தேதி எண்') || raw[keys[keys.length - 1]] || raw[keys[16]] || '').trim();
      tamilDayNumber = tamilDayNumberRaw ? parseInt(tamilDayNumberRaw, 10) || null : null;
    }

    if (!dateVal) {
      console.warn(`Row ${i + 1} skipped: invalid or missing date.`);
      continue;
    }

    await pool.query(
      `INSERT INTO panchangam (
        panch_date, nalla_neram, yamagandam, kuligai, rahu_kalam,
        thithi, thithi_time, natchathiram, yogam,
        chandrashtamam, kulam, parigaram, special_note, worship_note,
        tamil_month, tamil_year, tamil_day_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nalla_neram = VALUES(nalla_neram),
        yamagandam = VALUES(yamagandam),
        kuligai = VALUES(kuligai),
        rahu_kalam = VALUES(rahu_kalam),
        thithi = VALUES(thithi),
        thithi_time = VALUES(thithi_time),
        natchathiram = VALUES(natchathiram),
        yogam = VALUES(yogam),
        chandrashtamam = VALUES(chandrashtamam),
        kulam = VALUES(kulam),
        parigaram = VALUES(parigaram),
        special_note = VALUES(special_note),
        worship_note = VALUES(worship_note),
        tamil_month = VALUES(tamil_month),
        tamil_year = VALUES(tamil_year),
        tamil_day_number = VALUES(tamil_day_number)`,
      [
        dateVal, nallaNeram, yamagandam, kuligai, rahuKalam,
        thithi, thithiTime, natchathiram, yogam,
        chandrashtamam, kulam, parigaram, specialNote, worshipNote,
        tamilMonth, tamilYear, tamilDayNumber
      ]
    );

    successCount++;
  }

  console.log(`✅ Successfully imported/upserted ${successCount} days into panchangam table!`);
  return successCount;
}

if (require.main === module) {
  const fileArg = process.argv[2] || path.join(__dirname, 'panchangam_template.csv');
  importPanchangamFile(fileArg)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Panchangam import error:', err);
      process.exit(1);
    });
}

module.exports = { importPanchangamFile, healRowValues };
