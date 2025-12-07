const pool = require("../database/pool.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { getThumbnailVideoUpload } = require("../middleware/fileUploader.js");
const { getErrorMessages, attributeCount } = require("../middleware/helpers.js");
const likesTable = require("../database/likesTable.js");


const uploadThumbnailVideo = getThumbnailVideoUpload();

const asArray = (v) => Array.isArray(v) ? v : [];

async function getRecipeMaker(req, res) {
    res.redirect("/static/create-recipe.html");
}

// POST /recipes
async function createRecipe(req, res) {
  uploadThumbnailVideo(req, res, async (error) => {
  console.log(req.files);
  const client = await pool.connect();


  // Parse JSON string fields from multipart/form-data
  const parseJSON = (s, fallback) => {
    try { return JSON.parse(s); } catch { return fallback; }
  };

  try {
    const {
      name,
      description,
      cookTimeMinutes = 0,
      servingSize = 1,
      publish = false,
    } = req.body || {};

    const tags          = parseJSON(req.body?.tags, []);
    const ingredients   = parseJSON(req.body?.ingredients, []);
    const instructions  = parseJSON(req.body?.instructions, []);

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    if (publish) {
      const reasons = await verifyIngredientsOrReasons(ingredients);
      if (reasons.length) {
        return res.status(400).json({ error: 'ingredient_verification_failed', reasons });
      }
    }

    await validate.thumbnailVideoUpload(req);
    const user = req.user;
    if (user) {
        const result = validationResult(req);
        const errorMessages = getErrorMessages(result);

        if (attributeCount(errorMessages)) {
            return res.status(400).json({ error: errorMessages["file"] });
        }
    }

    await client.query('BEGIN');

    const r = await client.query(
      `INSERT INTO recipes (user_id, name, description, cook_minutes, serving_size, tags, is_published, thumbnail, video, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        req.user.id,
        String(name).trim(),
        String(description).trim(),
        Number(cookTimeMinutes) || 0,
        Math.max(1, Number(servingSize) || 1),
        Array.isArray(tags) ? tags : [],
        !!publish,
        
        req.files["thumbnail"][0].filename,
        req.files.video?.[0]?.filename || null,
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
        `INSERT INTO instructions (recipe_id, step_num, text, hours, minutes)
         VALUES ($1,$2,$3,$4,$5)`,
        [recipeId, i + 1, s.text || '', Number(s.hours || 0), Number(s.minutes || 0)]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ id: recipeId, message: 'created' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createRecipe error:', err);

    if (req.user) {
        return res.status(500).json({ error: 'failed_to_create' });
    }
    else {
        return res.status(500).json({ error: 'You must be logged in to create a recipe.' });
    }

  } finally {
    client.release();
  }

  });

}

// POST /recipes/:id/likes
async function likeRecipe(req, res) {
    try {
        await likesTable.likeRecipe(req.params.id, req.user.id);
        return res.status(201).json({ message: 'recipe liked' });
    }
    catch (err) {
        if (req.user) {
            return res.status(500).json({ error: 'failed_to_like' });
        }
        else {
            return res.status(500).json({ error: 'You must be logged in to like a recipe.' });
        }
    }
}

async function recipeIsLiked(req, res) {
    try {
        const recipeLike = await likesTable.getRecipeLike(req.params.id, req.user.id);
        const liked = recipeLike ? true : false;
        const likes = await likesTable.getRecipeLikes(req.params.id);
        return res.status(200).json({ liked: liked, likes: likes });
    }
    catch {
        const likes = await likesTable.getRecipeLikes(req.params.id);
        return res.status(500).json({ liked: false, likes: likes });
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
    `SELECT id, name, description, cook_minutes, serving_size, tags, is_published, created_at
     FROM recipes
     ORDER BY created_at DESC`
  );
  return res.json({ items: r.rows });
}

// GET /recipes/:id
async function getRecipe(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const recipe = await pool.query(
      `SELECT id, user_id, name, description, cook_minutes, serving_size, tags, thumbnail, video,
              is_published, created_at
         FROM recipes
        WHERE id = $1`,
      [id]
    );

    if (recipe.rowCount === 0)
      return res.status(404).json({ error: "not_found" });

    const ingredients = await pool.query(
      `SELECT name, qty, unit
         FROM ingredients
        WHERE recipe_id = $1
     ORDER BY recipe_id ASC`,
      [id]
    );

    const instructions = await pool.query(
      `SELECT step_num, text, hours, minutes
         FROM instructions
        WHERE recipe_id = $1
     ORDER BY step_num ASC`,
      [id]
    );

    res.json({
      ...recipe.rows[0],
      ingredients: ingredients.rows,
      instructions: instructions.rows
    });
  } catch (err) {
    console.error("getRecipe error:", err); // 👈 this will show the actual DB error
    res.status(500).json({ error: "server_error" });
  }
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

async function getRecipeView(request, response) {
    response.redirect("/static/recipe-view.html");
}

// Obtains all recipes by a specific user provided their user ID
async function getRecipesByUser(request, response) {
  const userId = Number(request.params.userId); // Gets user ID from route
  if (!userId) return response.status(400).json({ error: "invalid id" });
  try {
      const recipes = await pool.query(
        `SELECT id, user_id, thumbnail, name, description, cook_minutes, serving_size, tags, is_published, created_at
        FROM recipes
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );

      const recipeIds = recipes.rows.map(r => r.id);

      if (recipes.rowCount === 0) return response.status(404).json({ error: "no recipes found" });

      const ingredients = await pool.query(
        `SELECT recipe_id, name
        FROM ingredients
        WHERE recipe_id = ANY($1)
        ORDER BY recipe_id ASC`,
        [recipeIds]
      );

      return response.json({ recipes: recipes.rows, ingredients: ingredients.rows});
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
    getRecipeMaker,
    createRecipe,
    likeRecipe,
    recipeIsLiked,
    updateRecipe,
    listRecipes,
    getRecipe,
    deleteRecipe,
    verifyIngredientsPreview,
    getRecipeView,
    getRecipesByUser
};
