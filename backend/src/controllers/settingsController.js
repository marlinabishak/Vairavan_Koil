const pool = require('../db/pool');

// GET /api/settings
async function getSettings(req, res) {
  try {
    const { rows } = await pool.query('SELECT setting_key, setting_value, description FROM system_settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.setting_key] = r.setting_value;
    });
    // Ensure default transfer_base_amount is present
    if (!settingsMap.transfer_base_amount) {
      settingsMap.transfer_base_amount = '3500';
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
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    if (key === 'transfer_base_amount') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: 'Transfer base amount must be a positive number' });
      }
    }

    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ($1, $2)
       ON DUPLICATE KEY UPDATE setting_value = $3`,
      [key, String(value), String(value)]
    );

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
