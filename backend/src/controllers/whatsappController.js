const pool = require('../db/pool');
const { sendKattalaiTemplate } = require('../services/whatsappService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDatePairs(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const pairs = [];
  let curr = new Date(start);
  while (curr <= end) {
    pairs.push({ m: curr.getMonth() + 1, d: curr.getDate() });
    curr.setDate(curr.getDate() + 1);
  }
  return pairs;
}

function buildDateQuery(pairs, startIndex = 1) {
  let paramIndex = startIndex;
  const conditions = [];
  const params = [];
  for (const p of pairs) {
    conditions.push(`(b.kattalai_month = $${paramIndex++} AND b.kattalai_date = $${paramIndex++})`);
    params.push(p.m, p.d);
  }
  return { clause: `(${conditions.join(' OR ')})`, params, nextIndex: paramIndex };
}

async function sendBatch(req, res) {
  const { date: exactDate, fromDate, toDate, lang } = req.body;
  const isTamil = lang === 'ta';
  
  let campaignName = (fromDate || exactDate);
  if (fromDate !== toDate) {
    campaignName = `${fromDate || exactDate} to ${toDate || exactDate}`;
  }
  campaignName = `Kattalai Reminders - ${campaignName}`;

  const start = fromDate || exactDate;
  const end = toDate || exactDate;

  if (!start || !end || !lang) {
    return res.status(400).json({ error: 'date/fromDate/toDate and lang are required' });
  }

  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Unauthorized to send WhatsApp campaigns.' });
  }

  try {
    const templateName = isTamil ? process.env.WHATSAPP_TEMPLATE_TAMIL : process.env.WHATSAPP_TEMPLATE_ENGLISH;
    const imageUrl = process.env.WHATSAPP_HEADER_IMAGE_URL;

    const pairs = getDatePairs(start, end);
    if (pairs.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 days allowed' });
    }
    const { clause, params } = buildDateQuery(pairs);

    const targetYear = start ? parseInt(start.split('-')[0], 10) : new Date().getFullYear();

    const { rows } = await pool.query(
      `SELECT b.*, ybr.wa_status_en, ybr.wa_status_ta, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${targetYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE ${clause}
       ORDER BY b.kattalai_month, b.kattalai_date, kt.display_order`,
      params
    );

    const results = [];
    const failures = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const kDate = String(row.kattalai_date).padStart(2, '0');
      const kMonth = String(row.kattalai_month).padStart(2, '0');
      // No year stored in DB, fallback to current year
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedKattalaiDate = `${kDate}.${monthNames[parseInt(row.kattalai_month) - 1]}.${String(targetYear).slice(2)}`;

      let finalKattalaiName = row.kattalai_name || '';
      let finalKattalaiNameTa = row.kattalai_name_ta || '';
      if (finalKattalaiName.toLowerCase().includes('uchi')) {
        finalKattalaiName = 'Uchikkalam';
        finalKattalaiNameTa = 'உச்சிக்காலம்';
      } else if (finalKattalaiName.toLowerCase().includes('artha')) {
        finalKattalaiName = 'Arthajamam';
        finalKattalaiNameTa = 'அர்த்தஜாமம்';
      }

      let poojaTime = '';
      if (row.kattalai_name && row.kattalai_name.toLowerCase().includes('uchi')) poojaTime = '11:30 AM';
      else if (row.kattalai_name && row.kattalai_name.toLowerCase().includes('artha')) poojaTime = '07:30 PM';

      let variables;
      if (!isTamil) {
        variables = [
          row.code,
          (row.title || '').trim(),
          (row.name || '').trim(),
          finalKattalaiName,
          formattedKattalaiDate,
          poojaTime,
          row.place,
          row.star
        ];
      } else {
        variables = [
          row.code,
          row.place_ta || row.place,
          (row.title_ta || row.title || '').trim(),
          (row.name_ta || row.name || '').trim(),
          finalKattalaiNameTa,
          formattedKattalaiDate,
          row.star_ta || row.star,
          poojaTime
        ];
      }

      variables = variables.map(v => String(v || "") || "-");

      const mobileNumber = row.whatsapp_number || row.mobile;
      const countryCode = row.country_code || '91';

      console.log(`[BatchSender] Sending to ${row.name}, vars:`, JSON.stringify(variables));

      let { success, error } = await sendKattalaiTemplate({
        countryCode,
        mobileNumber,
        templateName,
        variables,
        imageUrl,
        langCode: isTamil ? "ta" : "en",
        campaignName
      });

      if (!success) {
        await sleep(3000);
        const retry = await sendKattalaiTemplate({
          countryCode,
          mobileNumber,
          templateName,
          variables,
          imageUrl,
          langCode: isTamil ? "ta" : "en",
        });
        success = retry.success;
        error = retry.error;
      }

      const status = success ? "sent" : "failed";

      try {
        if (!isTamil) {
          await pool.query(
            `INSERT INTO yearly_booking_records (id, booking_id, record_year, wa_status_en, wa_error_en) VALUES (UUID(), $1, ${targetYear}, $2, $3) ON DUPLICATE KEY UPDATE wa_status_en = VALUES(wa_status_en), wa_error_en = VALUES(wa_error_en)`,
            [row.id, status, error || null]
          );
        } else {
          await pool.query(
            `INSERT INTO yearly_booking_records (id, booking_id, record_year, wa_status_ta, wa_error_ta) VALUES (UUID(), $1, ${targetYear}, $2, $3) ON DUPLICATE KEY UPDATE wa_status_ta = VALUES(wa_status_ta), wa_error_ta = VALUES(wa_error_ta)`,
            [row.id, status, error || null]
          );
        }
      } catch (dbErr) {
        console.error(`[whatsappController] Failed to update yearly_booking_record for booking ${row.id}:`, dbErr.message);
      }

      results.push({
        id: row.id,
        contact_name: row.name,
        mobile_number: mobileNumber,
        status,
        error,
      });

      if (!success) {
        failures.push({ name: row.name, mobile: mobileNumber, error });
      }

      if (i < rows.length - 1) {
        await sleep(100);
      }
      if ((i + 1) % 50 === 0 && i < rows.length - 1) {
        await sleep(2000);
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;

    try {
      const { v4: uuidv4 } = require('uuid');
      const targetDateStr = (start === end) ? start : `${start} to ${end}`;
      const staffIdentifier = req.user?.name ? `${req.user.name} (${req.user.role})` : (req.user?.role || 'manual');
      
      await pool.query(
        `INSERT INTO whatsapp_send_history (id, lang, target_date, total, sent, failed, triggered_by, error_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), lang, targetDateStr, results.length, sentCount, results.length - sentCount, staffIdentifier, failures.length ? JSON.stringify(failures) : null]
      );

      // Audit log into history_logs
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, $2, $3, $4, NULL)`,
        [
          uuidv4(),
          req.user?.id || null,
          'Sent WhatsApp Reminders',
          `Sent ${sentCount}/${results.length} reminders (${lang.toUpperCase()}) for date ${targetDateStr}. Triggered by ${staffIdentifier}`
        ]
      );
    } catch (histErr) {
      console.error("Failed to write send_history:", histErr.message);
    }

    res.json({
      lang,
      targetDate: (start === end) ? start : `${start} to ${end}`,
      total: results.length,
      sent: sentCount,
      failed: results.length - sentCount,
      results,
    });
  } catch (err) {
    console.error('Error [whatsappController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to process whatsapp batch' });
  }
}

