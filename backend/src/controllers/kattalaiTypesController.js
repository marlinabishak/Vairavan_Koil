const pool = require('../db/pool');

async function listKattalaiTypes(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM kattalai_types WHERE active = true ORDER BY display_order`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error [kattalaiTypesController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch kattalai types' });
  }
}

async function createKattalaiType(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { name, name_ta, color_key, default_amount, display_order } = req.body;
  if (!name || !color_key) {
    return res.status(400).json({ error: 'name and color_key are required' });
  }
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO kattalai_types (id, name, name_ta, color_key, default_amount, display_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, name, name_ta, color_key, default_amount || 0, display_order || 0]
    );
    const { rows } = await pool.query('SELECT * FROM kattalai_types WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [kattalaiTypesController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to create kattalai type' });
  }
}
async function updateKattalaiType(req, res) {
  const { id } = req.params;
  const { max_slots } = req.body;
  if (max_slots === undefined) {
    return res.status(400).json({ error: 'max_slots is required' });
  }
  try {
    await pool.query(
      `UPDATE kattalai_types SET max_slots = $1 WHERE id = $2`,
      [max_slots, id]
    );
    const { rows } = await pool.query('SELECT * FROM kattalai_types WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [kattalaiTypesController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update kattalai type' });
  }
}

module.exports = { listKattalaiTypes, createKattalaiType, updateKattalaiType };
