const pool = require("../database/pool.js");

async function listCurrentUserCollections(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, user_id, collection_name, recipe_ids, created_at
       FROM collections
       WHERE user_id = $1
       ORDER BY id DESC`
      , [userId]
    );
    if (!userId) {
        throw new Error(result.error)
    }
    return res.json({ items: result.rows });
  } catch (err) {
    console.error("listCurrentUserCollections error:", err);
    return res.status(500).json({ error: "failed_to_list" });
  }
}

async function getCollection(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid ID provided." });
  }
  try {
    const result = await pool.query(
      `SELECT id, user_id, collection_name, recipe_ids, created_at
       FROM collections
       WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getCollection error:", err);
    return res.status(500).json({ error: "failed_to_get" });
  }
}

async function getCollectionByName(req, res) {
  const collectionName = req.params.collectionName;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ error: "Invalid user id provided." });
  }

  if (!collectionName || typeof collectionName !== "string") {
    return res.status(400).json({ error: "Invalid collection name provided." });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, collection_name, recipe_ids, created_at
       FROM collections
       WHERE user_id = $1 AND collection_name = $2`,
      [userId, collectionName]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getCollectionByName error:", err);
    return res.status(500).json({ error: "failed_to_get" });
  }
}


async function createCollection(req, res) {
  const client = await pool.connect();
  try {
    const user_id = req.user.id;
    const { collectionName, recipe_ids } = req.body || {};
    const recipeIds = Array.isArray(recipe_ids) ? recipe_ids : [];

    if (!user_id || !collectionName) {
      return res.status(400).json({
        error: "user_id and collection_name are required"
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO collections (user_id, collection_name, recipe_ids)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, collection_name, recipe_ids, created_at`,
      [user_id, collectionName, recipeIds]
    );

    if (!result) {
      throw new Error(result.error);
    }

    await client.query("COMMIT");
    return res
      .status(201)
      .json({ message: "created", collection: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createCollection error:", err);
    return res.status(500).json({ error: "failed_to_create" });
  } finally {
    client.release();
  }
}

async function deleteCollection(req, res) {
  const id = Number(req.params.collectionId);
  if (!id) {
    return res.status(400).json({ error: "id not provided" });
  }
  try {
    const result = await pool.query(`DELETE FROM collections WHERE id = $1`, [
      id
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ id, message: "deleted" });
  } catch (err) {
    console.error("deleteCollection error:", err);
    return res.status(500).json({ error: "failed_to_delete" });
  }
}

/**
 * POST /collections/:id/recipes/:recipeId
 * Safely append a recipe ID to the recipe_ids array (no duplicates).
 */
async function addRecipeToCollection(req, res) {
  const client = await pool.connect();
  try {
    const collectionId = Number(req.params.collectionId);
    const recipeId = Number(req.params.recipeId);

    if (!collectionId || !recipeId) {
      return res
        .status(400)
        .json({ error: `collection id and recipe id are required ${collectionId} ${recipeId} ${req.params.collection_id}` });
    }

    await client.query("BEGIN");

    // Lock the row to avoid race conditions on concurrent updates
    const { rows, rowCount } = await client.query(
      `SELECT id, recipe_ids
       FROM collections
       WHERE id = $1
       FOR UPDATE`,
      [collectionId]
    );
    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "collection_not_found" });
    }

    const current = rows[0].recipe_ids || [];
    if (current.includes(recipeId)) {
      await client.query("COMMIT");
      return res.json({
        collection_id: collectionId,
        recipe_id: current,
        message: "already_present"
      });
    }

    const updated = await client.query(
      `UPDATE collections
       SET recipe_ids = array_append(recipe_ids, $2)
       WHERE id = $1
       RETURNING id, user_id, collection_name, recipe_ids, created_at`,
      [collectionId, recipeId]
    );

    await client.query("COMMIT");
    return res.json({
      message: "added",
      collection: updated.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("addRecipeToCollection error:", err);
    return res.status(500).json({ error: "failed_to_add_recipe" });
  } finally {
    client.release();
  }
}


async function removeRecipeFromCollection(req, res) {
  const client = await pool.connect();
  try {
    const collectionId = Number(req.params.collectionId);
    const recipeId = Number(req.params.recipeId);

    if (!collectionId || !recipeId) {
      return res
        .status(400)
        .json({ error: "collection id and recipe id are required" });
    }

    await client.query("BEGIN");

    // Only update if recipeId is actually present (optional guard)
    const updated = await client.query(
      `UPDATE collections
       SET recipe_ids = array_remove(recipe_ids, $2)
       WHERE id = $1
       RETURNING id, user_id, collection_name, recipe_ids, created_at`,
      [collectionId, recipeId]
    );

    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "collection_not_found" });
    }

    await client.query("COMMIT");
    return res.json({
      message: "removed",
      collection: updated.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("removeRecipeFromCollection error:", err);
    return res.status(500).json({ error: "failed_to_remove_recipe" });
  } finally {
    client.release();
  }
}


async function listRecipesInCollection(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid ID provided." });
  }
  try {
    const result = await pool.query(
      `SELECT recipe_ids
       FROM collections
       WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ collection_id: id, recipe_ids: result.rows[0].recipe_ids || [] });
  } catch (err) {
    console.error("listRecipesInCollection error:", err);
    return res.status(500).json({ error: "failed_to_list_recipes" });
  }
}

module.exports = {
  listCurrentUserCollections,
  getCollection,
  getCollectionByName,
  createCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  listRecipesInCollection
};
