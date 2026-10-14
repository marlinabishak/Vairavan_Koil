const pool = require('../db/pool');

// GET /api/todos - returns lists with nested items
async function listTodos(req, res) {
  try {
    const lists = await pool.query(`SELECT * FROM todo_lists ORDER BY display_order`);
    const items = await pool.query(`SELECT * FROM todo_items ORDER BY display_order, created_at`);

    const result = lists.rows.map((list) => ({
      ...list,
      items: items.rows.filter((i) => i.todo_list_id === list.id),
    }));
    res.json(result);
  } catch (err) {
    console.error('Error [todosController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
}

// POST /api/todos/:listId/items  Body: { name, booking_id? }
async function addTodoItem(req, res) {
  const { v4: uuidv4 } = require('uuid');
  const { name, booking_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO todo_items (id, todo_list_id, name, booking_id) VALUES ($1,$2,$3,$4)`,
      [id, req.params.listId, name, booking_id || null]
    );
    const { rows } = await pool.query('SELECT * FROM todo_items WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error [todosController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to add todo item' });
  }
}

// PATCH /api/todos/items/:itemId  Body: { completed }
async function updateTodoItem(req, res) {
  try {
    await pool.query(
      `UPDATE todo_items SET completed = $1 WHERE id = $2`,
      [!!req.body.completed, req.params.itemId]
    );
    const { rows } = await pool.query('SELECT * FROM todo_items WHERE id = $1', [req.params.itemId]);
    if (!rows.length) return res.status(404).json({ error: 'Todo item not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error [todosController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to update todo item' });
  }
}

// DELETE /api/todos/items/:itemId
async function deleteTodoItem(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM todo_items WHERE id = $1', [req.params.itemId]);
    if (!rowCount) return res.status(404).json({ error: 'Todo item not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error [todosController]:', err.stack || err);
    res.status(500).json({ error: 'Failed to delete todo item' });
  }
}

module.exports = { listTodos, addTodoItem, updateTodoItem, deleteTodoItem };
