const db = require("../database/query.js");

exports.getRecipeMaker = async (request, response) => {
    response.render("recipes");
};

exports.getRecipes = async (request, response) => {
    const result = await db.pool.query("SELECT * FROM recipes");
    response.send(result.rows);
};

exports.createRecipe = async (request, response) => {
    const recipe = request.body;
    await db.pool.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags]);
    response.send(recipe);
};
