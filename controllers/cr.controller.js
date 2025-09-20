/**
 * Recipes Controller: CRUD + ingredient verification for the Recipe Book app.
 *
 * - POST /recipes
 *   Validates required fields; if publish=true, runs an ingredient check.
 *   Creates recipe, ingredients, and instructions inside a DB transaction.
 *
 * - PUT /recipes/:id
 *   Updates core fields and REPLACES all ingredients & instructions (transactional).
 *
 * - GET /recipes
 *   Lists recipes (newest first) with basic fields.
 *
 * - GET /recipes/:id
 *   Returns a single recipe plus its ingredients and ordered instructions.
 *
 * - DELETE /recipes/:id
 *   Deletes a recipe by id.
 *
 * - verifyIngredientsPreview(req,res)
 *   Lightweight server-side validation for ingredient names before publishing.
 *
 * Notes: Uses pg Pool from ../database/cr_index.js; sanitizes inputs,
 * coerces numbers/booleans, wraps writes in BEGIN/COMMIT with rollback on error.
 */
// controllers/recipes.controller.js
const { pool } = require('../database/cr_index.js');

const asArray = (v) => Array.isArray(v) ? v : [];

// POST /recipes
async function createRecipe(req, res) {
  const client = await pool.connect();
  try {
    const {
      name,
      description,
      cookTimeMinutes = 0,
      servingSize = 1,
      tags = [],
      publish = false,
      ingredients = [],
      instructions = [],
    } = req.body || {};

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    if (publish) {
      const reasons = await verifyIngredientsOrReasons(ingredients);
      if (reasons.length) {
        return res.status(400).json({ error: 'ingredient_verification_failed', reasons });
      }
    }

    await client.query('BEGIN');

    const r = await client.query(
      `INSERT INTO recipes (name, description, cook_minutes, serving_size, tags, is_published)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [
        String(name).trim(),
        String(description).trim(),
        Number(cookTimeMinutes) || 0,
        Math.max(1, Number(servingSize) || 1),
        Array.isArray(tags) ? tags : [],
        !!publish,
      ]
    );
    const recipeId = r.rows[0].id;

    for (const ing of asArray(ingredients)) {
      await client.query(
        `INSERT INTO ingredients (recipe_id, name, qty, unit)
         VALUES ($1,$2,$3,$4)`,
        [recipeId, ing.name || '', ing.qty || '', ing.unit || null]
      );
    }

    for (let i = 0; i < asArray(instructions).length; i++) {
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

// PUT /recipes/:id
async function updateRecipe(req, res) {
  const client = await pool.connect();
  try {
    const recipeId = Number(req.params.id);
    if (!recipeId) return res.status(400).json({ error: 'invalid id' });

    const {
      name,
      description,
      cookTimeMinutes = 0,
      servingSize = 1,
      tags = [],
      publish = false,
      ingredients = [],
      instructions = [],
    } = req.body || {};

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE recipes
         SET name=$1,
             description=$2,
             cook_minutes=$3,
             serving_size=$4,
             tags=$5,
             is_published=$6
       WHERE id=$7`,
      [
        String(name).trim(),
        String(description).trim(),
        Number(cookTimeMinutes) || 0,
        Math.max(1, Number(servingSize) || 1),
        Array.isArray(tags) ? tags : [],
        !!publish,
        recipeId,
      ]
    );

    await client.query(`DELETE FROM ingredients  WHERE recipe_id=$1`, [recipeId]);
    await client.query(`DELETE FROM instructions WHERE recipe_id=$1`, [recipeId]);

    for (const ing of asArray(ingredients)) {
      await client.query(
        `INSERT INTO ingredients (recipe_id, name, qty, unit)
         VALUES ($1,$2,$3,$4)`,
        [recipeId, ing.name || '', ing.qty || '', ing.unit || null]
      );
    }

    for (let i = 0; i < asArray(instructions).length; i++) {
      const s = instructions[i] || {};
      await client.query(
        `INSERT INTO instructions (recipe_id, step_num, text, hours, minutes, has_image)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [recipeId, i + 1, s.text || '', Number(s.hours || 0), Number(s.minutes || 0), !!s.hasImage]
      );
    }

    await client.query('COMMIT');
    return res.json({ id: recipeId, message: 'updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateRecipe error:', err);
    return res.status(500).json({ error: 'failed_to_update' });
  } finally {
    client.release();
  }
}

// GET /recipes
async function listRecipes(_req, res) {
  const r = await pool.query(
    `SELECT id, name, description, cook_minutes, serving_size, tags, is_published, created_at, updated_at
     FROM recipes
     ORDER BY created_at DESC`
  );
  return res.json({ items: r.rows });
}

// GET /recipes/:id
async function getRecipe(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const r = await pool.query(
    `SELECT id, name, description, cook_minutes, serving_size, tags, is_published, created_at, updated_at
     FROM recipes WHERE id=$1`,
    [id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });

  const ingredients = await pool.query(
    `SELECT name, qty, unit FROM ingredients WHERE recipe_id=$1 ORDER BY id ASC`,
    [id]
  );
  const instructions = await pool.query(
    `SELECT step_num, text, hours, minutes, has_image FROM instructions WHERE recipe_id=$1 ORDER BY step_num ASC`,
    [id]
  );

  return res.json({ ...r.rows[0], ingredients: ingredients.rows, instructions: instructions.rows });
}

// DELETE /recipes/:id
async function deleteRecipe(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const r = await pool.query(`DELETE FROM recipes WHERE id=$1`, [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
  return res.json({ id, message: 'deleted' });
}

// controllers/cr.controller.js
async function verifyIngredientsPreview(req, res) {
  try {
    const list = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
    const reasons = [];

    const ALLOWED = new Set([
      'salt','sugar','flour','butter','egg','eggs','milk',
      'olive oil','noodles','pasta','tomato','onion','garlic',
      'chocolate','chocolate chips','baking soda','baking powder',
      'vanilla','vanilla extract','water','yeast'
    ]);

    for (const item of list) {
      const n = String(item?.name || '').trim();
      if (n.length < 2) { reasons.push('Ingredient name is too short.'); continue; }
      if (!/^[a-z0-9\s\-’',.()]+$/i.test(n)) { reasons.push(`Suspicious ingredient name: "${n}"`); continue; }

      const key = n.toLowerCase();
      if (![...ALLOWED].some(w => w === key)) {
        reasons.push(`Unrecognized ingredient: "${n}"`);
      }
    }

    if (reasons.length) return res.json({ ok: false, reasons });
    return res.json({ ok: true, reasons: [] });
  } catch {
    return res.status(500).json({ ok: false, reasons: ['server_error'] });
  }
}

module.exports = {
  createRecipe,
  updateRecipe,
  listRecipes,
  getRecipe,
  deleteRecipe,
  verifyIngredientsPreview,
};