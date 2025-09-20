// controllers/recipes.controller.js
const { pool } = require('../database/cr_index.js');

const asArray = (v) => Array.isArray(v) ? v : [];

// POST /recipes
async function createRecipe(req, res) {
  const client = await pool.connect();
  try {
    const { name, description, wantsVideo = false } = req.body || {};
    const ingredients  = asArray(req.body?.ingredients);
    const instructions = asArray(req.body?.instructions);

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    await client.query('BEGIN');

    const r = await client.query(
      `INSERT INTO recipes (name, description, wants_video)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [String(name).trim(), String(description).trim(), !!wantsVideo]
    );
    const recipeId = r.rows[0].id;

    for (const ing of ingredients) {
      await client.query(
        `INSERT INTO ingredients (recipe_id, name, qty, unit)
         VALUES ($1,$2,$3,$4)`,
        [recipeId, ing.name || '', ing.qty || '', ing.unit || null]
      );
    }

    for (let i = 0; i < instructions.length; i++) {
      const s = instructions[i] || {};
      await client.query(
        `INSERT INTO instructions (recipe_id, step_num, text, hours, minutes, has_image)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [recipeId, i + 1, s.text || '', Number(s.hours || 0), Number(s.minutes || 0), !!s.hasImage]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ id: recipeId, message: 'created' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createRecipe error:', err);
    return res.status(500).json({ error: 'failed_to_create' });
  } finally {
    client.release();
  }
}

// GET /recipes
async function listRecipes(_req, res) {
  const r = await pool.query(
    `SELECT id, name, description, wants_video, created_at, updated_at
     FROM recipes
     ORDER BY created_at DESC`
  );
  return res.json({ items: r.rows });
}

// GET /recipes/:id  (returns recipe + children)
async function getRecipe(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const r = await pool.query(
    `SELECT id, name, description, wants_video, created_at, updated_at
     FROM recipes WHERE id=$1`, [id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });

  const ingredients = await pool.query(
    `SELECT name, qty, unit
     FROM ingredients WHERE recipe_id=$1 ORDER BY id ASC`, [id]
  );

  const instructions = await pool.query(
    `SELECT step_num, text, hours, minutes, has_image
     FROM instructions WHERE recipe_id=$1 ORDER BY step_num ASC`, [id]
  );

  return res.json({
    ...r.rows[0],
    ingredients: ingredients.rows,
    instructions: instructions.rows
  });
}

module.exports = {
  createRecipe,
  listRecipes,
  getRecipe,          
};