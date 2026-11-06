const pool = require('../db/pool');

// GET /api/panchangam/:date  (date = YYYY-MM-DD)
async function getPanchangam(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT *, DATE_FORMAT(panch_date, '%Y-%m-%d') as panch_date FROM panchangam WHERE panch_date = $1`,
      [req.params.date]
    );
    if (!rows.length) return res.status(404).json({ error: 'No panchangam data for this date' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [panchangamController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch panchangam' });
  }
}

// PUT /api/panchangam/:date - upsert (admin data entry / import)
async function upsertPanchangam(req, res) {
  const d = req.params.date;
  const {
    tamil_month, tamil_year, tamil_day_number, nalla_neram, yamagandam,
    kuligai, rahu_kalam, thithi, thithi_time, natchathiram, yogam,
    chandrashtamam, kulam, parigaram, special_note, worship_note,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO panchangam
        (panch_date, tamil_month, tamil_year, tamil_day_number, nalla_neram, yamagandam,
         kuligai, rahu_kalam, thithi, thithi_time, natchathiram, yogam,
         chandrashtamam, kulam, parigaram, special_note, worship_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON DUPLICATE KEY UPDATE
         tamil_month=VALUES(tamil_month), tamil_year=VALUES(tamil_year), tamil_day_number=VALUES(tamil_day_number), nalla_neram=VALUES(nalla_neram), yamagandam=VALUES(yamagandam),
         kuligai=VALUES(kuligai), rahu_kalam=VALUES(rahu_kalam), thithi=VALUES(thithi), thithi_time=VALUES(thithi_time), natchathiram=VALUES(natchathiram), yogam=VALUES(yogam),
         chandrashtamam=VALUES(chandrashtamam), kulam=VALUES(kulam), parigaram=VALUES(parigaram), special_note=VALUES(special_note), worship_note=VALUES(worship_note)`,
      [d, tamil_month, tamil_year, tamil_day_number, 
       nalla_neram ? JSON.stringify(nalla_neram) : null, 
       yamagandam ? JSON.stringify(yamagandam) : null,
       kuligai ? JSON.stringify(kuligai) : null, 
       rahu_kalam ? JSON.stringify(rahu_kalam) : null, 
       thithi, thithi_time, natchathiram, yogam,
       chandrashtamam, kulam, parigaram, special_note, worship_note]
    );
    const { rows } = await pool.query('SELECT * FROM panchangam WHERE panch_date = $1', [d]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [panchangamController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to save panchangam' });
  }
}

const { importPanchangamFile } = require('../../import_panchangam');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function uploadCsv(req, res) {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }
    const tempFile = path.join(os.tmpdir(), `panchangam_import_${Date.now()}.csv`);
    fs.writeFileSync(tempFile, csvContent, 'utf8');
    const count = await importPanchangamFile(tempFile);
    try { fs.unlinkSync(tempFile); } catch (e) {}

    // Audit log
    try {
      const { v4: uuidv4 } = require('uuid');
      const staffName = req.user?.name || 'Administrator';
      const staffRole = req.user?.role || 'admin';
      const staffUsername = req.user?.email ? ` (login: ${req.user.email})` : '';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [
          uuidv4(),
          req.user?.id || null,
          'Uploaded Panchangam',
          `Imported ${count} days of Panchangam data from CSV. Uploaded by ${staffName} [${staffRole}]${staffUsername}.`
        ]
      );
    } catch (logErr) {
      console.error('Audit log failed for panchangam upload:', logErr.message);
    }

    res.json({ message: `Successfully imported ${count} days of Panchangam data`, count });
  } catch (err) {
    console.error('Error [uploadCsv]:', err.stack || err);
    res.status(500).json({ error: err.message || 'Failed to import panchangam CSV' });
  }
}

module.exports = { getPanchangam, upsertPanchangam, uploadCsv };
