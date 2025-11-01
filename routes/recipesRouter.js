const { Router } = require("express");
const recipesController = require("../controllers/recipesController.js");

const recipesRouter = Router();

/* Place these higher up so they get priority over the routes that accept an id below
 * The way Express determines the requested route is similar to pattern matching */
recipesRouter.get("/create", recipesController.getRecipeMaker);
recipesRouter.get("/view", recipesController.getRecipeView);

recipesRouter.post("/verify-ingredients", recipesController.verifyIngredientsPreview);
recipesRouter.post("/", recipesController.createRecipe);
recipesRouter.get("/", recipesController.listRecipes);
recipesRouter.get("/:id", recipesController.getRecipe);
recipesRouter.put("/:id", recipesController.updateRecipe);
recipesRouter.delete("/:id", recipesController.deleteRecipe);

module.exports = recipesRouter;
