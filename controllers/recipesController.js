const recipesTable = require("../database/recipesTable.js");

exports.getRecipeMaker = async (request, response) => {
    response.render("recipes");
};

exports.getRecipes = async (request, response) => {
    const recipes = await recipesTable.getAllRecipes();
    response.send(recipes);
};

exports.createRecipe = async (request, response) => {
    const recipe = request.body;
    await recipesTable.createRecipe(recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags);
    response.send(recipe);
};
