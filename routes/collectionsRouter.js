const { Router } = require("express");
const pool = require("../database/pool.js");
const collectionsController = require("../controllers/collectionsController.js")

const collectionsRouter = Router();

// GET all collections for current user
collectionsRouter.get("/", collectionsController.listCurrentUserCollections);
// GET a specific collection by name
collectionsRouter.get("/name/:collectionName", collectionsController.getCollectionByName);
// GET a specific collection by ID
collectionsRouter.get("/:collectionId", collectionsController.getCollection);
// ADD a recipe to an existing collection
collectionsRouter.post("/:collectionId/recipes/:recipeId", collectionsController.addRecipeToCollection);
// CREATE a new collection
collectionsRouter.post("/", collectionsController.createCollection);
// REMOVE a recipe from a collection
collectionsRouter.delete("/:collectionId/recipes/:recipeId", collectionsController.removeRecipeFromCollection);
// DELETE a collection
collectionsRouter.delete("/:collectionId", collectionsController.deleteCollection);
// GET all recipes within a collection
collectionsRouter.get("/:collectionId/recipes", collectionsController.listRecipesInCollection);

module.exports = collectionsRouter;
