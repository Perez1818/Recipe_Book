const recipesTable = require("../database/recipesTable.js");

exports.getWorldMap = async (request, response) => {
    const { tag } = request.query;
    if (tag) {
        const recipesByTag = await recipesTable.getRecipesByTag(tag);
        response.json(recipesByTag);
    }
    else {
        response.render("world-map");
    }
}
