/**
 * Recipes Routes (Express Router)
 *
 * Mount under /recipes to expose:
 * - POST   /verify-ingredients → server-side check of ingredient names for the wizard.
 * - POST   /                    → create recipe (and its ingredients/instructions).
 * - GET    /                    → list all recipes (newest first).
 * - GET    /:id                 → fetch a single recipe by id.
 * - PUT    /:id                 → update a recipe; replaces ingredients/instructions.
 * - DELETE /:id                 → delete a recipe by id.
 *
 * Delegates logic to ../controllers/cr.controller.js and exports the router.
 */
// routes/cr.routes.js
const express = require('express');
const {
  createRecipe,
  listRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  verifyIngredientsPreview,   
} = require('../controllers/cr.controller.js');

const router = express.Router();

// verification endpoint used by your front-end
router.post('/verify-ingredients', verifyIngredientsPreview);

router.post('/', createRecipe);
router.get('/', listRecipes);
router.get('/:id', getRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

module.exports = router;
