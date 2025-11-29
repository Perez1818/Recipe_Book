const express = require('express');
const router = express.Router();

const { searchIngredients } = require('../controllers/ingredientsController.js');

router.get('/api/ingredients', searchIngredients);

module.exports = router;
