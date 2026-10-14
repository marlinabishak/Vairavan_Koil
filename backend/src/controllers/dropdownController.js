const pool = require('../db/pool');

// GET /api/dropdown-options?category=title
async function getOptions(req, res) {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM dropdown_options';
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, display_order, created_at';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error [dropdownController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch dropdown options' });
  }
}

// POST /api/dropdown-options
async function addOption(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { category, value } = req.body;
  
  if (!category || !value) {
    return res.status(400).json({ error: 'category and value are required' });
  }

  const id = uuidv4();

  try {
    // Get max display order for this category
    const maxRes = await pool.query('SELECT MAX(display_order) as max_order FROM dropdown_options WHERE category = $1', [category]);
    const nextOrder = (maxRes.rows[0].max_order || 0) + 1;

    await pool.query(
      'INSERT INTO dropdown_options (id, category, value, display_order) VALUES ($1, $2, $3, $4)',
      [id, category, value, nextOrder]
    );
    const { rows } = await pool.query('SELECT * FROM dropdown_options WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [dropdownController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to add dropdown option' });
  }
}

// DELETE /api/dropdown-options/:id
async function deleteOption(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM dropdown_options WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error [dropdownController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to delete dropdown option' });
  }
}

module.exports = {
  getOptions,
  addOption,
  deleteOption
};
