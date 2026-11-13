const pool = require('../db/pool');
const { sendKattalaiTemplate } = require('./whatsappService');
const { v4: uuidv4 } = require('uuid');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert current time to Indian Standard Time (IST, UTC+5:30) and apply offset days
function getISTDate(offsetDays = 0) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istMs = utcMs + (5.5 * 3600000);
  const istDate = new Date(istMs);
  if (offsetDays !== 0) {
    istDate.setDate(istDate.getDate() + offsetDays);
  }
  return istDate;
}

function formatDateString(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runDailyAutomation(triggeredBy = 'Automated System Scheduler') {
  console.log(`[WhatsApp Automation] Checking daily automation triggers at ${new Date().toISOString()}...`);

  // 1. Fetch system settings
  const { rows: settingsRows } = await pool.query(
    `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('whatsapp_automation_enabled', 'whatsapp_tamil_lead_days', 'whatsapp_english_lead_days')`
  );
  const settings = {};
  settingsRows.forEach(r => {
    settings[r.setting_key] = r.setting_value;
  });

  const isEnabled = settings.whatsapp_automation_enabled === 'true';
  if (!isEnabled) {
    console.log('[WhatsApp Automation] Automated dispatch is currently disabled in System Settings. Skipping.');
    return {
      status: 'disabled',
      message: 'WhatsApp automation is currently disabled in System Settings.'
    };
  }

  const tamilLead = Math.max(1, parseInt(settings.whatsapp_tamil_lead_days || '5', 10));
  const englishLead = Math.max(1, parseInt(settings.whatsapp_english_lead_days || '2', 10));

  const tamilDate = getISTDate(tamilLead);
  const englishDate = getISTDate(englishLead);

  const tamilDay = tamilDate.getDate();
  const tamilMonth = tamilDate.getMonth() + 1;
  const tamilYear = tamilDate.getFullYear();
  const tamilTargetStr = formatDateString(tamilDate);

  const englishDay = englishDate.getDate();
  const englishMonth = englishDate.getMonth() + 1;
  const englishYear = englishDate.getFullYear();
  const englishTargetStr = formatDateString(englishDate);

  const results = {
    tamil: { targetDate: tamilTargetStr, leadDays: tamilLead, total: 0, sent: 0, failed: 0, errors: [] },
    english: { targetDate: englishTargetStr, leadDays: englishLead, total: 0, sent: 0, failed: 0, errors: [] }
  };

  // Helper to format devotee variables and send
  const dispatchSingle = async (row, isTamil, targetYear, targetDateStr) => {
    const kDate = String(row.kattalai_date).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedKattalaiDate = `${kDate}.${monthNames[parseInt(row.kattalai_month) - 1]}.${String(targetYear).slice(2)}`;

    let finalKattalaiName = row.kattalai_name || '';
    let finalKattalaiNameTa = row.kattalai_name_ta || '';
    if (finalKattalaiName.toLowerCase().includes('uchi') || finalKattalaiName.includes('உச்சி')) {
      finalKattalaiName = 'Uchikkalam';
      finalKattalaiNameTa = 'உச்சிக்காலம்';
    } else if (finalKattalaiName.toLowerCase().includes('artha') || finalKattalaiName.includes('அர்த்த')) {
      finalKattalaiName = 'Arthajamam';
      finalKattalaiNameTa = 'அர்த்தஜாமம்';
    }

    let poojaTime = '';
    if (row.kattalai_name && (row.kattalai_name.toLowerCase().includes('uchi') || row.kattalai_name.includes('உச்சி'))) {
      poojaTime = '11:30 AM';
    } else if (row.kattalai_name && (row.kattalai_name.toLowerCase().includes('artha') || row.kattalai_name.includes('அர்த்த'))) {
      poojaTime = '07:30 PM';
    }

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
    const templateName = isTamil ? process.env.WHATSAPP_TEMPLATE_TAMIL : process.env.WHATSAPP_TEMPLATE_ENGLISH;
    const imageUrl = process.env.WHATSAPP_HEADER_IMAGE_URL;

    let { success, error } = await sendKattalaiTemplate({
      countryCode,
      mobileNumber,
      templateName,
      variables,
      imageUrl,
      langCode: isTamil ? "ta" : "en",
      campaignName: `Auto Reminder (${isTamil ? 'Tamil' : 'English'}) - ${targetDateStr}`
    });

    if (!success) {
      await sleep(2500);
      const retry = await sendKattalaiTemplate({
        countryCode,
        mobileNumber,
        templateName,
        variables,
        imageUrl,
        langCode: isTamil ? "ta" : "en",
        campaignName: `Auto Reminder (${isTamil ? 'Tamil' : 'English'}) - ${targetDateStr} (Retry)`
      });
      success = retry.success;
      error = retry.error;
    }

    const status = success ? 'sent' : 'failed';

    try {
      if (!isTamil) {
        await pool.query(
          `INSERT INTO yearly_booking_records (id, booking_id, record_year, wa_status_en, wa_error_en) 
           VALUES (UUID(), $1, ${targetYear}, $2, $3) 
           ON DUPLICATE KEY UPDATE wa_status_en = VALUES(wa_status_en), wa_error_en = VALUES(wa_error_en)`,
          [row.id, status, error || null]
        );
      } else {
        await pool.query(
          `INSERT INTO yearly_booking_records (id, booking_id, record_year, wa_status_ta, wa_error_ta) 
           VALUES (UUID(), $1, ${targetYear}, $2, $3) 
           ON DUPLICATE KEY UPDATE wa_status_ta = VALUES(wa_status_ta), wa_error_ta = VALUES(wa_error_ta)`,
          [row.id, status, error || null]
        );
      }
    } catch (dbErr) {
      console.error(`[WhatsApp Automation] Failed to update yearly_booking_record for booking ${row.id}:`, dbErr.message);
    }

    return { success, error, name: row.name, mobile: mobileNumber };
  };

  // 2. Dispatch Tamil reminders (Pooja on Day D -> Sent on Day D - tamilLead)
  try {
    const { rows: tamilRows } = await pool.query(
      `SELECT b.*, ybr.wa_status_ta, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${tamilYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE b.kattalai_month = $1 AND b.kattalai_date = $2
         AND (ybr.wa_status_ta IS NULL OR ybr.wa_status_ta != 'sent')
       ORDER BY kt.display_order, b.code`,
      [tamilMonth, tamilDay]
    );

    results.tamil.total = tamilRows.length;
    console.log(`[WhatsApp Automation] Found ${tamilRows.length} eligible Tamil reminders for target date ${tamilTargetStr} (${tamilLead} days ahead).`);

    for (let i = 0; i < tamilRows.length; i++) {
      const res = await dispatchSingle(tamilRows[i], true, tamilYear, tamilTargetStr);
      if (res.success) {
        results.tamil.sent++;
      } else {
        results.tamil.failed++;
        results.tamil.errors.push({ name: res.name, mobile: res.mobile, error: res.error });
      }
      if (i < tamilRows.length - 1) await sleep(150);
    }

    if (tamilRows.length > 0) {
      await pool.query(
        `INSERT INTO whatsapp_send_history (id, lang, target_date, total, sent, failed, triggered_by, error_details)
         VALUES ($1, 'ta', $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), tamilTargetStr, results.tamil.total, results.tamil.sent, results.tamil.failed, triggeredBy, results.tamil.errors.length ? JSON.stringify(results.tamil.errors) : null]
      );
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, NULL, $2, $3, NULL)`,
        [uuidv4(), 'Automated WhatsApp Dispatch', `Automated Tamil reminders: ${results.tamil.sent}/${results.tamil.total} sent for pooja date ${tamilTargetStr} (${tamilLead} days ahead). Triggered by ${triggeredBy}`]
      );
    }
  } catch (taErr) {
    console.error('[WhatsApp Automation] Error processing Tamil automation:', taErr);
  }

  // 3. Dispatch English reminders (Pooja on Day D -> Sent on Day D - englishLead)
  try {
    const { rows: englishRows } = await pool.query(
      `SELECT b.*, ybr.wa_status_en, kt.name AS kattalai_name, kt.name_ta AS kattalai_name_ta
       FROM bookings b
       LEFT JOIN yearly_booking_records ybr ON b.id = ybr.booking_id AND ybr.record_year = ${englishYear}
       JOIN kattalai_types kt ON kt.id = b.kattalai_type_id
       WHERE b.kattalai_month = $1 AND b.kattalai_date = $2
         AND (ybr.wa_status_en IS NULL OR ybr.wa_status_en != 'sent')
       ORDER BY kt.display_order, b.code`,
      [englishMonth, englishDay]
    );

    results.english.total = englishRows.length;
    console.log(`[WhatsApp Automation] Found ${englishRows.length} eligible English reminders for target date ${englishTargetStr} (${englishLead} days ahead).`);

    for (let i = 0; i < englishRows.length; i++) {
      const res = await dispatchSingle(englishRows[i], false, englishYear, englishTargetStr);
      if (res.success) {
        results.english.sent++;
      } else {
        results.english.failed++;
        results.english.errors.push({ name: res.name, mobile: res.mobile, error: res.error });
      }
      if (i < englishRows.length - 1) await sleep(150);
    }

    if (englishRows.length > 0) {
      await pool.query(
        `INSERT INTO whatsapp_send_history (id, lang, target_date, total, sent, failed, triggered_by, error_details)
         VALUES ($1, 'en', $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), englishTargetStr, results.english.total, results.english.sent, results.english.failed, triggeredBy, results.english.errors.length ? JSON.stringify(results.english.errors) : null]
      );
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details, booking_id) VALUES ($1, NULL, $2, $3, NULL)`,
        [uuidv4(), 'Automated WhatsApp Dispatch', `Automated English reminders: ${results.english.sent}/${results.english.total} sent for pooja date ${englishTargetStr} (${englishLead} days ahead). Triggered by ${triggeredBy}`]
      );
    }
  } catch (enErr) {
    console.error('[WhatsApp Automation] Error processing English automation:', enErr);
  }

  // Update last run marker in system_settings
  const nowIstStr = formatDateString(getISTDate(0));
  try {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) VALUES ('whatsapp_last_automation_run', $1) 
       ON DUPLICATE KEY UPDATE setting_value = $2`,
      [nowIstStr, nowIstStr]
    );
  } catch (settErr) {
    console.warn('[WhatsApp Automation] Could not update whatsapp_last_automation_run:', settErr.message);
  }

  return {
    status: 'success',
    executedAt: new Date().toISOString(),
    results
  };
}

let schedulerInterval = null;

function initScheduler() {
  if (schedulerInterval) return;

  console.log('[WhatsApp Automation] Initializing daily background scheduler (IST)...');

  const checkAndRun = async () => {
    try {
      const { rows: sRows } = await pool.query(
        `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('whatsapp_automation_enabled', 'whatsapp_dispatch_time', 'whatsapp_last_automation_run')`
      );
      const sMap = {};
      sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });

      if (sMap.whatsapp_automation_enabled !== 'true') {
        return;
      }

      const istDate = getISTDate(0);
      const istHour = istDate.getHours();
      const istMinute = istDate.getMinutes();
      const todayStr = formatDateString(istDate);

      const targetTimeStr = sMap.whatsapp_dispatch_time || '06:00';
      const [schedHour, schedMin] = targetTimeStr.split(':').map(Number);
      const currentTotalMin = istHour * 60 + istMinute;
      const schedTotalMin = (schedHour || 6) * 60 + (schedMin || 0);

      // Run when current IST time reaches or passes the configured dispatch time
      if (currentTotalMin >= schedTotalMin) {
        const lastRun = sMap.whatsapp_last_automation_run;

        if (lastRun !== todayStr) {
          console.log(`[WhatsApp Automation] Scheduler triggering automatic daily dispatch for date ${todayStr} (Configured Time: ${targetTimeStr} IST, Current: ${String(istHour).padStart(2, '0')}:${String(istMinute).padStart(2, '0')})...`);
          await runDailyAutomation(`Automated Daily Schedule (${targetTimeStr} IST)`);
        }
      }
    } catch (err) {
      console.error('[WhatsApp Automation] Scheduler check error:', err.message);
    }
  };

  // Run initial check 15 seconds after server startup
  setTimeout(checkAndRun, 15000);

  // Check every 5 minutes so it dispatches promptly at 06:00 AM IST
  schedulerInterval = setInterval(checkAndRun, 5 * 60 * 1000);
}

module.exports = {
  runDailyAutomation,
  initScheduler,
  getISTDate
};