async function getHistory(req, res) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Unauthorized to view WhatsApp history.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM whatsapp_send_history ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [whatsappController.getHistory]:', err);
    res.status(500).json({ error: 'Failed to fetch whatsapp history' });
  }
}

async function previewBatch(req, res) {
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    return res.status(400).json({ error: 'fromDate and toDate are required' });
  }

  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  try {
    const pairs = getDatePairs(fromDate, toDate);
    if (pairs.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 days allowed' });
    }
    const { clause, params } = buildDateQuery(pairs);

    const targetYear = fromDate ? parseInt(fromDate.split('-')[0], 10) : new Date().getFullYear();

    const { rows } = await pool.query(
      `SELECT b.id, b.name, b.name_ta, b.title, b.title_ta, b.star, b.star_ta, b.place, b.place_ta, b.mobile, b.whatsapp_number, b.country_code, b.kattalai_date, b.kattalai_month, b.code, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta, ybr.wa_status_en, ybr.wa_status_ta
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${targetYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE ${clause}
       ORDER BY b.kattalai_month, b.kattalai_date, kt.display_order`,
      params
    );

    res.json({ count: rows.length, users: rows });
  } catch (err) {
    console.error('Error [whatsappController.previewBatch]:', err);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
}

module.exports = { sendBatch, getHistory, previewBatch };
