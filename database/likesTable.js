const pool = require("./pool.js");

function getOnlyRow(rows) {
    if (rows.length === 1) {
        return rows[0];
    }
    else if (rows.length === 0) {
        return null;
    }
    throw new Error("More than one matching row was found in the database. Please review and update the uniqueness constraints or re-evaluate calling this function.");
}

async function likeRecipe(recipeId, userId) {
    const likesDeleted = await deleteRecipeLike(recipeId, userId);
    if (likesDeleted <= 0) {
        return await createRecipeLike(recipeId, userId);
    }
    return true;
}

async function createRecipeLike(recipeId, userId) {
    try {
        const result = await pool.query(`INSERT INTO recipelikes (recipe_id, user_id)
                                         VALUES ($1, $2);`, [recipeId, userId]);
        return true;
    }
    catch (exception) {
        console.log(exception);
        return false;
    }
}

async function deleteRecipeLike(recipeId, userId) {
    try {
        const result = await pool.query(`DELETE FROM recipelikes WHERE (recipe_id = $1 AND user_id = $2);`, [recipeId, userId]);
        return result.rowCount;
    }
    catch (exception) {
        console.log(exception);
        return 0;
    }
}

async function getRecipeLike(recipeId, userId) {
    const { rows } = await pool.query(`SELECT * FROM recipelikes WHERE (recipe_id = $1 AND user_id = $2);`, [recipeId, userId]);
    return getOnlyRow(rows);
}

async function getRecipeLikes(id) {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM recipelikes WHERE (recipe_id = $1);`, [id]);
    const row = getOnlyRow(rows);
    const likeCount = row.count;
    return likeCount;
}

module.exports = {
    likeRecipe,
    getRecipeLikes,
    getRecipeLike
}
