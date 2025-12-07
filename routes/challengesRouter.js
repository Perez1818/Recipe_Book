const { Router } = require("express");
const challengesController = require("../controllers/challengesController.js");

const router = Router();

// Routes
// Liam #4
router.get("/", challengesController.getChallengeMaker);
router.post("/", challengesController.createChallenge);
// Tyrese #4
router.get("/list", challengesController.listChallenges);   // Gets all unexpired-challenges
router.get("/:id", challengesController.getChallenge);      // Gets challenge by ID

module.exports = router;
