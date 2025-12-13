const express = require("express");
const router = express.Router();
const stepCommentsController = require("../controllers/stepCommentsController.js");

// POST /step-comments
router.post("/", stepCommentsController.createStepComment);

// GET /step-comments/:recipeId/:stepNum
router.get("/:recipeId/:stepNum", stepCommentsController.getStepComments);


router.patch("/:id", stepCommentsController.updateStepComment);
router.delete("/:id", stepCommentsController.deleteStepComment);

module.exports = router;