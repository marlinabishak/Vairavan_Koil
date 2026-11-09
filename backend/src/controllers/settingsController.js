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

    if (key === 'transfer_base_amount' || key === 'kattalai_base_amount' || key === 'archanai_fee') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: `${key} must be a positive number` });
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
