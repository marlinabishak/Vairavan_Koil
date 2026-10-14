const pool = require('./src/db/pool');

async function insertPanchangam() {
  const data = {
    panch_date: '2026-09-24',
    tamil_month: 'Purattasi',
    tamil_year: 'Krothi',
    tamil_day_number: 8,
    nalla_neram: JSON.stringify([{start: "07:31 am", end: "09:00 am"}]),
    yamagandam: JSON.stringify([{start: "09:00 am", end: "10:30 am"}]),
    kuligai: JSON.stringify([{start: "12:00 pm", end: "01:30 pm"}]),
    rahu_kalam: JSON.stringify([{start: "03:00 pm", end: "04:30 pm"}]),
    thithi: 'ஏகாதசி',
    thithi_time: 'தசமி காலை 10.36',
    natchathiram: 'பரணி இரவு 9.26',
    yogam: 'மரண-அமிர்த',
    chandrashtamam: 'மகம்',
    kulam: 'வடக்கு',
    parigaram: 'பால்',
    special_note: 'தத்தாத்ரேயர் ஜெயந்தி.\nஅக்ஷயலோகாம் 32வது பட்டம்\nஅடைந்திய சிங்கர் திருநட்சத்திரம்.',
    worship_note: 'பிரம்மா, விஷ்ணு, சிவனை நினைத்து\nவழிபடுதல்.'
  };

  try {
    await pool.query(
      "INSERT INTO panchangam (panch_date, tamil_month, tamil_year, tamil_day_number, nalla_neram, yamagandam, kuligai, rahu_kalam, thithi, thithi_time, natchathiram, yogam, chandrashtamam, kulam, parigaram, special_note, worship_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tamil_month=VALUES(tamil_month), tamil_year=VALUES(tamil_year), tamil_day_number=VALUES(tamil_day_number), nalla_neram=VALUES(nalla_neram), yamagandam=VALUES(yamagandam), kuligai=VALUES(kuligai), rahu_kalam=VALUES(rahu_kalam), thithi=VALUES(thithi), thithi_time=VALUES(thithi_time), natchathiram=VALUES(natchathiram), yogam=VALUES(yogam), chandrashtamam=VALUES(chandrashtamam), kulam=VALUES(kulam), parigaram=VALUES(parigaram), special_note=VALUES(special_note), worship_note=VALUES(worship_note)",
      [
        data.panch_date, data.tamil_month, data.tamil_year, data.tamil_day_number,
        data.nalla_neram, data.yamagandam, data.kuligai, data.rahu_kalam,
        data.thithi, data.thithi_time, data.natchathiram, data.yogam,
        data.chandrashtamam, data.kulam, data.parigaram, data.special_note, data.worship_note
      ]
    );
    console.log("Panchangam updated successfully with multiline Tamil data!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertPanchangam();
