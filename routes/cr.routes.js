// routes/recipes.routes.js
const express = require('express');
const {
  createRecipe,
  listRecipes,
  getRecipe,
} = require('../controllers/cr.controller');

const router = express.Router();

// POST /recipes
router.post('/', createRecipe);

// GET /recipes
router.get('/', listRecipes);

router.get('/:id', getRecipe);

module.exports = router;
