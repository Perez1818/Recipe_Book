const { Router } = require("express");
const challengesController = require("../controllers/challengesController.js");

const router = Router();

router.get("/", challengesController.getChallengeMaker);
router.post("/", challengesController.createChallenge);

module.exports = router;
