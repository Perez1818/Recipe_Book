const pool = require("./pool.js");

exports.getAllRecipes = async () => {
    const { rows } = await pool.query("SELECT * FROM recipes");
    return rows;
};

exports.createRecipe = async (name, description, ingredients, cookTime, tags) => {
    await pool.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [name, description, ingredients, cookTime, tags]);
};
