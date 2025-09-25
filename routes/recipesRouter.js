const { Router } = require("express");
const recipesController = require("../controllers/recipesController.js");

const recipesRouter = Router();

recipesRouter.get("/create", recipesController.getRecipeMaker);

recipesRouter.post("/verify-ingredients", recipesController.verifyIngredientsPreview);
recipesRouter.post("/", recipesController.createRecipe);
recipesRouter.get("/", recipesController.listRecipes);
recipesRouter.get("/:id", recipesController.getRecipe);
recipesRouter.put("/:id", recipesController.updateRecipe);
recipesRouter.delete("/:id", recipesController.deleteRecipe);

module.exports = recipesRouter;
