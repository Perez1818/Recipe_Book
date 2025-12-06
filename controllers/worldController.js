const recipesTable = require("../database/recipesTable.js");

exports.getWorldMap = async (request, response) => {
    const { tag, country } = request.query;
    if (tag) {
        const recipesByTag = await recipesTable.getRecipesByTagOrCountry(tag, decodeURIComponent(country));
        response.json(recipesByTag);
    }
    else {
        response.render("world-map");
    }
}
