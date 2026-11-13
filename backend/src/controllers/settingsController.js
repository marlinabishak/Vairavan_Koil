const pool = require('../db/pool');

// GET /api/settings
async function getSettings(req, res) {
  try {
    const { rows } = await pool.query('SELECT setting_key, setting_value, description FROM system_settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.setting_key] = r.setting_value;
    });
    // Ensure default system settings are present and synchronized
    const baseAmount = settingsMap.kattalai_base_amount || settingsMap.transfer_base_amount || '3500';
    settingsMap.kattalai_base_amount = baseAmount;
    settingsMap.transfer_base_amount = baseAmount;
    if (!settingsMap.archanai_fee) {
      settingsMap.archanai_fee = '200';
    }
    if (!settingsMap.transfer_extra_fee) {
      settingsMap.transfer_extra_fee = settingsMap.archanai_fee || '200';
    }
    if (!settingsMap.thuritha_kattalai_amount) {
      settingsMap.thuritha_kattalai_amount = settingsMap.thani_archanai_amount || settingsMap.archanai_fee || '200';
    }
    if (!settingsMap.edit_unlock_base_amount) {
      settingsMap.edit_unlock_base_amount = '3500';
    }
    if (!settingsMap.whatsapp_automation_enabled) {
      settingsMap.whatsapp_automation_enabled = 'false';
    }
    if (!settingsMap.whatsapp_tamil_lead_days) {
      settingsMap.whatsapp_tamil_lead_days = '5';
    }
    if (!settingsMap.whatsapp_english_lead_days) {
      settingsMap.whatsapp_english_lead_days = '2';
    }
    if (!settingsMap.whatsapp_dispatch_time) {
      settingsMap.whatsapp_dispatch_time = '06:00';
    }
    res.json(settingsMap);
  } catch (err) {
    console.error('Error [settingsController.getSettings]:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

// PUT /api/settings
async function updateSetting(req, res) {
  try {
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied. Only administrators can update system settings.' });
    }

    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    if (key === 'transfer_base_amount' || key === 'kattalai_base_amount' || key === 'archanai_fee' || key === 'transfer_extra_fee' || key === 'edit_unlock_base_amount' || key === 'thuritha_kattalai_amount' || key === 'thani_archanai_amount') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: `${key} must be a positive number` });
      }
    }

    if (key === 'whatsapp_tamil_lead_days' || key === 'whatsapp_english_lead_days') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1 || num > 30) {
        return res.status(400).json({ error: `${key} must be an integer between 1 and 30` });
      }
    }

    if (key === 'whatsapp_dispatch_time') {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(String(value).trim())) {
        return res.status(400).json({ error: 'whatsapp_dispatch_time must be in HH:MM format (24-hour)' });
      }
    }

    if (key === 'whatsapp_automation_enabled') {
      const strVal = String(value).toLowerCase();
      if (strVal !== 'true' && strVal !== 'false') {
        return res.status(400).json({ error: 'whatsapp_automation_enabled must be true or false' });
      }
    }

    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ($1, $2)
       ON DUPLICATE KEY UPDATE setting_value = $3`,
      [key, String(value), String(value)]
    );

    // Keep base endowment fee in sync between registration and transfer calculation
    if (key === 'kattalai_base_amount' || key === 'transfer_base_amount') {
      const otherKey = key === 'kattalai_base_amount' ? 'transfer_base_amount' : 'kattalai_base_amount';
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES ($1, $2)
         ON DUPLICATE KEY UPDATE setting_value = $3`,
        [otherKey, String(value), String(value)]
      );
    }

    // Record audit log in history_logs for Panchangam & Settings tab
    try {
      const { v4: uuidv4 } = require('uuid');
      const staffName = req.user?.name || req.user?.username || 'Administrator';
      await pool.query(
        `INSERT INTO history_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [
          uuidv4(),
          req.user?.id || null,
          'Updated System Setting',
          `Administrator ${staffName} updated system configuration "${key}" to "${value}".`
        ]
      );
    } catch (logErr) {
      console.warn('Settings audit log warning:', logErr.message);
    }

    res.json({ success: true, key, value });
  } catch (err) {
    console.error('Error [settingsController.updateSetting]:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
}

module.exports = {
  getSettings,
  updateSetting
};
